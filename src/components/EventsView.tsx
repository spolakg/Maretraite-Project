import React, { useState } from 'react';
import { 
  Calendar, MapPin, Clock, Users, User, ArrowRight,
  Plus, Image as ImageIcon, Send, HelpCircle, CheckCircle, AlertCircle,
  Upload, X
} from 'lucide-react';
import { Event, User as UserType } from '../types';

interface EventsViewProps {
  currentUser: UserType;
  events: Event[];
  onRsvpEvent: (eventId: string) => Promise<void>;
  onAddEvent: (eventData: {
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category: 'social' | 'meeting' | 'project' | 'cleanup';
    image?: string;
  }) => Promise<void>;
}

export default function EventsView({
  currentUser,
  events,
  onRsvpEvent,
  onAddEvent
}: EventsViewProps) {
  const [showCreator, setShowCreator] = useState(false);
  
  // Event creator form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<'social' | 'meeting' | 'project' | 'cleanup'>('social');
  const [imageUrl, setImageUrl] = useState('');
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
          setImageUrl(dataUrl);
        } else {
          setImageUrl(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !date || !time || !location) return;

    setIsSubmitting(true);
    try {
      await onAddEvent({
        title,
        description,
        date,
        time,
        location,
        category,
        image: imageUrl || undefined
      });
      // clear inputs
      setTitle('');
      setDescription('');
      setDate('');
      setTime('');
      setLocation('');
      setImageUrl('');
      setShowCreator(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow space-y-6" id="events-bulletin">
      
      {/* Header section with Add Button */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-205 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-850 dark:text-slate-100 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-900 dark:text-blue-400" />
            <span>Buurt Evenementenbulletin</span>
          </h1>
          <p className="text-xs text-slate-400">Coördineer en neem deel aan buurtvergaderingen, opruimacties en sponsoractiviteiten</p>
        </div>

        {currentUser.role === 'admin' && (
          <button
            onClick={() => setShowCreator(!showCreator)}
            className="bg-blue-900 hover:bg-blue-800 text-xs font-bold text-white px-4 py-2.5 rounded-xl cursor-pointer transition-all flex items-center space-x-1.5 shadow-md shadow-blue-900/10"
            id="register-new-event-btn"
          >
            <Plus className="h-4 w-4" />
            <span>Nieuw Evenement Plannen</span>
          </button>
        )}
      </div>

      {/* Admin Creator Popup Drawer */}
      {showCreator && currentUser.role === 'admin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 animate-in fade-in transition-all">
          <div className="pb-3 border-b mb-4">
            <h3 className="text-sm font-bold text-slate-850 dark:text-slate-200">Nieuw Buurtevenement Plannen</h3>
            <span className="text-[10px] text-slate-400">Alle geregistreerde Maretraite bewoners ontvangen een notificatie over de geplande datum.</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Titel Evenement*</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="bijv. Grote Buurtopruimactie Sector B"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200"
                  id="event-title-input"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Categorie Evenement*</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="social">🍉 Buurtfeest & Gezelligheid</option>
                  <option value="meeting">🏛️ Adviesraad & Vergadering</option>
                  <option value="project">🚧 Projectpresentatie & Inspraak</option>
                  <option value="cleanup">🧹 Groenactie & Buurtopruiming</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Beschrijving / Doel van bijeenkomst*</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Geef details over de agenda, wat mee te nemen, wat te verwachten..."
                rows={3}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-200 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Datum Bijeenkomst*</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-350"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Tijd Bijeenkomst*</label>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Locatie / Adres*</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="bijv. Buurtcentrum Zaal 2"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-2 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500 block">Evenementsfoto (Foto uploaden of link plakken)</label>
              
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 group">
                  <img 
                    src={imageUrl} 
                    alt="Evenement preview" 
                    className="w-full h-40 object-cover" 
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
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
                      Upload evenementsfoto
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
                      placeholder="Plak Unsplash URL"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
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
                className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-bold py-2.5 text-xs rounded-xl"
              >
                Evenement Inplannen
              </button>
              <button
                type="button"
                onClick={() => setShowCreator(false)}
                className="px-5 py-2.5 border rounded-xl border-slate-200 text-xs text-slate-550"
              >
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events Board display list grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((ev) => {
          const hasRsvped = ev.rsvps.includes(currentUser.id);
          return (
            <div
              key={ev.id}
              className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-205 dark:border-slate-800 flex flex-col transition-colors"
              id={`event-bulletin-card-${ev.id}`}
            >
              <div className="relative h-44 bg-slate-100 dark:bg-slate-950">
                <img
                  src={ev.image || "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=600"}
                  alt={ev.title}
                  className="w-full h-full object-cover"
                />

                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-sm tracking-wider ${
                  ev.category === 'social' ? 'bg-amber-500' :
                  ev.category === 'cleanup' ? 'bg-green-600' :
                  ev.category === 'meeting' ? 'bg-blue-900 border border-white' :
                  'bg-purple-600'
                }`}>
                  {ev.category === 'social' ? 'Gezelligheid' :
                   ev.category === 'cleanup' ? 'Opruimactie' :
                   ev.category === 'meeting' ? 'Vergadering' :
                   'Projectbespreking'}
                </span>

                <div className="absolute bottom-3 right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-xl text-center text-slate-800 dark:text-slate-100 shadow border dark:border-slate-800 flex items-center space-x-1.5">
                  <Calendar className="h-3.5 w-3.5 text-blue-900 dark:text-blue-400" />
                  <span className="text-[10px] font-bold">{new Date(ev.date).toLocaleDateString('nl-NL')}</span>
                </div>
              </div>

              <div className="p-5 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-850 dark:text-slate-100 leading-snug">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                <div className="mt-5 space-y-2.5 border-t pt-4 border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span>Tijd: {ev.time}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span className="truncate">Locatie: {ev.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center space-x-1 text-slate-500">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{ev.rsvps.length} Aanmelding(en)</span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono">Georganiseerd door {ev.organizer}</p>
                  </div>

                  <div className="mt-4 pt-3.5 flex justify-between gap-2 border-t">
                    <button
                      onClick={() => onRsvpEvent(ev.id)}
                      className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all text-center cursor-pointer flex items-center justify-center space-x-1 border ${
                        hasRsvped 
                          ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                      id={`rsvp-btn-${ev.id}`}
                    >
                      {hasRsvped ? (
                        <>
                          <CheckCircle className="h-3.5 w-3.5 text-white" />
                          <span>Ik ga hiernaartoe!</span>
                        </>
                      ) : (
                        <span>Aanmelden</span>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
