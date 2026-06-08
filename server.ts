import express from "express";
import path from "path";
import fs from "fs";

// Simple file logging to debug startup issues
const logFile = path.join(process.cwd(), "server.log");
fs.writeFileSync(logFile, "=== Server Log Started ===\n", "utf8");
const originalLog = console.log;
const originalError = console.error;

console.log = (...args: any[]) => {
  const msg = args.map(a => (typeof a === 'object' && a !== null) ? (a.stack || JSON.stringify(a)) : String(a)).join(" ");
  fs.appendFileSync(logFile, `[LOG] ${new Date().toISOString()} - ${msg}\n`, "utf8");
  originalLog(...args);
};

console.error = (...args: any[]) => {
  const msg = args.map(a => (typeof a === 'object' && a !== null) ? (a.stack || JSON.stringify(a)) : String(a)).join(" ");
  fs.appendFileSync(logFile, `[ERR] ${new Date().toISOString()} - ${msg}\n`, "utf8");
  originalError(...args);
};

import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } from "firebase/firestore";

// Load environment variables
dotenv.config();

// Define Firebase operation types and error handler per skills
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, pathName: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path: pathName
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase using the configuration file
const firebaseConfigPath = path.join(process.cwd(), "firebase-applet-config.json");
let firebaseApp: any = null;
let firestoreDb: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  try {
    const configData = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf-8"));
    firebaseApp = initializeApp(configData);
    firestoreDb = getFirestore(firebaseApp, configData.firestoreDatabaseId);
    console.log("Firebase App & Firestore successfully initialized on background server.");
  } catch (err) {
    console.error("Failed to initialize Firebase on background server:", err);
  }
}

// Types imported
import { 
  User, Post, Comment, Event, Project, Payment, 
  Conversation, Message, Notification, Poll, GalleryItem, UserStatus, MarketplaceItem 
} from "./src/types";

const app = express();
const PORT = 3000;

// Body parsing with higher limits for base64 image media uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Database File Path
const DB_PATH = path.join(process.cwd(), "server_db.json");

// Gemini Client Setup
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API key loaded successfully.");
  } catch (err) {
    console.error("Error setting up Gemini Client:", err);
  }
}

