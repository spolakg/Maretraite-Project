import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Users, MessageSquare, Tag, Calendar, Folder, Image, 
  X, ExternalLink, ArrowRight, CornerDownRight, Check, Sparkles, AlertCircle
} from 'lucide-react';
import { User, Post, Poll, Event, Project, GalleryItem, MarketplaceItem } from '../types';

interface SearchResultsViewProps {
  query: string;
  members: User[];
  posts: Post[];
  polls: Poll[];
  marketplace: MarketplaceItem[];
  events: Event[];
  projects: Project[];
  gallery: GalleryItem[];
  currentUser: User;
  onClearSearch: () => void;
  onNavigate: (tab: string) => void;
}

type SearchCategory = 'all' | 'members' | 'posts' | 'marketplace' | 'events' | 'projects' | 'gallery';

export default function SearchResultsView({
  query,
  members,
  posts,
  polls,
  marketplace,
  events,
  projects,
  gallery,
  currentUser,
  onClearSearch,
  onNavigate
}: SearchResultsViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedDetail, setSelectedDetail] = useState<{ type: string; item: any } | null>(null);

  const cleanQuery = query.toLowerCase().trim();

  // Search Logic
  const filteredData = useMemo(() => {
    if (!cleanQuery) {
      return {
        members: [], posts: [], polls: [], marketplace: [], events: [], projects: [], gallery: []
      };
    }

    const matchedMembers = members.filter(m => 
      m.fullName.toLowerCase().includes(cleanQuery) ||
      m.username.toLowerCase().includes(cleanQuery) ||
      m.bio.toLowerCase().includes(cleanQuery) ||
      m.email.toLowerCase().includes(cleanQuery) ||
      (m.phone && m.phone.toLowerCase().includes(cleanQuery)) ||
      m.memberId.toLowerCase().includes(cleanQuery)
    );

    const matchedPosts = posts.filter(p => 
      p.content.toLowerCase().includes(cleanQuery) ||
      p.authorName.toLowerCase().includes(cleanQuery)
    );

    const matchedPolls = polls.filter(po => 
      po.question.toLowerCase().includes(cleanQuery) ||
      po.authorName.toLowerCase().includes(cleanQuery)
    );

    const matchedMarketplace = marketplace.filter(i => 
      i.title.toLowerCase().includes(cleanQuery) ||
      i.description.toLowerCase().includes(cleanQuery) ||
      i.category.toLowerCase().includes(cleanQuery) ||
      i.sellerName.toLowerCase().includes(cleanQuery) ||
      String(i.price).includes(cleanQuery)
    );

    const matchedEvents = events.filter(e => 
      e.title.toLowerCase().includes(cleanQuery) ||
      e.description.toLowerCase().includes(cleanQuery) ||
      e.location.toLowerCase().includes(cleanQuery) ||
      e.organizer.toLowerCase().includes(cleanQuery) ||
      e.category.toLowerCase().includes(cleanQuery)
    );

    const matchedProjects = projects.filter(pr => 
      pr.title.toLowerCase().includes(cleanQuery) ||
      pr.description.toLowerCase().includes(cleanQuery) ||
      pr.category.toLowerCase().includes(cleanQuery)
    );

    const matchedGallery = gallery.filter(g => 
      g.title.toLowerCase().includes(cleanQuery) ||
      g.uploadedBy.toLowerCase().includes(cleanQuery)
    );

    return {
      members: matchedMembers,
      posts: matchedPosts,
      polls: matchedPolls,
      marketplace: matchedMarketplace,
      events: matchedEvents,
      projects: matchedProjects,
      gallery: matchedGallery
    };
  }, [cleanQuery, members, posts, polls, marketplace, events, projects, gallery]);

  const totalResults = 
    filteredData.members.length + 
    filteredData.posts.length + 
    filteredData.polls.length + 
    filteredData.marketplace.length + 
    filteredData.events.length + 
    filteredData.projects.length + 
    filteredData.gallery.length;

  const categories = [
    { id: 'all', label: 'Alles', count: totalResults, icon: Search },
    { id: 'members', label: 'Bewoners', count: filteredData.members.length, icon: Users },
    { id: 'posts', label: 'Feed & Polls', count: filteredData.posts.length + filteredData.polls.length, icon: MessageSquare },
    { id: 'marketplace', label: 'Marktplaats', count: filteredData.marketplace.length, icon: Tag },
    { id: 'events', label: 'Evenementen', count: filteredData.events.length, icon: Calendar },
    { id: 'projects', label: 'Projecten', count: filteredData.projects.length, icon: Folder },
    { id: 'gallery', label: 'Media & Foto\'s', count: filteredData.gallery.length, icon: Image },
  ];

  const handleOpenDetail = (type: string, item: any) => {
    setSelectedDetail({ type, item });
  };

  const handleCloseDetail = () => {
    setSelectedDetail(null);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Search Overview Jumbotron */}
      <div className="bg-gradient-to-r from-blue-900 to-[#1E3A8A] border border-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 font-semibold text-sm mb-1">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>Globale Zoekmachine</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Zoekresultaten voor: <span className="text-[#F59E0B] italic font-serif">"{query}"</span>
            </h2>
            <p className="text-blue-100/80 text-xs sm:text-sm mt-1">
              {totalResults === 0 
                ? 'Geen resultaten gevonden in het netwerk.' 
                : `${totalResults} match${totalResults === 1 ? '' : 'es'} gevonden over alle categorieën.`}
            </p>
          </div>
          <button 
            onClick={onClearSearch}
            className="self-start sm:self-center bg-white/10 hover:bg-white/20 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center space-x-1.5 transition-all outline-none"
          >
            <X className="h-4 w-4" />
            <span>Zoeken herstellen</span>
          </button>
        </div>
      </div>

      {/* Category Selection Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as SearchCategory)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-full whitespace-nowrap text-xs font-semibold transition-all border outline-none cursor-pointer ${
                isActive 
                  ? 'bg-[#1E3A8A] border-blue-900 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-amber-500 text-blue-950 font-bold' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid of Results */}
      {totalResults === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center shadow-sm">
          <AlertCircle className="mx-auto h-12 w-12 text-slate-400 mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Geen resultaten gevonden</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
            We konden niets vinden dat overeenkomt met "{query}". Controleer de spelling of zoek op andere termen, zoals de naam van een bewoner, trefwoorden van evenementen, of foto's.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* CATEGORY 1: BEWONERS & LEDEN */}
          {(selectedCategory === 'all' || selectedCategory === 'members') && filteredData.members.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Bewoners & Leden ({filteredData.members.length})</h3>
                </div>
                {selectedCategory === 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('members')}
                    className="text-xs hover:underline text-blue-600 dark:text-blue-400 font-semibold"
                  >
                    Bekijk alles
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredData.members.map((m) => (
                  <div 
                    key={m.id} 
                    onClick={() => handleOpenDetail('member', m)}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/60 transition-all bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer group"
                  >
                    <img 
                      src={m.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
                      alt={m.fullName}
                      className="h-11 w-11 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                          {m.fullName}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                          m.role === 'admin'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'
                            : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-400'
                        }`}>
                          {m.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono">{m.memberId}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 italic">
                        {m.bio || 'Geen bio beschikbaar.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY 2: POSTS & POLLS */}
          {(selectedCategory === 'all' || selectedCategory === 'posts') && (filteredData.posts.length > 0 || filteredData.polls.length > 0) && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-[#1E3A8A] dark:text-blue-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Berichten & Polls ({filteredData.posts.length + filteredData.polls.length})</h3>
                </div>
                {selectedCategory === 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('posts')}
                    className="text-xs hover:underline text-[#1E3A8A] dark:text-blue-400 font-semibold"
                  >
                    Bekijk alles
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {/* Posts mapping */}
                {filteredData.posts.map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => handleOpenDetail('post', p)}
                    className="p-4 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-950/20 hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={p.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
                          className="h-8 w-8 rounded-full object-cover" 
                          alt="avatar"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">{p.authorName}</span>
                          <span className="text-[10px] text-slate-400 block">{new Date(p.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {p.isAnnouncement && (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full dark:bg-red-950/40 dark:text-red-400">
                            Aankondiging
                          </span>
                        )}
                        <span className="text-[10px] text-slate-500 font-mono">Bericht</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                      {p.content}
                    </p>
                    {p.mediaUrl && (
                      <div className="mt-2 text-xs flex items-center text-blue-600 dark:text-blue-400 font-semibold space-x-1">
                        <Image className="h-3.5 w-3.5" />
                        <span>Inclusief bijlage media ({p.mediaName || "afbeelding"})</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Polls mapping */}
                {filteredData.polls.map((po) => (
                  <div 
                    key={po.id}
                    onClick={() => handleOpenDetail('poll', po)}
                    className="p-4 rounded-lg border border-blue-100 dark:border-blue-900/30 bg-blue-50/20 dark:bg-blue-950/10 hover:border-blue-200 dark:hover:border-blue-900/60 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-1.5 text-blue-900 dark:text-blue-400">
                        <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                        <span className="text-xs font-bold font-mono">Community Poll</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(po.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3">{po.question}</h4>
                    <div className="space-y-2">
                      {po.options.slice(0, 2).map((opt) => {
                        const score = opt.votes.length;
                        return (
                          <div key={opt.id} className="text-xs">
                            <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-400 mb-1">
                              <span>{opt.text}</span>
                              <span>{score} stem{score === 1 ? '' : 'men'}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, Math.max(5, (score * 20)))}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      {po.options.length > 2 && (
                        <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                          + nog {po.options.length - 2} opties...
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY 3: MARKETPLACE */}
          {(selectedCategory === 'all' || selectedCategory === 'marketplace') && filteredData.marketplace.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Marktplaats Listings ({filteredData.marketplace.length})</h3>
                </div>
                {selectedCategory === 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('marketplace')}
                    className="text-xs hover:underline text-amber-600 dark:text-amber-500 font-semibold"
                  >
                    Bekijk alles
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredData.marketplace.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleOpenDetail('marketplace', item)}
                    className="border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 hover:border-amber-200 dark:hover:border-amber-950/70 transition-all cursor-pointer flex flex-col h-full"
                  >
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.title} 
                        className="h-32 w-full object-cover border-b border-slate-100 dark:border-slate-800"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="h-32 w-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        <Tag className="h-10 w-10 text-slate-300 dark:text-slate-750" />
                      </div>
                    )}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs line-clamp-1">{item.title}</h4>
                          <span className="font-bold text-xs text-amber-600 dark:text-[#F59E0B] flex-shrink-0">€{item.price}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 capitalize mt-0.5">{item.category}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 mt-3 pt-2">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          item.status === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                        }`}>
                          {item.status === 'available' ? 'Beschikbaar' : 'Verkocht'}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.sellerName}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY 4: EVENTS */}
          {(selectedCategory === 'all' || selectedCategory === 'events') && filteredData.events.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Buurt evenementen ({filteredData.events.length})</h3>
                </div>
                {selectedCategory === 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('events')}
                    className="text-xs hover:underline text-indigo-600 dark:text-indigo-400 font-semibold"
                  >
                    Bekijk alles
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredData.events.map((e) => (
                  <div 
                    key={e.id}
                    onClick={() => handleOpenDetail('event', e)}
                    className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-indigo-200 dark:hover:border-indigo-950/60 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{e.title}</h4>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                          {e.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{e.date} om {e.time}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {e.description}
                      </p>
                    </div>
                    <div className="border-t border-slate-100 dark:border-slate-850 mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Locatie: <strong className="text-slate-600 dark:text-slate-300">{e.location}</strong></span>
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-semibold text-slate-700 dark:text-slate-300">
                        {e.rsvps.length} rsvps
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY 5: PROJECTS */}
          {(selectedCategory === 'all' || selectedCategory === 'projects') && filteredData.projects.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Folder className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Community Projecten ({filteredData.projects.length})</h3>
                </div>
                {selectedCategory === 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('projects')}
                    className="text-xs hover:underline text-emerald-600 dark:text-emerald-400 font-semibold"
                  >
                    Bekijk alles
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {filteredData.projects.map((pr) => (
                  <div 
                    key={pr.id}
                    onClick={() => handleOpenDetail('project', pr)}
                    className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 hover:border-emerald-200 dark:hover:border-emerald-950/60 transition-all cursor-pointer"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100">{pr.title}</h4>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        pr.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : pr.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pr.status === 'completed' ? 'Voltooid' : pr.status === 'in-progress' ? 'Lopend' : 'Plannen'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 uppercase font-bold">{pr.category}</p>
                    <p className="text-xs text-slate-550 dark:text-slate-400 mt-1 lines-clamp-2">
                      {pr.description}
                    </p>
                    
                    {/* Budget & Progress indicators */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-850/60 pt-3">
                      <div className="flex items-center space-x-4 text-xs text-slate-500">
                        <span>Budget: <strong>€{pr.budget.toLocaleString()}</strong></span>
                        <span>Besteed: <strong className="text-red-500">€{pr.spent.toLocaleString()}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-44 text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400 flex-shrink-0">{pr.progress}%</span>
                        <div className="h-1.5 w-full bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600" style={{ width: `${pr.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* CATEGORY 6: GALLERY */}
          {(selectedCategory === 'all' || selectedCategory === 'gallery') && filteredData.gallery.length > 0 && (
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Image className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Gedeelde Foto's & Media ({filteredData.gallery.length})</h3>
                </div>
                {selectedCategory === 'all' && (
                  <button 
                    onClick={() => setSelectedCategory('gallery')}
                    className="text-xs hover:underline text-indigo-500 font-semibold"
                  >
                    Bekijk alles
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredData.gallery.map((g) => (
                  <div 
                    key={g.id}
                    onClick={() => handleOpenDetail('gallery_img', g)}
                    className="group border border-slate-100 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all cursor-pointer aspect-square flex flex-col justify-between"
                  >
                    <div className="relative flex-1 bg-slate-900 overflow-hidden leading-[0]">
                      <img 
                        src={g.url} 
                        alt={g.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-[10px] truncate">Geupload door:</p>
                        <p className="text-xs font-bold truncate">{g.uploadedBy}</p>
                      </div>
                    </div>
                    <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-xs truncate text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{g.title}</p>
                      <p className="text-[9px] text-slate-400">{g.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      <AnimatePresence>
        {selectedDetail && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Backdrop cover backdrop-blur option */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDetail}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 overflow-hidden flex flex-col"
              id="search-detail-modal"
            >
              {/* Header Close button */}
              <button 
                onClick={handleCloseDetail}
                className="absolute top-4 right-4 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750 p-2 rounded-full cursor-pointer transition-all z-10"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Inside details according to type */}
              <div className="p-6">
                
                {/* 1. MEMBER DETAIL VIEW */}
                {selectedDetail.type === 'member' && (() => {
                  const m: User = selectedDetail.item;
                  return (
                    <div className="text-center">
                      <img 
                        src={m.profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"} 
                        alt={m.fullName}
                        className="h-24 w-24 rounded-full mx-auto object-cover border-4 border-amber-400 shadow-md mb-4"
                        referrerPolicy="no-referrer"
                      />
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{m.fullName}</h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">@{m.username} • ID: {m.memberId}</p>

                      <div className="flex justify-center gap-2 mt-3 mb-4">
                        <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400">
                          Role: {m.role}
                        </span>
                        <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                          {m.status}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-4 rounded-xl text-left mb-5">
                        <h4 className="font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Over deze bewoner</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
                          "{m.bio || 'Geen bio verstrekt door deze bewoner.'}"
                        </p>
                      </div>

                      <div className="space-y-2.5 mb-6 text-left text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-4">
                        <div className="flex justify-between">
                          <span>📧 Email adres:</span>
                          <strong className="text-slate-800 dark:text-slate-200">{m.email}</strong>
                        </div>
                        {m.phone && (
                          <div className="flex justify-between">
                            <span>📞 Telefoonnummer:</span>
                            <strong className="text-slate-800 dark:text-slate-200">{m.phone}</strong>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>📅 Lid sinds:</span>
                          <strong className="text-slate-850 dark:text-slate-200">{new Date(m.registrationDate).toLocaleDateString()}</strong>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 dark:border-slate-850 pt-3 mt-3">
                          <span>Lidmaatschap Bijdrage (Geregistreerd):</span>
                          <span className="font-semibold text-emerald-600">€{m.totalContributed} voldaan</span>
                        </div>
                      </div>

                      <div className="flex gap-3 justify-center">
                        <button 
                          onClick={() => {
                            handleCloseDetail();
                            onNavigate('messages');
                          }}
                          className="bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center space-x-1.5 transition-all outline-none cursor-pointer shadow-md"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>Stuur Privébericht</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. POST DETAIL VIEW */}
                {selectedDetail.type === 'post' && (() => {
                  const p: Post = selectedDetail.item;
                  return (
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <img 
                          src={p.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
                          className="h-10 w-10 rounded-full object-cover" 
                          alt="avatar"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="font-bold text-slate-850 dark:text-slate-100 text-sm">{p.authorName}</h4>
                          <span className="text-[11px] text-slate-400 block">{new Date(p.date).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {p.content}
                      </div>

                      {p.mediaUrl && (
                        <div className="mt-4 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                          <img 
                            src={p.mediaUrl} 
                            alt={p.mediaName || "Bijlage"} 
                            className="w-full max-h-60 object-contain mx-auto"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="flex gap-2 mt-4 flex-wrap">
                        {p.isAnnouncement && (
                          <span className="bg-red-150 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-red-950/40 dark:text-red-400">
                            Aankondiging • {p.announcementCategory}
                          </span>
                        )}
                        <span className="bg-slate-100 dark:bg-slate-805 text-slate-500 text-xs font-bold px-2.5 py-1 rounded-full">
                          👍 {p.likes.length} likes • 💬 {p.comments.length} reacties
                        </span>
                      </div>

                      {p.comments.length > 0 && (
                        <div className="mt-5 border-t border-slate-100 dark:border-slate-850 pt-4">
                          <h5 className="font-bold text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Reacties</h5>
                          <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                            {p.comments.map((c) => (
                              <div key={c.id} className="bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-lg text-xs">
                                <div className="flex justify-between items-center mb-1">
                                  <strong className="text-slate-700 dark:text-slate-300">{c.authorName}</strong>
                                  <span className="text-slate-450 text-[10px]">{new Date(c.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-slate-650 dark:text-slate-450">{c.content}</p>
                                {c.mediaUrl && (
                                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 max-h-36 max-w-xs">
                                    <img 
                                      src={c.mediaUrl} 
                                      alt="Detail Comment Attachment" 
                                      className="h-24 w-full object-cover" 
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 justify-end mt-6 border-t border-slate-100 dark:border-slate-850 pt-4">
                        <button 
                          onClick={() => {
                            handleCloseDetail();
                            onNavigate('feed');
                          }}
                          className="bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                        >
                          <span>Bekijk in Feed Hub</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. POLL DETAIL VIEW */}
                {selectedDetail.type === 'poll' && (() => {
                  const po: Poll = selectedDetail.item;
                  return (
                    <div>
                      <div className="flex items-center space-x-2 text-blue-900 dark:text-blue-400 mb-3 font-semibold text-xs font-mono">
                        <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                        <span>COMMUNITY POLL PEILING</span>
                      </div>
                      
                      <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 leading-snug mb-4">
                        {po.question}
                      </h3>

                      <p className="text-[11px] text-slate-400 mb-4">
                        Aangemaakt door <strong>{po.authorName}</strong>, op {new Date(po.date).toLocaleDateString()}
                      </p>

                      <div className="space-y-3">
                        {po.options.map((opt) => {
                          const votesCount = opt.votes.length;
                          return (
                            <div key={opt.id} className="bg-slate-50 dark:bg-slate-950 p-3.5 border border-slate-150 dark:border-slate-850 rounded-xl">
                              <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                                <span className="text-slate-800 dark:text-slate-200">{opt.text}</span>
                                <span className="text-blue-600 dark:text-blue-400">{votesCount} stem{votesCount === 1 ? '' : 'men'}</span>
                              </div>
                              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, Math.max(5, (votesCount * 12)))}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex gap-3 justify-end mt-6 border-t border-slate-100 dark:border-slate-850 pt-4">
                        <button 
                          onClick={() => {
                            handleCloseDetail();
                            onNavigate('feed');
                          }}
                          className="bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Bekijk & Stem in Feed</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. MARKETPLACE DETAIL VIEW */}
                {selectedDetail.type === 'marketplace' && (() => {
                  const item: MarketplaceItem = selectedDetail.item;
                  return (
                    <div>
                      {item.imageUrl && (
                        <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-100 dark:border-slate-800 max-h-56 mb-4">
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full object-cover mx-auto"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{item.title}</h3>
                          <span className="text-xs text-slate-400 capitalize bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xl font-bold text-amber-600 dark:text-[#F59E0B]">€{item.price}</span>
                          <span className={`text-[10px] uppercase font-bold block mt-1 px-2 py-0.5 rounded-full ${
                            item.status === 'available'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {item.status === 'available' ? 'Beschikbaar' : 'Verkocht'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-b border-slate-100 dark:border-slate-850 py-3 mb-4">
                        <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-1.5">Omschrijving</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-wrap">
                          {item.description}
                        </p>
                      </div>

                      {/* Seller Profile contact */}
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={item.sellerAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120"} 
                            alt="seller avatar" 
                            className="h-9 w-9 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <p className="text-xs text-slate-400 uppercase">Aangeboden door</p>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.sellerName}</p>
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          <p>Datum: {new Date(item.date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                        <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">📞 Contactgegevens verkoper</h4>
                        <div className="text-xs text-slate-750 dark:text-slate-350 space-y-1">
                          <p>Tel: <strong>{item.contactPhone}</strong></p>
                          {item.contactEmail && <p>Email: <strong>{item.contactEmail}</strong></p>}
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end mt-6">
                        <button 
                          onClick={() => {
                            handleCloseDetail();
                            onNavigate('marketplace');
                          }}
                          className="bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-sm"
                        >
                          <span>Bekijk op Marktplaats</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 5. EVENT DETAIL VIEW */}
                {selectedDetail.type === 'event' && (() => {
                  const e: Event = selectedDetail.item;
                  return (
                    <div>
                      <div className="flex justify-between items-start gap-1 mb-2">
                        <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">{e.title}</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
                          {e.category}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-850 pb-2">
                        <span>🗓️ {e.date}</span>
                        <span>⏰ {e.time}</span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed mb-4 whitespace-pre-wrap">
                        {e.description}
                      </p>

                      <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 py-3 text-xs">
                        <p>📍 Locatie: <strong className="text-slate-850 dark:text-slate-200">{e.location}</strong></p>
                        <p>👤 Organisatie door: <strong className="text-slate-850 dark:text-slate-200">{e.organizer}</strong></p>
                        <p>👥 Deelnemers: <strong className="text-slate-800 dark:text-slate-300">{e.rsvps.length} bewoners gaan akkoord (RSVP overzicht)</strong></p>
                      </div>

                      <div className="flex gap-3 justify-end mt-6">
                        <button 
                          onClick={() => {
                            handleCloseDetail();
                            onNavigate('events');
                          }}
                          className="bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Ga naar Evenementen Hub</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 6. PROJECT DETAIL VIEW */}
                {selectedDetail.type === 'project' && (() => {
                  const pr: Project = selectedDetail.item;
                  return (
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <div>
                          <h3 className="text-lg font-bold text-slate-850 dark:text-slate-100">{pr.title}</h3>
                          <span className="text-[9px] uppercase font-sans tracking-wide text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 border dark:border-slate-850 rounded">
                            Niveau: {pr.category}
                          </span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                          pr.status === 'completed'
                            ? 'bg-green-150 text-green-850 dark:bg-green-950/40 dark:text-green-400'
                            : pr.status === 'in-progress'
                            ? 'bg-blue-150 text-blue-800 dark:bg-blue-950/40'
                            : 'bg-slate-100 text-slate-650'
                        }`}>
                          {pr.status === 'completed' ? 'Voltooid' : pr.status === 'in-progress' ? 'Lopend' : 'Plannen'}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed mt-4 mb-4 whitespace-pre-wrap">
                        {pr.description}
                      </p>

                      <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-4 space-y-3 border border-slate-100 dark:border-slate-850/80 mb-4 text-xs">
                        <div className="flex justify-between">
                          <span>📊 Uitvoeringvoortgang:</span>
                          <strong className="text-emerald-600">{pr.progress}% voltooid</strong>
                        </div>
                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-600" style={{ width: `${pr.progress}%` }} />
                        </div>

                        <div className="flex justify-between border-t border-slate-200/50 dark:border-slate-850 pt-2.5 mt-2 text-xs">
                          <span>📦 Project Budget: <strong>€{pr.budget.toLocaleString()}</strong></span>
                          <span>💸 Gerealiseerd: <strong className="text-red-500">€{pr.spent.toLocaleString()}</strong></span>
                        </div>
                      </div>

                      {pr.updates && pr.updates.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-850 pt-3">
                          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-2.5">Laatste voortgang updates</h4>
                          <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                            {pr.updates.map((upd) => (
                              <div key={upd.id} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/40 dark:bg-slate-950/20 text-xs">
                                <div className="flex justify-between items-center font-bold mb-1">
                                  <span>{upd.title}</span>
                                  <span className="text-[10px] text-slate-400">{upd.date}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">{upd.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3 justify-end mt-6">
                        <button 
                          onClick={() => {
                            handleCloseDetail();
                            onNavigate('projects');
                          }}
                          className="bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer shadow"
                        >
                          <span>Bekijk Project Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* 7. GALLERY ITEM DETAIL VIEW */}
                {selectedDetail.type === 'gallery_img' && (() => {
                  const g: GalleryItem = selectedDetail.item;
                  return (
                    <div className="text-center">
                      <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-250 dark:border-slate-800 max-h-80 mb-4 flex items-center justify-center leading-[0]">
                        <img 
                          src={g.url} 
                          alt={g.title} 
                          className="max-w-full max-h-80 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{g.title}</h3>
                      
                      <div className="text-xs text-slate-400 mt-1 mb-5 flex justify-center gap-3">
                        <span>👤 Geupload door: <strong>{g.uploadedBy}</strong></span>
                        <span>📅 Datum: <strong>{g.date}</strong></span>
                      </div>

                      <div className="flex justify-center gap-3">
                        <button 
                          onClick={() => {
                            handleCloseDetail();
                            onNavigate('gallery');
                          }}
                          className="bg-[#1E3A8A] hover:bg-blue-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Bekijk Gedeelde Galerij</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
