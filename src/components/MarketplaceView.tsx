import React, { useState } from 'react';
import { 
  Tag, Search, Plus, Phone, Mail, Clock,
  Trash2, CheckCircle2, AlertCircle, ShoppingBag, ArrowLeft, Filter,
  Upload, X, Image as ImageIcon
} from 'lucide-react';
import { User, MarketplaceItem } from '../types';

interface MarketplaceViewProps {
  currentUser: User | null;
  marketplace: MarketplaceItem[];
  onAddListing: (listing: Omit<MarketplaceItem, 'id' | 'sellerId' | 'sellerName' | 'sellerAvatar' | 'date' | 'status'>) => Promise<boolean>;
  onUpdateStatus: (itemId: string, status: 'available' | 'sold') => Promise<void>;
  onDeleteListing: (itemId: string) => Promise<void>;
  onOpenLightbox?: (url: string, caption?: string) => void;
}

export default function MarketplaceView({
  currentUser,
  marketplace,
  onAddListing,
  onUpdateStatus,
  onDeleteListing,
  onOpenLightbox
}: MarketplaceViewProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  
  // Listing Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<'vehicles' | 'property' | 'electronics' | 'household' | 'services' | 'other'>('household');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [imageUrl, setImageUrl] = useState('');
  const [formError, setFormError] = useState('');
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

  const categoriesList = [
    { id: 'all', label: 'Alle Advertenties' },
    { id: 'vehicles', label: 'Voertuigen & Fietsen' },
    { id: 'property', label: 'Vastgoed & Huur' },
    { id: 'electronics', label: 'Elektronica & Tech' },
    { id: 'household', label: 'Huis & Inrichting' },
    { id: 'services', label: 'Lokale Diensten' },
    { id: 'other', label: 'Overige' }
  ];

  // Filter listings
  const filteredListings = marketplace.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!title.trim() || !description.trim() || !price || !contactPhone.trim()) {
      setFormError('Vul alle verplichte velden in (Titel, Beschrijving, Prijs, Telefoonnummer)');
      setIsSubmitting(false);
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Vul een geldige positieve prijs in');
      setIsSubmitting(false);
      return;
    }

    // Default image if empty
    let finalImageUrl = imageUrl.trim();
    if (!finalImageUrl) {
      if (category === 'vehicles') {
        finalImageUrl = 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=600';
      } else if (category === 'electronics') {
        finalImageUrl = 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&q=80&w=600';
      } else if (category === 'property') {
        finalImageUrl = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600';
      } else if (category === 'services') {
        finalImageUrl = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=600';
      } else {
        finalImageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600';
      }
    }

    const success = await onAddListing({
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      category,
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim() || undefined,
      imageUrl: finalImageUrl
    });

    setIsSubmitting(false);

    if (success) {
      // Reset form fields
      setTitle('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setShowAddForm(false);
    } else {
      setFormError('Kan advertentie niet plaatsen. Probeer het opnieuw.');
    }
  };

  return (
    <div className="space-y-6" id="marketplace-view-root">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-amber-500" />
            <span>Maretraite Marktplaats</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Koop, verkoop of ruil goederen en professionele diensten met andere geverifieerde bewoners.
          </p>
        </div>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            id="btn-create-listing"
            className="inline-flex items-center justify-center space-x-2 px-4.5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Advertentie Plaatsen</span>
          </button>
        )}
      </div>

      {showAddForm ? (
        /* Create Listing Form */
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in duration-200 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800 mb-6">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center space-x-2">
              <Plus className="h-4 w-4 text-[#F59E0B]" />
              <span>Nieuwe Gratis Advertentie</span>
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1.5 cursor-pointer bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Terug naar Marktplaats</span>
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="p-3.5 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Titel / Naam van dienst *</label>
                <input
                  type="text"
                  required
                  placeholder="bijv. Grasmaaier, Engelse les, Bank"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs py-2.5 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Categorie *</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs py-2.5 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                >
                  <option value="household">Huis & Inrichting</option>
                  <option value="vehicles">Voertuigen & Fietsen</option>
                  <option value="electronics">Elektronica & Tech</option>
                  <option value="property">Vastgoed & Huur</option>
                  <option value="services">Lokale Diensten</option>
                  <option value="other">Overige</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Prijs (SRD) *</label>
                <div className="mt-1 relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold">SRD</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    placeholder="0,00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs py-2.5 pl-12 pr-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Telefoonnummer Contact *</label>
                <input
                  type="text"
                  required
                  placeholder="+597-XXX-XXXX"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs py-2.5 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">E-mailadres Contact (Optioneel)</label>
                <input
                  type="email"
                  placeholder="bijv. bewoner@gmail.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs py-2.5 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Afbeelding weergave (Foto uploaden of link plakken)</label>
                
                {imageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-755 bg-slate-50 dark:bg-slate-900 group">
                    <img 
                      src={imageUrl} 
                      alt="Geselecteerde weergave" 
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Drag and Drop File Selector */}
                    <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-205 dark:border-slate-800 hover:border-blue-900 dark:hover:border-blue-400 rounded-xl p-4 bg-slate-50 dark:bg-slate-905 cursor-pointer group transition-colors min-h-[90px]">
                      <Upload className="h-5 w-5 text-slate-400 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors mb-1" />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-900 dark:group-hover:text-blue-400 transition-colors">
                        Foto uploaden
                      </span>
                      <span className="text-[9px] text-slate-400 mt-0.5">JPEG, PNG of GIF</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageFileChange} 
                        className="hidden" 
                      />
                    </label>

                    {/* URL Input Box */}
                    <div className="flex flex-col justify-center border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-905">
                      <div className="flex items-center space-x-1.5 mb-2 text-slate-500">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Of plak een foto URL</span>
                      </div>
                      <input
                        type="url"
                        placeholder="Plak Unsplash- of andere fotolink"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs py-1.5 px-2.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Beschrijving Advertentie *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Geef een nauwkeurige omschrijving, staat van het product of voorwaarden van uw dienst..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs py-2.5 px-3.5 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-900 resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>{isSubmitting ? 'Bezig met publiceren...' : 'Advertentie Publiceren'}</span>
            </button>
          </form>
        </div>
      ) : (
        /* Marketplace Directory */
        <div className="space-y-6">
          
          {/* Filters shelf */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center transition-colors">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Zoeken naar advertenties..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900 border-none"
              />
            </div>

            {/* Category selection pill scroller */}
            <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
              {categoriesList.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-900 text-white'
                      : 'bg-slate-150 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listings list layout */}
          {filteredListings.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-16 text-center border border-slate-200 dark:border-slate-800">
              <ShoppingBag className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-400">Geen advertenties gevonden die aan uw criteria voldoen</p>
              <p className="text-xs text-slate-400 mt-1">Plaats als eerste iets leuks op de Maretraite Marktplaats!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map(item => {
                const isOwner = currentUser?.id === item.sellerId;
                const isAdmin = currentUser?.role === 'admin';

                return (
                  <div 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between transition-all hover:shadow-md cursor-pointer hover:border-slate-350 dark:hover:border-slate-700 hover:scale-[1.01] group"
                    id={`marketplace-card-${item.id}`}
                  >
                    
                    {/* Visual Frame */}
                    <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                      
                      {/* Ribbon Category */}
                      <span className="absolute top-2.5 left-2.5 text-[9px] font-black uppercase tracking-wider text-white bg-slate-905/80 backdrop-blur-md px-2 py-1 rounded">
                        {item.category === 'household' ? 'Huis & Inrichting' :
                         item.category === 'vehicles' ? 'Voertuigen & Fietsen' :
                         item.category === 'electronics' ? 'Elektronica & Tech' :
                         item.category === 'property' ? 'Vastgoed & Huur' :
                         item.category === 'services' ? 'Lokale Diensten' : 'Overige'}
                      </span>
                      
                      {/* Live Indicator overlay link text */}
                      <span className="absolute bottom-2 right-2 text-[9.5px] font-bold text-white bg-slate-900/40 backdrop-blur-[2px] px-2 py-0.5 rounded transition-opacity group-hover:opacity-100">
                        Klik voor details
                      </span>

                      {/* Status indicator badge */}
                      <span className={`absolute top-2.5 right-2.5 text-[9px] font-black uppercase tracking-wider text-white px-2 py-1 rounded ${
                        item.status === 'sold' ? 'bg-red-650' : 'bg-[#16A34A]'
                      }`}>
                        {item.status === 'sold' ? 'VERKOCHT' : 'BESCHIKBAAR'}
                      </span>
                    </div>

                    {/* Meta info & descriptions */}
                    <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1">
                            {item.title}
                          </h3>
                          <span className="text-sm font-black text-blue-900 dark:text-blue-450 whitespace-nowrap">
                            SRD {item.price.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Contact metadata */}
                      <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-850 space-y-2">
                        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                          <Phone className="h-3.5 w-3.5 text-blue-905/70" />
                          <a 
                            href={`tel:${item.contactPhone}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline hover:text-blue-900 font-medium"
                          >
                            {item.contactPhone}
                          </a>
                        </div>
                        {item.contactEmail && (
                          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                            <Mail className="h-3.5 w-3.5 text-blue-905/70" />
                            <a 
                              href={`mailto:${item.contactEmail}`} 
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline hover:text-blue-900 font-medium truncate"
                            >
                              {item.contactEmail}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Seller Profile row */}
                      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={item.sellerAvatar} 
                            alt={item.sellerName}
                            className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">
                              {item.sellerName}
                            </p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center space-x-0.5 mt-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              <span>{new Date(item.date).toLocaleDateString('nl-NL')}</span>
                            </span>
                          </div>
                        </div>

                        {/* Admin/Seller actions block */}
                        {(isOwner || isAdmin) && (
                          <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-850 p-1 rounded-lg">
                            {/* Toggle Sold Status */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStatus(item.id, item.status === 'sold' ? 'available' : 'sold');
                              }}
                              title={item.status === 'sold' ? 'Markeren als Beschikbaar' : 'Markeren als Verkocht'}
                              className="p-1 px-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-green-650 rounded cursor-pointer transition-colors"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            
                            {/* Delete Listing */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteListing(item.id);
                              }}
                              title="Advertentie Verwijderen"
                              className="p-1 px-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-500 hover:text-red-500 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* Modal for detail view */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedItem(null);
            }
          }}
          id="marketplace-detail-modal"
        >
          <div 
            className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header image with close trigger */}
            <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
              <img 
                src={selectedItem.imageUrl} 
                alt={selectedItem.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover cursor-zoom-in hover:opacity-95 transition-opacity"
                onClick={() => onOpenLightbox?.(selectedItem.imageUrl, `${selectedItem.title} (€${selectedItem.price})`)}
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 p-2 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-md focus:outline-none cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-wider text-white bg-blue-900/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
                {selectedItem.category === 'household' ? 'Huis & Inrichting' :
                 selectedItem.category === 'vehicles' ? 'Voertuigen & Fietsen' :
                 selectedItem.category === 'electronics' ? 'Elektronica & Tech' :
                 selectedItem.category === 'property' ? 'Vastgoed & Huur' :
                 selectedItem.category === 'services' ? 'Lokale Diensten' : 'Overige'}
              </span>
            </div>

            {/* Detailed specifications body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className={`inline-block text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-full mb-1.5 ${
                    selectedItem.status === 'sold' ? 'bg-red-650' : 'bg-[#16A34A]'
                  }`}>
                    {selectedItem.status === 'sold' ? 'Verkocht' : 'Beschikbaar'}
                  </span>
                  <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight leading-snug">
                    {selectedItem.title}
                  </h2>
                </div>
                <span className="text-base font-black text-blue-905 dark:text-blue-450 whitespace-nowrap">
                  SRD {selectedItem.price.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Beschrijving</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {selectedItem.description}
                </p>
              </div>

              {/* Direct links contacts */}
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Contactgegevens</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <a 
                    href={`tel:${selectedItem.contactPhone}`}
                    className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-205 dark:border-slate-800 hover:border-blue-900 dark:hover:border-blue-400 bg-white dark:bg-slate-905 transition-all group cursor-pointer"
                  >
                    <Phone className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Bellen</p>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedItem.contactPhone}</p>
                    </div>
                  </a>
                  {selectedItem.contactEmail && (
                    <a 
                      href={`mailto:${selectedItem.contactEmail}`}
                      className="flex items-center space-x-2.5 p-3 rounded-xl border border-slate-205 dark:border-slate-800 hover:border-blue-905 dark:hover:border-blue-400 bg-white dark:bg-slate-905 transition-all group cursor-pointer"
                    >
                      <Mail className="h-4 w-4 text-blue-905 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Mailen</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{selectedItem.contactEmail}</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Seller metadata row */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <img 
                    src={selectedItem.sellerAvatar} 
                    alt={selectedItem.sellerName}
                    className="h-8 w-8 rounded-full object-cover border border-slate-251 dark:border-slate-700" 
                  />
                  <div>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Aangeboden door {selectedItem.sellerName}
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center space-x-1 mt-0.5">
                      <Clock className="h-3 w-3 text-slate-350" />
                      <span>Geplaatst op {new Date(selectedItem.date).toLocaleDateString('nl-NL')}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
