import React from "react";
import {
  ChevronRight,
  Flame,
  MessageCircle,
  Bell,
  Search,
  Activity,
  Wind,
  Compass,
  Calendar,
  Sparkles,
  Trophy,
  Check,
  Plus,
  Clock,
  FileText,
  Shield,
  Smile,
  Leaf,
  PiggyBank,
  CheckCircle2,
} from "lucide-react";
import { cn } from "../lib/utils";
import mascotImg from "../assets/mascot/noconi-mascot.png";

/* ————————————————— Design tokens ————————————————— */
export const wellnessTokens = {
  colors: {
    cream: "#FFF8EC",
    creamCard: "#FFFDF7",
    leaf: "#2AA97E",
    leafDeep: "#1C7D5B",
    leafSoft: "#DCF2E5",
    sun: "#FFC531",
    sunSoft: "#FFF1C4",
    sky: "#7CC8F5",
    skySoft: "#E3F3FD",
    peach: "#FF9E6B",
    cocoa: "#4A3F35",
    cocoaSoft: "#8A7A6B",
  },
  radius: { card: "1.75rem", pill: "999px", tile: "1.25rem" },
  shadow: "0 12px 32px rgba(28,95,65,0.07), 0 2px 8px rgba(28,95,65,0.04)",
};

/* ————————————————— Companion Avatar ————————————————— */
export type CompanionMood = "happy" | "calm" | "proud" | "supportive";

const moodAnimation: Record<CompanionMood, string> = {
  happy: "animate-float-soft",
  calm: "animate-breathe",
  proud: "animate-float-soft",
  supportive: "animate-breathe",
};

export function CompanionAvatar({
  mood = "happy",
  size = 56,
  className,
  grounded = false,
}: {
  mood?: CompanionMood;
  size?: number;
  className?: string;
  grounded?: boolean;
}) {
  return (
    <div
      className={cn("relative shrink-0", moodAnimation[mood], className)}
      style={{ width: size, height: grounded ? size * 1.25 : size }}
      aria-hidden
    >
      {grounded && (
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-[50%]"
          style={{
            bottom: 0,
            width: size * 0.96,
            height: size * 0.28,
            background: "radial-gradient(ellipse at 50% 35%, #85E8B1 0%, #46CA98 55%, rgba(46,180,130,0) 80%)",
            boxShadow: "0 6px 14px rgba(28,125,91,0.2)",
          }}
        >
          {/* tiny flowers on the platform */}
          <span className="absolute rounded-full" style={{ left: "14%", top: "28%", width: 4, height: 4, background: "#FFD233" }} />
          <span className="absolute rounded-full" style={{ right: "16%", top: "38%", width: 3.5, height: 3.5, background: "#FF8C52" }} />
        </div>
      )}
      <div
        className="absolute -inset-1 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(42,169,126,0.18) 0%, rgba(255,197,49,0.08) 60%, transparent 75%)",
        }}
      />
      <img
        src={mascotImg}
        alt="Noconi Mascot"
        draggable={false}
        className={cn(
          "absolute left-1/2 -translate-x-1/2 w-full object-contain drop-shadow-[0_8px_16px_rgba(30,70,50,0.18)] transition-transform duration-300",
          grounded ? "bottom-[10%]" : "inset-0"
        )}
        style={grounded ? { height: size } : undefined}
      />
    </div>
  );
}

