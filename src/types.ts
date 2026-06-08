/**
 * Shared Type Definitions for Maretraite Project Network
 */

export type UserRole = 'member' | 'admin' | 'moderator';
export type UserStatus = 'pending' | 'approved' | 'suspended';

export interface User {
  id: string;
  memberId: string; // Format: MR-26-XXXX
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profilePicture: string; // Base64 or placeholder URL
  bio: string;
  phone?: string;
  registrationDate: string;
  outstandingBalance: number; // For finance dashboard (default $100 annually)
  totalContributed: number;
  pincode?: string;
}

export type MediaType = 'image' | 'video' | 'document' | null;

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: UserRole;
  content: string;
  mediaUrl?: string; // base64 or placeholder URI
  mediaName?: string;
  mediaType: MediaType;
  likes: string[]; // List of User IDs who liked
  comments: Comment[];
  shares: number;
  date: string;
  isAnnouncement?: boolean;
  announcementCategory?: 'general' | 'emergency' | 'finance';
  aiModerated?: 'clean' | 'flagged' | 'pending';
  aiReviewReason?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  mediaUrl?: string;
  date: string;
  likes?: string[];
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  rsvps: string[]; // List of User IDs who RSVPed YES
  image?: string;
  category: 'social' | 'meeting' | 'project' | 'cleanup';
}

export interface ProjectUpdate {
  id: string;
  date: string;
  title: string;
  content: string;
  authorName: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'infrastructure' | 'roads' | 'buildings' | 'water' | 'education';
  status: 'planning' | 'in-progress' | 'completed';
  budget: number;
  spent: number;
  progress: number; // Percentage: 0 to 100
  photos: string[];
  updates: ProjectUpdate[];
}

export type PaymentMethod = 'bank_transfer' | 'cash' | 'credit_card' | 'mobile_pay';

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  referenceNumber: string;
  notes?: string;
}

export interface Conversation {
  id: string;
  name?: string; // For group chats
  isGroup: boolean;
  participantIds: string[];
  lastMessageText?: string;
  lastMessageDate?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  date: string;
  isRead: boolean;
}

export type NotificationType = 'post_like' | 'post_comment' | 'announcement' | 'payment' | 'event' | 'message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  date: string;
  isRead: boolean;
  referenceId?: string; // E.g., postId, eventId, paymentId
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: string[] }[]; // List of User IDs who voted for this option
  date: string;
  authorId: string;
  authorName: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string; // base64 or placeholder
  type: 'image' | 'video';
  uploadedBy: string;
  date: string;
}

export interface MarketplaceItem {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl?: string;
  category: 'vehicles' | 'property' | 'electronics' | 'household' | 'services' | 'other';
  contactPhone: string;
  contactEmail?: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  date: string;
  status: 'available' | 'sold';
}
