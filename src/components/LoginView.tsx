import React, { useState } from 'react';
import { 
  Lock, Mail, User, Phone, AlignLeft, ShieldCheck, CheckCircle, 
  ArrowRight, Key, Info, HelpCircle
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (username: string, pincode?: string) => Promise<{ success: boolean; pincodeRequired?: boolean; hasPincode?: boolean; error?: string }>;
  onRegister: (formData: {
    username: string;
    fullName: string;
    email: string;
    phone?: string;
    bio?: string;
    profilePicture?: string;
  }) => Promise<void>;
}

export default function LoginView({ onLogin, onRegister }: LoginViewProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  // Login inputs
  const [loginUsername, setLoginUsername] = useState('');

  // States for pincode login phase
  const [pincodeStep, setPincodeStep] = useState(false);
  const [hasPincode, setHasPincode] = useState(false);
  const [pincode, setPincode] = useState('');
  const [confirmPincode, setConfirmPincode] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Register inputs
  const [regUsername, setRegUsername] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regBio, setRegBio] = useState('');
  const [regImg, setRegImg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!loginUsername.trim()) {
      setErrorText('Geef uw geregistreerde gebruikersnaam op.');
      return;
    }

    try {
      if (!pincodeStep) {
        setIsSubmitting(true);
        const result = await onLogin(loginUsername.toLowerCase().trim());
        setIsSubmitting(false);

        if (result.success) {
          // Logged in successfully!
          return;
        }

        if (result.pincodeRequired) {
          setPincodeStep(true);
          setHasPincode(!!result.hasPincode);
          setPincode('');
          setConfirmPincode('');
          return;
        }

        if (result.error) {
          setErrorText(result.error);
        } else {
          setErrorText('Geen actief goedgekeurde bewonersaccount gevonden met deze gebruikersnaam.');
        }
      } else {
        // Validate pin format (exactly 4 digits)
        const isFourDigits = /^\d{4}$/.test(pincode);
        if (!isFourDigits) {
          setErrorText('De pincode moet exact 4 cijfers bevatten.');
          return;
        }

        if (!hasPincode) {
          if (pincode !== confirmPincode) {
            setErrorText('De pincodes komen niet overeen. Probeer het opnieuw.');
            return;
          }
        }

        setIsSubmitting(true);
        const result = await onLogin(loginUsername.toLowerCase().trim(), pincode);
        setIsSubmitting(false);

        if (result.success) {
          // Logged in!
          return;
        }

        if (result.error) {
          setErrorText(result.error);
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorText(err.message || 'Verificatie mislukt. Probeer het opnieuw.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!regUsername || !regFullName || !regEmail) {
      setErrorText('Vul alstublieft alle verplichte velden in.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister({
        username: regUsername.toLowerCase().trim(),
        fullName: regFullName,
        email: regEmail,
        phone: regPhone || undefined,
        bio: regBio || undefined,
        profilePicture: regImg || undefined
      });
      setSuccessText('Registratie ingediend! Een beheerder is op de hoogte gesteld om uw aanvraag te beoordelen.');
      
      // Reset registration values
      setRegUsername('');
      setRegFullName('');
      setRegEmail('');
      setRegPhone('');
      setRegBio('');
      setRegImg('');
      
      // Wait and show login
      setTimeout(() => {
        setIsRegistering(false);
        setSuccessText('');
      }, 5000);

    } catch (err: any) {
      setErrorText(err.message || 'Gebruikersnaam of e-mailadres is al geregistreerd.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectShortcutLogin = (username: string) => {
    setLoginUsername(username);
    setPincodeStep(false);
    setPincode('');
    setConfirmPincode('');
    setErrorText('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors" id="auth-view-screen">
      <div className="max-w-md w-full mx-auto space-y-8">
        
        {/* Banner Headers */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#F59E0B] rounded-xl flex items-center justify-center text-[#1E3A8A] text-3xl font-black font-sans shadow-md border border-[#F59E0B]/80">
            M
          </div>
          <h2 className="mt-6 text-2xl font-black text-slate-850 dark:text-white tracking-tight">
            Maretraite Project Network
          </h2>
          <p className="mt-2 text-xs text-slate-500 leading-normal">
            {isRegistering 
              ? 'Vraag een bewonersaccount aan om lid te worden van het netwerk' 
              : 'Meld u aan voor toegang tot het nieuwsoverzicht, evenementen en betalingen'}
          </p>
        </div>

        {/* Card Canvas */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/50 dark:border-slate-805 transition-colors">
          
          {errorText && (
            <div className="mb-5 p-3.5 bg-red-50 text-red-800 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <Info className="h-4 w-4 text-red-650 flex-shrink-0" />
              <span className="font-semibold">{errorText}</span>
            </div>
          )}

          {successText && (
            <div className="mb-5 p-4 bg-green-50 text-green-800 rounded-xl text-xs flex items-start space-x-2.5 animate-in fade-in">
              <CheckCircle className="h-4.5 w-4.5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Aanvraag ontvangen</p>
                <p className="mt-0.5 opacity-90">{successText}</p>
              </div>
            </div>
          )}

          {!isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {!pincodeStep ? (
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
                    Gebruikersnaam voor aanmelding
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Voer uw geregistreerde gebruikersnaam in (bijv. john)"
                      className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 pl-10 pr-4 py-3 rounded-2xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-900"
                      id="login-username-input"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 dark:bg-slate-800/20 border border-blue-105 rounded-xl space-y-1">
                    <p className="text-[11px] font-bold text-blue-900 dark:text-blue-400">Gebruikersnaam geverifieerd:</p>
                    <p className="text-xs font-bold text-slate-705 dark:text-slate-200 flex items-center space-x-1.5 animate-pulse">
                      <User className="h-3.5 w-3.5 text-blue-900" />
                      <span>@{loginUsername}</span>
                    </p>
                  </div>

                  {!hasPincode ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 rounded-xl">
                        <p className="text-xs font-semibold text-amber-802 dark:text-amber-300">
                          🎉 Uw account is geactiveerd door de beheerder! Stel uw nieuwe 4-cijferige pincode in om in te loggen.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-605 dark:text-slate-400 block mb-1">
                            Nieuwe 4-cijferige Pincode
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <Lock className="h-4.5 w-4.5" />
                            </span>
                            <input
                              type={showPin ? "text" : "password"}
                              pattern="\d*"
                              maxLength={4}
                              required
                              value={pincode}
                              onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                              placeholder="v.b. 1234"
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 pl-10 pr-4 py-3 rounded-2xl text-slate-800 dark:text-slate-105 placeholder-slate-400 focus:outline-none text-center tracking-widest font-black text-sm"
                              id="login-setup-pincode-input"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-605 dark:text-slate-400 block mb-1">
                            Bevestig Beveiligingspincode
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                              <ShieldCheck className="h-4.5 w-4.5" />
                            </span>
                            <input
                              type={showPin ? "text" : "password"}
                              pattern="\d*"
                              maxLength={4}
                              required
                              value={confirmPincode}
                              onChange={(e) => setConfirmPincode(e.target.value.replace(/\D/g, ''))}
                              placeholder="v.b. 1234"
                              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 pl-10 pr-4 py-3 rounded-2xl text-slate-800 dark:text-slate-105 placeholder-slate-400 focus:outline-none text-center tracking-widest font-black text-sm"
                              id="login-setup-pincode-confirm-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-xs font-bold text-slate-605 dark:text-slate-400 block">
                          Voer uw 4-cijferige pincode in
                        </label>
                        {["admin", "maretraite", "moderator"].includes(loginUsername.toLowerCase()) && (
                          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            Tip: gebruik pincode 1234
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-4.5 w-4.5" />
                        </span>
                        <input
                          type={showPin ? "text" : "password"}
                          pattern="\d*"
                          maxLength={4}
                          required
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                          placeholder="Voer 4 cijfers in"
                          className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-205 dark:border-slate-700 pl-10 pr-4 py-3 rounded-2xl text-slate-800 dark:text-slate-105 placeholder-slate-400 focus:outline-none text-center tracking-widest font-black text-sm"
                          id="login-verify-pincode-input"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-[11px] text-slate-500 hover:text-slate-700 hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>{showPin ? "Verberg pincode" : "Toon pincode"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPincodeStep(false)}
                      className="text-[11px] text-blue-900 hover:text-blue-805 hover:underline font-bold cursor-pointer"
                    >
                      Andere gebruikersnaam?
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-900 hover:bg-blue-805 disabled:bg-blue-300 text-xs font-bold text-white py-3 rounded-2xl transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-md shadow-blue-900/10"
                  id="login-submit-btn"
                >
                  {isSubmitting ? (
                    <span>Verifiëren...</span>
                  ) : !pincodeStep ? (
                    <>
                      <span>Profiel Verifiëren</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : !hasPincode ? (
                    <span>Pincode Instellen & Aanmelden</span>
                  ) : (
                    <span>Aanmelden met Pincode</span>
                  )}
                </button>
              </div>

              {/* Demo accounts selector shortcuts */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Snelkoppeling voor Evaluatie:</span>
                <button
                  type="button"
                  onClick={() => selectShortcutLogin('moderator')}
                  className="w-full text-left bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100/50 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-[11.5px] transition-all cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-amber-802 dark:text-amber-400">🛡️ Gast Moderator</p>
                    <p className="text-[10.5px] text-slate-500 mt-0.5">Direct inloggen als moderator • gebruiker: <span className="underline font-medium">moderator</span></p>
                  </div>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold text-xs">→</span>
                </button>
              </div>

              <div className="pt-3.5 text-center text-xs">
                <span className="text-slate-400">Nieuw in Maretraite?</span>{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-blue-900 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Profiel Aanmaken
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Gebruikersnaam *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="bijv. robert"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                    id="register-username-input"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Volledige Naam *
                  </label>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="bijv. Robert DeVries"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    E-mailadres *
                  </label>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="robert@gmail.com"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    Telefoonnummer
                  </label>
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+597-862-xxxx"
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Huishoudelijke Bio / Locatiedetails
                </label>
                <textarea
                  value={regBio}
                  onChange={(e) => setRegBio(e.target.value)}
                  placeholder="Vertel over uzelf of waar u in Maretraite woont..."
                  rows={2}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-205 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Profielfoto URL (Optioneel)
                </label>
                <input
                  type="url"
                  value={regImg}
                  onChange={(e) => setRegImg(e.target.value)}
                  placeholder="bijv. Unsplash link naar afbeelding"
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl px-2.5 py-2 text-slate-800"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-900 hover:bg-blue-805 text-xs font-bold text-white py-3 rounded-2xl transition-colors cursor-pointer"
                  id="register-submit-btn"
                >
                  {isSubmitting ? 'Bezig met registreren...' : 'Beveiligingsregistratie Aanvragen'}
                </button>
              </div>

              <div className="pt-2 text-center text-xs">
                <span className="text-slate-400">Heeft u al een account?</span>{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-blue-900 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                >
                  Inlogpagina
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Security Alert Badge Footer */}
        <div className="p-4 bg-blue-900/5 dark:bg-slate-900 border text-center rounded-2xl text-[10px] text-slate-400 leading-normal">
          <ShieldCheck className="h-4 w-4 text-blue-900 mx-auto mb-1 opacity-70" />
          <span>Maretraite gemeenschapsdatabases zijn versleuteld volgens hoge standaarden. Neem contact op met het beheer kantoor voor inloggegevens of ledger details.</span>
        </div>

      </div>
    </div>
  );
}
