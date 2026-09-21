import React from "react";
import {
  Home,
  PlusCircle,
  BarChart2,
  MessageCircle,
  BookOpen,
  Settings,
  Target,
  Map as MapIcon,
  ShoppingCart,
  Zap
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAppContext } from "../store/AppContext";
import { useLanguage } from "../contexts/LanguageContext";
import mascotImg from "../assets/mascot/noconi-mascot.png";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { addInhalerLog } = useAppContext();
  const { t, language } = useLanguage();

  const navItems = [
    { id: "home", icon: Home, label: t.nav.home },
    { id: "method", icon: MapIcon, label: t.nav.myPlan },
    { id: "log", icon: PlusCircle, label: t.nav.log },
    { id: "chat", icon: MessageCircle, label: t.nav.coach },
    { id: "more", icon: BarChart2, label: t.nav.more },
  ];

  const subItems = [
    { id: "inhaler", icon: BookOpen, label: t.nav.inhaler },
    { id: "shop", icon: ShoppingCart, label: t.nav.shop },
    { id: "learn", icon: BookOpen, label: t.nav.learn },
    { id: "analytics", icon: BarChart2, label: t.nav.analytics },
    { id: "goals", icon: Target, label: t.nav.goals },
    { id: "tools", icon: BookOpen, label: t.nav.tools },
    { id: "settings", icon: Settings, label: t.nav.settings },
  ];

  const [showMore, setShowMore] = React.useState(false);
  const [showLogOptions, setShowLogOptions] = React.useState(false);

  return (
    <div className="wellness-shell w-full h-[100dvh] max-w-md mx-auto flex flex-col overflow-hidden relative shadow-[0_0_40px_rgba(74,63,53,0.08)] sm:border-x sm:border-[#EADDC8]">
      <main className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {children}
      </main>

      {/* Log Options Menu Popup */}
      {showLogOptions && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity"
          onClick={() => setShowLogOptions(false)}
        >
          <div
            className="w-full rounded-t-[1.75rem] p-6 pb-12 animate-in slide-in-from-bottom max-w-md mx-auto"
            style={{ background: 'linear-gradient(180deg,#FFFDF7,#FFF6E3)', border: '1px solid rgba(255,255,255,0.9)', outline: '1px solid rgba(74,63,53,0.08)', boxShadow: '0 -12px 40px rgba(74,63,53,0.16)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ background: '#EADDC8' }}></div>
            <h3 className="font-bold text-xl mb-1 ml-1" style={{ color: '#4A3F35' }}>
              {t.logModal.title}
            </h3>
            <p className="text-[13px] font-semibold ml-1 mb-4" style={{ color: '#8A7A6B' }}>
              {language === 'id' ? 'mau mencatat apa hari ini?' : 'what shall we note today?'}
            </p>
            <div className="flex flex-col gap-4">
            <button
              className="card-duo flex items-center gap-4 p-5 text-left border-brand bg-brand-surface shadow-[0_4px_0_var(--color-brand-dark)] hover:bg-brand-surface/80 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              onClick={() => {
                setShowLogOptions(false);
                setActiveTab("log");
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-brand font-bold flex items-center justify-center shrink-0 border-2 border-brand-dark shadow-[0_2px_0_var(--color-brand-dark)]">
                <PlusCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-brand-dark leading-tight mb-1">
                  {t.logModal.logCraving}
                </h4>
                <p className="text-sm text-brand/80 font-bold tracking-wide">
                  {t.logModal.logCravingDesc}
                </p>
              </div>
            </button>

            <button
              className="card-duo flex items-center gap-4 p-5 text-left border-blue-200 bg-blue-50 shadow-[0_4px_0_var(--color-blue-200)] hover:bg-blue-100 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              onClick={() => {
                setShowLogOptions(false);
                setActiveTab("inhaler_log");
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500 font-bold flex items-center justify-center shrink-0 border-2 border-blue-600 shadow-[0_2px_0_var(--color-blue-600)]">
                <MapIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-blue-900 leading-tight mb-1">
                  {t.logModal.logInhaler}
                </h4>
                <p className="text-sm text-blue-500 font-bold tracking-wide">
                  {t.logModal.logInhalerDesc}
                </p>
              </div>
            </button>

            <button
              className="card-duo flex items-center gap-3 p-3 text-left border-amber-200 bg-amber-50 shadow-[0_4px_0_var(--color-amber-200)] hover:bg-amber-100 active:translate-y-1 active:shadow-none transition-all cursor-pointer"
              onClick={async () => {
                try {
                  await addInhalerLog({
                    timestamp: new Date().toISOString(),
                    variantUsed: 'automatic-bypass',
                    context: ['quick-auto-log'],
                    intensityBefore: 5,
                    intensityAfter: 0,
                    isInhalerAvailable: true,
                    fallbackMethod: null,
                    notes: 'Auto-logged via quick action'
                  });
                  setShowLogOptions(false);
                } catch (err) {
                  console.error('Failed to log inhaler via quick action:', err);
                }
              }}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500 font-bold flex items-center justify-center shrink-0 border-2 border-amber-600 shadow-[0_2px_0_var(--color-amber-600)]">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-md text-amber-900 leading-tight">
                  {language === 'id' ? 'Catat Cepat Inhaler' : 'Quick Auto-Log Inhaler'}
                </h4>
                <p className="text-[10px] text-amber-600 font-bold tracking-wide">
                  {language === 'id' ? '1-Klik rekam instan' : '1-Click instant log'}
                </p>
              </div>
            </button>
            </div>
          </div>
        </div>
      )}

      {/* More Menu Popup */}
      {showMore && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity"
          onClick={() => setShowMore(false)}
        >
          <div
            className="w-full rounded-t-[1.75rem] p-6 pb-12 animate-in slide-in-from-bottom max-w-md mx-auto"
            style={{ background: 'linear-gradient(180deg,#FFFDF7,#FFF6E3)', border: '1px solid rgba(255,255,255,0.9)', outline: '1px solid rgba(74,63,53,0.08)', boxShadow: '0 -12px 40px rgba(74,63,53,0.16)' }}
            onClick={(e) => e.stopPropagation()}
          >
              <div className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ background: '#EADDC8' }}></div>
              <h3 className="font-bold text-xl mb-5 ml-1" style={{ color: '#4A3F35' }}>
                {language === 'id' ? 'Fitur Lainnya' : 'More Features'}
              </h3>
             <div className="grid grid-cols-2 gap-4">
              {subItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMore(false);
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border-2 transition-all font-bold text-center cursor-pointer",
                    activeTab === item.id
                      ? "bg-brand-surface border-brand shadow-[0_4px_0_var(--color-brand-dark)] text-brand-dark"
                      : "bg-white border-gray-200 text-gray-700 shadow-[0_4px_0_#e5e7eb] hover:bg-gray-50 active:translate-y-1 active:shadow-none",
                  )}
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2",
                      activeTab === item.id ? "bg-brand border-brand-dark shadow-[0_2px_0_var(--color-brand-dark)]" : "bg-gray-100 border-gray-300 shadow-[0_2px_0_#d1d5db]"
                  )}>
                    <item.icon
                      className={cn("w-7 h-7", activeTab === item.id ? "text-white" : "text-gray-600")}
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-sm leading-tight text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dikta Floating Bottom Nav — Frosted glass dock with elevated center mascot button */}
      <div className="absolute bottom-4 left-3.5 right-3.5 z-50 pointer-events-none">
        <nav
          className="pointer-events-auto flex justify-between items-center px-2 py-1.5 rounded-[2.2rem] relative"
          style={{
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1.5px solid rgba(255, 255, 255, 0.98)',
            boxShadow: '0 16px 40px -4px rgba(24, 76, 50, 0.12), 0 4px 12px rgba(24, 76, 50, 0.04), inset 0 1px 0 #fff',
          }}
        >
          {/* Tab 1: Home */}
          <button
            onClick={() => {
              setShowMore(false);
              setShowLogOptions(false);
              setActiveTab("home");
            }}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 cursor-pointer active:scale-95 transition-all"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "home" ? "text-[#2AA97E] bg-[#EAF7EF]" : "text-[#7B9B8C]"
              )}
            >
              <Home className="w-5 h-5" strokeWidth={activeTab === "home" ? 2.6 : 2} />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold tracking-tight",
                activeTab === "home" ? "text-[#2AA97E]" : "text-[#7B9B8C]"
              )}
            >
              {t.nav.home}
            </span>
          </button>

          {/* Tab 2: Records / Plan */}
          <button
            onClick={() => {
              setShowMore(false);
              setShowLogOptions(false);
              setActiveTab("method");
            }}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 cursor-pointer active:scale-95 transition-all"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center transition-all",
                activeTab === "method" ? "text-[#2AA97E] bg-[#EAF7EF]" : "text-[#7B9B8C]"
              )}
            >
              <BookOpen className="w-5 h-5" strokeWidth={activeTab === "method" ? 2.6 : 2} />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold tracking-tight",
                activeTab === "method" ? "text-[#2AA97E]" : "text-[#7B9B8C]"
              )}
            >
              {language === "id" ? "Catatan" : "Records"}
            </span>
          </button>

          {/* Tab 3: ELEVATED CENTER MASCOT BUTTON (Dikta center mascot) */}
          <div className="flex flex-col items-center justify-center -mt-7 relative px-1">
            <button
              onClick={() => {
                setShowMore(false);
                setShowLogOptions(false);
                setActiveTab("chat");
              }}
              className="w-[58px] h-[58px] rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform relative group pointer-events-auto"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #FFF8E6 55%, #FFE9B3 100%)",
                border: "3px solid #FFFFFF",
                boxShadow: "0 10px 24px rgba(255, 180, 40, 0.4), 0 4px 10px rgba(42, 169, 126, 0.15), inset 0 2px 4px #FFFFFF",
              }}
              aria-label="Chat with Noconi Coach"
            >
              {/* Outer soft glowing aura */}
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#FFBE26]/20 to-[#46CA98]/20 blur-sm pointer-events-none" />

              {/* Noconi Mascot inside circular pod */}
              <div className="w-11 h-11 relative flex items-center justify-center">
                <img
                  src={mascotImg}
                  alt="Noconi Mascot"
                  className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(28,95,65,0.25)] group-hover:scale-105 transition-transform"
                />
              </div>
            </button>
            <span
              className={cn(
                "text-[10px] font-bold tracking-tight mt-0.5",
                activeTab === "chat" ? "text-[#2AA97E]" : "text-[#587D6B]"
              )}
            >
              {language === "id" ? "Chat" : "Chat"}
            </span>
          </div>

          {/* Tab 4: Schedule / Log */}
          <button
            onClick={() => {
              setShowLogOptions(!showLogOptions);
              setShowMore(false);
            }}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 cursor-pointer active:scale-95 transition-all"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center transition-all",
                showLogOptions || activeTab === "log" ? "text-[#2AA97E] bg-[#EAF7EF]" : "text-[#7B9B8C]"
              )}
            >
              <PlusCircle className="w-5 h-5" strokeWidth={showLogOptions || activeTab === "log" ? 2.6 : 2} />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold tracking-tight",
                showLogOptions || activeTab === "log" ? "text-[#2AA97E]" : "text-[#7B9B8C]"
              )}
            >
              {language === "id" ? "Catat" : "Schedule"}
            </span>
          </button>

          {/* Tab 5: Profile / More */}
          <button
            onClick={() => {
              setShowMore(!showMore);
              setShowLogOptions(false);
            }}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 cursor-pointer active:scale-95 transition-all"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center transition-all",
                showMore || ["analytics", "goals", "settings", "inhaler", "tools", "learn", "shop"].includes(activeTab)
                  ? "text-[#2AA97E] bg-[#EAF7EF]"
                  : "text-[#7B9B8C]"
              )}
            >
              <Settings className="w-5 h-5" strokeWidth={showMore ? 2.6 : 2} />
            </div>
            <span
              className={cn(
                "text-[10px] font-bold tracking-tight",
                showMore || ["analytics", "goals", "settings", "inhaler", "tools", "learn", "shop"].includes(activeTab)
                  ? "text-[#2AA97E]"
                  : "text-[#7B9B8C]"
              )}
            >
              {language === "id" ? "Profil" : "Profile"}
            </span>
          </button>
        </nav>
      </div>
    </div>
  );
}
