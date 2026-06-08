import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import FeedView from './components/FeedView';
import FinanceView from './components/FinanceView';
import EventsView from './components/EventsView';
import ProjectsView from './components/ProjectsView';
import GalleryView from './components/GalleryView';
import MessagingView from './components/MessagingView';
import AdminView from './components/AdminView';
import ProfileView from './components/ProfileView';
import LoginView from './components/LoginView';
import MarketplaceView from './components/MarketplaceView';
import SearchResultsView from './components/SearchResultsView';
import LightboxModal from './components/LightboxModal';
import { 
  User, Post, Event, Project, Payment, 
  Conversation, Message, Notification, Poll, GalleryItem, MarketplaceItem 
} from './types';

export default function App() {
  // Session Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem('mcn_token'));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [authError, setAuthError] = useState('');

  // Primary Workspace States
  const [activeTab, setActiveTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxCaption, setLightboxCaption] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('mcn_dark_mode') === 'true';
  });

  // DB Sync States
  const [posts, setPosts] = useState<Post[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsAnalytics, setPaymentsAnalytics] = useState({
    totalCollected: 0,
    monthlyCollections: 0,
    yearlyCollections: 0,
    outstandingContributions: 0
  });
  const [members, setMembers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [marketplace, setMarketplace] = useState<MarketplaceItem[]>([]);

  // Setup Dark mode styling classes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('mcn_dark_mode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('mcn_dark_mode', 'false');
    }
  }, [darkMode]);

  // Authorization API Utilities
  const getHeaders = () => {
    const activeToken = localStorage.getItem('mcn_token') || token;
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { 'Authorization': `Bearer ${activeToken}` } : {})
    };
  };

  // Securely verify profile or logoff on failures
  const checkTokenSelf = async () => {
    const activeToken = localStorage.getItem('mcn_token') || token;
    if (!activeToken) {
      setIsAuthChecked(true);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${activeToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setToken(activeToken);
      } else {
        // Discard stale token securely
        handleLogout();
      }
    } catch (err) {
      console.error("Token checking exception:", err);
    } finally {
      setIsAuthChecked(true);
    }
  };

  // Load Database Records
  const fetchAllData = async () => {
    const activeToken = localStorage.getItem('mcn_token') || token;
    if (!activeToken) return;

    try {
      // 1. Fetch Posts
      const resPosts = await fetch('/api/posts', { headers: getHeaders() });
      if (resPosts.ok) {
        const d = await resPosts.ok ? await resPosts.json() : { posts: [] };
        setPosts(d.posts);
      }

      // 2. Fetch Polls
      const resPolls = await fetch('/api/polls', { headers: getHeaders() });
      if (resPolls.ok) {
        const d = await resPolls.json();
        setPolls(d.polls);
      }

      // 3. Fetch Events
      const resEvents = await fetch('/api/events', { headers: getHeaders() });
      if (resEvents.ok) {
        const d = await resEvents.json();
        setEvents(d.events);
      }

      // 4. Fetch Projects
      const resProjects = await fetch('/api/projects', { headers: getHeaders() });
      if (resProjects.ok) {
        const d = await resProjects.json();
        setProjects(d.projects);
      }

      // 5. Fetch Gallery
      const resGallery = await fetch('/api/gallery', { headers: getHeaders() });
      if (resGallery.ok) {
        const d = await resGallery.json();
        setGallery(d.gallery);
      }

      // 6. Fetch Payments
      const resPayments = await fetch('/api/payments', { headers: getHeaders() });
      if (resPayments.ok) {
        const d = await resPayments.json();
        setPayments(d.payments);
        setPaymentsAnalytics(d.analytics);
      }

      // 7. Fetch Residents Directory
      const resMembers = await fetch('/api/members', { headers: getHeaders() });
      if (resMembers.ok) {
        const d = await resMembers.json();
        setMembers(d.users);

        // Keep current profile summary up-to-date with directory adjustments
        const myActiveProfile = d.users.find((u: User) => u.id === currentUser?.id);
        if (myActiveProfile) {
          setCurrentUser(myActiveProfile);
        }
      }

      // 8. Fetch Conversations & Notifications
      const resConv = await fetch('/api/conversations', { headers: getHeaders() });
      if (resConv.ok) {
        const d = await resConv.json();
        setConversations(d.conversations);
      }

      const resNotif = await fetch('/api/notifications', { headers: getHeaders() });
      if (resNotif.ok) {
        const d = await resNotif.json();
        setNotifications(d.notifications);
      }

      // 9. Fetch Marketplace
      const resMarket = await fetch('/api/marketplace', { headers: getHeaders() });
      if (resMarket.ok) {
        const d = await resMarket.json();
        setMarketplace(d.marketplace);
      }

    } catch (err) {
      console.error("Critical directory syncing exception:", err);
    }
  };

  // Sync active chat dialogue messages stream
  const fetchMessages = async () => {
    if (!activeConversationId) return;
    try {
      const res = await fetch(`/api/conversations/${activeConversationId}/messages`, {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error("Messages fetch failure:", err);
    }
  };

  // Check login and sync on startup or token modifications
  useEffect(() => {
    checkTokenSelf();
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      fetchAllData();
    }
  }, [currentUser?.id]);

  // Reload messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages();
      // Auto-read on select
      fetch(`/api/conversations/${activeConversationId}/read`, {
        method: 'POST',
        headers: getHeaders()
      }).then(() => fetchAllData());
    }
  }, [activeConversationId]);

  // Periodic Polling interval for chat/notifications real-time feel (every 7s)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => {
      fetchAllData();
      if (activeConversationId) {
        fetchMessages();
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [currentUser?.id, activeConversationId]);

  // Authenticate member
  const handleLogin = async (username: string, pincode?: string): Promise<{ success: boolean; pincodeRequired?: boolean; hasPincode?: boolean; error?: string }> => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pincode })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.pincodeRequired) {
          return { success: false, pincodeRequired: true, hasPincode: data.hasPincode };
        }
        localStorage.setItem('mcn_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        setActiveTab('feed');
        return { success: true };
      } else {
        setAuthError(data.error || 'Identity matching failed.');
        return { success: false, error: data.error };
      }
    } catch (err) {
      const errMsg = 'Verbindingsfout naar server.';
      setAuthError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  // Sign out
  const handleLogout = () => {
    localStorage.removeItem('mcn_token');
    setToken(null);
    setCurrentUser(null);
    setPosts([]);
    setNotifications([]);
    setActiveTab('feed');
  };

  // Handle registrations
  const handleRegister = async (formData: any) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Sign-up request rejected.');
    }
  };

  // Profile fields edits
  const handleUpdateProfile = async (formData: any) => {
    const res = await fetch('/api/members/update', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data.user);
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed updating profile.');
    }
  };

  // Social feed updates posts creation
  const handleAddPost = async (formData: any) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      alert(`Posting rejected: ${ext.error || 'Server error'}`);
    }
  };

  // Likes trigger
  const handleLikePost = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      fetchAllData();
    }
  };

  // Comment addition dispatch
  const handleAddComment = async (postId: string, content: string, mediaUrl?: string) => {
    const res = await fetch(`/api/posts/${postId}/comment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content, mediaUrl })
    });
    if (res.ok) {
      fetchAllData();
    }
  };

  // Comment liking toggling
  const handleLikeComment = async (postId: string, commentId: string) => {
    const res = await fetch(`/api/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      fetchAllData();
    }
  };

  // Post removal (作者 or admin)
  const handleDeletePost = async (postId: string) => {
    const res = await fetch(`/api/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (res.ok) {
      fetchAllData();
    }
  };

  // Poll voting
  const handleVotePoll = async (pollId: string, optionId: string) => {
    const res = await fetch(`/api/polls/${pollId}/vote`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ optionId })
    });
    if (res.ok) {
      fetchAllData();
    }
  };

  // Poll creation
  const handleAddPoll = async (question: string, options: string[]) => {
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ question, options })
    });
    if (res.ok) {
      fetchAllData();
    }
  };

  // Financial manual register (Admins)
  const handleAddPayment = async (paymentData: any) => {
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(paymentData)
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed storing payment.');
    }
  };

  // Event scheduling (Admins)
  const handleAddEvent = async (eventData: any) => {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(eventData)
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed storing event.');
    }
  };

  // Event RSVP yes/no toggling
  const handleRsvpEvent = async (eventId: string) => {
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (res.ok) {
      fetchAllData();
    }
  };

  // Infrastructure project creation
  const handleAddProject = async (projectData: any) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(projectData)
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed starting project tracking.');
    }
  };

  // Project building log comments updates
  const handleAddProjectUpdate = async (projectId: string, updateData: any) => {
    const res = await fetch(`/api/projects/${projectId}/updates`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(updateData)
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed publishing update log.');
    }
  };

  // Adjust status sliders or budgets spent for construction project
  const handleUpdateProjectProgress = async (projectId: string, progressData: any) => {
    const res = await fetch(`/api/projects/${projectId}/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(progressData)
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed saving project adjustments.');
    }
  };

  // Publish memory to gallery
  const handleUploadGalleryItem = async (itemData: any) => {
    const res = await fetch('/api/gallery', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(itemData)
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed storing gallery image.');
    }
  };

  // Chat message send handler
  const handleSendMessage = async (convId: string | null, recipientId: string | null, content: string) => {
    const res = await fetch('/api/conversations/message', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ conversationId: convId, recipientId, content })
    });

    if (res.ok) {
      const data = await res.json();
      if (!convId && data.conversationId) {
        setActiveConversationId(data.conversationId);
      } else {
        fetchMessages();
      }
      fetchAllData();
    } else {
      const ext = await res.json();
      throw new Error(ext.error || 'Failed sending message.');
    }
  };

  // Mark all conversation messages as read
  const handleMarkRead = async (convId: string) => {
    await fetch(`/api/conversations/${convId}/read`, {
      method: 'POST',
      headers: getHeaders()
    });
    fetchAllData();
  };

  // Manage Member Approval applications status (Admins only)
  const handleModifyMemberStatus = async (memberUserId: string, status: 'approved' | 'suspended') => {
    const res = await fetch('/api/admin/members/status', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ memberId: memberUserId, status })
    });

    if (res.ok) {
      // Refresh directory and statistics
      fetchAllData();
    } else {
      const ext = await res.json();
      alert(`Approval adjustment failed: ${ext.error || 'Try again'}`);
    }
  };

  // Change user role (Admins only)
  const handleModifyMemberRole = async (memberUserId: string, role: 'admin' | 'member' | 'moderator') => {
    const res = await fetch('/api/admin/members/role', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ memberId: memberUserId, role })
    });

    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      alert(`Role update failed: ${ext.error || 'Try again'}`);
    }
  };

  // Reset user pincode (Admins only)
  const handleResetPincode = async (memberUserId: string) => {
    const res = await fetch('/api/admin/members/reset-pincode', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ memberId: memberUserId })
    });

    if (res.ok) {
      alert(`De pincode van dit lid is succesvol gereset. Bij de volgende aanmelding kan het lid een nieuwe pincode instellen.`);
      fetchAllData();
    } else {
      const ext = await res.json();
      alert(`Pincode reset mislukt: ${ext.error || 'Probeer het opnieuw'}`);
    }
  };

  // Delete physical/logical user from database (Admins only)
  const handleDeleteMember = async (memberUserId: string) => {
    const res = await fetch('/api/admin/members/delete', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ memberId: memberUserId })
    });

    if (res.ok) {
      fetchAllData();
    } else {
      const ext = await res.json();
      alert(`User deletion failed: ${ext.error || 'Try again'}`);
    }
  };

  // Marketplace interaction callbacks
  const handleAddMarketplaceListing = async (listingData: Omit<MarketplaceItem, 'id' | 'sellerId' | 'sellerName' | 'sellerAvatar' | 'date' | 'status'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/marketplace', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(listingData)
      });
      if (res.ok) {
        fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed adding listing", err);
      return false;
    }
  };

  const handleUpdateMarketplaceStatus = async (itemId: string, status: 'available' | 'sold') => {
    try {
      const res = await fetch(`/api/marketplace/${itemId}/status`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed updating listing status", err);
    }
  };

  const handleDeleteMarketplaceListing = async (itemId: string) => {
    try {
      const res = await fetch(`/api/marketplace/${itemId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (err) {
      console.error("Failed deleting listing", err);
    }
  };

  // Notification clear mark as read
  const handleReadNotification = async (notificationId: string, referenceId?: string) => {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: getHeaders()
    });
    fetchAllData();
  };

  // Custom Search Query triggers
  const handleSearchOverride = (query: string) => {
    setSearchQuery(query);
  };

  // Global count of unread chats
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Fallback Loading screen
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="h-14 w-14 bg-blue-900 border border-amber-500 rounded-2xl flex items-center justify-center font-bold text-2xl text-white animate-bounce shadow">
          M
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Maretraite Project Network accounts...</p>
      </div>
    );
  }

  // Securely intercept unauthorized access
  if (!token || !currentUser) {
    return (
      <LoginView
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  // Normal Authorized Workspace layout Renders
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors pb-8">
      
      {/* Navigation Headers */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        unreadMessagesCount={unreadMessagesCount}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onLogout={handleLogout}
        onNavigate={(tab) => {
          setActiveTab(tab);
          if (tab !== 'messages') setActiveConversationId(null);
        }}
        onSearch={handleSearchOverride}
        onReadNotification={handleReadNotification}
        members={members}
      />

      {/* Main grids block */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Sidebar drawer navigator */}
          <Sidebar
            currentUser={currentUser}
            activeTab={activeTab}
            onNavigate={(tab) => {
              setActiveTab(tab);
              if (tab !== 'messages') setActiveConversationId(null);
            }}
            analytics={paymentsAnalytics}
          />

          {/* Active Tab rendering router */}
          <div className="flex-1 min-w-0">
            {searchQuery.trim() !== '' ? (
              <SearchResultsView
                query={searchQuery}
                members={members}
                posts={posts}
                polls={polls}
                marketplace={marketplace}
                events={events}
                projects={projects}
                gallery={gallery}
                currentUser={currentUser}
                onClearSearch={() => setSearchQuery('')}
                onNavigate={(tab) => {
                  setSearchQuery('');
                  setActiveTab(tab);
                  if (tab !== 'messages') setActiveConversationId(null);
                }}
              />
            ) : (
              <>
                {activeTab === 'feed' && (
                  <FeedView
                    currentUser={currentUser}
                    posts={posts}
                    polls={polls}
                    searchQuery={searchQuery}
                    onAddPost={handleAddPost}
                    onLikePost={handleLikePost}
                    onAddComment={handleAddComment}
                    onLikeComment={handleLikeComment}
                    onDeletePost={handleDeletePost}
                    onVotePoll={handleVotePoll}
                    onAddPoll={handleAddPoll}
                    onOpenLightbox={(url, desc) => { setLightboxImage(url); setLightboxCaption(desc || ''); }}
                  />
                )}

                {activeTab === 'finance' && currentUser?.role === 'admin' && (
                  <FinanceView
                    currentUser={currentUser}
                    payments={payments}
                    members={members}
                    analytics={paymentsAnalytics}
                    onAddPayment={handleAddPayment}
                  />
                )}

                {activeTab === 'marketplace' && (
                  <MarketplaceView
                    currentUser={currentUser}
                    marketplace={marketplace}
                    onAddListing={handleAddMarketplaceListing}
                    onUpdateStatus={handleUpdateMarketplaceStatus}
                    onDeleteListing={handleDeleteMarketplaceListing}
                    onOpenLightbox={(url, desc) => { setLightboxImage(url); setLightboxCaption(desc || ''); }}
                  />
                )}

                {activeTab === 'events' && (
                  <EventsView
                    currentUser={currentUser}
                    events={events}
                    onRsvpEvent={handleRsvpEvent}
                    onAddEvent={handleAddEvent}
                  />
                )}

                {activeTab === 'projects' && (
                  <ProjectsView
                    currentUser={currentUser}
                    projects={projects}
                    onAddProject={handleAddProject}
                    onAddProjectUpdate={handleAddProjectUpdate}
                    onUpdateProjectProgress={handleUpdateProjectProgress}
                  />
                )}

                {activeTab === 'gallery' && (
                  <GalleryView
                    currentUser={currentUser}
                    gallery={gallery}
                    onUploadGalleryItem={handleUploadGalleryItem}
                    onOpenLightbox={(url, desc) => { setLightboxImage(url); setLightboxCaption(desc || ''); }}
                  />
                )}

                {activeTab === 'messages' && (
                  <MessagingView
                    currentUser={currentUser}
                    conversations={conversations}
                    messages={messages}
                    members={members}
                    activeConversationId={activeConversationId}
                    onSelectConversation={async (id) => setActiveConversationId(id || null)}
                    onSendMessage={handleSendMessage}
                    onMarkRead={handleMarkRead}
                  />
                )}

                {activeTab === 'admin' && (currentUser.role === 'admin' || currentUser.role === 'moderator') && (
                  <AdminView
                    currentUser={currentUser}
                    members={members}
                    posts={posts}
                    paymentsCount={payments.length}
                    eventsCount={events.length}
                    totalCollected={paymentsAnalytics.totalCollected}
                    onModifyMemberStatus={handleModifyMemberStatus}
                    onModifyMemberRole={handleModifyMemberRole}
                    onDeletePost={handleDeletePost}
                    onNavigate={setActiveTab}
                    onDeleteMember={handleDeleteMember}
                    onResetPincode={handleResetPincode}
                  />
                )}

                {activeTab === 'profile' && (
                  <ProfileView
                    currentUser={currentUser}
                    onUpdateProfile={handleUpdateProfile}
                  />
                )}
              </>
            )}
          </div>

        </div>
      </main>

      {lightboxImage && (
        <LightboxModal
          imageUrl={lightboxImage}
          caption={lightboxCaption}
          onClose={() => {
            setLightboxImage(null);
            setLightboxCaption('');
          }}
        />
      )}
    </div>
  );
}
