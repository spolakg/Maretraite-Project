import React, { useState } from 'react';
import { Landmark, Shield, Upload, Phone, Mail, FileText, CheckCircle } from 'lucide-react';
import { User } from '../types';

interface ProfileViewProps {
  currentUser: User;
  onUpdateProfile: (profileData: {
    fullName: string;
    email: string;
    phone?: string;
    bio?: string;
    profilePicture?: string;
    pincode?: string;
  }) => Promise<void>;
}

export default function ProfileView({
  currentUser,
  onUpdateProfile
}: ProfileViewProps) {
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [profilePicture, setProfilePicture] = useState(currentUser.profilePicture || '');
  const [pincode, setPincode] = useState(currentUser.pincode || '');
  const [showPincode, setShowPincode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState('');

  React.useEffect(() => {
    setFullName(currentUser.fullName);
    setEmail(currentUser.email);
    setPhone(currentUser.phone || '');
    setBio(currentUser.bio || '');
    setProfilePicture(currentUser.profilePicture || '');
    setPincode(currentUser.pincode || '');
  }, [
    currentUser.id,
    currentUser.fullName,
    currentUser.email,
    currentUser.phone,
    currentUser.bio,
    currentUser.profilePicture,
    currentUser.pincode
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    if (pincode && !/^\d{4}$/.test(pincode)) {
      alert("Inlogpincode moet exact 4 cijfers bevatten.");
      return;
    }

    setIsSubmitting(true);
    setNotice('');
    try {
      await onUpdateProfile({
        fullName,
        email,
        phone: phone || undefined,
        bio: bio || undefined,
        profilePicture,
        pincode: pincode || undefined
      });
      setNotice('Uw bewonersprofiel is succesvol bijgewerkt!');
      setTimeout(() => setNotice(''), 3000);
    } catch (err: any) {
      alert(`Fout bij bijwerken profiel: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setProfilePicture(compressedDataUrl);
        } else {
          setProfilePicture(event.target?.result as string);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-grow max-w-2xl mx-auto space-y-6" id="profile-management-view">
      
      {/* Profile summary headers card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row items-center sm:space-x-5 space-y-4 sm:space-y-0 text-center sm:text-left">
          <div className="relative">
            <img
              src={profilePicture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=240"}
              alt={currentUser.fullName}
              className="h-24 w-24 rounded-full object-cover border-4 border-blue-900/10 shadow-sm"
              id="profile-big-picture-display"
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-850 dark:text-slate-105 flex items-center justify-center sm:justify-start space-x-2">
              <span>{currentUser.fullName}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${currentUser.role === 'admin' ? 'bg-red-50 text-red-650' : 'bg-blue-50 text-blue-900'}`}>
                {currentUser.role === 'admin' ? 'BEHEERDER' : currentUser.role === 'moderator' ? 'MODERATOR' : 'BEWONER'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">ID Code: <span className="font-mono font-bold text-slate-500">{currentUser.memberId}</span></p>
            <p className="text-xs text-slate-500 mt-2 italic max-w-sm">"{currentUser.bio || 'Actieve bewoner van Maretraite.'}"</p>
          </div>
        </div>

        <div className="grid grid-cols-2 mt-6 gap-3 pt-5 border-t text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Totaal Voldane Contributie</span>
            <span className="text-sm font-black text-green-600">SRD {currentUser.totalContributed.toLocaleString('nl-NL')}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
            <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Openstaande Contributie</span>
            <span className={`text-sm font-black ${currentUser.outstandingBalance > 0 ? 'text-amber-500' : 'text-green-600'}`}>
              SRD {currentUser.outstandingBalance.toLocaleString('nl-NL')}
            </span>
          </div>
        </div>
      </div>

      {/* Editor profile form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 pb-3 border-b mb-5">
          Bewonersprofiel Bewerken
        </h3>

        {notice && (
          <div className="mb-4 p-4 bg-green-50 text-green-800 border border-green-250 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-650" />
            <span className="font-bold">{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Volledige Naam*</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2.5 text-slate-800 dark:text-slate-100"
                id="edit-fullname-input"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">E-mailadres*</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2.5 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Telefoonnummer</label>
              <input
                type="text"
                value={phone || ''}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+597-xxx-xxxx"
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2.5 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Profielfoto URL</label>
              <input
                type="text"
                value={profilePicture || ''}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2.5 text-slate-800 dark:text-slate-100"
                id="edit-avatar-url-input"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Of upload een JPEG/PNG-bestand</label>
            <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-150">
              <Upload className="h-5 w-5 text-slate-400" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs text-slate-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-150 dark:border-slate-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Buurtbewoners Beveiligingspincode (4 cijfers)</label>
              <button
                type="button"
                onClick={() => setShowPincode(!showPincode)}
                className="text-[10px] text-blue-900 dark:text-blue-400 font-bold hover:underline"
              >
                {showPincode ? "Pincode maskeren" : "Toon pincode"}
              </button>
            </div>
            <p className="text-[10.5px] text-slate-450 leading-relaxed">
              Dit is uw persoonlijke 4-cijferige pincode waarmee u inlogt op het Maretraite-netwerk. Houd dit altijd geheim.
            </p>
            <input
              type={showPincode ? "text" : "password"}
              pattern="\d*"
              maxLength={4}
              value={pincode || ''}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
              placeholder="v.b. 1234"
              className="w-24 text-center text-xs tracking-widest font-black bg-white dark:bg-slate-900 border rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-900"
              id="edit-pincode-input"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Korte Biografie</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Vertel buurtbewoners in welke straat u woont of wat uw bijdragen zijn aan de buurt."
              rows={3}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-900 hover:bg-blue-805 text-white font-bold text-xs py-3 rounded-2xl transition-all cursor-pointer shadow-md shadow-blue-900/10"
            id="save-profile-btn"
          >
            {isSubmitting ? 'Wijzigingen opslaan...' : 'Profiel Opslaan'}
          </button>

        </form>
      </div>

    </div>
  );
}
