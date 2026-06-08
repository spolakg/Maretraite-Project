import React, { useState } from 'react';
import { 
  HardHat, DollarSign, Calendar, Sliders, MessageSquare, 
  Plus, CheckCircle, BarChart, FileDown, Eye, Send, Compass,
  Upload, X, Image as ImageIcon
} from 'lucide-react';
import { Project, User } from '../types';

interface ProjectsViewProps {
  currentUser: User;
  projects: Project[];
  onAddProject: (projectData: {
    title: string;
    description: string;
    category: 'infrastructure' | 'roads' | 'buildings' | 'water' | 'education';
    budget: number;
    photos?: string[];
  }) => Promise<void>;
  onAddProjectUpdate: (projectId: string, updateData: {
    title: string;
    content: string;
  }) => Promise<void>;
  onUpdateProjectProgress: (projectId: string, progressData: {
    status?: 'planning' | 'in-progress' | 'completed';
    spent?: number;
    progress?: number;
  }) => Promise<void>;
}

export default function ProjectsView({
  currentUser,
  projects,
  onAddProject,
  onAddProjectUpdate,
  onUpdateProjectProgress
}: ProjectsViewProps) {
  // Tabs: 'list' | 'declare_project'
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'declare'>('list');
  const [activeProjectControlsId, setActiveProjectControlsId] = useState<string | null>(null);

  // New project states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'infrastructure' | 'roads' | 'buildings' | 'water' | 'education'>('roads');
  const [budget, setBudget] = useState('');
  const [coverPhoto, setCoverPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setCoverPhoto(dataUrl);
        } else {
          setCoverPhoto(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Quick updates text/remarks
  const [newUpdateTitle, setNewUpdateTitle] = useState<{ [pId: string]: string }>({});
  const [newUpdateContent, setNewUpdateContent] = useState<{ [pId: string]: string }>({});
  const [isPublishingUpdate, setIsPublishingUpdate] = useState<{ [pId: string]: boolean }>({});

  // Slide controls adjustments
  const [modStatus, setModStatus] = useState<'planning' | 'in-progress' | 'completed'>('planning');
  const [modSpent, setModSpent] = useState('');
  const [modProgress, setModProgress] = useState('');

  const handleOpenControls = (p: Project) => {
    setActiveProjectControlsId(activeProjectControlsId === p.id ? null : p.id);
    setModStatus(p.status);
    setModSpent(String(p.spent));
    setModProgress(String(p.progress));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !budget) return;

    setIsSubmitting(true);
    try {
      await onAddProject({
        title,
        description,
        category,
        budget: Number(budget),
        photos: coverPhoto ? [coverPhoto] : undefined
      });
      setTitle('');
      setDescription('');
      setCategory('infrastructure');
      setBudget('');
      setCoverPhoto('');
      setActiveSubTab('list');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitProjectLogUpdate = async (pId: string) => {
    const ut = newUpdateTitle[pId];
    const uc = newUpdateContent[pId];
    if (!ut || !uc) return;

    setIsPublishingUpdate({ ...isPublishingUpdate, [pId]: true });
    try {
      await onAddProjectUpdate(pId, { title: ut, content: uc });
      setNewUpdateTitle({ ...newUpdateTitle, [pId]: '' });
      setNewUpdateContent({ ...newUpdateContent, [pId]: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishingUpdate({ ...isPublishingUpdate, [pId]: false });
    }
  };

  const submitAdminAdjustments = async (pId: string) => {
    try {
      await onUpdateProjectProgress(pId, {
        status: modStatus,
        spent: Number(modSpent),
        progress: Number(modProgress)
      });
      setActiveProjectControlsId(null);
      alert('Project statistics updated successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-grow space-y-6" id="projects-view">
      
      {/* Tab Header Navigator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-205 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-850 dark:text-slate-100 flex items-center space-x-2">
            <HardHat className="h-5 w-5 text-blue-900 dark:text-blue-400" />
            <span>Overzicht Infrastructuurprojecten</span>
          </h1>
          <p className="text-xs text-slate-400">Volg budgetten, voortgangslijnen en updates op locatie transparant</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'list' ? 'bg-blue-900 text-white shadow' : 'text-slate-500 hover:text-slate-705 bg-slate-50 dark:bg-slate-800'}`}
          >
            Lopende Projecten
          </button>
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveSubTab('declare')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'declare' ? 'bg-blue-900 text-white shadow' : 'text-slate-500 hover:text-slate-705 bg-slate-50 dark:bg-slate-800'}`}
              id="declare-project-btn"
            >
              Project Aanmelden
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'declare' && currentUser.role === 'admin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors max-w-2xl mx-auto">
          <div className="pb-3 border-b mb-5">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Nieuw Ontwikkelingsproject Aanmelden</h3>
            <span className="text-[10px] text-slate-400">Maakt een openbare projectfiche aan. De gealloceerde contributie wordt hieraan gekoppeld.</span>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Projectnaam / Omschrijving*</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="bijv. Sector 3 Well Sinking Improvement"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
                id="proj-title-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Ontwikkelingscategorie*</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="roads">🚗 Weginfrastructuur & Bestrating</option>
                  <option value="water">💧 Schoon Drinkwater Infrastructuur</option>
                  <option value="infrastructure">⚡ Buurtbeveiliging & Straatverlichting</option>
                  <option value="buildings">🏛️ Renovatie Buurtcentrum</option>
                  <option value="education">🎒 Buurtschoolinitiatieven</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Totaal Budget (SRD)*</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="bijv. 25000"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-slate-800"
                  id="proj-budget-input"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Doelstellingen & Scope*</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijf specificaties, fysieke werkzaamheden, planning..."
                rows={4}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

             <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 block">Projectfoto (Foto uploaden of link plakken)</label>
              
              {coverPhoto ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 group">
                  <img 
                    src={coverPhoto} 
                    alt="Project preview" 
                    className="w-full h-40 object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverPhoto('')}
                    className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-600 text-white p-1.5 rounded-full transition-all shadow-md focus:outline-none cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-white text-[10px] font-mono">
                    Foto geselecteerd
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* File Selector */}
                  <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-900 dark:border-slate-800 dark:hover:border-blue-400 rounded-xl p-4 bg-slate-50 dark:bg-slate-905 cursor-pointer group transition-colors min-h-[90px]">
                    <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors mb-1" />
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                      Upload projectfoto
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">JPEG of PNG</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileChange} 
                      className="hidden" 
                    />
                  </label>

                  {/* URL Input */}
                  <div className="flex flex-col justify-center border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-905">
                    <div className="flex items-center space-x-1.5 mb-2 text-slate-500">
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Of plak een foto URL</span>
                    </div>
                    <input
                      type="url"
                      placeholder="Plak Unsplash construction URL"
                      value={coverPhoto}
                      onChange={(e) => setCoverPhoto(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-slate-800 border rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-grow bg-blue-900 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Project Starten
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('list')}
                className="px-6 py-2.5 border border-slate-200 text-xs text-slate-500 rounded-xl"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Cards List Display */}
      {activeSubTab === 'list' && (
        <div className="space-y-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 transition-colors p-5 sm:p-6"
              id={`project-card-${p.id}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Cover / Core detail */}
                <div>
                  <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <img
                      src={p.photos?.[0] || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600'}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 dark:bg-slate-905/95 border dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[10px] font-bold uppercase py-0.5 px-2.5 rounded-full">
                      {p.category === 'roads' ? '🚗 WEGWERKZAAMHEDEN' :
                       p.category === 'water' ? '💧 WATERINRASTRUCTUUR' :
                       p.category === 'infrastructure' ? '⚡ BUURTBEVEILIGING' :
                       p.category === 'buildings' ? '🏛️ BUURTCENTRUM' :
                       '🎒 ONDERWIJS'}
                    </div>

                    <div className={`absolute bottom-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-white ${
                      p.status === 'planning' ? 'bg-slate-500' :
                      p.status === 'in-progress' ? 'bg-amber-500' :
                      'bg-green-600'
                    }`}>
                      {p.status === 'planning' ? 'PLANNING' :
                       p.status === 'in-progress' ? 'IN UITVOERING' :
                       'VOLTOOID'}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3.5 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Totaal Budget:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">SRD {p.budget.toLocaleString('nl-NL')}</span>
                    </div>

                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block font-medium">Besteed:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-100">SRD {p.spent.toLocaleString('nl-NL')}</span>
                    </div>
                  </div>
                </div>

                {/* Scope Description and Progress Bar details */}
                <div className="lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="font-black text-slate-850 dark:text-slate-100 text-base leading-tight">
                        {p.title}
                      </h3>

                      {currentUser.role === 'admin' && (
                        <button
                          onClick={() => handleOpenControls(p)}
                          className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-blue-900 dark:text-blue-400 rounded-lg border dark:border-slate-700 flex items-center space-x-1 cursor-pointer"
                        >
                          <Sliders className="h-3 w-3" />
                          <span>Status Wijzigen</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2.5">
                      {p.description}
                    </p>

                    {/* Progress visual indicators bar */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-650 dark:text-slate-300">
                        <span>Fysieke Mijlpalen Behaald</span>
                        <span>{p.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* ADMIN ADJUSTMENT DRAWER INSIDE CARD PANEL */}
                  {activeProjectControlsId === p.id && currentUser.role === 'admin' && (
                    <div className="mt-4 p-4 border bg-blue-50/20 dark:bg-slate-950/20 rounded-2xl border-blue-900/10 space-y-3">
                      <span className="text-[10px] font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider block">Beheerderstatus Aanpassen</span>
                      
                      <div className="grid grid-cols-3 gap-2.5">
                        <div>
                          <label className="text-[9px] text-slate-500 font-bold block mb-0.5">Status</label>
                          <select
                            value={modStatus}
                            onChange={(e: any) => setModStatus(e.target.value)}
                            className="bg-white dark:bg-slate-800 border text-[10px] rounded p-1 w-full"
                          >
                            <option value="planning">Planning</option>
                            <option value="in-progress">In Uitvoering</option>
                            <option value="completed">Voltooid</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-bold block mb-0.5">Besteed Bedrag (SRD)</label>
                          <input
                            type="number"
                            value={modSpent}
                            onChange={(e) => setModSpent(e.target.value)}
                            className="bg-white dark:bg-slate-800 border text-[10px] rounded p-1 w-full"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-500 font-bold block mb-0.5">Voortgang %</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={modProgress}
                            onChange={(e) => setModProgress(e.target.value)}
                            className="bg-white dark:bg-slate-800 border text-[10px] rounded p-1 w-full"
                          />
                        </div>
                      </div>

                      <div className="flex space-x-2 pt-1.5">
                        <button
                          onClick={() => submitAdminAdjustments(p.id)}
                          className="bg-blue-900 hover:bg-blue-800 text-[10px] font-bold text-white px-3 py-1 rounded"
                        >
                          Opslaan
                        </button>
                        <button
                          onClick={() => setActiveProjectControlsId(null)}
                          className="border text-[10px] text-slate-500 px-3 py-1 rounded"
                        >
                          Sluiten
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Project site progress logs updates section */}
                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center space-x-1">
                      <Compass className="h-4 w-4" />
                      <span>Bouwdagboek / Voortgangslogboek</span>
                    </h4>

                    {/* Admin Create Progress Update tool */}
                    <div className="bg-slate-50/50 dark:bg-slate-800/40 p-3 rounded-xl space-y-2 border">
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Nieuwe Update Registreren</span>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          required
                          value={newUpdateTitle[p.id] || ''}
                          onChange={(e) => setNewUpdateTitle({ ...newUpdateTitle, [p.id]: e.target.value })}
                          placeholder="Titel (bijv. Cement gestort)"
                          className="bg-white dark:bg-slate-800 border text-[10px] rounded px-2 py-1 flex-grow text-slate-800 dark:text-slate-100"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          required
                          value={newUpdateContent[p.id] || ''}
                          onChange={(e) => setNewUpdateContent({ ...newUpdateContent, [p.id]: e.target.value })}
                          placeholder="Geef details over de uitgevoerde werkzaamheden..."
                          className="bg-white dark:bg-slate-800 border text-[10px] rounded px-2 py-1 flex-grow text-slate-800 dark:text-slate-100"
                        />
                        <button
                          disabled={isPublishingUpdate[p.id] || !newUpdateTitle[p.id]?.trim() || !newUpdateContent[p.id]?.trim()}
                          onClick={() => submitProjectLogUpdate(p.id)}
                          className="bg-blue-900 hover:bg-blue-850 disabled:opacity-40 text-[10px] text-white font-bold px-3 py-1 rounded cursor-pointer"
                        >
                          Log Indienen
                        </button>
                      </div>
                    </div>

                    {/* Progress logs listing details */}
                    {p.updates.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic">Er zijn nog geen updates geregistreerd voor dit project.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                        {p.updates.map((up) => (
                          <div key={up.id} className="text-xs bg-slate-50 dark:bg-slate-800/30 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex justify-between font-bold text-slate-700 dark:text-slate-200">
                              <span>🚧 {up.title}</span>
                              <span className="text-[9px] text-slate-400 font-normal">{new Date(up.date).toLocaleDateString('nl-NL')}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{up.content}</p>
                            <span className="text-[9px] text-slate-400 font-medium block mt-1">• Geregistreerd door {up.authorName}</span>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
