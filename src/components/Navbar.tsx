import React, { useState } from 'react';
import { 
  Bell, MessageSquare, Sun, Moon, Search, LogOut, 
  User, CheckCircle, Menu, X, Award, AlertTriangle 
} from 'lucide-react';
import { Notification, User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType;
  notifications: Notification[];
  unreadMessagesCount: number;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onLogout: () => void;
  onNavigate: (tab: string) => void;
  onSearch: (query: string) => void;
  onReadNotification: (id: string, refId?: string) => void;
  members: UserType[];
}

export default function Navbar({
  currentUser,
  notifications,
  unreadMessagesCount,
  darkMode,
  setDarkMode,
  onLogout,
  onNavigate,
  onSearch,
  onReadNotification,
  members
}: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileProfile, setShowMobileProfile] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch(q);
  };

  const handleNotificationClick = (n: Notification) => {
    onReadNotification(n.id, n.referenceId);
    setShowNotifications(false);
    
    // Auto navigation based on notification type
    if (n.type === 'post_like' || n.type === 'post_comment' || n.type === 'announcement') {
      onNavigate('feed');
    } else if (n.type === 'event') {
      onNavigate('events');
    } else if (n.type === 'payment') {
      onNavigate('finance');
    } else if (n.type === 'message') {
      onNavigate('messages');
    }
  };

  const unreadNotifs = notifications.filter(n => !n.isRead);

  return (
    <nav className="sticky top-0 z-40 w-full bg-[#1E3A8A] border-b border-blue-800 transition-colors shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Logo Brand */}
          <div className="flex items-center">
            <div 
              className="flex items-center cursor-pointer space-x-2" 
              onClick={() => onNavigate('feed')}
              id="brand-logo"
            >
              <div className="h-10 w-10 bg-[#F59E0B] text-[#1E3A8A] rounded-lg flex items-center justify-center font-bold text-xl shadow-md border border-[#F59E0B]/80">
                M
              </div>
              <span className="hidden sm:block font-bold text-lg text-white tracking-tight">
                Maretraite <span className="font-light opacity-80 text-blue-100">Project</span>
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-12 max-w-lg">
            <div className="w-full relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-blue-300" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Zoek bewoners, projecten of betalingen..."
                className="w-full pl-10 pr-4 py-1.5 rounded-full border border-blue-800 bg-[#162C6E] text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:border-transparent text-sm transition-all"
                id="global-search-input"
              />
            </div>
          </div>

          {/* Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Dark Mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-800 dark:hover:bg-slate-800 transition-colors focus:outline-none"
              title="Donker/Licht thema omschakelen"
              id="theme-toggle-btn"
            >
              {darkMode ? <Sun className="h-5 w-5 text-[#F59E0B]" /> : <Moon className="h-5 w-5 text-white" />}
            </button>

            {/* Notifications panel */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowMobileProfile(false);
                }}
                className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-800 dark:hover:bg-slate-800 transition-colors focus:outline-none relative"
                id="notifications-toggle-btn"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-red-500 text-[10px] font-bold text-white rounded-full">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Overlay Menu */}
              {showNotifications && (
                <div 
                  className="absolute right-0 mt-3 w-80 max-h-[480px] overflow-y-auto bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  id="notifications-dropdown"
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Meldingen</span>
                    <span className="text-xs text-blue-900 dark:text-blue-400 font-medium">{unreadNotifs.length} ongelezen</span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      Nog geen meldingen
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex items-start space-x-2.5 ${!n.isRead ? 'bg-blue-50/40 dark:bg-blue-950/10' : ''}`}
                        >
                          <div className={`p-1.5 rounded-full mt-0.5 ${
                            n.type === 'announcement' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-500' :
                            n.type === 'payment' ? 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-500' :
                            n.type === 'post_like' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/30' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          }`}>
                            {n.type === 'announcement' ? <AlertTriangle className="h-3.5 w-3.5" /> : 
                             n.type === 'payment' ? <Award className="h-3.5 w-3.5" /> :
                             <Bell className="h-3.5 w-3.5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.content}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                              {new Date(n.date).toLocaleDateString()}
                            </span>
                          </div>
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 self-start flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Direct messages shortcut */}
            <button
              onClick={() => onNavigate('messages')}
              className="p-2 rounded-lg text-blue-100 hover:text-white hover:bg-blue-800 dark:hover:bg-slate-800 transition-colors focus:outline-none relative"
              title="Privédiscussies"
              id="messages-nav-shortcut"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessagesCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center bg-green-500 text-[10px] font-bold text-white rounded-full">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown / Trigger */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMobileProfile(!showMobileProfile);
                  setShowNotifications(false);
                }}
                className="flex items-center space-x-1.5 focus:outline-none p-1 rounded-full hover:bg-blue-800 dark:hover:bg-slate-800 transition-all cursor-pointer"
                id="profile-dropdown-trigger"
              >
                <img
                  src={currentUser.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}
                  alt={currentUser.fullName}
                  className="h-8 w-8 rounded-full object-cover border-2 border-[#F59E0B]"
                />
                <div className="hidden md:block text-left">
                  <p className="text-white text-xs font-semibold truncate max-w-[120px]">
                    {currentUser.fullName}
                  </p>
                  <p className="text-[#F59E0B] text-[9px] font-bold uppercase tracking-wider">
                    {currentUser.role === 'admin' ? 'Gemeenschapsbeheerder' : currentUser.role === 'moderator' ? 'Moderator' : 'Buurtbewoner'}
                  </p>
                </div>
              </button>

              {showMobileProfile && (
                <div 
                  className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  id="profile-dropdown"
                >
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">Aangemeld als</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{currentUser.fullName}</p>
                    <p className="text-[10px] text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded mt-1 inline-block truncate border border-amber-200/50">
                      ID: {currentUser.memberId}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setShowMobileProfile(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <User className="h-4 w-4 text-slate-400" />
                    <span>Mijn Profiel</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('finance');
                      setShowMobileProfile(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <Award className="h-4 w-4 text-slate-400" />
                    <span>Financiële Bijdragen</span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      onLogout();
                      setShowMobileProfile(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center space-x-2"
                    id="logout-button"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Afmelden</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
}