// Memory database representation
interface DatabaseSchema {
  users: User[];
  posts: Post[];
  events: Event[];
  projects: Project[];
  payments: Payment[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  polls: Poll[];
  gallery: GalleryItem[];
  marketplace: MarketplaceItem[];
}

let db: DatabaseSchema = {
  users: [],
  posts: [],
  events: [],
  projects: [],
  payments: [],
  conversations: [],
  messages: [],
  notifications: [],
  polls: [],
  gallery: [],
  marketplace: []
};

// Firestore persistence helpers
async function saveItemToFirestore(collName: keyof DatabaseSchema, item: any) {
  if (!firestoreDb) return;
  const pathName = `${collName}/${item.id}`;
  try {
    // Deep clone and clean undefined values to stay compliant with Firestore
    const cleaned = JSON.parse(JSON.stringify(item, (key, value) => {
      return value === undefined ? null : value;
    }));

    // Maintain a generous base64 size threshold (e.g. 800,000 characters / ~600KB) 
    // to prevent standard uploaded assets from being overwritten with a generic placeholder.
    const maxChars = 800000;

    if (cleaned.profilePicture && cleaned.profilePicture.startsWith("data:") && cleaned.profilePicture.length > maxChars) {
      console.log(`Profile picture in ${collName}/${item.id} is exception-large (${cleaned.profilePicture.length} chars). Applying placeholder.`);
      cleaned.profilePicture = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200";
    }

    if (cleaned.mediaUrl && cleaned.mediaUrl.startsWith("data:") && cleaned.mediaUrl.length > maxChars) {
      console.log(`mediaUrl in ${collName}/${item.id} is exception-large. Resetting to placeholder.`);
      cleaned.mediaUrl = "";
    }

    if (cleaned.imageUrl && cleaned.imageUrl.startsWith("data:") && cleaned.imageUrl.length > maxChars) {
      console.log(`imageUrl in ${collName}/${item.id} is exception-large. Resetting to placeholder.`);
      cleaned.imageUrl = "";
    }

    const docRef = doc(firestoreDb, collName, item.id);
    await setDoc(docRef, cleaned);
    console.log(`Saved ${collName}/${item.id} successfully to Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathName);
  }
}

async function deleteItemFromFirestore(collName: keyof DatabaseSchema, id: string) {
  if (!firestoreDb) return;
  const pathName = `${collName}/${id}`;
  try {
    const docRef = doc(firestoreDb, collName, id);
    await deleteDoc(docRef);
    console.log(`Deleted ${collName}/${id} successfully from Firestore.`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, pathName);
  }
}

async function syncCollectionFromFirestore<T extends { id: string }>(collName: keyof DatabaseSchema) {
  if (!firestoreDb) return;
  const pathName = collName;
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, pathName));
    const items: T[] = [];
    querySnapshot.forEach((docSnap) => {
      items.push(docSnap.data() as T);
    });

    if (items.length > 0) {
      console.log(`Retrieved ${items.length} records in ${collName} from Firestore.`);
      items.forEach(item => {
        const existingIdx = (db[collName] as any[]).findIndex(u => u.id === item.id);
        if (existingIdx !== -1) {
          const existingItem = (db[collName] as any[])[existingIdx];
          const anyExisting = existingItem as any;
          const anyItem = item as any;
          // Protect custom local base64 profile pictures and other media assets from being overwritten by Firestore generic placeholders
          if (anyExisting.profilePicture && anyExisting.profilePicture.startsWith("data:") &&
              (!anyItem.profilePicture || !anyItem.profilePicture.startsWith("data:"))) {
            anyItem.profilePicture = anyExisting.profilePicture;
          }
          if (anyExisting.mediaUrl && anyExisting.mediaUrl.startsWith("data:") &&
              (!anyItem.mediaUrl || !anyItem.mediaUrl.startsWith("data:"))) {
            anyItem.mediaUrl = anyExisting.mediaUrl;
          }
          if (anyExisting.imageUrl && anyExisting.imageUrl.startsWith("data:") &&
              (!anyItem.imageUrl || !anyItem.imageUrl.startsWith("data:"))) {
            anyItem.imageUrl = anyExisting.imageUrl;
          }
          (db[collName] as any[])[existingIdx] = anyItem;
        } else {
          (db[collName] as any[]).push(item);
        }
      });
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
      } catch (e) {
        console.error(`Failed to write updated db.${collName} to disk:`, e);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathName);
  }
}

async function seedCollectionToFirestore(collName: keyof DatabaseSchema) {
  if (!firestoreDb) return;
  const pathName = collName;
  try {
    const querySnapshot = await getDocs(collection(firestoreDb, pathName));
    if (querySnapshot.empty) {
      console.log(`Firestore collection '${collName}' is empty. Seeding defaults into Firestore...`);
      for (const item of db[collName]) {
        await saveItemToFirestore(collName, item);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathName);
  }
}

// Seed Mock Data
function loadOrSeedDatabase() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileData = fs.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(fileData);
      db.marketplace = db.marketplace || [];
      
      // Auto-migrate standard accounts to have "1234" as a fallback pincode for evaluation
      db.users.forEach(u => {
        if (["u_admin", "u_john", "u_sarah", "u_maretraite", "u_moderator"].includes(u.id) && !u.pincode) {
          u.pincode = "1234";
        }
      });
      saveToDisk();

      if (!db.users.find(u => u.username.toLowerCase() === "maretraite")) {
        db.users.push({
          id: "u_maretraite",
          memberId: "MR-26-0002",
          username: "Maretraite",
          fullName: "Maretraite Admin",
          email: "support@maretraite.org",
          role: "admin",
          status: "approved",
          profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
          bio: "Official administrator account for the Maretraite Project Network administration. Password 'Buren123'.",
          phone: "+597-888-8888",
          registrationDate: new Date().toISOString(),
          outstandingBalance: 0,
          totalContributed: 500
        });
        saveToDisk();
      }

      if (!db.users.find(u => u.username.toLowerCase() === "moderator")) {
        db.users.push({
          id: "u_moderator",
          memberId: "MR-26-0003",
          username: "moderator",
          fullName: "Gast Moderator",
          email: "moderator@maretraite.org",
          role: "moderator",
          status: "approved",
          profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
          bio: "Gast moderator account om de gemeenschapsfeed en marktplaats veilig te houden.",
          phone: "+597-888-9999",
          registrationDate: new Date().toISOString(),
          outstandingBalance: 0,
          totalContributed: 100
        });
        saveToDisk();
      }
      console.log("Database successfully loaded from disk.");
      return;
    } catch (e) {
      console.error("Failed to read database file, seeding instead...", e);
    }
  }

  // Pre-configured Users
  const seedUsers: User[] = [
    {
      id: "u_admin",
      memberId: "MR-26-0001",
      username: "admin",
      fullName: "Maretraite Admin",
      email: "admin@maretraite.org",
      role: "admin",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
      bio: "Official administrator account for the Maretraite Project Network administration. Here to assist with payments, reports, and community moderation.",
      phone: "+597-888-8888",
      registrationDate: "2026-01-10T12:00:00Z",
      outstandingBalance: 0,
      totalContributed: 500,
      pincode: "1234"
    },
    {
      id: "u_john",
      memberId: "MR-26-1025",
      username: "john",
      fullName: "Johnathan Mercer",
      email: "john@gmail.com",
      role: "member",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      bio: "Maretraite Sector 3 resident since 2018. Civil engineer interested in local infrastructure improvements. Let's make our neighborhood beautiful!",
      phone: "+597-876-5432",
      registrationDate: "2026-02-15T09:30:00Z",
      outstandingBalance: 0,
      totalContributed: 100, // Fully paid annual balance
      pincode: "1234"
    },
    {
      id: "u_sarah",
      memberId: "MR-26-1402",
      username: "sarah",
      fullName: "Sarah Alberg",
      email: "sarah@gmail.com",
      role: "member",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      bio: "Local high school educator. Organizing youth development programs and school-zone speed bump road repairs. Connect with me!",
      phone: "+597-855-1212",
      registrationDate: "2026-03-01T14:45:00Z",
      outstandingBalance: 40, // Paid 60, outstanding 40
      totalContributed: 60,
      pincode: "1234"
    },
    {
      id: "u_robert",
      memberId: "MR-26-2189",
      username: "robert",
      fullName: "Robert DeVries",
      email: "robert@gmail.com",
      role: "member",
      status: "pending", // Pending approval for admin workflow demo
      profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      bio: "New resident in Maretraite East. Excited to join the community committee and pay physical dues during next general cleanup assembly.",
      phone: "+597-862-9900",
      registrationDate: "2026-05-28T18:10:00Z",
      outstandingBalance: 100, // Not paid yet
      totalContributed: 0
    },
    {
      id: "u_maretraite",
      memberId: "MR-26-0002",
      username: "Maretraite",
      fullName: "Maretraite Admin",
      email: "support@maretraite.org",
      role: "admin",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      bio: "Official administrator account for the Maretraite Project Network administration. Password 'Buren123'.",
      phone: "+597-888-8888",
      registrationDate: "2026-05-28T12:00:00Z",
      outstandingBalance: 0,
      totalContributed: 500,
      pincode: "1234"
    },
    {
      id: "u_moderator",
      memberId: "MR-26-0003",
      username: "moderator",
      fullName: "Gast Moderator",
      email: "moderator@maretraite.org",
      role: "moderator",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      bio: "Gast moderator account om de gemeenschapsfeed en marktplaats veilig te houden.",
      phone: "+597-888-9999",
      registrationDate: "2026-05-28T12:00:00Z",
      outstandingBalance: 0,
      totalContributed: 100,
      pincode: "1234"
    }
  ];

  // Preset Community Projects
  const seedProjects: Project[] = [
    {
      id: "p_1",
      title: "Road Resurfacing of Maretraite Main Street",
      description: "Major overhaul and paving of 1.2km of Main Street starting from Sector 2 to the regional bypass. Eliminates deep potholes and installs modern asphalt drainage channels to prevent flash flooding.",
      category: "roads",
      status: "in-progress",
      budget: 45000,
      spent: 38000,
      progress: 75,
      photos: [
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
        "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600"
      ],
      updates: [
        {
          id: "pu_1_1",
          date: "2026-05-15T10:00:00Z",
          title: "Base gravel compaction completed",
          content: "The grading team has successfully compressed 100% of the gravel sublayers. Preparing for the primary asphalt binder course next Tuesday.",
          authorName: "Johnathan Mercer"
        },
        {
          id: "pu_1_2",
          date: "2026-05-25T14:00:00Z",
          title: "Rain delays resolved",
          content: "After three days of tropical rain, paving has resumed. The heavy machinery is moving back onto Sector 3 intersections. Drive carefully!",
          authorName: "Maretraite Admin"
        }
      ]
    },
    {
      id: "p_2",
      title: "Clean Water Pump Overhaul (Sector 3 Substation)",
      description: "Replacement of three industrial deep-bore water pumps to stabilize local pressure. Upgraded electrical panels with hybrid backup generator sockets to safeguard against power grid dropouts.",
      category: "water",
      status: "completed",
      budget: 12000,
      spent: 11500,
      progress: 100,
      photos: [
        "https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600"
      ],
      updates: [
        {
          id: "pu_2_1",
          date: "2026-04-10T11:30:00Z",
          title: "Full system testing green",
          content: "All three pumps ran continuously for 24 hours. Pressure meters show a steady 3.4 bar across all connected Maretraite households. Mission accomplished!",
          authorName: "Maretraite Admin"
        }
      ]
    },
    {
      id: "p_3",
      title: "Solar Streetlight Installation Initiative",
      description: "Phased installation of 150 independent, high-intensity LED streetlights powered by top-mounted solar cells. Increases security and physical visibility on darker intersections.",
      category: "infrastructure",
      status: "planning",
      budget: 25000,
      spent: 2500,
      progress: 20,
      photos: [
        "https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=600"
      ],
      updates: [
        {
          id: "pu_3_1",
          date: "2026-05-29T16:00:00Z",
          title: "Equipment vendor selected & Downpayment sent",
          content: "We have finalized negotiations with Solarex Ltd. The first shipment of 40 poles and solar lamp heads is expected at the harbor by late June.",
          authorName: "Maretraite Admin"
        }
      ]
    }
  ];

  // Preset Feed Posts
  const seedPosts: Post[] = [
    {
      id: "pos_1",
      authorId: "u_admin",
      authorName: "Maretraite Admin",
      authorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
      authorRole: "admin",
      content: "📢 EXTREMELY IMPORTANT: General Community Assembly is scheduled for Sunday, June 14th at 4:30 PM. We will review our final 2026 budgets, discuss road paving extensions, and collect physical cash contributions. RSVP below so we can arrange sufficient food and drinks!",
      likes: ["u_john", "u_sarah"],
      comments: [
        {
          id: "com_1_1",
          postId: "pos_1",
          authorId: "u_john",
          authorName: "Johnathan Mercer",
          authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
          content: "I will be there with files of the Sector B survey reports. Essential reading!",
          date: "2026-05-30T10:00:00Z"
        },
        {
          id: "com_1_2",
          postId: "pos_1",
          authorId: "u_sarah",
          authorName: "Sarah Alberg",
          authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
          content: "Excellent. Can we review school slow-zone signage as well?",
          date: "2026-05-31T09:15:00Z"
        }
      ],
      shares: 4,
      date: "2026-05-30T08:00:00Z",
      isAnnouncement: true,
      announcementCategory: "general",
      mediaType: null,
      aiModerated: "clean"
    },
    {
      id: "pos_2",
      authorId: "u_john",
      authorName: "Johnathan Mercer",
      authorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      authorRole: "member",
      content: "Construction crew doing a fantastic job compacted gravel layers on Road Segment 4! The foundation feels rock solid. A massive shoutout to the administration finance department who successfully gathered funds for this week's diesel supply.",
      mediaUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600",
      mediaName: "road_foundation.jpg",
      mediaType: "image",
      likes: ["u_admin", "u_sarah"],
      comments: [],
      shares: 1,
      date: "2026-05-31T15:20:00Z",
      aiModerated: "clean"
    },
    {
      id: "pos_3",
      authorId: "u_sarah",
      authorName: "Sarah Alberg",
      authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
      authorRole: "member",
      content: "Found this dog wandering around Sector 2 near the old water pump station. It has a collar but no tag. Super friendly. Please DM me if it's yours!",
      mediaUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
      mediaName: "lost_dog.jpg",
      mediaType: "image",
      likes: ["u_john"],
      comments: [
        {
          id: "com_3_1",
          postId: "pos_3",
          authorId: "u_admin",
          authorName: "Maretraite Admin",
          authorAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
          content: "I will share this in the administrative SMS list to notify Sector 2 elders.",
          date: "2026-06-01T01:00:00Z"
        }
      ],
      shares: 12,
      date: "2026-05-31T20:45:00Z",
      aiModerated: "clean"
    }
  ];

  // Preset Events
  const seedEvents: Event[] = [
    {
      id: "e_1",
      title: "Maretraite Annual General Assembly",
      description: "Come together at the main hall to discuss community development projects, view the financial ledger, and nominate safety committee leaders.",
      date: "2026-06-14",
      time: "16:30",
      location: "Maretraite Community Center Hall A",
      organizer: "Maretraite Association Committee",
      rsvps: ["u_john", "u_sarah"],
      image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
      category: "meeting"
    },
    {
      id: "e_2",
      title: "Ecology Clean-up & Tree Planting Event",
      description: "Community cleanup along drainage channel sector B. Gloves, garbage bags, and complimentary beverages will be supplied. Let's safeguard our ecosystem!",
      date: "2026-06-07",
      time: "08:00",
      location: "Drainage Canal Parking Space",
      organizer: "Sarah Alberg",
      rsvps: ["u_admin", "u_sarah", "u_john"],
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600",
      category: "cleanup"
    },
    {
      id: "e_3",
      title: "Surnamese Traditional Food Festival Fundraiser",
      description: "Charity food bazaar featuring local delicacies. All proceeds go toward paving school bus parking lots. Admission is free, dishes cost $5 - $10.",
      date: "2026-06-21",
      time: "12:00",
      location: "Maretraite Athletic Playing Field",
      organizer: "Association Auxiliary Board",
      rsvps: [],
      image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600",
      category: "social"
    }
  ];

  // Preset Payments
  const seedPayments: Payment[] = [
    {
      id: "pay_1",
      memberId: "MR-26-1025",
      memberName: "Johnathan Mercer",
      amount: 100,
      date: "2026-02-18",
      method: "bank_transfer",
      referenceNumber: "TXN7704123",
      notes: "Annual contribution for fiscal year 2026."
    },
    {
      id: "pay_2",
      memberId: "MR-26-1402",
      memberName: "Sarah Alberg",
      amount: 60,
      date: "2026-03-05",
      method: "mobile_pay",
      referenceNumber: "MP_JAS_9918",
      notes: "Part 1 of dues. Rest will be sent physically in June."
    },
    {
      id: "pay_3",
      memberId: "MR-26-0001",
      memberName: "Maretraite Admin",
      amount: 500,
      date: "2026-01-11",
      method: "bank_transfer",
      referenceNumber: "INT_DON_26A",
      notes: "Administrative setup donation and early coverage."
    }
  ];

  // Conversations & Messages
  const seedConversations: Conversation[] = [
    {
      id: "c_1",
      isGroup: false,
      participantIds: ["u_admin", "u_john"],
      lastMessageText: "Sure, let's look at the drainage blueprints during the meeting.",
      lastMessageDate: "2026-06-01T01:10:00Z"
    }
  ];

  const seedMessages: Message[] = [
    {
      id: "m_1",
      conversationId: "c_1",
      senderId: "u_john",
      content: "Hello Admin, have we confirmed the delivery date for the drainage tubes?",
      date: "2026-06-01T01:05:00Z",
      isRead: true
    },
    {
      id: "m_2",
      conversationId: "c_1",
      senderId: "u_admin",
      content: "Sure, let's look at the drainage blueprints during the meeting.",
      date: "2026-06-01T01:10:00Z",
      isRead: false
    }
  ];

  // Polls
  const seedPolls: Poll[] = [
    {
      id: "poll_1",
      question: "Which sector should we prioritize for the next phase of Solar Streetlights?",
      options: [
        { id: "o_1", text: "Sector 1 (Eastern main avenue entrance)", votes: ["u_john", "u_sarah"] },
        { id: "o_2", text: "Sector 2 (Church & elementary school zone)", votes: ["u_admin"] },
        { id: "o_3", text: "Sector 3 (Market square perimeter)", votes: [] }
      ],
      date: "2026-05-28T09:00:00Z",
      authorId: "u_admin",
      authorName: "Maretraite Admin"
    }
  ];

  // Gallery
  const seedGallery: GalleryItem[] = [
    {
      id: "g_1",
      title: "Last year's independence day playground gathering",
      url: "https://images.unsplash.com/photo-1543807535-eceef0bc6599?auto=format&fit=crop&q=80&w=600",
      type: "image",
      uploadedBy: "Admin",
      date: "2025-11-25T14:30:00Z"
    },
    {
      id: "g_2",
      title: "Main Street asphalt preparation crew",
      url: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=600",
      type: "image",
      uploadedBy: "Johnathan Mercer",
      date: "2026-05-20T11:00:00Z"
    }
  ];

  // Seed Notifications
  const seedNotifications: Notification[] = [
    {
      id: "n_1",
      userId: "u_john",
      type: "announcement",
      title: "New Announcement Posted",
      content: "Maretraite Admin posted a new announcement: Maretraite Annual General Assembly is scheduled.",
      date: "2026-05-30T08:05:00Z",
      isRead: false,
      referenceId: "pos_1"
    },
    {
      id: "n_2",
      userId: "u_admin",
      type: "payment",
      title: "Payment Received",
      content: "Johnathan Mercer submitted high value payment of $100 via Bank Transfer.",
      date: "2026-02-18T14:00:00Z",
      isRead: true,
      referenceId: "pay_1"
    }
  ];

  const seedMarketplace: MarketplaceItem[] = [
    {
      id: "m_1",
      title: "Second-hand Mountain Bike",
      description: "Excellent condition mudguards, perfect for Surinamese roads in the wet season. 18-speed Shimano gears.",
      price: 150,
      imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=300",
      category: "vehicles",
      contactPhone: "+597-888-8888",
      contactEmail: "admin@maretraite.org",
      sellerId: "u_admin",
      sellerName: "Maretraite Admin",
      sellerAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
      date: "2026-05-25T10:00:00Z",
      status: "available"
    },
    {
      id: "m_2",
      title: "Portable Air Conditioner",
      description: "12000 BTU, works great, used only for 3 months. Remote control and exhaust hose included.",
      price: 320,
      imageUrl: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=300",
      category: "electronics",
      contactPhone: "+597-876-5432",
      contactEmail: "john@gmail.com",
      sellerId: "u_john",
      sellerName: "Johnathan Mercer",
      sellerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
      date: "2026-05-28T15:30:00Z",
      status: "available"
    }
  ];

  db = {
    users: [
      {
        id: "u_admin",
        memberId: "MR-26-0001",
        username: "admin",
        fullName: "Maretraite Admin",
        email: "admin@maretraite.org",
        role: "admin",
        status: "approved",
        profilePicture: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
        bio: "Official administrator account for the Maretraite Project Network administration. Here to assist with payments, reports, and community moderation.",
        phone: "+597-888-8888",
        registrationDate: "2026-01-10T12:00:00Z",
        outstandingBalance: 0,
        totalContributed: 500,
        pincode: "1234"
      },
      {
        id: "u_maretraite",
        memberId: "MR-26-0002",
        username: "Maretraite",
        fullName: "Maretraite Admin",
        email: "support@maretraite.org",
        role: "admin",
        status: "approved",
        profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
        bio: "Official administrator account for the Maretraite Project Network administration. Password 'Buren123'.",
        phone: "+597-888-8888",
        registrationDate: "2026-05-28T12:00:00Z",
        outstandingBalance: 0,
        totalContributed: 500,
        pincode: "1234"
      },
      {
        id: "u_moderator",
        memberId: "MR-26-0003",
        username: "moderator",
        fullName: "Gast Moderator",
        email: "moderator@maretraite.org",
        role: "moderator",
        status: "approved",
        profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        bio: "Gast moderator account om de gemeenschapsfeed en marktplaats veilig te houden.",
        phone: "+597-888-9999",
        registrationDate: "2026-05-28T12:00:00Z",
        outstandingBalance: 0,
        totalContributed: 100,
        pincode: "1234"
      }
    ],
    posts: [],
    events: [],
    projects: [],
    payments: [],
    conversations: [],
    messages: [],
    notifications: [],
    polls: [],
    gallery: [],
    marketplace: []
  };

  saveToDisk();
}

function saveToDisk() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write database to disk:", e);
  }
}

// Ensure database file exists
loadOrSeedDatabase();

async function cleanupDummyData() {
  const dummyIds: Record<string, string[]> = {
    users: ["u_john", "u_sarah", "u_robert"],
    posts: ["pos_1", "pos_2", "pos_3"],
    events: ["e_1", "e_2", "e_3"],
    projects: ["p_1", "p_2", "p_3"],
    payments: ["pay_1", "pay_2", "pay_3"],
    conversations: ["c_1"],
    messages: ["m_1", "m_2"],
    notifications: ["n_1", "n_2"],
    polls: ["poll_1"],
    gallery: ["g_1", "g_2"],
    marketplace: ["m_1", "m_2"]
  };

  console.log("Starting dummy data cleanup from local database and Firestore...");
  for (const collName of Object.keys(dummyIds)) {
    const ids = dummyIds[collName];
    const currentColl = collName as keyof DatabaseSchema;
    // Filter local db
    if (db[currentColl]) {
      db[currentColl] = (db[currentColl] as any[]).filter(
        (item: any) => !ids.includes(item.id)
      ) as any;
    }
    // Delete from Firestore
    for (const id of ids) {
      try {
        await deleteItemFromFirestore(currentColl, id);
      } catch (err) {
        console.error(`Error deleting doc ${collName}/${id} from Firestore:`, err);
      }
    }
  }
  saveToDisk();
  console.log("Dummy data cleanup completed.");
}

async function ensureEssentialUsers() {
  const essentialUsers: User[] = [
    {
      id: "u_admin",
      memberId: "MR-26-0001",
      username: "admin",
      fullName: "Maretraite Admin",
      email: "admin@maretraite.org",
      role: "admin",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200",
      bio: "Official administrator account for the Maretraite Project Network administration. Here to assist with payments, reports, and community moderation.",
      phone: "+597-888-8888",
      registrationDate: "2026-01-10T12:00:00Z",
      outstandingBalance: 0,
      totalContributed: 500,
      pincode: "1234"
    },
    {
      id: "u_maretraite",
      memberId: "MR-26-0002",
      username: "Maretraite",
      fullName: "Maretraite Admin",
      email: "support@maretraite.org",
      role: "admin",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      bio: "Official administrator account for the Maretraite Project Network administration. Password 'Buren123'.",
      phone: "+597-888-8888",
      registrationDate: "2026-05-28T12:00:00Z",
      outstandingBalance: 0,
      totalContributed: 500,
      pincode: "1234"
    },
    {
      id: "u_moderator",
      memberId: "MR-26-0003",
      username: "moderator",
      fullName: "Gast Moderator",
      email: "moderator@maretraite.org",
      role: "moderator",
      status: "approved",
      profilePicture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      bio: "Gast moderator account om de gemeenschapsfeed en marktplaats veilig te houden.",
      phone: "+597-888-9999",
      registrationDate: "2026-05-28T12:00:00Z",
      outstandingBalance: 0,
      totalContributed: 100,
      pincode: "1234"
    }
  ];

  console.log("Validating and ensuring essential administrator/moderator accounts...");
  let needsDiskSave = false;
  for (const user of essentialUsers) {
    const existingIdx = db.users.findIndex(u => u.id === user.id);
    if (existingIdx === -1) {
      db.users.push(user);
      needsDiskSave = true;
      console.log(`Restored missing essential user locally: ${user.username}`);
    } else {
      let updated = false;
      const existing = db.users[existingIdx];
      if (existing.username !== user.username) { existing.username = user.username; updated = true; }
      if (existing.role !== user.role) { existing.role = user.role; updated = true; }
      if (existing.pincode !== user.pincode) { existing.pincode = user.pincode; updated = true; }
      if (existing.status !== user.status) { existing.status = user.status; updated = true; }
      if (updated) {
        needsDiskSave = true;
        console.log(`Updated existing essential user fields locally: ${user.username}`);
      }
    }

    // Always ensure they exist in Firestore too
    try {
      await saveItemToFirestore("users", user);
    } catch (err) {
      console.error(`Error saving essential user ${user.username} to Firestore:`, err);
    }
  }

  if (needsDiskSave) {
    saveToDisk();
  }
}

// Sync and seed with cloud Firestore database
(async () => {
  // Clear any existing dummy records from database to go live with a clean slate
  await cleanupDummyData();

  const collections: (keyof DatabaseSchema)[] = [
    "users", "posts", "events", "projects", "payments", 
    "conversations", "messages", "notifications", "polls", 
    "gallery", "marketplace"
  ];
  for (const coll of collections) {
    await syncCollectionFromFirestore(coll);
    await seedCollectionToFirestore(coll);
  }

  // Ensure robust backup of special moderator and admin accounts
  await ensureEssentialUsers();
})().catch(err => {
  console.error("Failed to run initial background Firestore sync/seed:", err);
});


// --- MIDDLEWARE FOR API TOKENS ---
// For the mock token approach, we use simplified authorizer
// Header format: Bearer u_admin or Bearer u_john
function checkAuth(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized access, token missing" });
  }
  const userId = authHeader.split(" ")[1];
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User profile not found" });
  }
  if (user.status === "pending") {
    return res.status(403).json({ error: "Uw account is nog in afwachting van goedkeuring door de beheerder." });
  }
  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account is suspended. Please contact admin." });
  }
  req.user = user;
  next();
}


// --- API ENDPOINTS ---

// 1. Auth routes
app.post("/api/auth/register", async (req, res) => {
  const { username, fullName, email, password, bio, phone, profilePicture } = req.body;
  if (!username || !fullName || !email) {
    return res.status(400).json({ error: "Username, full name, and email are required" });
  }

  // Check unique username or email
  const exists = db.users.find(u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: "Username or email is already registered." });
  }

  // Create highly realistic unique Member ID (e.g., MR-26-XXXX)
  const randNumStr = String(Math.floor(1000 + Math.random() * 9000));
  const newMemberId = `MR-26-${randNumStr}`;
  const newUserId = `u_${Date.now()}`;

  const newUser: User = {
    id: newUserId,
    memberId: newMemberId,
    username: username.toLowerCase().trim(),
    fullName,
    email,
    role: "member",
    status: "pending", // Newly registered users are pending admin approval
    profilePicture: profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200",
    bio: bio || "Proud member of the Maretraite Community.",
    phone: phone || "",
    registrationDate: new Date().toISOString(),
    outstandingBalance: 100, // Annual standard contribution fee
    totalContributed: 0
  };

  db.users.push(newUser);
  saveToDisk();

  // Save to persistent cloud Firestore database
  try {
    await saveItemToFirestore("users", newUser);
  } catch (err: any) {
    console.warn("Firestore sync warning during registration (local DB updated successfully):", err);
  }

  res.status(201).json({ 
    message: "Registration successful! Admin review pending.", 
    user: newUser 
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { username, pincode } = req.body;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  // Simple username case-insensitive validation
  const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: "Invalid username or account not found" });
  }

  if (user.status === "pending") {
    return res.status(403).json({ error: "Uw account is nog in afwachting van goedkeuring door de beheerder." });
  }

  if (user.status === "suspended") {
    return res.status(403).json({ error: "Your account is suspended. Please contact support." });
  }

  const userPin = user.pincode;

  // If no pincode provided in the login body, inform the client that a pincode is required and whether one is already set
  if (pincode === undefined) {
    return res.json({
      pincodeRequired: true,
      hasPincode: !!userPin
    });
  }

  // Validate format of the provided pincode (must be exactly 4 digits)
  const isFourDigits = /^\d{4}$/.test(pincode);
  if (!isFourDigits) {
    return res.status(400).json({ error: "De pincode moet exact 4 cijfers bevatten." });
  }

  // If the user does not have a pincode set yet (e.g., they were just activated by the admin)
  if (!userPin) {
    user.pincode = pincode;
    saveToDisk();
    try {
      await saveItemToFirestore("users", user);
    } catch (err: any) {
      console.warn("Firestore sync warning during pincode creation (local DB updated successfully):", err);
    }
    return res.json({
      token: user.id,
      user
    });
  }

  // If a pincode is set, check if it matches
  if (userPin !== pincode) {
    return res.status(401).json({ error: "Onjuiste pincode. Probeer het opnieuw." });
  }

  // Simulating token response with userId itself as token
  res.json({
    token: user.id,
    user
  });
});

app.get("/api/auth/me", checkAuth, (req: any, res) => {
  res.json({ user: req.user });
});


// 2. Members Directory Routes
app.get("/api/members", checkAuth, (req, res) => {
  res.json({ users: db.users });
});

app.post("/api/members/update", checkAuth, async (req: any, res) => {
  const { fullName, email, bio, phone, profilePicture, pincode } = req.body;
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (email && email.toLowerCase() !== user.email.toLowerCase()) {
    const emailExists = db.users.find(u => u.id !== user.id && u.email.toLowerCase() === email.toLowerCase());
    if (emailExists) {
      return res.status(400).json({ error: "Dit e-mailadres is al geregistreerd bij een andere bewoner." });
    }
    user.email = email;
  }

  if (fullName) user.fullName = fullName;
  if (bio !== undefined) user.bio = bio;
  if (phone !== undefined) user.phone = phone;
  if (profilePicture) user.profilePicture = profilePicture;

  if (pincode !== undefined) {
    const isFourDigits = /^\d{4}$/.test(pincode);
    if (!isFourDigits) {
      return res.status(400).json({ error: "De pincode moet exact 4 cijfers bevatten." });
    }
    user.pincode = pincode;
  }

  // Sync post/comment display data references dynamically
  db.posts.forEach(p => {
    if (p.authorId === user.id) {
       p.authorName = user.fullName;
       p.authorAvatar = user.profilePicture;
    }
    p.comments.forEach(c => {
      if (c.authorId === user.id) {
        c.authorName = user.fullName;
        c.authorAvatar = user.profilePicture;
      }
    });
  });

  saveToDisk();

  // Save updated profile to Firestore cloud database
  try {
    await saveItemToFirestore("users", user);
    for (const post of db.posts) {
      if (post.authorId === user.id || post.comments.some(c => c.authorId === user.id)) {
        await saveItemToFirestore("posts", post);
      }
    }
  } catch (err: any) {
    console.warn("Firestore sync warning during profile update (local DB updated successfully):", err);
  }

  res.json({ success: true, user });
});


// 3. User Moderation Admin API Endpoints
app.post("/api/admin/members/status", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can perform status changes" });
  }

  const { memberId, status } = req.body;
  const targetUser = db.users.find(u => u.id === memberId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  if (targetUser.id === "u_admin") {
    return res.status(400).json({ error: "Cannot modify primary Administrator account status" });
  }

  targetUser.status = status as UserStatus;
  saveToDisk();

  // Notify user
  const newNotif: Notification = {
    id: `notif_${Date.now()}`,
    userId: targetUser.id,
    type: "announcement",
    title: "Account Status Updated",
    content: `An administrator has updated your account status to: ${status.toUpperCase()}`,
    date: new Date().toISOString(),
    isRead: false
  };
  db.notifications.push(newNotif);
  saveToDisk();

  // Persist updated user parameters and notification to cloud database
  try {
    await saveItemToFirestore("users", targetUser);
    await saveItemToFirestore("notifications", newNotif);
  } catch (err: any) {
    console.warn("Firestore sync warning during status change (local DB updated successfully):", err);
  }

  res.json({ success: true, user: targetUser });
});


app.post("/api/admin/members/role", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can perform role modifications" });
  }

  const { memberId, role } = req.body;
  const targetUser = db.users.find(u => u.id === memberId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  if (targetUser.id === "u_admin") {
    return res.status(400).json({ error: "Cannot modify primary Administrator account role" });
  }

  const allowedRoles = ["admin", "member", "moderator"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role specified" });
  }

  targetUser.role = role as any;
  saveToDisk();

  // Notify user
  const newNotif: Notification = {
    id: `notif_${Date.now()}`,
    userId: targetUser.id,
    type: "announcement",
    title: "Account Role Updated",
    content: `An administrator has updated your account role to: ${role.toUpperCase()}`,
    date: new Date().toISOString(),
    isRead: false
  };
  db.notifications.push(newNotif);
  saveToDisk();

  // Persist updated user roles and notification to cloud database
  try {
    await saveItemToFirestore("users", targetUser);
    await saveItemToFirestore("notifications", newNotif);
  } catch (err: any) {
    console.warn("Firestore sync warning during role change (local DB updated successfully):", err);
  }

  res.json({ success: true, user: targetUser });
});


app.post("/api/admin/members/reset-pincode", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can reset pincodes" });
  }

  const { memberId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: "Missing memberId parameter" });
  }

  const targetUser = db.users.find(u => u.id === memberId);
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  delete targetUser.pincode;
  saveToDisk();

  try {
    await saveItemToFirestore("users", targetUser);
  } catch (err: any) {
    console.warn("Firestore sync warning during pincode reset (local DB updated successfully):", err);
  }

  res.json({ success: true, user: targetUser });
});


app.post("/api/admin/members/delete", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can perform user deletions" });
  }

  const { memberId } = req.body;
  if (!memberId) {
    return res.status(400).json({ error: "Missing memberId parameter" });
  }

  if (memberId === "u_admin") {
    return res.status(400).json({ error: "Cannot delete the primary Administrator account" });
  }

  if (memberId === req.user.id) {
    return res.status(400).json({ error: "Cannot delete your own administrator account" });
  }

  const targetIdx = db.users.findIndex(u => u.id === memberId);
  if (targetIdx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  // Remove the user from local DB and save
  const deletedUser = db.users[targetIdx];
  db.users.splice(targetIdx, 1);
  saveToDisk();

  // Try to remove the user from Firestore
  try {
    await deleteItemFromFirestore("users", memberId);
  } catch (err: any) {
    console.warn("Firestore sync warning during user deletion (local DB updated successfully):", err);
  }

  res.json({ success: true, deletedUserId: memberId, username: deletedUser.username });
});


// 3.5 Marketplace API
app.get("/api/marketplace", checkAuth, (req, res) => {
  if (!db.marketplace) {
    db.marketplace = [];
  }
  res.json({ marketplace: db.marketplace });
});

app.post("/api/marketplace", checkAuth, async (req: any, res) => {
  const { title, description, price, imageUrl, category, contactPhone, contactEmail } = req.body;

  if (!title || !description || price === undefined || !category || !contactPhone) {
    return res.status(400).json({ error: "Missing required fields for marketplace listing" });
  }

  const newItem: MarketplaceItem = {
    id: `market_${Date.now()}`,
    title,
    description,
    price: Number(price),
    imageUrl: imageUrl || undefined,
    category,
    contactPhone,
    contactEmail: contactEmail || undefined,
    sellerId: req.user.id,
    sellerName: req.user.fullName,
    sellerAvatar: req.user.profilePicture,
    date: new Date().toISOString(),
    status: "available"
  };

  if (!db.marketplace) db.marketplace = [];
  db.marketplace.unshift(newItem);
  saveToDisk();
  await saveItemToFirestore("marketplace", newItem);

  res.status(201).json({ success: true, item: newItem });
});

app.post("/api/marketplace/:id/status", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "available" && status !== "sold") {
    return res.status(400).json({ error: "Invalid status" });
  }

  if (!db.marketplace) db.marketplace = [];
  const item = db.marketplace.find(i => i.id === id);
  if (!item) {
    return res.status(404).json({ error: "Marketplace item not found" });
  }

  // Allow seller or admin only
  const canUpdate = item.sellerId === req.user.id || req.user.role === "admin";
  if (!canUpdate) {
    return res.status(403).json({ error: "Unauthorized to update status" });
  }

  item.status = status;
  saveToDisk();
  await saveItemToFirestore("marketplace", item);

  res.json({ success: true, item });
});

app.delete("/api/marketplace/:id", checkAuth, async (req: any, res) => {
  const { id } = req.params;

  if (!db.marketplace) db.marketplace = [];
  const itemIndex = db.marketplace.findIndex(i => i.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: "Marketplace item not found" });
  }

  const item = db.marketplace[itemIndex];
  // Allow seller or admin only
  const canDelete = item.sellerId === req.user.id || req.user.role === "admin";
  if (!canDelete) {
    return res.status(403).json({ error: "Unauthorized to delete listing" });
  }

  db.marketplace.splice(itemIndex, 1);
  saveToDisk();
  await deleteItemFromFirestore("marketplace", id);

  res.json({ success: true });
});


// 4. Feed & Posts API
app.get("/api/posts", checkAuth, (req, res) => {
  res.json({ posts: db.posts });
});

// Create Post with Auto AI content moderation using Gemini
app.post("/api/posts", checkAuth, async (req: any, res) => {
  const { content, mediaUrl, mediaName, mediaType, isAnnouncement, announcementCategory } = req.body;
  if (!content && !mediaUrl) {
    return res.status(400).json({ error: "Post cannot be empty" });
  }

  const postAuthor = req.user;
  const newPostId = `pos_${Date.now()}`;

  const newPost: Post = {
    id: newPostId,
    authorId: postAuthor.id,
    authorName: postAuthor.fullName,
    authorAvatar: postAuthor.profilePicture,
    authorRole: postAuthor.role,
    content: content || "",
    mediaUrl,
    mediaName,
    mediaType: mediaType || null,
    likes: [],
    comments: [],
    shares: 0,
    date: new Date().toISOString(),
    isAnnouncement: !!(isAnnouncement && postAuthor.role === "admin"),
    announcementCategory: isAnnouncement && postAuthor.role === "admin" ? announcementCategory : undefined,
    aiModerated: "pending"
  };

  db.posts.unshift(newPost);
  saveToDisk();

  // Create notifications as requested if it's announcement
  if (newPost.isAnnouncement) {
    db.users.forEach(u => {
      if (u.id !== postAuthor.id) {
        db.notifications.push({
          id: `notif_ann_${Date.now()}_${u.id}`,
          userId: u.id,
          type: "announcement",
          title: "Official Community Announcement",
          content: `${postAuthor.fullName} posted: ${newPost.content.slice(0, 60)}...`,
          date: new Date().toISOString(),
          isRead: false,
          referenceId: newPostId
        });
      }
    });
  }

  // AI Moderation Trigger (Asynchronous or immediately prior)
  if (ai) {
    try {
      const prompt = `You are an automated AI safety content moderator for "Maretraite Project Network", a respectful family-oriented neighborhood network. Analyze this post and output JSON with structure: { "safe": boolean, "reason": "string describing safety issues if safe is false" }. A safe post must NOT contain severe insults, extreme hate speech, explicit pornography, racism, extreme violence, or spam. Safe posts are true or polite community inquiries.

      Post content: "${newPost.content}" 
      Has attachment: ${!!newPost.mediaUrl}`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = aiResponse.text?.trim() || "";
      const resultObj = JSON.parse(responseText);

      const targetPost = db.posts.find(p => p.id === newPostId);
      if (targetPost) {
        if (resultObj.safe) {
          targetPost.aiModerated = "clean";
        } else {
          targetPost.aiModerated = "flagged";
          targetPost.aiReviewReason = resultObj.reason;
        }
        saveToDisk();
      }
    } catch (moderationErr) {
      console.error("Gemini AI Content Moderation error:", moderationErr);
      // Fail safely
      const targetPost = db.posts.find(p => p.id === newPostId);
      if (targetPost) {
        targetPost.aiModerated = "clean";
        saveToDisk();
      }
    }
  } else {
    // If key missing, auto-moderate safe as "clean"
    const targetPost = db.posts.find(p => p.id === newPostId);
    if (targetPost) {
      targetPost.aiModerated = "clean";
      saveToDisk();
    }
  }

  const postToSave = db.posts.find(p => p.id === newPostId) || newPost;
  await saveItemToFirestore("posts", postToSave);

  if (newPost.isAnnouncement) {
    for (const u of db.users) {
      if (u.id !== postAuthor.id) {
        const notif = db.notifications.find(n => n.userId === u.id && n.referenceId === newPostId);
        if (notif) {
          await saveItemToFirestore("notifications", notif);
        }
      }
    }
  }

  res.status(201).json({ success: true, post: postToSave });
});

// Like Toggling
app.post("/api/posts/:id/like", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const userId = req.user.id;
  const index = post.likes.indexOf(userId);
  let isLiked = false;
  let newNotif: any = null;

  if (index === -1) {
    post.likes.push(userId);
    isLiked = true;

    // Send a notification to author if author isn't the liker
    if (post.authorId !== userId) {
      newNotif = {
        id: `notif_like_${Date.now()}`,
        userId: post.authorId,
        type: "post_like",
        title: "Post Liked",
        content: `${req.user.fullName} liked your update.`,
        date: new Date().toISOString(),
        isRead: false,
        referenceId: id
      };
      db.notifications.push(newNotif);
    }
  } else {
    post.likes.splice(index, 1);
  }

  saveToDisk();
  await saveItemToFirestore("posts", post);
  if (newNotif) {
    await saveItemToFirestore("notifications", newNotif);
  }

  res.json({ success: true, likes: post.likes, isLiked });
});

// Comment Adding
app.post("/api/posts/:id/comment", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const { content, mediaUrl } = req.body;
  if ((!content || !content.trim()) && !mediaUrl) {
    return res.status(400).json({ error: "Comment content or photo is required" });
  }

  const post = db.posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const newComment: Comment = {
    id: `com_${Date.now()}`,
    postId: id,
    authorId: req.user.id,
    authorName: req.user.fullName,
    authorAvatar: req.user.profilePicture,
    content: (content || "").trim(),
    mediaUrl: mediaUrl || undefined,
    date: new Date().toISOString(),
    likes: []
  };

  post.comments.push(newComment);
  saveToDisk();
  await saveItemToFirestore("posts", post);

  // Create notifications as requested
  if (post.authorId !== req.user.id) {
    const newNotif: Notification = {
      id: `notif_com_${Date.now()}`,
      userId: post.authorId,
      type: "post_comment",
      title: "New Comment Received",
      content: `${req.user.fullName} commented: "${content.slice(0, 30)}..."`,
      date: new Date().toISOString(),
      isRead: false,
      referenceId: id
    };
    db.notifications.push(newNotif);
    await saveItemToFirestore("notifications", newNotif);
  }

  res.status(201).json({ success: true, comment: newComment });
});

// Delete Post (Only author or admin)
app.delete("/api/posts/:id", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const postIndex = db.posts.findIndex(p => p.id === id);
  if (postIndex === -1) return res.status(404).json({ error: "Post not found" });

  const post = db.posts[postIndex];
  if (post.authorId !== req.user.id && req.user.role !== "admin" && req.user.role !== "moderator") {
    return res.status(403).json({ error: "You are not authorized to delete this post" });
  }

  db.posts.splice(postIndex, 1);
  saveToDisk();
  await deleteItemFromFirestore("posts", id);
  res.json({ success: true });
});

// Like Comment Toggling
app.post("/api/posts/:postId/comments/:commentId/like", checkAuth, async (req: any, res) => {
  const { postId, commentId } = req.params;
  const post = db.posts.find(p => p.id === postId);
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = post.comments.find(c => c.id === commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });

  if (!comment.likes) {
    comment.likes = [];
  }

  const userId = req.user.id;
  const index = comment.likes.indexOf(userId);
  let isLiked = false;
  let newNotif: any = null;

  if (index === -1) {
    comment.likes.push(userId);
    isLiked = true;

    // Send a notification to comment author if author isn't the liker
    if (comment.authorId !== userId) {
      newNotif = {
        id: `notif_com_like_${Date.now()}`,
        userId: comment.authorId,
        type: "post_like",
        title: "Comment Liked",
        content: `${req.user.fullName} liked your comment: "${comment.content.slice(0, 20)}..."`,
        date: new Date().toISOString(),
        isRead: false,
        referenceId: postId
      };
      db.notifications.push(newNotif);
    }
  } else {
    comment.likes.splice(index, 1);
  }

  saveToDisk();
  await saveItemToFirestore("posts", post);
  if (newNotif) {
    await saveItemToFirestore("notifications", newNotif);
  }

  res.json({ success: true, likes: comment.likes, isLiked });
});


// 5. Finance Management API System
app.get("/api/payments", checkAuth, (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can view financial records" });
  }
  // Compute analytics
  const totalCollected = db.payments.reduce((acc, pay) => acc + pay.amount, 0);
  
  // Custom totals calculations
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentYear = currentDate.getFullYear();

  const monthlyCollections = db.payments
    .filter(pay => {
      const payDate = new Date(pay.date);
      return payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear;
    })
    .reduce((acc, pay) => acc + pay.amount, 0);

  const yearlyCollections = db.payments
    .filter(pay => {
      const payDate = new Date(pay.date);
      return payDate.getFullYear() === currentYear;
    })
    .reduce((acc, pay) => acc + pay.amount, 0);

  const outstandingContributions = db.users.reduce((acc, u) => acc + u.outstandingBalance, 0);

  res.json({
    payments: db.payments,
    analytics: {
      totalCollected,
      monthlyCollections,
      yearlyCollections,
      outstandingContributions
    }
  });
});

app.post("/api/payments", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can record manual payments" });
  }

  const { memberId, amount, date, method, referenceNumber, notes, nonMemberName } = req.body;
  if (!memberId || !amount || !referenceNumber) {
    return res.status(400).json({ error: "Member ID, amount, and reference number are required" });
  }

  const paymentAmount = Number(amount);

  if (memberId === "non_member") {
    const finalName = nonMemberName || "Non-member Resident";
    const newPayment: Payment = {
      id: `pay_${Date.now()}`,
      memberId: "NON-MEMBER",
      memberName: finalName,
      amount: paymentAmount,
      date: date || new Date().toISOString().split("T")[0],
      method: method || "bank_transfer",
      referenceNumber,
      notes: notes || ""
    };

    db.payments.unshift(newPayment);
    saveToDisk();

    return res.status(201).json({ success: true, payment: newPayment });
  }

  // Find user by either system username or system ID
  const targetUser = db.users.find(u => u.id === memberId || u.memberId === memberId || u.username === memberId);
  if (!targetUser) {
    return res.status(404).json({ error: "Recipient community member not found" });
  }

  const newPayment: Payment = {
    id: `pay_${Date.now()}`,
    memberId: targetUser.memberId,
    memberName: targetUser.fullName,
    amount: paymentAmount,
    date: date || new Date().toISOString().split("T")[0],
    method: method || "bank_transfer",
    referenceNumber,
    notes: notes || ""
  };

  db.payments.unshift(newPayment);

  // Update target user's financial ledger counts
  targetUser.totalContributed += paymentAmount;
  targetUser.outstandingBalance = Math.max(0, targetUser.outstandingBalance - paymentAmount);
  saveToDisk();

  // Create notifications as requested
  db.notifications.push({
    id: `notif_pay_${Date.now()}`,
    userId: targetUser.id,
    type: "payment",
    title: "Payment Registered",
    content: `An administrator recorded physical receipt of $${paymentAmount} via ${method.replace('_', ' ')}. Contribution tracker was credited.`,
    date: new Date().toISOString(),
    isRead: false,
    referenceId: newPayment.id
  });

  saveToDisk();

  // Save the updated user with adjusted balance, the payment record, and notification to Firestore
  try {
    await saveItemToFirestore("users", targetUser);
    await saveItemToFirestore("payments", newPayment);
    const lastNotif = db.notifications[db.notifications.length - 1];
    if (lastNotif) {
      await saveItemToFirestore("notifications", lastNotif);
    }
  } catch (err: any) {
    console.warn("Firestore sync warning during payments sync (local DB updated successfully):", err);
  }

  res.status(201).json({ success: true, payment: newPayment, user: targetUser });
});


// 6. Events API
app.get("/api/events", checkAuth, (req, res) => {
  res.json({ events: db.events });
});

app.post("/api/events", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only administrators can produce new events" });
  }

  const { title, description, date, time, location, category, image } = req.body;
  if (!title || !description || !date || !time || !location) {
    return res.status(400).json({ error: "Essential fields are missing for event setup." });
  }

  const newEvent: Event = {
    id: `e_${Date.now()}`,
    title,
    description,
    date,
    time,
    location,
    organizer: req.user.fullName,
    rsvps: [],
    image: image || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600",
    category: category || "social"
  };

  db.events.push(newEvent);
  
  // Add notifications for all members
  db.users.forEach(u => {
    if (u.id !== req.user.id) {
       db.notifications.push({
         id: `notif_ev_${Date.now()}_${u.id}`,
         userId: u.id,
         type: "event",
         title: "New Event Announced",
         content: `Event: "${title}" is set for ${date}. RSVP on the events bulletin board.`,
         date: new Date().toISOString(),
         isRead: false,
         referenceId: newEvent.id
       });
    }
  });

  saveToDisk();
  await saveItemToFirestore("events", newEvent);
  for (const u of db.users) {
    if (u.id !== req.user.id) {
      const notif = db.notifications.find(n => n.userId === u.id && n.referenceId === newEvent.id);
      if (notif) {
        await saveItemToFirestore("notifications", notif);
      }
    }
  }

  res.status(201).json({ success: true, event: newEvent });
});

// Event RSVP
app.post("/api/events/:id/rsvp", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const event = db.events.find(e => e.id === id);
  if (!event) return res.status(404).json({ error: "Event bulletin not found" });

  const userId = req.user.id;
  const index = event.rsvps.indexOf(userId);
  let status = "yes";

  if (index === -1) {
    event.rsvps.push(userId);
  } else {
    event.rsvps.splice(index, 1);
    status = "no";
  }

  saveToDisk();
  await saveItemToFirestore("events", event);
  res.json({ success: true, rsvps: event.rsvps, status });
});


// 7. Projects API endpoints
app.get("/api/projects", checkAuth, (req, res) => {
  res.json({ projects: db.projects });
});

// Create project (Admin-only)
app.post("/api/projects", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Only admins can declare ongoing construction projects" });
  }

  const { title, description, category, budget, photos } = req.body;
  if (!title || !description || !category || !budget) {
    return res.status(400).json({ error: "Missing title, description, category, or budget limits" });
  }

  const newProject: Project = {
    id: `p_${Date.now()}`,
    title,
    description,
    category,
    status: "planning",
    budget: Number(budget),
    spent: 0,
    progress: 0,
    photos: photos || ["https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600"],
    updates: []
  };

  db.projects.push(newProject);
  saveToDisk();
  await saveItemToFirestore("projects", newProject);
  res.status(201).json({ success: true, project: newProject });
});

// Add update notes to project
app.post("/api/projects/:id/updates", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: "Update header and content notes are required" });
  }

  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const newUpdate = {
    id: `pu_${Date.now()}`,
    date: new Date().toISOString(),
    title,
    content,
    authorName: req.user.fullName
  };

  project.updates.unshift(newUpdate);
  saveToDisk();
  await saveItemToFirestore("projects", project);
  res.status(201).json({ success: true, update: newUpdate, project });
});

// Update project status, budget spent percentage
app.post("/api/projects/:id/progress", checkAuth, async (req: any, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin auth required to change physical site parameters" });
  }

  const { id } = req.params;
  const { status, spent, progress } = req.body;
  const project = db.projects.find(p => p.id === id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  if (status) project.status = status;
  if (spent !== undefined) project.spent = Number(spent);
  if (progress !== undefined) project.progress = Math.min(100, Math.max(0, Number(progress)));

  saveToDisk();
  await saveItemToFirestore("projects", project);
  res.json({ success: true, project });
});


// 8. One-to-One and Group Messaging API
app.get("/api/conversations", checkAuth, (req: any, res) => {
  const userId = req.user.id;
  // Filters conversations this user participates in
  const userConvs = db.conversations.filter(c => c.participantIds.includes(userId));

  // Augment descriptions
  const conversationsAugmented = userConvs.map(conv => {
    // Determine target recipient (for direct chats)
    const otherId = conv.participantIds.find(id => id !== userId);
    const otherUser = db.users.find(u => u.id === otherId);

    // Compute unread message count
    const unreadCount = db.messages.filter(m => 
      m.conversationId === conv.id && 
      m.senderId !== userId && 
      !m.isRead
    ).length;

    return {
      ...conv,
      recipientName: conv.isGroup ? conv.name : (otherUser ? otherUser.fullName : "Unknown Member"),
      recipientAvatar: conv.isGroup ? "" : (otherUser ? otherUser.profilePicture : ""),
      unreadCount
    };
  });

  res.json({ conversations: conversationsAugmented });
});

app.get("/api/conversations/:id/messages", checkAuth, (req, res) => {
  const { id } = req.params;
  const messages = db.messages.filter(m => m.conversationId === id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json({ messages });
});

app.post("/api/conversations/message", checkAuth, async (req: any, res) => {
  const { conversationId, recipientId, content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "Message content is required" });
  }

  const senderId = req.user.id;
  let activeConversationId = conversationId;

  if (!activeConversationId) {
    if (!recipientId) return res.status(400).json({ error: "Either Conversation ID or Recipient ID must be defined." });
    
    // Check if one-to-one conversation already exists
    let existing = db.conversations.find(c => 
      !c.isGroup && 
      c.participantIds.includes(senderId) && 
      c.participantIds.includes(recipientId)
    );

    if (existing) {
      activeConversationId = existing.id;
    } else {
      // Create new private chat
      activeConversationId = `c_${Date.now()}`;
      const newConv: Conversation = {
        id: activeConversationId,
        isGroup: false,
        participantIds: [senderId, recipientId],
        lastMessageText: content.trim(),
        lastMessageDate: new Date().toISOString()
      };
      db.conversations.push(newConv);
    }
  }

  // Create message
  const newMessage: Message = {
    id: `m_${Date.now()}`,
    conversationId: activeConversationId,
    senderId,
    content: content.trim(),
    date: new Date().toISOString(),
    isRead: false
  };

  db.messages.push(newMessage);

  // Sync last message meta
  const targetedConv = db.conversations.find(c => c.id === activeConversationId);
  if (targetedConv) {
    targetedConv.lastMessageText = content.trim();
    targetedConv.lastMessageDate = new Date().toISOString();
  }

  saveToDisk();
  await saveItemToFirestore("messages", newMessage);
  if (targetedConv) {
    await saveItemToFirestore("conversations", targetedConv);
  }

  // Push immediate messaging notification to recipient if direct chat
  if (targetedConv && !targetedConv.isGroup) {
    const recId = targetedConv.participantIds.find(id => id !== senderId);
    if (recId) {
      const msgNotif: Notification = {
        id: `notif_msg_${Date.now()}`,
        userId: recId,
        type: "message",
        title: "Private Message",
        content: `New message from ${req.user.fullName}: "${content.slice(0, 30)}..."`,
        date: new Date().toISOString(),
        isRead: false,
        referenceId: activeConversationId
      };
      db.notifications.push(msgNotif);
      saveToDisk();
      await saveItemToFirestore("notifications", msgNotif);
    }
  }

  res.status(201).json({ success: true, message: newMessage, conversationId: activeConversationId });
});

app.post("/api/conversations/:id/read", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  for (const m of db.messages) {
    if (m.conversationId === id && m.senderId !== userId) {
      if (!m.isRead) {
        m.isRead = true;
        await saveItemToFirestore("messages", m);
      }
    }
  }

  saveToDisk();
  res.json({ success: true });
});


// 9. Community Polls API
app.get("/api/polls", checkAuth, (req, res) => {
  res.json({ polls: db.polls });
});

app.post("/api/polls", checkAuth, async (req: any, res) => {
  const { question, options } = req.body;
  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "Polls require a valid question and at least 2 choice options." });
  }

  const newPoll: Poll = {
    id: `poll_${Date.now()}`,
    question,
    options: options.map((opt: string, i: number) => ({
      id: `o_${i}_${Date.now()}`,
      text: opt,
      votes: []
    })),
    date: new Date().toISOString(),
    authorId: req.user.id,
    authorName: req.user.fullName
  };

  db.polls.unshift(newPoll);
  saveToDisk();
  await saveItemToFirestore("polls", newPoll);
  res.status(201).json({ success: true, poll: newPoll });
});

app.post("/api/polls/:id/vote", checkAuth, async (req: any, res) => {
  const { id } = req.params;
  const { optionId } = req.body;
  const poll = db.polls.find(p => p.id === id);
  if (!poll) return res.status(404).json({ error: "Poll not found" });

  const userId = req.user.id;

  // Revoke any existing vote in this specific poll
  poll.options.forEach(opt => {
    const idx = opt.votes.indexOf(userId);
    if (idx !== -1) opt.votes.splice(idx, 1);
  });

  // Apply new vote
  const targetOption = poll.options.find(opt => opt.id === optionId);
  if (targetOption) {
    targetOption.votes.push(userId);
  }

  saveToDisk();
  await saveItemToFirestore("polls", poll);
  res.json({ success: true, poll });
});


// 10. Community Gallery API
app.get("/api/gallery", checkAuth, (req, res) => {
  res.json({ gallery: db.gallery });
});

app.post("/api/gallery", checkAuth, async (req: any, res) => {
  const { title, url, type } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: "Title and file media URL are required to publish in community gallery." });
  }

  const newItem: GalleryItem = {
    id: `g_${Date.now()}`,
    title,
    url,
    type: type || "image",
    uploadedBy: req.user.fullName,
    date: new Date().toISOString()
  };

  db.gallery.unshift(newItem);
  saveToDisk();
  await saveItemToFirestore("gallery", newItem);
  res.status(201).json({ success: true, item: newItem });
});


// 11. Notifications Listing Routes
app.get("/api/notifications", checkAuth, (req: any, res) => {
  const userNotifs = db.notifications
    .filter(n => n.userId === req.user.id)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json({ notifications: userNotifs });
});

app.post("/api/notifications/:id/read", checkAuth, async (req, res) => {
  const { id } = req.params;
  const notification = db.notifications.find(n => n.id === id);
  if (notification) {
    notification.isRead = true;
    saveToDisk();
    await saveItemToFirestore("notifications", notification);
  }
  res.json({ success: true });
});



// --- VITE DEV OR PRODUCTION INGRESS ROUTING ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Serve development SPA using Vite
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production from dist output
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Maretraite Project Network backend booted successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer();
