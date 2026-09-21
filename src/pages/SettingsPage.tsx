import { useAppContext } from '../store/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Bluetooth, Bell, User, LogOut, Trash2, Trophy, Flame, Globe } from 'lucide-react';
import { NotificationSettings } from '../lib/db';
import { differenceInDays } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

export function SettingsPage() {
  const { state, updateProfile, clearData } = useAppContext();
  const { user, isGuest, signOut } = useAuth();
  const { t, language } = useLanguage();

  const handleToggle = (key: keyof NotificationSettings) => {
    const current = state.profile?.notificationSettings || {
       peakWarning: true,
       streakCheckpoint: true,
       journalReminder: true,
       aiCheckIn: true,
       journalTime: '20:00',
       quietHoursStart: '22:00',
       quietHoursEnd: '07:00'
    };
    
    updateProfile({
        notificationSettings: {
            ...current,
            [key]: !current[key]
        }
    });
  };

  const prefs = state.profile?.notificationSettings || {
       peakWarning: true,
       streakCheckpoint: true,
       journalReminder: true,
       aiCheckIn: true,
       journalTime: '20:00',
       quietHoursStart: '22:00',
       quietHoursEnd: '07:00'
  };

  const streakDays = state.profile?.lastSmoked
    ? differenceInDays(new Date(), new Date(state.profile.lastSmoked))
    : (state.profile ? differenceInDays(new Date(), new Date(state.profile.quitDate)) : 0);

  const cigsAvoided = Math.round((streakDays * (state.profile?.cigarettesPerDay || 0)));

  return (
    <div className="p-4 space-y-6 pt-12 pb-24 max-w-lg mx-auto">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {t.settings.title}
        </h1>
      </header>

      {/* Account Profile */}
      <section className="card-duo flex items-center gap-4 bg-white shadow-sm border-2 border-gray-100 p-4">
        <div className="w-14 h-14 bg-brand/10 text-brand rounded-full flex items-center justify-center border-2 border-brand/20">
           <User className="w-6 h-6" />
        </div>
        <div className="flex-1">
           <h2 className="font-bold text-gray-900 text-lg">
               {isGuest ? (language === 'id' ? 'Pengguna Tamu' : 'Guest User') : user?.email || 'User'}
           </h2>
           <p className="text-sm font-medium text-gray-500">
               {isGuest ? (language === 'id' ? 'Data tersimpan di perangkat' : 'Local data only') : (language === 'id' ? 'Tersinkronisasi aman' : 'Synced securely')}
           </p>
        </div>
        {isGuest ? (
           <button onClick={() => { localStorage.removeItem('isGuest'); window.location.reload(); }} className="btn-primary py-2 px-4 shadow-[0_2px_0_var(--color-brand-dark)] text-xs">
              {language === 'id' ? 'Masuk / Sync' : 'Log In / Sync'}
           </button>
        ) : (
           <button onClick={() => signOut()} className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors active:scale-95" title={t.settings.signOut}>
              <LogOut className="w-5 h-5 ml-0.5" />
           </button>
        )}
      </section>

      {/* Language Selection Card */}
      <section className="card-duo p-4 bg-white shadow-sm border-2 border-gray-100 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center border-2 border-emerald-200">
             <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">{t.settings.languageSection}</h3>
            <p className="text-xs text-gray-500 font-medium">{t.settings.languageDesc}</p>
          </div>
        </div>
        <div className="pt-1">
          <LanguageToggle variant="card" />
        </div>
      </section>

      {/* Stats Summary */}
      <section className="grid grid-cols-2 gap-4">
         <div className="card-duo p-4 bg-orange-50 border-orange-200 shadow-[0_2px_0_var(--color-orange-200)] flex flex-col items-center justify-center text-center">
            <Flame className="w-6 h-6 text-orange-500 mb-2" />
            <h3 className="font-bold text-gray-900 text-2xl">{Math.max(0, streakDays)}<span className="text-sm text-gray-500 font-medium ml-1">{language === 'id' ? 'hari' : 'days'}</span></h3>
            <p className="text-xs font-bold text-orange-600 tracking-wider mt-1">{language === 'id' ? 'HARI BEBAS ROKOK' : 'STREAK'}</p>
         </div>
         <div className="card-duo p-4 bg-blue-50 border-blue-200 shadow-[0_2px_0_var(--color-blue-200)] flex flex-col items-center justify-center text-center">
            <Trophy className="w-6 h-6 text-blue-500 mb-2" />
            <h3 className="font-bold text-gray-900 text-2xl">{Math.max(0, cigsAvoided)}</h3>
            <p className="text-xs font-bold text-blue-600 tracking-wider mt-1">{language === 'id' ? 'BATANG DITIADAKAN' : 'CIGS AVOIDED'}</p>
         </div>
      </section>

      {/* Preferences */}
      <section className="card-duo overflow-hidden p-0 mb-6 bg-white shadow-sm border-2 border-gray-100">
        <div className="p-4 border-b-2 border-gray-100 flex items-center gap-3 bg-transparent">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center border-2 border-blue-200">
             <Bell className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="font-bold text-gray-900">{t.settings.notificationsSection}</h3>
        </div>
        
        <div className="p-4 flex items-center justify-between border-b-2 border-gray-100 cursor-pointer hover:bg-transparent active:bg-gray-100 transition-colors" onClick={() => handleToggle('peakWarning')}>
           <div>
             <h4 className="font-bold text-sm text-gray-900">{t.settings.peakWarning}</h4>
             <p className="text-xs text-gray-500 font-medium max-w-[220px] mt-0.5">{t.settings.peakWarningDesc}</p>
           </div>
           <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-all duration-300 border-2 ${prefs.peakWarning ? 'bg-brand border-brand-dark' : 'bg-gray-100 border-gray-200'}`}>
               <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${prefs.peakWarning ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
           </div>
        </div>

        <div className="p-4 flex items-center justify-between border-b-2 border-gray-100 cursor-pointer hover:bg-transparent active:bg-gray-100 transition-colors" onClick={() => handleToggle('streakCheckpoint')}>
           <div>
             <h4 className="font-bold text-sm text-gray-900">{t.settings.streakCheckpoint}</h4>
             <p className="text-xs text-gray-500 font-medium max-w-[220px] mt-0.5">{t.settings.streakCheckpointDesc}</p>
           </div>
           <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-all duration-300 border-2 ${prefs.streakCheckpoint ? 'bg-brand border-brand-dark' : 'bg-gray-100 border-gray-200'}`}>
               <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${prefs.streakCheckpoint ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
           </div>
        </div>
        
        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-transparent active:bg-gray-100 transition-colors" onClick={() => handleToggle('aiCheckIn')}>
           <div>
             <h4 className="font-bold text-sm text-gray-900">{t.settings.aiCheckIn}</h4>
             <p className="text-xs text-gray-500 font-medium max-w-[220px] mt-0.5">{t.settings.aiCheckInDesc}</p>
           </div>
           <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-all duration-300 border-2 ${prefs.aiCheckIn ? 'bg-brand border-brand-dark' : 'bg-gray-100 border-gray-200'}`}>
               <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform duration-300 ${prefs.aiCheckIn ? 'translate-x-[22px]' : 'translate-x-0'}`}></div>
           </div>
        </div>
      </section>

      {/* Device Status */}
      <section className="card-duo p-4 bg-white shadow-sm border-2 border-gray-100">
         <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center border-2 border-indigo-200">
               <Bluetooth className="w-4 h-4 text-indigo-600"/>
            </div>
            {t.settings.inhalerSection}
         </h3>
         <div className="flex items-center justify-between">
           <div>
             <span className="block font-bold text-sm text-gray-900">{t.settings.inhalerName}</span>
             <span className="text-[10px] text-brand font-bold uppercase tracking-wider">{t.settings.inhalerStatus}</span>
           </div>
           <button className="text-[11px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border-2 border-gray-100 tracking-wider px-4 py-2 rounded-xl transition-colors active:scale-95">
             {t.settings.disconnect}
           </button>
         </div>
      </section>

      {/* Danger Zone */}
      <section className="pt-4">
        <button 
          onClick={() => {
            if (window.confirm(t.settings.clearConfirm)) {
               clearData().then(() => window.location.reload());
            }
          }}
          className="w-full btn-outline border-2 border-red-200 hover:border-red-500 hover:bg-red-50 text-red-500 py-3.5 transition-colors shadow-none font-bold cursor-pointer"
        >
          <Trash2 className="w-4 h-4" /> {t.settings.clearData}
        </button>
      </section>
    </div>
  );
}