/* ————————————————— GlassCard (Compatibility) ————————————————— */
export function GlassCard({
  children,
  className,
  tone = "cream",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "cream" | "leaf" | "sun" | "sky" | "peach";
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn("dikta-card p-5 relative overflow-hidden transition-all duration-200", onClick && "cursor-pointer active:scale-[0.99]", className)}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ————————————————— 1. Dikta Top Header ————————————————— */
export function DiktaHeader({
  title = "Noconi",
  subtitle = "Inhaler Nilam Bebas Nikotin",
  badgeText,
  unreadNotifications = true,
  onNotificationClick,
  onProfileClick,
}: {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  unreadNotifications?: boolean;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 pt-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <h1 className="text-[28px] font-bold tracking-tight text-[#1D583E] leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {title}
          </h1>
          {/* Glowing leaf/sun dot above 'i' */}
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBE26] shadow-[0_0_8px_rgba(255,190,38,0.8)] shrink-0 self-start mt-0.5" />
          {badgeText && (
            <span className="ml-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E7F7EE] text-[#1C7D5B] border border-[#2AA97E]/30 uppercase tracking-wide">
              {badgeText}
            </span>
          )}
        </div>
        <p className="text-[12.5px] font-medium text-[#487C63] mt-1 truncate tracking-tight">
          {subtitle}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Notification Bell Button */}
        <button
          onClick={onNotificationClick}
          className="w-10 h-10 rounded-2xl bg-white/95 border border-white shadow-[0_4px_14px_rgba(30,70,50,0.06)] flex items-center justify-center relative cursor-pointer active:scale-95 transition-all text-[#3D765A] hover:bg-white"
          aria-label="Notifications"
        >
          <Bell className="w-4.5 h-4.5 stroke-[2.2]" />
          {unreadNotifications && (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF6243] ring-2 ring-white" />
          )}
        </button>

        {/* Profile Avatar Button */}
        <button
          onClick={onProfileClick}
          className="w-10 h-10 rounded-full border-2 border-white shadow-[0_4px_14px_rgba(30,70,50,0.08)] overflow-hidden cursor-pointer active:scale-95 transition-all relative group bg-gradient-to-br from-emerald-100 to-teal-50"
          aria-label="Profile"
        >
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
            alt="User avatar"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        </button>
      </div>
    </header>
  );
}

/* ————————————————— 2. Dikta Search / Quick Ask Pill ————————————————— */
export function DiktaSearchBar({
  placeholder = "Tanya Noconi AI Coach...",
  onClick,
}: {
  placeholder?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="w-full bg-white/95 backdrop-blur-md border border-white/95 shadow-[0_6px_20px_rgba(30,70,50,0.05)] rounded-full px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-white active:scale-[0.99] transition-all"
    >
      <div className="w-7 h-7 rounded-full bg-[#EAF7EF] text-[#2AA97E] flex items-center justify-center shrink-0 border border-[#CEEEDC]">
        <MessageCircle className="w-4 h-4 stroke-[2.4]" />
      </div>
      <span className="text-[13.5px] font-medium text-[#658777] tracking-tight truncate">
        {placeholder}
      </span>
    </div>
  );
}

