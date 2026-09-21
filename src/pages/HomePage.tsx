import { useEffect, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { differenceInDays, differenceInHours, isToday } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DiktaHeader,
  DiktaSearchBar,
  DiktaHeroCard,
  DiktaQuickActions,
  DiktaDailyTrackers,
  DiktaInsightMoodSection,
  DiktaChallengeBanner,
} from '../components/wellness';
import { Wind, Activity, BrainCircuit } from 'lucide-react';

export function HomePage({ setActiveTab }: { setActiveTab: (t: any) => void }) {
  const { state, addCoachInsight, addInhalerLog } = useAppContext();
  const { language, t } = useLanguage();
  const profile = state.profile;
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState(false);

  useEffect(() => {
    async function generateDailyInsight() {
      if (!profile) return;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const hasInsightToday = state.coachInsights.some(
        c => c.type === 'daily_dashboard' && new Date(c.timestamp) >= todayStart
      );

      if (hasInsightToday) return;

      setInsightLoading(true);
      setInsightError(false);
      try {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const recentCravings = state.cravings.filter(c => new Date(c.timestamp) >= last7Days);

        // Peak Hour
        const hourCounts = recentCravings.reduce((acc, curr) => {
          const hr = new Date(curr.timestamp).getHours();
          acc[hr] = (acc[hr] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let peakHourStr = "N/A";
        if (Object.keys(hourCounts).length > 0) {
          const peakHr = Object.keys(hourCounts).reduce((a, b) => (hourCounts[a] > hourCounts[b] ? a : b));
          peakHourStr = `${peakHr}:00`;
        }

        // Dominant Trigger
        const triggerCounts = recentCravings.reduce((acc, curr) => {
          acc[curr.trigger_category] = (acc[curr.trigger_category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        let dominantTriggerStr = "N/A";
        if (Object.keys(triggerCounts).length > 0) {
          dominantTriggerStr = Object.keys(triggerCounts).reduce((a, b) => (triggerCounts[a] > triggerCounts[b] ? a : b));
        }

        const statsContext = `Peak Craving Hour: ${peakHourStr}. Dominant Trigger: ${dominantTriggerStr}. Total past 7 days: ${recentCravings.length} cravings.`;

        const res = await fetch("/api/insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statsContext, language: language || 'id' }),
        });
        const data = await res.json();

        if (data.content) {
          await addCoachInsight({
            content: data.content,
            timestamp: new Date().toISOString(),
            isRead: false,
            type: 'daily_dashboard',
          });
        } else {
          setInsightError(true);
        }
      } catch (err) {
        console.error("Failed to generate insight:", err);
        setInsightError(true);
      } finally {
        setInsightLoading(false);
      }
    }

    const to = setTimeout(generateDailyInsight, 2000);
    return () => clearTimeout(to);
  }, [profile, state.cravings, state.coachInsights, addCoachInsight, language]);

  if (!profile) return null;

  const now = new Date();
  const streakStartDate = profile.lastSmoked ? new Date(profile.lastSmoked) : new Date(profile.quitDate);
  const rawStreakDays = differenceInDays(now, streakStartDate);
  const streakDays = Math.max(0, rawStreakDays);
  const streakHours = differenceInHours(now, streakStartDate) % 24;

  const cravingsToday = state.cravings.filter(c => isToday(new Date(c.timestamp)));
  const resistedToday = cravingsToday.filter(c => c.outcome === 'resisted').length;
  const totalResisted = state.cravings.filter(c => c.outcome === 'resisted').length;

  // Inhaler stats
  const inhalerLogsToday = (state.inhalerLogs || []).filter(l => isToday(new Date(l.timestamp)));
  const inhalerUsedToday = inhalerLogsToday.length;

  // Money saved calculation (Rp 2.500 per batang rokok)
  const costPerCig = 2500;
  const cigarettesAvoided = streakDays * (profile.cigarettesPerDay || 16);
  const moneySaved = Math.round(cigarettesAvoided * costPerCig);

  // XP and Level calculation
  let methodEngagements = 0;
  if (profile.quitMethod === 'cbt') methodEngagements = state.cbtJournals?.length || 0;
  if (profile.quitMethod === 'act') methodEngagements = state.actUrges?.length || 0;
  if (profile.quitMethod === 'mindfulness') methodEngagements = state.mindfulnessLogs?.length || 0;
  if (profile.quitMethod === 'mi') methodEngagements = state.miReductionLogs?.length || 0;
  if (profile.quitMethod === 'habit') methodEngagements = state.habitLogs?.length || 0;

  const totalXP = (streakDays * 50) + (totalResisted * 20) + (methodEngagements * 15);
  const currentLevel = Math.max(1, Math.floor(Math.sqrt(totalXP / 100)) + 1);
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  const xpIntoLevel = Math.max(0, totalXP - xpForCurrentLevel);
  const xpNeededForLevel = Math.max(100, xpForNextLevel - xpForCurrentLevel);

  const userTitle = (t.home.userTitles as Record<number, string>)[currentLevel] || `Level ${currentLevel} Guardian`;

  const methodTitle = profile.quitMethod && (t.home.methodNames as any)[profile.quitMethod]
    ? (t.home.methodNames as any)[profile.quitMethod]
    : "Motivational Interviewing";

  // Recovery / Lung Health Score calculation (60 - 99)
  const baseScore = 72;
  const streakBonus = Math.min(18, Math.floor(streakDays * 0.5));
  const resistBonus = Math.min(9, totalResisted * 2);
  const wellnessScore = Math.min(99, Math.max(60, baseScore + streakBonus + resistBonus));

  // Find latest dashboard insight
  const latestInsight = [...state.coachInsights]
    .filter(c => c.type === 'daily_dashboard')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const fallbackInsightText = insightError || !latestInsight
    ? (streakDays > 0
      ? (language === 'id'
        ? `Kamu sudah ${streakDays} hari konsisten bebas rokok! Sensasi aromatik nilam terbukti efektif menggantikan ritual fisik merokok. Pastikan inhaler Noconi selalu siap saat dorongan muncul.`
        : `You are on a solid ${streakDays} days smoke-free streak! Patchouli aromatic sensations are effectively replacing the physical smoking ritual. Keep your Noconi inhaler close.`)
      : (language === 'id'
        ? "Langkah awal dimulai hari ini. Gunakan inhaler nilam setiap kali timbul dorongan merokok agar AI kami dapat mengenali pola dan pemicumu."
        : "The first step begins today. Use your patchouli inhaler whenever cravings strike so our AI can learn your triggers."))
    : latestInsight.content;

  // Handler: Instant 1-click inhaler log
  const handleQuickAddInhaler = async () => {
    try {
      await addInhalerLog({
        timestamp: new Date().toISOString(),
        variantUsed: 'automatic-bypass',
        context: ['quick-tracker-puff'],
        intensityBefore: 5,
        intensityAfter: 0,
        isInhalerAvailable: true,
        fallbackMethod: null,
        notes: 'Catat instan inhaler nilam pengganti rokok',
      });
    } catch (e) {
      console.error('Failed to log inhaler puff:', e);
    }
  };

  const heroHeadline = language === 'id'
    ? (streakDays > 30 ? 'Paru-parumu kian bersih!' : streakDays > 7 ? 'Napasmu kian lega & segar!' : 'Langkah awal bebas rokok!')
    : (streakDays > 30 ? 'Your lungs are healing!' : streakDays > 7 ? 'Breathing much easier!' : 'First smoke-free step!');

  const heroSub = language === 'id'
    ? 'Pertahankan ritual inhaler nilam — kamu memegang kendali penuh atas kebiasaan barumu!'
    : 'Keep up the patchouli inhaler ritual — you are in full control of your new habit!';

  const quickActionItems = [
    {
      id: "inhaler",
      title: language === 'id' ? "Inhaler Nilam" : "Patchouli Inhaler",
      subtitle: language === 'id' ? "Ganti ritual rokok" : "Soothe craving",
      iconBg: "bg-[#E6F8EE]",
      iconColor: "text-[#2AA97E]",
      arrowBg: "bg-[#D8F4E4] text-[#2AA97E]",
      icon: Wind,
      onClick: () => setActiveTab("inhaler"),
    },
    {
      id: "craving",
      title: language === 'id' ? "Catat Craving" : "Log Craving",
      subtitle: language === 'id' ? "Rekam pemicu CBT" : "Track triggers",
      iconBg: "bg-[#FFF4E6]",
      iconColor: "text-[#FF8D3B]",
      arrowBg: "bg-[#FFE8D0] text-[#FF8D3B]",
      icon: Activity,
      onClick: () => setActiveTab("log"),
    },
    {
      id: "method",
      title: language === 'id' ? "Metode AI" : "Your Method",
      subtitle: methodTitle,
      iconBg: "bg-[#EBF5FE]",
      iconColor: "text-[#3CA4E5]",
      arrowBg: "bg-[#D9EDFD] text-[#3CA4E5]",
      icon: BrainCircuit,
      onClick: () => setActiveTab("method"),
    },
  ];

  return (
    <div className="wellness-page px-4 space-y-4 pt-3 pb-32 max-w-md mx-auto">
      {/* 1. Header Dikta: Brand Noconi + Glowing Sun Dot + Dependancy Badge + Bell + Profile */}
      <DiktaHeader
        title="Noconi"
        subtitle={language === 'id' ? 'Inhaler Nilam Bebas Nikotin & AI Coach' : 'Nicotine-Free Patchouli Inhaler & AI'}
        badgeText={profile.dependancyLevel ? profile.dependancyLevel.toUpperCase() : 'LOW'}
        unreadNotifications={true}
        onNotificationClick={() => setActiveTab('analytics')}
        onProfileClick={() => setActiveTab('settings')}
      />

      {/* 2. Dikta Search Pill Bar: "Tanya Noconi AI Coach..." */}
      <DiktaSearchBar
        placeholder={
          language === 'id'
            ? 'Tanya Noconi AI Coach... (Craving, Pemicu, atau Latihan)'
            : 'Ask Noconi AI Coach... (Cravings, Triggers, or CBT)'
        }
        onClick={() => setActiveTab('chat')}
      />

      {/* 3. Dikta Main Hero Card: Pemulihan Paru & Bebas Rokok */}
      <DiktaHeroCard
        cardTitle={language === 'id' ? 'Kondisi Paru & Pemulihan' : 'Lung Health & Recovery'}
        scoreLabel={language === 'id' ? 'Skor Pemulihan' : 'Recovery score'}
        score={wellnessScore}
        maxScore={100}
        streakLabel={
          language === 'id'
            ? `${streakDays} Hari ${streakHours} Jam Bebas`
            : `${streakDays}d ${streakHours}h Smoke-Free`
        }
        secondPillLabel={
          moneySaved > 0
            ? (language === 'id' ? `Hemat Rp ${moneySaved.toLocaleString('id-ID')}` : `Saved Rp ${moneySaved.toLocaleString('id-ID')}`)
            : (language === 'id' ? `+${totalXP} XP Quitter` : `+${totalXP} Quitter XP`)
        }
        secondPillEmoji={moneySaved > 0 ? '💰' : '⭐'}
        headline={heroHeadline}
        subHeadline={heroSub}
        level={currentLevel}
        levelTitle={`Level ${currentLevel} ${userTitle}`}
        currentXP={xpIntoLevel}
        nextLevelXP={xpNeededForLevel}
        onLevelClick={() => setActiveTab('method')}
        onCardClick={() => setActiveTab('method')}
      />

      {/* 4. Dikta Quick Action 3-Card Row: Inhaler Nilam, Catat Craving, Metode AI */}
      <DiktaQuickActions
        items={quickActionItems}
      />

      {/* 5. Dikta Daily Trackers (Pelacak Harian Anti-Rokok): Inhaler Nilam, Craving Ditolak, Uang Dihemat */}
      <DiktaDailyTrackers
        title={language === 'id' ? 'Pelacak Harian Anti-Rokok' : 'Daily Smoke-Free Trackers'}
        card1Title={language === 'id' ? 'Inhaler Nilam' : 'Patchouli Inhaler'}
        card1Sub={language === 'id' ? 'Ritual pengganti' : 'Habit replacement'}
        card1Value={`${inhalerUsedToday}/8`}
        card1Unit="puffs"
        card1Progress={Math.min(100, Math.round((inhalerUsedToday / 8) * 100))}
        onAddCard1={handleQuickAddInhaler}

        card2Title={language === 'id' ? 'Craving Ditolak' : 'Resisted Cravings'}
        card2Sub={
          cravingsToday.length === 0
            ? (language === 'id' ? 'Belum ada craving' : 'No cravings today')
            : `${cravingsToday.length} ${language === 'id' ? 'dorongan hari ini' : 'cravings today'}`
        }
        card2Value={`${resistedToday}/${Math.max(1, cravingsToday.length)}`}
        card2Unit={language === 'id' ? 'berhasil' : 'resisted'}
        card2Progress={cravingsToday.length > 0 ? Math.round((resistedToday / cravingsToday.length) * 100) : 100}
        card2Badge={`🕒 ${streakHours}j aman`}

        card3Title={language === 'id' ? 'Uang Dihemat' : 'Money Saved'}
        card3Sub={`${cigarettesAvoided} ${language === 'id' ? 'rokok dihindari' : 'cigs avoided'}`}
        card3Value={
          moneySaved >= 1000000
            ? `Rp ${(moneySaved / 1000000).toFixed(2)}jt`
            : `Rp ${(moneySaved / 1000).toLocaleString('id-ID')}rb`
        }
        card3Unit=""
        card3Progress={Math.min(100, Math.max(15, Math.round((moneySaved / 5000000) * 100)))}
        card3Badge={`${Math.min(100, Math.max(15, Math.round((moneySaved / 5000000) * 100)))}%`}
        onAddCard3={() => setActiveTab('analytics')}
      />

      {/* 6. Dikta Insight + Mood + Pengingat (2-Column Grid) */}
      <DiktaInsightMoodSection
        insightLabel="Noconi AI Coach"
        insightTitle={language === 'id' ? 'Analisis Kebiasaan & Craving' : 'Habit & Craving Analysis'}
        insightMessage={fallbackInsightText}
        insightCta={language === 'id' ? 'Tanya Coach' : 'Ask Coach'}
        moodLabel={language === 'id' ? 'Kontrol Craving' : "Craving Control"}
        moodBadge={language === 'id' ? 'Terkendali' : 'Controlled'}
        moodStatus={language === 'id' ? 'Tenang & Bebas Rokok' : 'Calm & Smoke-Free'}
        reminderLabel={language === 'id' ? 'Pengingat Noconi' : 'Noconi Reminder'}
        reminderTitle={language === 'id' ? 'Ritual Inhaler Nilam' : 'Patchouli Ritual'}
        reminderTime={language === 'id' ? 'Sore hari ›' : 'Evening ›'}
        reminderDoctor={language === 'id' ? 'Ganti pemicu stres' : 'Replace stress trigger'}
        onInsightClick={() => setActiveTab('chat')}
        onMoodClick={() => setActiveTab('log')}
        onReminderClick={() => setActiveTab('inhaler')}
      />

      {/* 7. Dikta Challenge Banner: Tantangan Bebas Rokok Hari Ini */}
      <DiktaChallengeBanner
        title={language === 'id' ? 'Tantangan Hari Ini' : "Today's Challenge"}
        subtitle={
          language === 'id'
            ? '24 Jam Penuh Bebas Asap Rokok!'
            : '24 Hours Completely Smoke-Free!'
        }
        description={
          language === 'id'
            ? 'Ganti dorongan merokok dengan aroma inhaler nilam untuk bonus +50 XP!'
            : 'Replace smoking urges with aromatic patchouli inhaler for +50 XP bonus!'
        }
        progressText={language === 'id' ? '2/3 selesai' : '2/3 done'}
        onClick={() => setActiveTab('goals')}
      />
    </div>
  );
}
