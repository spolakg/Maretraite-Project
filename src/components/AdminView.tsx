import React from 'react';
import { 
  ShieldAlert, Users, Heart, Landmark, Calendar, Radio, Check, 
  Trash, ShieldCheck, AlertCircle, RefreshCw, Eye
} from 'lucide-react';
import { User, Post } from '../types';

interface AdminViewProps {
  currentUser: User;
  members: User[];
  posts: Post[];
  paymentsCount: number;
  eventsCount: number;
  totalCollected: number;
  onModifyMemberStatus: (memberId: string, status: 'approved' | 'suspended') => Promise<void>;
  onModifyMemberRole: (memberId: string, role: 'admin' | 'member' | 'moderator') => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onNavigate: (tab: string) => void;
  onDeleteMember: (memberId: string) => Promise<void>;
  onResetPincode?: (memberId: string) => Promise<void>;
}

export default function AdminView({
  currentUser,
  members,
  posts,
  paymentsCount,
  eventsCount,
  totalCollected,
  onModifyMemberStatus,
  onModifyMemberRole,
  onDeletePost,
  onNavigate,
  onDeleteMember,
  onResetPincode
}: AdminViewProps) {
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  
  if (currentUser.role !== 'admin' && currentUser.role !== 'moderator') {
    return (
      <div className="p-8 text-center text-red-500 font-bold bg-white dark:bg-slate-900 border rounded-2xl">
        Toegang Geweigerd: Beheerders- of moderatierechten vereist.
      </div>
    );
  }

  // Segment user statuses
  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status === 'approved');
  const suspendedMembers = members.filter(m => m.status === 'suspended');

  // Posts flagged by Gemini AI
  const aiFlaggedPosts = posts.filter(p => p.aiModerated === 'flagged');

  return (
    <div className="flex-grow space-y-6" id="admin-moderation-view">
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Totaal Leden</span>
            <Users className="h-4.5 w-4.5 text-blue-900" />
          </div>
          <p className="text-2xl font-black mt-2 text-slate-800 dark:text-slate-100">{members.length}</p>
          <span className="text-[10px] text-green-500 mt-1 block font-semibold">{activeMembers.length} actieve geregistreerde bewoners</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Wachtend op Goedkeuring</span>
            <AlertCircle className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-black mt-2 text-amber-500">{pendingMembers.length}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Aanvragen vereisen beoordeling</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Gemarkeerde Berichten</span>
            <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
          </div>
          <p className="text-2xl font-black mt-2 text-red-500">{aiFlaggedPosts.length}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">Vereisen moderatie door beheerder</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-bold uppercase tracking-wider">Gemeenschappelijke Kas</span>
            <Landmark className="h-4.5 w-4.5 text-green-600" />
          </div>
          <p className="text-2xl font-black mt-2 text-green-600">SRD {totalCollected.toLocaleString('nl-NL')}</p>
          <span className="text-[10px] text-slate-400 mt-1 block">{paymentsCount} betalingen geverifieerd</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* User Approvals and status block Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Applications widget list */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4 flex items-center justify-between">
              <span>Wachtende Aanvragen van Bewoners</span>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pendingMembers.length} Aanvragen
              </span>
            </h3>

            {pendingMembers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Er zijn momenteel geen bewonersprofielen die op goedkeuring wachten.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingMembers.map((m) => (
                  <div key={m.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0">
                      <img src={m.profilePicture} className="h-10 w-10 rounded-full object-cover" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-805 dark:text-slate-200 truncate">{m.fullName}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate">@{m.username} • ID: {m.memberId}</p>
                        <p className="text-[10px] text-blue-900 dark:text-blue-400 font-semibold truncate mt-0.5">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onModifyMemberStatus(m.id, 'approved')}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold text-[10.5px] px-3.5 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer shadow-sm"
                        id={`approve-member-${m.id}`}
                      >
                        <Check className="h-3 w-3" />
                        <span>Goedkeuren</span>
                      </button>

                      <button
                        onClick={() => onModifyMemberStatus(m.id, 'suspended')}
                        className="border border-red-250 text-red-650 hover:bg-red-50 text-[10.5px] px-3.5 py-1.5 rounded-lg cursor-pointer text-red-600"
                        id={`reject-member-${m.id}`}
                      >
                        Afwijzen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Directory Status List details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-205 dark:border-slate-800 transition-colors">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-stone-100 dark:border-slate-800 mb-4">
              Beheer Bewonersregister
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
              {members.filter(m => m.id !== currentUser.id).map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                    <img src={m.profilePicture} className="h-9 w-9 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{m.fullName}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-medium">{m.memberId}</span>
                        <span className="text-[10px] text-slate-350">•</span>
                        <select
                          value={m.role}
                          disabled={currentUser.role !== 'admin'}
                          onChange={(e) => onModifyMemberRole(m.id, e.target.value as any)}
                          className="text-[9px] font-bold uppercase py-0.5 px-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-350 cursor-pointer focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                          id={`role-select-${m.id}`}
                        >
                          <option value="member">Bewoner (Lid)</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Beheerder</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      m.status === 'approved' ? 'bg-green-50 text-green-600 dark:bg-green-950/20' :
                      m.status === 'suspended' ? 'bg-red-50 text-red-600' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {m.status === 'approved' ? 'ACTIEF' : m.status === 'suspended' ? 'GESCHORST' : 'IN BEHANDELING'}
                    </span>

                    {currentUser.role === 'admin' && (
                      <>
                        {m.status === 'approved' ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onModifyMemberStatus(m.id, 'suspended')}
                              className="text-red-600 hover:underline text-[11px] font-bold cursor-pointer text-red-650"
                              id={`suspend-btn-${m.id}`}
                            >
                              Schorsen
                            </button>
                            
                            <span className="text-slate-200 dark:text-slate-800">|</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Weet u zeker dat u de pincode van ${m.fullName} wilt resetten?`)) {
                                  onResetPincode?.(m.id);
                                }
                              }}
                              className="text-amber-600 hover:text-amber-750 hover:underline text-[11px] font-bold cursor-pointer inline-flex items-center space-x-1.5"
                              id={`reset-pin-btn-${m.id}`}
                              title="Reset de inlogpincode van deze bewoner"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Pin reset</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onModifyMemberStatus(m.id, 'approved')}
                            className="text-green-600 hover:underline text-[11px] font-bold cursor-pointer"
                            id={`unsuspend-btn-${m.id}`}
                          >
                            Deblokkeren
                          </button>
                        )}

                        <span className="text-slate-200 dark:text-slate-800">|</span>
                        <button
                          onClick={() => setConfirmDeleteId(m.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-1.5 rounded-lg transition-all cursor-pointer"
                          title="Verwijderen"
                          id={`delete-member-btn-${m.id}`}
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Gemini AI Moderation flags Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <div className="flex items-center space-x-2 pb-3.5 border-b border-slate-150 mb-4 text-red-600">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h3 className="text-sm font-bold">AI Beveiliging & Moderatie</h3>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
              Wanneer berichten worden aangemaakt, beoordeelt onze geïntegreerde server-side **Gemini AI-moderator** of het bericht de richtlijnen overtreedt.
            </p>

            {aiFlaggedPosts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-2xl bg-slate-50/50 dark:bg-slate-800/10">
                <ShieldCheck className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-60" />
                <span>Geen onveilige berichten gemeld. De gemeenschapsfeed is veilig!</span>
              </div>
            ) : (
              <div className="space-y-4">
                {aiFlaggedPosts.map((p) => (
                  <div key={p.id} className="p-3 bg-red-50/40 border border-red-200 dark:border-red-950/20 dark:bg-slate-950/25 rounded-xl space-y-3.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Door: {p.authorName}</span>
                      <span className="text-slate-450">{new Date(p.date).toLocaleDateString()}</span>
                    </div>

                    <div className="p-2 bg-white dark:bg-slate-900 border rounded-lg max-h-24 overflow-y-auto text-[11px] text-slate-600 dark:text-slate-400">
                      "{p.content}"
                    </div>

                    <div className="p-2 bg-red-100/30 text-red-800 dark:text-red-400 rounded-lg text-[10px] space-y-1">
                      <p className="font-bold">Reden voor markering:</p>
                      <p className="opacity-95">{p.aiReviewReason || "Bevat storend taalgebruik of mogelijke pesterijen."}</p>
                    </div>

                    <div className="flex space-x-2 pt-1.5">
                      <button
                        onClick={() => onDeletePost(p.id)}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] py-1.5 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
                        id={`delete-flagged-btn-${p.id}`}
                      >
                        <Trash className="h-3 w-3" />
                        <span>Verwijderen</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Delete confirmation Modal overlay */}
      {confirmDeleteId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          id="delete-member-confirm-modal"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-base font-black tracking-tight text-slate-800 dark:text-slate-100">Bewoner Verwijderen</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
              Weet u zeker dat u de bewoner <strong className="text-slate-800 dark:text-slate-100">
                {members.find(m => m.id === confirmDeleteId)?.fullName || 'deze gebruiker'}
              </strong> wilt verwijderen? Dit zal al hun profiel- en accountgegevens permanent wissen. Deze actie kan niet ongedaan worden gemaakt.
            </p>
            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-slate-200 dark:border-slate-700 dark:text-slate-300 text-slate-705 font-bold text-xs py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Annuleren
              </button>
              <button
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  await onDeleteMember(id);
                }}
                className="flex-1 bg-red-650 hover:bg-red-500 text-white font-bold text-xs py-2 rounded-xl transition cursor-pointer shadow-sm"
                id="confirm-delete-member-btn"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
