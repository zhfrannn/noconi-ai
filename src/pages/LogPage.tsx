import { useEffect, useRef, useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { CravingContext, Mood } from '../types';
import { CheckCircle2, Wind, Search, Trophy, ShoppingCart } from 'lucide-react';
import { cn } from '../lib/utils';
import { Milestone } from '../lib/db';
import { useLanguage } from '../contexts/LanguageContext';

export function LogPage({ setActiveTab }: { setActiveTab: (t: any) => void }) {
  const { addCraving } = useAppContext();
  const { t, language } = useLanguage();
  
  const [intensity, setIntensity] = useState(5);
  const [context, setContext] = useState<CravingContext | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);
  const [resisted, setResisted] = useState(true);
  const [inhalerUsed, setInhalerUsed] = useState(true);
  const [milestoneQueue, setMilestoneQueue] = useState<Milestone[]>([]);
  const goHomeAfterMilestones = useRef(false);

  // Show unlocked milestones one at a time, then return to the home tab.
  useEffect(() => {
    if (milestoneQueue.length === 0) {
      if (goHomeAfterMilestones.current) {
        goHomeAfterMilestones.current = false;
        setActiveTab('home');
      }
      return;
    }
    const timer = setTimeout(() => setMilestoneQueue(q => q.slice(1)), 4000); // 4 seconds animation delay
    return () => clearTimeout(timer);
  }, [milestoneQueue]);

  const contexts: {id: CravingContext, label: string}[] = [
    {id: 'waking_up', label: 'Waking Up'},
    {id: 'after_meal', label: 'After Meal'},
    {id: 'stressed', label: 'Stressed'},
    {id: 'bored', label: 'Bored'},
    {id: 'social', label: 'Socializing'},
    {id: 'working', label: 'Working'},
    {id: 'drinking_coffee', label: 'Drinking Coffee'},
    {id: 'other', label: 'Other'},
  ];

  const moods: {id: Mood, label: string, emoji: string}[] = [
    {id: 'happy', label: 'Happy', emoji: 'ðŸ˜Š'},
    {id: 'stressed', label: 'Stressed', emoji: 'ðŸ˜«'},
    {id: 'anxious', label: 'Anxious', emoji: 'ðŸ˜°'},
    {id: 'bored', label: 'Bored', emoji: 'ðŸ˜'},
    {id: 'sad', label: 'Sad', emoji: 'ðŸ˜”'},
  ];

  const handleSave = async () => {
    if (!context || !mood) return;

    const timestamp = new Date().toISOString();

    try {
      const milestones = await addCraving({
        timestamp,
        intensity,
        trigger_category: context,
        mood,
        outcome: resisted ? 'resisted' : 'smoked',
        inhaler_used: inhalerUsed,
      });

      if (milestones.length > 0) {
        goHomeAfterMilestones.current = true;
        setMilestoneQueue(milestones);
      } else {
        setActiveTab('home');
      }
    } catch (err: any) {
      console.error("Failed to add craving:", err);
      // Fallback
      setActiveTab('home');
    }
  };

  const showMilestone = milestoneQueue[0];

  if (showMilestone) {
     return (
       <div className="flex flex-col items-center justify-center h-full text-center p-4 animate-in zoom-in" style={{ background: 'linear-gradient(180deg,#E9FBF1,#FFF6E3)' }}>
          <div className="w-32 h-32 rounded-full flex items-center justify-center mb-6 animate-float-soft" style={{ background: 'linear-gradient(180deg,#FFF1C4,#FFE08A)', border: '4px solid #fff', boxShadow: '0 16px 32px rgba(255,197,49,0.35)' }}>
             <Trophy className="w-16 h-16" style={{ color: '#B97E0C' }} />
          </div>
          <h2 className="text-3xl font-display font-bold mb-2" style={{ color: '#4A3F35' }}>Milestone Unlocked!</h2>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#1C7D5B' }}>{showMilestone.title}</h3>
          <p className="font-semibold" style={{ color: '#8A7A6B' }}>{showMilestone.description}</p>
       </div>
     );
  }

  return (
    <div className="wellness-page p-3 space-y-6 pt-6 pb-24">
      <header>
        <h1 className="text-2xl font-display font-bold tracking-tight" style={{ color: '#4A3F35' }}>Log a Craving</h1>
        <p className="font-semibold text-sm mt-1" style={{ color: '#8A7A6B' }}>Understanding your patterns helps the AI coach you better.</p>
      </header>

      {/* Intensity */}
      <section className="card-duo p-3">
        <label className="block text-sm font-bold mb-4" style={{ color: '#4A3F35' }}>Craving Intensity</label>
        <div className="flex items-center gap-4">
          <input
            type="range" min="1" max="10"
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <div className={cn(
             "w-12 h-12 flex items-center justify-center rounded-2xl font-bold text-xl text-white",
             intensity < 8 ? "" : ""
          )}
          style={
            intensity < 4
              ? { background: 'linear-gradient(135deg,#2AA97E,#4CC39A)', boxShadow: '0 4px 0 #1C7D5B' }
              : intensity < 8
                ? { background: 'linear-gradient(135deg,#E8A100,#FFC531)', boxShadow: '0 4px 0 #B97E0C' }
                : { background: 'linear-gradient(135deg,#F07B4A,#FF9E6B)', boxShadow: '0 4px 0 #C2542F' }
          }>
            {intensity}
          </div>
        </div>
      </section>

      {/* Context / Trigger */}
      <section>
        <label className="block text-sm font-bold mb-3 ml-1" style={{ color: '#4A3F35' }}>What triggered this?</label>
        <div className="flex flex-wrap gap-2">
          {contexts.map(c => (
            <button
              key={c.id}
              onClick={() => setContext(c.id)}
              className={context === c.id ? "btn-outline btn-outline-active py-2 px-4 h-auto" : "btn-outline py-2 px-4 h-auto"}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {/* Mood */}
      <section>
        <label className="block text-sm font-bold mb-3 ml-1" style={{ color: '#4A3F35' }}>How are you feeling?</label>
        <div className="grid grid-cols-5 gap-2">
          {moods.map(m => (
            <button
               key={m.id}
               onClick={() => setMood(m.id)}
               className={m.id === mood ? "btn-outline btn-outline-active flex-col py-3 px-1 h-auto gap-0" : "btn-outline flex-col py-3 px-1 h-auto gap-0"}
            >
              <span className="text-2xl mb-1">{m.emoji}</span>
              <span className="text-[10px] font-bold">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Outcomes */}
      <section className="card-duo py-3 px-4 divide-y divide-gray-100 mb-2" style={{ ['--tw-divide-opacity' as any]: 1 }}>
        <label className="flex items-center justify-between py-3 cursor-pointer">
           <div>
             <span className="block font-bold text-sm" style={{ color: '#4A3F35' }}>Did you resist?</span>
             <span className="text-xs font-semibold" style={{ color: '#8A7A6B' }}>I did not smoke a cigarette</span>
           </div>
           <input
             type="checkbox"
             checked={resisted}
             onChange={(e) => setResisted(e.target.checked)}
             className="w-6 h-6 accent-brand rounded cursor-pointer"
           />
        </label>
        <label className="flex items-center justify-between py-3 cursor-pointer">
           <div>
             <span className="block font-bold text-sm" style={{ color: '#4A3F35' }}>{t.logPage.usedInhalerLabel}</span>
             <span className="text-xs font-semibold" style={{ color: '#8A7A6B' }}>{t.logPage.inhalerAuto}</span>
           </div>
           <input
             type="checkbox"
             checked={inhalerUsed}
             onChange={(e) => setInhalerUsed(e.target.checked)}
             className="w-6 h-6 accent-brand rounded cursor-pointer"
           />
        </label>
      </section>

      {!inhalerUsed && (
         <button onClick={() => setActiveTab('shop')} className="w-full text-white p-3 rounded-2xl flex items-center justify-between press-soft" style={{ background: 'linear-gradient(135deg,#F07B4A,#FFB184)', boxShadow: '0 5px 0 #C2542F, 0 12px 24px rgba(240,123,74,0.3)' }}>
            <div className="text-left">
              <p className="text-xs font-bold tracking-wider text-white/80">{t.logPage.needRelief}</p>
              <p className="text-sm font-bold">{t.logPage.getInhaler}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center shrink-0">
               <ShoppingCart className="w-4 h-4 text-white" />
            </div>
         </button>
      )}

      <div className="pt-4 pb-8">
        <button
          disabled={!context || !mood}
          onClick={handleSave}
          className={cn("w-full btn-primary !h-auto !py-4", (!context || !mood) && "opacity-50 grayscale cursor-not-allowed")}
        >
          <div className="w-6 h-6 mr-1 flex items-center justify-center rounded-full bg-white/25">
             <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          Save Log
        </button>
      </div>
    </div>
  );
}