/* ————————————————— 3. Dikta Main Hero Card ("Pemulihan Paru & Bebas Rokok") ————————————————— */
export function DiktaHeroCard({
  cardTitle = "Kondisi Paru & Pemulihan",
  scoreLabel = "Skor Pemulihan",
  score = 76,
  maxScore = 100,
  streakLabel = "116 hari bebas rokok",
  secondPillLabel = "Hemat Rp 4.640.000",
  secondPillEmoji = "💰",
  streakDays = 6,
  pointsGained = 10,
  headline = "Paru-paru semakin pulih!",
  subHeadline = "Pertahankan ritual inhaler nilam — kamu memegang kendali penuh!",
  level = 8,
  levelTitle = "Level 8 Guardian",
  currentXP = 5860,
  nextLevelXP = 6400,
  onLevelClick,
  onCardClick,
}: {
  cardTitle?: string;
  scoreLabel?: string;
  score?: number;
  maxScore?: number;
  streakLabel?: string;
  secondPillLabel?: string;
  secondPillEmoji?: string;
  streakDays?: number;
  pointsGained?: number;
  headline?: string;
  subHeadline?: string;
  level?: number | string;
  levelTitle?: string;
  currentXP?: number;
  nextLevelXP?: number;
  onLevelClick?: () => void;
  onCardClick?: () => void;
}) {
  // SVG Circular progress gauge calculations
  const radius = 46;
  const strokeWidth = 9;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, (score / maxScore) * 100));
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const xpPct = Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));

  return (
    <div
      className="dikta-card p-5 relative overflow-hidden cursor-default transition-all shadow-[0_16px_36px_-6px_rgba(24,76,50,0.09)]"
      style={{
        background: "linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.92) 100%)",
      }}
    >
      {/* Soft environmental ambient lights */}
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#7CC8F5]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full bg-[#46CA98]/12 blur-3xl pointer-events-none" />

      {/* Card Header: Leaf Icon + Card Title */}
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-6 h-6 rounded-full bg-[#EAF7EF] flex items-center justify-center text-[#2AA97E] shrink-0 border border-[#D5EFE0]">
          <Leaf className="w-3.5 h-3.5 fill-[#2AA97E]/30 stroke-[2.4]" />
        </div>
        <span className="text-[13.5px] font-bold text-[#2A5E44] tracking-tight">
          {cardTitle}
        </span>
      </div>

      {/* Two-Column Middle Section */}
      <div className="grid grid-cols-12 gap-3 items-center">
        {/* Left Column: Donut Meter & Badges */}
        <div className="col-span-5 flex flex-col items-center sm:items-start">
          {/* Circular Donut Meter */}
          <div className="relative w-[116px] h-[116px] flex items-center justify-center shrink-0">
            {/* SVG Ring */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 116 116">
              <circle
                cx="58"
                cy="58"
                r={radius}
                fill="transparent"
                stroke="#EAF4EE"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              <circle
                cx="58"
                cy="58"
                r={radius}
                fill="transparent"
                stroke="url(#diktaHeroGrad)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
              />
              <defs>
                <linearGradient id="diktaHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2AA97E" />
                  <stop offset="60%" stopColor="#46CA98" />
                  <stop offset="100%" stopColor="#89E4B2" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-[#567D6A] leading-tight">
                {scoreLabel}
              </span>
              <div className="text-[28px] font-black text-[#1B4E38] leading-tight tracking-tight mt-0.5">
                {score}
              </div>
              <span className="text-[10px] font-medium text-[#7C9E8E]">
                /{maxScore}
              </span>
            </div>
          </div>

          {/* Under gauge: Streak pill & Points/Money pill */}
          <div className="flex flex-col gap-1.5 w-full mt-3">
            <div className="dikta-pill px-2.5 py-1 flex items-center gap-1.5 text-[10.5px] font-bold text-[#2A5E44] shadow-xs">
              <span className="text-sm leading-none">🔥</span>
              <span className="truncate">{streakLabel || `Streak ${streakDays} hari`}</span>
            </div>
            <div className="dikta-pill px-2.5 py-1 flex items-center gap-1.5 text-[10.5px] font-bold text-[#2A5E44] shadow-xs">
              <span className="text-sm leading-none">{secondPillEmoji}</span>
              <span className="truncate">{secondPillLabel || `+${pointsGained} XP`}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Motivational Message & Mascot on Grass Mound */}
        <div className="col-span-7 flex flex-col justify-between pl-1 relative" style={{ minHeight: 160 }}>
          {/* Motivational Copy — stays above the mascot */}
          <div className="relative z-10 pr-1">
            <h2 className="text-[17px] font-bold text-[#1E4D38] leading-tight tracking-tight">
              {headline}
            </h2>
            <p className="text-[12px] font-medium text-[#5B8270] leading-snug mt-1.5">
              {subHeadline}
            </p>
          </div>

          {/* Mascot on grass mound — centered under text */}
          <div className="relative flex flex-col items-center self-center mt-2" style={{ height: 88 }}>
            {/* Grassy platform */}
            <div
              className="absolute bottom-0 w-32 h-8 rounded-[50%]"
              style={{
                background: "radial-gradient(ellipse at 50% 30%, #76E0A8 0%, #3DBF8D 60%, rgba(46,160,115,0) 85%)",
                boxShadow: "0 6px 16px rgba(28,125,91,0.22)",
              }}
            >
              {/* tiny flowers on lawn */}
              <span className="absolute rounded-full" style={{ left: "20%", top: "35%", width: 5, height: 5, background: "#FFD438" }} />
              <span className="absolute rounded-full" style={{ right: "22%", top: "42%", width: 4, height: 4, background: "#FF915C" }} />
              <span className="absolute rounded-full" style={{ left: "50%", top: "50%", width: 3.5, height: 3.5, background: "#FFFFFF" }} />
            </div>

            {/* Mascot standing proudly, sized to fit above the mound */}
            <div className="absolute bottom-5 w-20 h-20">
              <img
                src={mascotImg}
                alt="Noconi Lungs Mascot"
                className="w-full h-full object-contain drop-shadow-[0_8px_14px_rgba(24,76,50,0.22)] animate-breathe"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Health / Quitter Level Strip inside the card */}
      <div
        onClick={onLevelClick}
        className="mt-4 bg-[#F2FAF5] hover:bg-[#E9F6EE] border border-[#DCF1E4] rounded-2xl p-2.5 px-3 flex items-center gap-3 cursor-pointer transition-colors"
      >
        <div className="w-7 h-7 rounded-xl bg-[#28A176] text-white flex items-center justify-center shrink-0 shadow-xs">
          <Shield className="w-4 h-4 fill-white/20 stroke-[2.4]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[12px] font-bold text-[#1E4D38] truncate">
              {levelTitle}
            </span>
            <span className="text-[11px] font-bold text-[#628A77] shrink-0">
              {currentXP}/{nextLevelXP} XP
            </span>
          </div>

          {/* Green XP Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#DCEEE3] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${xpPct}%`,
                background: "linear-gradient(90deg, #2AA97E 0%, #54CE9E 100%)",
              }}
            />
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-[#759D8A] shrink-0" />
      </div>
    </div>
  );
}

/* ————————————————— 4. Dikta Quick Action 3-Card Row ————————————————— */
export function DiktaQuickActions({
  items: customItems,
  onChatClick,
  onInhalerClick,
  onPlanClick,
}: {
  items?: {
    id: string;
    title: string;
    subtitle: string;
    iconBg: string;
    iconColor: string;
    arrowBg: string;
    icon: any;
    onClick?: () => void;
  }[];
  onChatClick?: () => void;
  onInhalerClick?: () => void;
  onPlanClick?: () => void;
}) {
  const defaultItems = [
    {
      id: "inhaler",
      title: "Inhaler Nilam",
      subtitle: "Ganti ritual rokok",
      iconBg: "bg-[#E6F8EE]",
      iconColor: "text-[#2AA97E]",
      arrowBg: "bg-[#D8F4E4] text-[#2AA97E]",
      icon: Wind,
      onClick: onInhalerClick,
    },
    {
      id: "craving",
      title: "Catat Craving",
      subtitle: "Rekam pemicu CBT",
      iconBg: "bg-[#FFF4E6]",
      iconColor: "text-[#FF8D3B]",
      arrowBg: "bg-[#FFE8D0] text-[#FF8D3B]",
      icon: Activity,
      onClick: onChatClick,
    },
    {
      id: "plan",
      title: "Metode Anda",
      subtitle: "Latihan & habit",
      iconBg: "bg-[#EBF5FE]",
      iconColor: "text-[#3CA4E5]",
      arrowBg: "bg-[#D9EDFD] text-[#3CA4E5]",
      icon: Compass,
      onClick: onPlanClick,
    },
  ];

  const items = customItems || defaultItems;

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className="dikta-card p-3 flex flex-col justify-between text-left cursor-pointer active:scale-[0.97] transition-all hover:bg-white relative group"
        >
          {/* Top row: Squircle icon + Arrow circle */}
          <div className="flex items-center justify-between gap-1 mb-2.5">
            <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center shadow-xs border border-white", item.iconBg, item.iconColor)}>
              <item.icon className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>

            <div className={cn("w-5.5 h-5.5 rounded-full flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform", item.arrowBg)}>
              <ChevronRight className="w-3 h-3 stroke-[2.8]" />
            </div>
          </div>

          {/* Titles */}
          <div>
            <h4 className="text-[13px] font-bold text-[#1F4E38] leading-tight truncate">
              {item.title}
            </h4>
            <p className="text-[10px] font-medium text-[#739785] leading-tight mt-0.5 truncate">
              {item.subtitle}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}

/* ————————————————— 5. Dikta Daily Trackers (3 Columns) ————————————————— */
export function DiktaDailyTrackers({
  title = "Pelacak Harian Anti-Rokok",
  card1Title = "Inhaler Nilam",
  card1Sub = "Target 8 puffs",
  card1Value = "5/8",
  card1Unit = "puffs",
  card1Progress = 62,
  onAddCard1,
  card2Title = "Craving Ditolak",
  card2Sub = "Dorongan rokok",
  card2Value = "2/2",
  card2Unit = "berhasil",
  card2Progress = 100,
  card2Badge = "🕒 20:00",
  card3Title = "Uang Dihemat",
  card3Sub = "Bebas rokok",
  card3Value = "4.64jt",
  card3Unit = "Rp",
  card3Progress = 85,
  card3Badge = "85%",
  onAddCard3,
}: {
  title?: string;
  card1Title?: string;
  card1Sub?: string;
  card1Value?: string;
  card1Unit?: string;
  card1Progress?: number;
  onAddCard1?: () => void;
  card2Title?: string;
  card2Sub?: string;
  card2Value?: string;
  card2Unit?: string;
  card2Progress?: number;
  card2Badge?: string;
  card3Title?: string;
  card3Sub?: string;
  card3Value?: string;
  card3Unit?: string;
  card3Progress?: number;
  card3Badge?: string;
  onAddCard3?: () => void;
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-[15px] font-bold text-[#1E4D38] tracking-tight px-1">
        {title}
      </h3>

      <div className="grid grid-cols-3 gap-2.5">
        {/* Card 1: Inhaler Nilam */}
        <div className="dikta-card p-3 flex flex-col justify-between text-left">
          <div>
            <div className="w-8 h-8 rounded-2xl bg-[#EAF5FE] text-[#3CA4E5] flex items-center justify-center mb-1.5 border border-[#D5EBFD]">
              <Wind className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <p className="text-[12px] font-bold text-[#1E4D38] leading-tight truncate">{card1Title}</p>
            <p className="text-[9.5px] font-medium text-[#739785] leading-tight truncate">{card1Sub}</p>

            <div className="flex items-baseline gap-0.5 mt-1.5">
              <span className="text-[16px] font-extrabold text-[#1B4E38]">{card1Value}</span>
              <span className="text-[9.5px] font-semibold text-[#739785]">{card1Unit}</span>
            </div>

            {/* Blue progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[#E3EFF9] overflow-hidden mt-1.5">
              <div className="h-full rounded-full bg-[#2098E0]" style={{ width: `${card1Progress}%` }} />
            </div>
          </div>

          {/* Bottom dots & plus button */}
          <div className="flex items-center justify-between gap-1 mt-2.5 pt-1">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    i < 3 ? "bg-[#2098E0]" : "bg-[#D4E6F4]"
                  )}
                />
              ))}
            </div>
            <button
              onClick={onAddCard1}
              className="w-5.5 h-5.5 rounded-full bg-[#EAF5FE] text-[#2098E0] flex items-center justify-center font-bold text-xs border border-[#CCE5F9] cursor-pointer active:scale-90 transition-transform"
              title="Catat 1 puff inhaler"
            >
              <Plus className="w-3 h-3 stroke-[2.8]" />
            </button>
          </div>
        </div>

        {/* Card 2: Craving Ditolak */}
        <div className="dikta-card p-3 flex flex-col justify-between text-left relative">
          {/* Checkmark badge */}
          <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full bg-[#E2F5FD] text-[#2098E0] flex items-center justify-center border border-[#CAEBFA]">
            <Check className="w-2.5 h-2.5 stroke-[3]" />
          </div>

          <div>
            <div className="w-8 h-8 rounded-2xl bg-[#EAF5FE] text-[#3CA4E5] flex items-center justify-center mb-1.5 border border-[#D5EBFD]">
              <Activity className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <p className="text-[12px] font-bold text-[#1E4D38] leading-tight truncate">{card2Title}</p>
            <p className="text-[9.5px] font-medium text-[#739785] leading-tight truncate">{card2Sub}</p>

            <div className="flex items-baseline gap-0.5 mt-1.5">
              <span className="text-[16px] font-extrabold text-[#1B4E38]">{card2Value}</span>
              <span className="text-[9.5px] font-semibold text-[#739785]">{card2Unit}</span>
            </div>

            {/* Blue progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[#E3EFF9] overflow-hidden mt-1.5">
              <div className="h-full rounded-full bg-[#2098E0]" style={{ width: `${card2Progress}%` }} />
            </div>
          </div>

          {/* Bottom time pill */}
          <div className="mt-2.5 pt-1">
            <span className="dikta-pill px-2 py-0.5 text-[9.5px] font-bold text-[#2098E0] flex items-center gap-1 w-fit bg-[#F2F9FD]">
              {card2Badge}
            </span>
          </div>
        </div>

        {/* Card 3: Uang Dihemat */}
        <div className="dikta-card p-3 flex flex-col justify-between text-left">
          <div>
            <div className="w-8 h-8 rounded-2xl bg-[#EBF7EE] text-[#2AA97E] flex items-center justify-center mb-1.5 border border-[#D2EEDC]">
              <PiggyBank className="w-4.5 h-4.5 stroke-[2.2]" />
            </div>
            <p className="text-[12px] font-bold text-[#1E4D38] leading-tight truncate">{card3Title}</p>
            <p className="text-[9.5px] font-medium text-[#739785] leading-tight truncate">{card3Sub}</p>

            <div className="flex items-baseline gap-0.5 mt-1.5">
              <span className="text-[15px] font-extrabold text-[#1B4E38] truncate">{card3Value}</span>
              <span className="text-[9.5px] font-semibold text-[#739785]">{card3Unit}</span>
            </div>

            {/* Green progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[#E5F3EA] overflow-hidden mt-1.5">
              <div className="h-full rounded-full bg-[#2AA97E]" style={{ width: `${card3Progress}%` }} />
            </div>
          </div>

          {/* Bottom percentage & plus button */}
          <div className="flex items-center justify-between gap-1 mt-2.5 pt-1">
            <span className="text-[10px] font-bold text-[#2AA97E]">{card3Badge}</span>
            <button
              onClick={onAddCard3}
              className="w-5.5 h-5.5 rounded-full bg-[#EBF7EE] text-[#2AA97E] flex items-center justify-center font-bold text-xs border border-[#CDEED8] cursor-pointer active:scale-90 transition-transform"
            >
              <Plus className="w-3 h-3 stroke-[2.8]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ————————————————— 6. Dikta Insight + Mood + Reminders (2-Column Grid) ————————————————— */
export function DiktaInsightMoodSection({
  insightLabel = "Noconi AI Insight",
  insightTitle = "Analisis Kebiasaan & Craving",
  insightMessage = "Sensasi aromatik nilam terbukti efektif meredakan pemicu stres sore harimu.",
  insightCta = "Tanya Coach",
  moodLabel = "Kontrol Craving",
  moodBadge = "Terkendali",
  moodStatus = "Tenang & Bebas Rokok",
  reminderLabel = "Pengingat Noconi",
  reminderTitle = "Ritual Inhaler Nilam",
  reminderTime = "Pukul 16:30",
  reminderDoctor = "Ganti rokok pemicu",
  onInsightClick,
  onMoodClick,
  onReminderClick,
}: {
  insightLabel?: string;
  insightTitle?: string;
  insightMessage?: string;
  insightCta?: string;
  moodLabel?: string;
  moodBadge?: string;
  moodStatus?: string;
  reminderLabel?: string;
  reminderTitle?: string;
  reminderTime?: string;
  reminderDoctor?: string;
  onInsightClick?: () => void;
  onMoodClick?: () => void;
  onReminderClick?: () => void;
}) {
  return (
    <div className="grid grid-cols-12 gap-3 items-stretch">
      {/* Left Column: Dikta Insight Card with Peeking Mascot */}
      <div className="col-span-6 dikta-card p-4 flex flex-col justify-between relative overflow-hidden bg-gradient-to-b from-white/95 to-[#F1FAF5]">
        <div>
          {/* Header */}
          <div className="flex items-center gap-1.5 text-[#2AA97E] font-bold text-[12px] mb-2">
            <Sparkles className="w-4 h-4 fill-[#2AA97E]/20" />
            <span>{insightLabel}</span>
          </div>

          <h4 className="text-[14px] font-bold text-[#1E4D38] leading-tight">
            {insightTitle}
          </h4>
          <p className="text-[11px] font-medium text-[#5B8270] leading-snug mt-1.5 line-clamp-3">
            {insightMessage}
          </p>
        </div>

        {/* Bottom CTA Button + Peeking Mascot */}
        <div className="relative mt-4 pt-1 flex items-end justify-between">
          <button
            onClick={onInsightClick}
            className="px-3.5 py-1.5 rounded-full text-white text-[11px] font-bold flex items-center gap-1 shadow-[0_4px_12px_rgba(42,169,126,0.3)] bg-gradient-to-r from-[#2AA97E] to-[#40C595] active:scale-95 transition-transform cursor-pointer z-10"
          >
            <span>{insightCta}</span>
            <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {/* Peeking Mascot on bottom-right with hands/heart */}
          <div className="absolute -right-3 -bottom-3 w-16 h-16 pointer-events-none">
            <img
              src={mascotImg}
              alt=""
              className="w-full h-full object-contain drop-shadow-[0_4px_8px_rgba(24,76,50,0.2)] animate-float-soft"
            />
          </div>
        </div>
      </div>

      {/* Right Column: Stacked Mood Card + Latest Reminder Card */}
      <div className="col-span-6 flex flex-col gap-2.5">
        {/* Top: Today's mood / Craving state */}
        <div
          onClick={onMoodClick}
          className="dikta-card p-3 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#628A77]">
              <span>🙂</span>
              <span>{moodLabel}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#2AA97E] font-extrabold text-[9px] border border-[#D2F0DD]">
              {moodBadge}
            </span>
          </div>

          <div className="flex items-center gap-2 my-1">
            <span className="text-xl">😊</span>
            <p className="text-[11px] font-bold text-[#1E4D38] leading-tight truncate">
              {moodStatus}
            </p>
          </div>

          {/* Mood indicator dots */}
          <div className="flex items-center gap-1.5 mt-1">
            {[...Array(6)].map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full",
                  i < 5 ? "bg-[#4CC39A]" : "bg-[#D7ECE0]"
                )}
              />
            ))}
          </div>
        </div>

        {/* Bottom: Latest reminder */}
        <div
          onClick={onReminderClick}
          className="dikta-card p-3 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all hover:bg-white"
        >
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#628A77]">
              <Clock className="w-3.5 h-3.5 text-[#4CC39A]" />
              <span>{reminderLabel}</span>
            </div>
            <span className="text-[10px] font-bold text-[#2AA97E] hover:underline">
              Lihat
            </span>
          </div>

          {/* Routine sub-card */}
          <div className="bg-[#F2FAF6] rounded-xl p-2 flex items-center gap-2 border border-[#DFEFE6]">
            <div className="w-7 h-7 rounded-lg bg-white text-[#2AA97E] flex items-center justify-center shrink-0 border border-[#D6ECE0] shadow-2xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] font-bold text-[#1E4D38] truncate">{reminderTitle}</p>
                <span className="text-[9px] font-bold text-[#E87A38] shrink-0">{reminderTime} ›</span>
              </div>
              <p className="text-[9px] font-medium text-[#7A9E8C] truncate">{reminderDoctor}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ————————————————— 7. Dikta Challenge Banner ————————————————— */
