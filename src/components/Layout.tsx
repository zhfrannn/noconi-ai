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
    <div className="w-full h-[100dvh] max-w-md mx-auto bg-white flex flex-col overflow-hidden relative shadow-[0_0_40px_rgba(0,0,0,0.05)] sm:border-x border-gray-200">
      <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {children}
      </main>

      {/* Log Options Menu Popup */}
      {showLogOptions && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity"
          onClick={() => setShowLogOptions(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom border-t-2 border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="font-bold text-gray-900 text-xl mb-5 ml-1">
              {t.logModal.title}
            </h3>
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
            className="w-full bg-white rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom border-t-2 border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
             <h3 className="font-bold text-gray-900 text-xl mb-5 ml-1">
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

      {/* Bottom Nav */}
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 pb-4 pt-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgb(0,0,0,0.02)]">
        {navItems.map((item) => {
          const isActive =
            item.id === "more"
              ? ["analytics", "goals", "settings", "inhaler", "inhaler_log", "tools", "learn", "shop"].includes(activeTab) || showMore
              : item.id === "log"
                ? showLogOptions || activeTab === "log"
                : activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "more") {
                  setShowMore(!showMore);
                  setShowLogOptions(false);
                } else if (item.id === "log") {
                  setShowLogOptions(!showLogOptions);
                  setShowMore(false);
                } else {
                  setShowMore(false);
                  setShowLogOptions(false);
                  setActiveTab(item.id);
                }
              }}
              className="flex flex-col items-center gap-1.5 relative px-2 py-1 rounded-2xl transition-colors cursor-pointer"
            >
              <div
                className={cn(
                  "icon-solid transition-all duration-300",
                  isActive
                    ? "w-11 h-11 bg-brand-3d opacity-100 text-white"
                    : "w-10 h-10 bg-gray-100 text-gray-400 opacity-60 grayscale hover:grayscale-0 hover:opacity-100",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-white" : "text-gray-500",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold transition-colors duration-300",
                  isActive ? "text-brand" : "text-gray-400",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
