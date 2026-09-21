import React, { useState } from 'react';
import { useAppContext } from '../../store/AppContext';
import { Wind, Activity, ChevronRight, BookOpen, ChevronDown, ChevronUp, Plus, X, Play, Square } from 'lucide-react';
import { cn } from '../../lib/utils';
import { CompanionMessage } from '../wellness';

const LIBRARY_VALUES = ['Health', 'Family', 'Freedom', 'Career', 'Self-respect', 'Energy', 'Longevity'];
const DAILY_EXERCISES = [
  { id: 'act-1', title: 'Leaves on a Stream', desc: 'Visualize thoughts floating away', duration: '5m' },
  { id: 'act-2', title: 'The Name Game', desc: 'A quick defusion technique', duration: '3m' },
  { id: 'act-3', title: 'Body Scan', desc: 'Grounding into the present moment', duration: '7m' },
];

export default function ACTMethod() {
  const { state, updateProfile, addActUrgeSurf } = useAppContext();

  const [showUrgeSurf, setShowUrgeSurf] = useState(false);
  const [showValues, setShowValues] = useState(false);
  const [showScience, setShowScience] = useState(false);

  // Values Setup
  const coreValues = state.profile?.actCoreValues || [];
  const [customValue, setCustomValue] = useState('');

  const toggleValue = async (val: string) => {
    const isEditing = coreValues.includes(val);
    const newValues = isEditing ? coreValues.filter(v => v !== val) : [...coreValues, val];
    if (newValues.length <= 5) {
      await updateProfile({ actCoreValues: newValues });
    }
  };

  const addCustomValue = async () => {
    if (customValue.trim() && coreValues.length < 5 && !coreValues.includes(customValue.trim())) {
      await updateProfile({ actCoreValues: [...coreValues, customValue.trim()] });
      setCustomValue('');
    }
  };

  // Urge Surfing State
  const [surfTime, setSurfTime] = useState(0);
  const [surfInterval, setSurfInterval] = useState<any>(null);
  const [surfPhase, setSurfPhase] = useState<'intro' | 'surfing' | 'summary'>('intro');

  const startSurfing = () => {
    setSurfPhase('surfing');
    setSurfTime(0);
    const int = setInterval(() => {
      setSurfTime(prev => prev + 1);
    }, 1000);
    setSurfInterval(int);
  };

  const endSurfing = async () => {
    if (surfInterval) clearInterval(surfInterval);
    const durationMinutes = Math.max(1, Math.round(surfTime / 60));
    await addActUrgeSurf({
      timestamp: new Date().toISOString(),
      durationMinutes
    });
    setSurfPhase('summary');
  };

  // Daily Exercise
  const [activeExercise, setActiveExercise] = useState<string | null>(null);
  const completedExecs = state.profile?.actExercisesCompleted || [];
  const todayExercise = DAILY_EXERCISES[0];

  const completeExercise = async (id: string) => {
    if (!completedExecs.includes(id)) {
      await updateProfile({ actExercisesCompleted: [...completedExecs, id] });
    }
    setActiveExercise(null);
  };

  return (
    <div className="wellness-page p-4 pt-2 pb-24 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <header className="mb-4">
        <h1 className="text-2xl font-display font-bold leading-tight" style={{ color: '#1E4D38' }}>
          Acceptance &amp; Commitment
        </h1>
        <p className="text-[13px] font-medium leading-relaxed mt-1" style={{ color: '#5B8270' }}>
          Don't fight the urge—observe it, accept it, and let it pass.
        </p>
      </header>

      {/* Companion message card — mascot inside squircle badge, never clips */}
      <CompanionMessage
        message="Hari ini kita latih satu hal kecil: membiarkan dorongan lewat tanpa melawan."
        sub="5 menit saja — aku menunggu di sini."
        mood="supportive"
      />

      {/* Urge Surfing Card */}
      <section className="dikta-card p-4 mb-3">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-display font-bold text-base" style={{ color: '#4A3F35' }}>Urge Surfing Tool</h3>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#8A7A6B' }}>Ride the wave of a craving</p>
          </div>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#2AA97E,#4CC39A)', boxShadow: '0 4px 0 #1C7D5B' }}>
            <Activity className="w-4 h-4 text-white" />
          </div>
        </div>
        <button
          onClick={() => { setShowUrgeSurf(true); setSurfPhase('intro'); }}
          className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
        >
          <Play className="w-4 h-4 fill-white" /> Start surf
        </button>
      </section>

      {/* Core Values Card */}
      <section className="dikta-card p-4 mb-3">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-display font-bold text-base" style={{ color: '#4A3F35' }}>My Core Values</h3>
            <p className="text-xs font-semibold mt-0.5" style={{ color: '#8A7A6B' }}>Setup your life anchors</p>
          </div>
          <button
            onClick={() => setShowValues(!showValues)}
            className="w-8 h-8 rounded-full flex justify-center items-center transition-colors cursor-pointer"
            style={{ background: 'rgba(74,63,53,0.06)', color: '#8A7A6B' }}
          >
            {showValues ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {showValues ? (
          <div className="space-y-4 animate-in slide-in-from-top-2 pt-4 mt-2" style={{ borderTop: '1px solid rgba(74,63,53,0.08)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#8A7A6B' }}>Select up to 5</p>
            <div className="flex flex-wrap gap-2">
              {LIBRARY_VALUES.map(val => (
                <button
                  key={val}
                  onClick={() => toggleValue(val)}
                  className={cn("px-3 py-1.5 rounded-full text-sm font-bold transition-all cursor-pointer press-soft", coreValues.includes(val) ? "text-white" : "bg-white")}
                  style={
                    coreValues.includes(val)
                      ? { background: 'linear-gradient(135deg,#2AA97E,#4CC39A)', boxShadow: '0 3px 0 #1C7D5B' }
                      : { color: '#4A3F35', border: '1px solid rgba(74,63,53,0.12)', boxShadow: '0 2px 0 rgba(74,63,53,0.06)' }
                  }
                >
                  {val}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 p-2 rounded-2xl" style={{ background: 'rgba(74,63,53,0.04)', border: '1px solid rgba(74,63,53,0.08)' }}>
              <input
                value={customValue}
                onChange={e => setCustomValue(e.target.value)}
                type="text"
                placeholder="Add custom value..."
                className="flex-1 bg-transparent px-3 py-1 text-sm font-medium focus:outline-none"
                style={{ color: '#4A3F35' }}
              />
              <button
                onClick={addCustomValue}
                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                style={{ background: '#E7F6EE', color: '#1C7D5B' }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {coreValues.length > 0 ? coreValues.map(v => (
              <span key={v} className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(74,63,53,0.05)', color: '#4A3F35', border: '1px solid rgba(74,63,53,0.1)' }}>{v}</span>
            )) : (
              <p className="text-sm font-semibold" style={{ color: '#B8A99A' }}>No values set. Tap edit to setup.</p>
            )}
          </div>
        )}
      </section>

      {/* Daily Defusion Card */}
      <section className="dikta-card p-4 mb-3">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setActiveExercise(todayExercise.id)}>
          <div>
            <h3 className="font-display font-bold text-base" style={{ color: '#4A3F35' }}>Daily Defusion</h3>
            <p className="text-xs font-bold mt-0.5" style={{ color: '#1C7D5B' }}>{todayExercise.title}</p>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer" style={{ background: 'rgba(74,63,53,0.06)', color: '#8A7A6B' }}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 w-full rounded-full h-2.5 overflow-hidden" style={{ background: 'rgba(74,63,53,0.07)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(completedExecs.length / DAILY_EXERCISES.length) * 100}%`, background: 'linear-gradient(90deg,#2AA97E,#4CC39A)' }} />
        </div>
        <p className="text-[10px] font-bold mt-2 text-right" style={{ color: '#8A7A6B' }}>{completedExecs.length}/{DAILY_EXERCISES.length} Exercises Done</p>
      </section>

      {/* Why This Works */}
      <section className="dikta-card p-4 transition-all duration-300" style={{ background: 'linear-gradient(180deg,#F4FAFF,#E3F0FB)' }}>
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowScience(!showScience)}>
          <h3 className="font-bold flex items-center gap-2 text-sm" style={{ color: '#2E5E8C' }}>
            <BookOpen className="w-4 h-4" style={{ color: '#5B9BD5' }} /> Why this works
          </h3>
          {showScience ? <ChevronUp className="w-4 h-4" style={{ color: '#5B9BD5' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#5B9BD5' }} />}
        </div>
        {showScience && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="bg-white/90 p-3 rounded-2xl mb-3" style={{ border: '1px solid rgba(91,155,213,0.2)' }}>
              <h4 className="text-xs font-bold mb-1" style={{ color: '#2E7CB6' }}>Science Fact</h4>
              <p className="text-sm leading-relaxed font-semibold" style={{ color: '#4A3F35' }}>
                ACT is proven effective, especially for smokers with high anxiety. Instead of suppressing the urge, ACT teaches accepting cravings as temporary physical sensations while staying committed to your values.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/90 p-3 rounded-2xl" style={{ border: '1px solid rgba(91,155,213,0.2)' }}>
                <p className="text-[10px] font-bold mb-0.5" style={{ color: '#8A7A6B' }}>Total surfs</p>
                <p className="text-lg font-bold" style={{ color: '#4A3F35' }}>{state.actUrges.length}</p>
              </div>
              <div className="flex-1 bg-white/90 p-3 rounded-2xl text-right" style={{ border: '1px solid rgba(91,155,213,0.2)' }}>
                <p className="text-[10px] font-bold mb-0.5" style={{ color: '#8A7A6B' }}>Method fit</p>
                <p className="text-sm font-bold truncate" style={{ color: '#2E7CB6' }}>High Anxiety</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Urge Surfing Full-Screen Modal */}
      {showUrgeSurf && (
        <div className="fixed inset-0 z-[60] bg-brand-dark flex flex-col justify-between animate-in fade-in">
          <div className="p-4 pt-12 text-center text-white relative z-10">
            <h2 className="text-xl font-bold mb-1">
              {surfPhase === 'intro' ? 'Ready to surf?' : surfPhase === 'surfing' ? 'Riding the wave...' : 'Urge surfed!'}
            </h2>
            {surfPhase === 'surfing' && (
              <div className="font-bold text-3xl opacity-90 mt-2 bg-black/20 inline-block px-4 py-2 rounded-2xl border-2 border-white/10">
                {Math.floor(surfTime / 60)}:{(surfTime % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>

          <div className="p-4 relative z-10 mb-8 max-w-sm mx-auto w-full">
            {surfPhase === 'intro' && (
              <div className="space-y-4">
                <p className="text-white/80 text-center font-medium mb-8 text-sm">Notice the physical sensations of your craving. Where is it in your body? Imagine it as an ocean wave. It will peak, and it will break.</p>
                <button onClick={startSurfing} className="btn-primary w-full bg-white text-brand-dark hover:bg-white/90 shadow-[0_4px_0_#94a3b8] border-2 border-transparent">I'm ready</button>
                <button onClick={() => setShowUrgeSurf(false)} className="w-full text-white/70 font-bold text-sm py-3 hover:text-white transition-colors">Cancel</button>
              </div>
            )}
            {surfPhase === 'surfing' && (
              <div className="space-y-4">
                <p className="text-white/90 text-center font-medium mb-8 text-sm">Just breathe normally. Don't fight it. The wave is passing through you.</p>
                <button onClick={endSurfing} className="btn-primary w-full bg-brand-dark border-2 border-brand hover:bg-brand-dark flex items-center justify-center gap-2 shadow-[0_4px_0_var(--color-brand)]">
                  <Square className="w-4 h-4 fill-white" /> Urge passed
                </button>
              </div>
            )}
            {surfPhase === 'summary' && (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-brand rounded-2xl border-2 border-brand-dark flex items-center justify-center mx-auto mb-2 text-white shadow-[0_4px_0_var(--color-brand-dark)]">
                  <Activity className="w-8 h-8" />
                </div>
                <p className="text-white/90 font-medium text-sm">You successfully let the urge pass without acting on it. Every time you do this, the wave gets smaller.</p>
                {coreValues.length > 0 && (
                  <div className="bg-black/20 border-2 border-white/10 p-4 rounded-2xl">
                    <p className="text-[10px] text-white/60 font-bold mb-1">Aligned with your values</p>
                    <p className="text-white font-bold text-sm">{coreValues[0]} {coreValues.length > 1 ? `& ${coreValues[1]}` : ''}</p>
                  </div>
                )}
                <button onClick={() => setShowUrgeSurf(false)} className="btn-primary w-full bg-white text-brand-dark hover:bg-white/90 shadow-[0_4px_0_#94a3b8] border-2 border-transparent">Return to plan</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Daily Exercise Modal */}
      {activeExercise && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-t-[1.75rem] overflow-hidden flex flex-col p-4" style={{ background: 'linear-gradient(180deg,#FFFDF7,#FFF6E3)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 -12px 40px rgba(74,63,53,0.16)' }}>
            <h2 className="font-display font-bold text-xl mb-2" style={{ color: '#4A3F35' }}>{todayExercise.title}</h2>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-6 w-fit" style={{ background: '#E7F6EE', color: '#1C7D5B' }}>{todayExercise.duration}</span>
            <p className="font-semibold mb-8 leading-relaxed text-sm p-4 rounded-2xl" style={{ color: '#4A3F35', background: 'rgba(74,63,53,0.04)', border: '1px solid rgba(74,63,53,0.07)' }}>
              Close your eyes and imagine a gentle stream with leaves floating on the surface. Every time a thought or craving pops into your head, place it on a leaf and watch it float away.
              <br /><br />
              If your mind goes blank, watch the stream. If you get stuck on a thought, gently place it back on a leaf.
            </p>
            <button onClick={() => completeExercise(todayExercise.id)} className="btn-primary w-full">
              Mark as complete
            </button>
            <button onClick={() => setActiveExercise(null)} className="mt-4 font-bold text-sm w-full py-2 transition-colors cursor-pointer" style={{ color: '#8A7A6B' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