export function DiktaChallengeBanner({
  title = "Tantangan Hari Ini",
  subtitle = "24 Jam Penuh Bebas Asap Rokok!",
  description = "Ganti dorongan merokok dengan aroma inhaler nilam untuk bonus +50 XP!",
  progressText = "2/3 selesai",
  onClick,
}: {
  title?: string;
  subtitle?: string;
  description?: string;
  progressText?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="dikta-card p-4 flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-all"
    >
      {/* Left: Trophy Icon */}
      <div className="w-11 h-11 rounded-2xl bg-[#FFF8E7] text-[#FFAA00] flex items-center justify-center shrink-0 border border-[#FEEAC2] shadow-xs">
        <Trophy className="w-6 h-6 stroke-[2.2] fill-[#FFAA00]/25" />
      </div>

      {/* Middle: Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold text-[#1E4D38]">{title}</span>
        </div>
        <p className="text-[11px] font-bold text-[#2AA97E] leading-tight truncate mt-0.5">
          {subtitle}
        </p>
        <p className="text-[10px] font-medium text-[#739785] leading-tight truncate mt-0.5">
          {description}
        </p>
      </div>

      {/* Right: Checkmarks + Gift + Done text */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[#2AA97E] text-white flex items-center justify-center shadow-xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <div className="w-5 h-5 rounded-full bg-[#2AA97E] text-white flex items-center justify-center shadow-xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span className="text-sm leading-none">🎁</span>
        </div>
        <span className="text-[10px] font-bold text-[#628A77]">
          {progressText}
        </span>
      </div>
    </div>
  );
}

/* ————————————————— CompanionMessage (Clean Dikta Card) ————————————————— */
export function CompanionMessage({
  message,
  sub,
  mood = "supportive",
}: {
  message: string;
  sub?: string;
  mood?: CompanionMood;
}) {
  return (
    <div className="dikta-card p-4 flex items-center gap-3.5 my-3 bg-white/95 shadow-sm border border-white">
      <div className="w-12 h-12 rounded-2xl bg-[#EAF7EF] border border-[#D5EFE0] flex items-center justify-center shrink-0">
        <img src={mascotImg} alt="Noconi Mascot" className="w-10 h-10 object-contain drop-shadow-sm" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-bold text-[#1E4D38] leading-snug">{message}</p>
        {sub && <p className="text-[11.5px] font-medium text-[#628A77] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ————————————————— WellnessMetric (Compatibility) ————————————————— */
export function WellnessMetric({
  icon,
  label,
  value,
  sub,
  tone = "leaf",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "leaf" | "sky" | "sun" | "peach";
  onClick?: () => void;
}) {
  return (
    <GlassCard onClick={onClick} className="p-4">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white mb-3 bg-gradient-to-br from-[#2AA97E] to-[#46CA98] shadow-xs">
        {icon}
      </div>
      <p className="text-[12px] font-bold text-[#739785] truncate">{label}</p>
      <div className="text-[26px] font-bold leading-tight tracking-tight text-[#1E4D38]">{value}</div>
      {sub && <p className="text-[11px] font-semibold text-[#90ADA0] mt-1">{sub}</p>}
    </GlassCard>
  );
}

/* ————————————————— ActionTile (Compatibility) ————————————————— */
export function ActionTile({
  icon,
  title,
  sub,
  onClick,
  accent = "leaf",
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  accent?: "leaf" | "peach" | "sky";
}) {
  return (
    <button onClick={onClick} className="w-full dikta-card p-4 flex items-center gap-3.5 text-left cursor-pointer group hover:bg-white active:scale-[0.99] transition-all">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br from-[#2AA97E] to-[#46CA98] shadow-xs group-active:scale-95 transition-transform">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-[15px] text-[#1E4D38] truncate">{title}</h4>
        <p className="text-xs font-semibold text-[#628A77] mt-0.5 line-clamp-2">{sub}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-[#8CAFA0] shrink-0" />
    </button>
  );
}

/* ————————————————— CoachCard (Compatibility) ————————————————— */
export function CoachCard({
  title,
  message,
  cta,
  onClick,
  loading = false,
}: {
  title: string;
  message: string;
  cta: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <div onClick={onClick} className="dikta-card p-5 cursor-pointer active:scale-[0.99] transition-all">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-bold text-[#2AA97E] flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> {title}
        </span>
        <span className="text-xs font-bold text-[#1E4D38] flex items-center gap-0.5">
          {cta} <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
      <p className="text-[13px] font-medium text-[#48735F] leading-relaxed line-clamp-3">
        {loading ? "Menyiapkan insight untukmu..." : message}
      </p>
    </div>
  );
}

/* ————————————————— ProgressCard (Compatibility) ————————————————— */
export function ProgressCard({
  level,
  title,
  xpLabel,
  progressPct,
  encouragement,
}: {
  level: number | string;
  title: string;
  xpLabel: string;
  progressPct: number;
  encouragement?: string;
}) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-[#739785] uppercase tracking-wider">Level {level}</p>
          <p className="text-[18px] font-bold text-[#1E4D38] mt-0.5">{title}</p>
        </div>
        <CompanionAvatar mood="proud" size={48} />
      </div>
      {encouragement && (
        <p className="text-[12px] font-semibold text-[#628A77] mt-2">{encouragement}</p>
      )}
      <div className="mt-3 h-2.5 rounded-full bg-[#E5F3EA] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2AA97E] to-[#55D2A0] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="text-[11px] font-bold text-[#739785] text-right mt-1">{xpLabel}</p>
    </GlassCard>
  );
}

/* ————————————————— Section Heading (Compatibility) ————————————————— */
export function WellnessSectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-1">
      <h3 className="text-[16px] font-bold text-[#1E4D38]">{title}</h3>
      {sub && <p className="text-[12px] font-medium text-[#739785] mt-0.5">{sub}</p>}
    </div>
  );
}

/* ————————————————— Stat Pill (Compatibility) ————————————————— */
export function StatPill({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="dikta-pill px-3 py-1.5 text-[12px] font-semibold text-[#1E4D38] flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}
