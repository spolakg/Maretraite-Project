import React from 'react';
import { 
  Rss, Calendar, HardHat, Image as ImageIcon, 
  MessageSquare, Landmark, ShieldAlert, BadgeInfo,
  DollarSign, Check, Store
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  onNavigate: (tab: string) => void;
  analytics?: {
    totalCollected: number;
    outstandingContributions: number;
  };
}

export default function Sidebar({ currentUser, activeTab, onNavigate, analytics }: SidebarProps) {
  
  const navItems = [
    { id: 'feed', label: 'Nieuwsoverzicht', icon: Rss },
    { id: 'events', label: 'Evenementen', icon: Calendar },
    { id: 'projects', label: 'Lopende Projecten', icon: HardHat },
    { id: 'gallery', label: 'Gemeenschappelijke Galerij', icon: ImageIcon },
    { id: 'marketplace', label: 'Lokale Marktplaats', icon: Store },
    { id: 'messages', label: 'Privédiscussies', icon: MessageSquare },
    ...(currentUser.role === 'admin' ? [{ id: 'finance', label: 'Gemeenschapsfinanciën', icon: Landmark }] : []),
  ];

  return (
    <div className="w-full lg:w-64 flex-shrink-0 flex flex-col space-y-6" id="app-sidebar">
      
      {/* Profile Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 transition-colors">
        <div className="flex items-center space-x-3.5">
          <img
            src={currentUser.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"}
            alt={currentUser.fullName}
            className="h-14 w-14 rounded-full object-cover border-2 border-[#F59E0B]"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{currentUser.fullName}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">@{currentUser.username}</p>
            <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-[10px] font-bold uppercase tracking-wide ${
              currentUser.role === 'admin' 
                ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                : currentUser.role === 'moderator'
                  ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                  : 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400'
            }`}>
              {currentUser.role === 'admin' ? 'Gemeenschapsbeheerder' : currentUser.role === 'moderator' ? 'Moderator' : 'Buurtbewoner'}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Lid-ID:</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentUser.memberId}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Totale Bijdrage:</span>
            <span className="font-bold text-green-600 dark:text-green-500">SRD {currentUser.totalContributed.toLocaleString('nl-NL')}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">Openstaand Saldo:</span>
            {currentUser.outstandingBalance > 0 ? (
              <span className="font-bold text-amber-500 dark:text-amber-400 flex items-center space-x-0.5">
                <BadgeInfo className="h-3 w-3 text-amber-500" />
                <span>SRD {currentUser.outstandingBalance.toLocaleString('nl-NL')}</span>
              </span>
            ) : (
              <span className="font-bold text-green-600 dark:text-green-500 flex items-center space-x-0.5 bg-green-50 dark:bg-green-950/10 px-1.5 py-0.5 rounded">
                <Check className="h-3 w-3" />
                <span>Volledig Betaald</span>
              </span>
            )}
          </div>
        </div>

        <button 
          onClick={() => onNavigate('profile')}
          className="mt-4 w-full py-2 px-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 transition-colors text-center cursor-pointer"
        >
          Profielinstellingen Beheren
        </button>
      </div>

      {/* Navigation Options list */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 transition-colors">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
          Hoofdmenu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1E3A8A] dark:text-blue-350' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    {isActive ? (
                      <span className="w-2 h-2 bg-[#1E3A8A] dark:bg-blue-300 rounded-full flex-shrink-0" id={`dot-${item.id}`} />
                    ) : (
                      <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span>{item.label}</span>
                  </div>
                </button>
              </li>
            );
          })}

          {/* Admin panel navigation (Visible to admin and moderator) */}
          {(currentUser.role === 'admin' || currentUser.role === 'moderator') && (
            <li className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onNavigate('admin')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? currentUser.role === 'admin'
                      ? 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-l-2 border-red-700'
                      : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-l-2 border-amber-500'
                    : currentUser.role === 'admin'
                      ? 'text-red-650 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/10'
                      : 'text-amber-650 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/10'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ShieldAlert className={`h-4 w-4 ${currentUser.role === 'admin' ? 'text-red-500' : 'text-amber-500'}`} />
                  <span>{currentUser.role === 'admin' ? 'Beheerderspaneel' : 'Moderatiepaneel'}</span>
                </div>
              </button>
            </li>
          )}
        </ul>
      </div>

      {/* Community Fund widget from Geometric Balance Layout */}
      <div className="p-4 bg-[#16A34A] rounded-xl text-white shadow-sm">
        <p className="text-xs opacity-90 font-medium">Gemeenschapsfonds</p>
        <p className="text-2xl font-black mt-0.5">
          SRD {(analytics?.totalCollected ?? 0).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
        </p>
        <div className="w-full bg-green-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div 
            className="bg-[#F59E0B] h-full transition-all duration-500" 
            style={{ width: `${Math.min(100, Math.round(((analytics?.totalCollected ?? 0) / 150000) * 100))}%` }}
          />
        </div>
        <p className="text-[10px] font-semibold mt-2.5 flex justify-between items-center opacity-90">
          <span>{Math.min(100, Math.round(((analytics?.totalCollected ?? 0) / 150000) * 100))}% van jaarlijks doel bereikt</span>
          <span className="font-mono text-[9px] font-bold">Doel: SRD 150K</span>
        </p>
      </div>

    </div>
  );
}
