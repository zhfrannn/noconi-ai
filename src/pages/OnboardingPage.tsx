import { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import { DependancyLevel } from '../types';
import { ArrowRight, ShieldCheck, HeartPulse } from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { LanguageToggle } from '../components/LanguageToggle';

export function OnboardingPage() {
  const { updateProfile } = useAppContext();
  const { t, language } = useLanguage();
  const [step, setStep] = useState(0);

  // Form State
  const [cigsPerDay, setCigsPerDay] = useState(15);
  const [yearsSmoking, setYearsSmoking] = useState(5);
  const [usualBrand, setUsualBrand] = useState('');
  
  // FTND specific
  const [timeToFirst, setTimeToFirst] = useState<'<5' | '6-30' | '31-60' | '>60'>('31-60');
  const [difficultForbidden, setDifficultForbidden] = useState<boolean>(false);
  const [hateToGiveUp, setHateToGiveUp] = useState<'first' | 'other'>('first');
  const [moreInMorning, setMoreInMorning] = useState<boolean>(false);
  const [smokeWhenIll, setSmokeWhenIll] = useState<boolean>(false);

  // Qualitative
  const [triggers, setTriggers] = useState<string[]>([]);
  const [quitReason, setQuitReason] = useState<string>('');

  const triggerKeys = ['Stressed', 'After Meal', 'Waking Up', 'Socializing', 'Drinking Coffee', 'Boredom', 'Working'] as const;
  const reasonKeys = ['Health & Fitness', 'Family & Loved Ones', 'Financial Savings', 'Appearance', 'Taking Control'] as const;

  // Method Matching
  const [methodReason, setMethodReason] = useState<string>('');
  const [methodApproach, setMethodApproach] = useState<string>('');
  const [methodAnxiety, setMethodAnxiety] = useState<string>('');

  const handleComplete = () => {
    // Calculate FTND Score
    let score = 0;
    
    // Time to first
    if (timeToFirst === '<5') score += 3;
    else if (timeToFirst === '6-30') score += 2;
    else if (timeToFirst === '31-60') score += 1;
    
    // Difficult forbidden
    if (difficultForbidden) score += 1;
    
    // Hate to give up
    if (hateToGiveUp === 'first') score += 1;
    
    // Cigs per day
    if (cigsPerDay >= 31) score += 3;
    else if (cigsPerDay >= 21) score += 2;
    else if (cigsPerDay >= 11) score += 1;
    
    // Morning smoke
    if (moreInMorning) score += 1;
    
    // Smoke when ill
    if (smokeWhenIll) score += 1;

    let dependancyLevel: DependancyLevel = 'low';
    let programWeeks = 2;
    let quitPlanMode: 'gradual' | 'cold-turkey' = 'cold-turkey';

    if (score >= 7) {
      dependancyLevel = 'high';
      programWeeks = 8;
      quitPlanMode = 'gradual';
    } else if (score >= 4) {
      dependancyLevel = 'medium';
      programWeeks = 4;
      quitPlanMode = 'gradual';
    }

    // Method Matching Logic
    let scores = { cbt: 0, act: 0, mindfulness: 0, mi: 0, habit: 0 };
    if (methodReason === 'stress') { scores.cbt += 2; scores.act += 1; }
    if (methodReason === 'boredom') { scores.habit += 2; }
    if (methodReason === 'unconscious') { scores.mindfulness += 2; scores.habit += 1; }

    if (methodApproach === 'gradual') { scores.mi += 3; scores.habit += 1; }
    if (methodApproach === 'cold') { scores.cbt += 1; scores.act += 1; }

    if (methodAnxiety === 'overthink') { scores.act += 3; scores.cbt += 1; }
    if (methodAnxiety === 'action') { scores.habit += 2; scores.mindfulness += 1; }
    if (methodAnxiety === 'logical') { scores.cbt += 2; scores.mi += 1; }

    const orderedMethods = Object.keys(scores).sort((a, b) => scores[b as keyof typeof scores] - scores[a as keyof typeof scores]);
    const matchedMethod = (orderedMethods[0] || 'cbt') as any;

    updateProfile({
      cigarettesPerDay: cigsPerDay,
      yearsSmoking,
      brandStrength: usualBrand as any,
      difficultForbidden,
      timeToFirstSmoke: timeToFirst as any,
      primaryTriggers: triggers,
      mainQuitReason: [quitReason],
      ftndScore: score,
      dependancyLevel,
      programWeeks,
      quitPlanMode,
      quitMethod: matchedMethod,
      quitDate: new Date().toISOString(),
      isOnboarded: true,
      language: language
    }).catch(err => console.error("Update profile failed:", err));
  };

  const toggleTrigger = (tKey: string) => {
    if (triggers.includes(tKey)) {
      setTriggers(triggers.filter(x => x !== tKey));
    } else {
      setTriggers([...triggers, tKey]);
    }
  };

  const timeOptions = [
    { label: t.onboarding.timeOpt5, value: '<5' },
    { label: t.onboarding.timeOpt6to30, value: '6-30' },
    { label: t.onboarding.timeOpt31to60, value: '31-60' },
    { label: t.onboarding.timeOptOver60, value: '>60' }
  ];

  return (
    <div className="w-full h-[100dvh] max-w-md mx-auto bg-white flex flex-col relative sm:border-x border-gray-200">
      {/* Top Header with Progress & Language Selector in normal document flow */}
      {step > 0 && (
        <header className="w-full shrink-0 flex justify-between items-center py-3.5 px-5 border-b border-gray-100 bg-white/95 backdrop-blur-sm z-10 shadow-xs">
           <div className="flex-1 flex gap-2 h-2.5 rounded-full mr-4">
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300 w-full")}></div>
             </div>
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300", step >= 2 ? "w-full" : "w-0")}></div>
             </div>
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300", step >= 3 ? "w-full" : "w-0")}></div>
             </div>
             <div className="flex-1 bg-gray-100 rounded-full overflow-hidden shadow-inner">
               <div className={cn("h-full bg-brand-3d transition-all duration-300", step >= 4 ? "w-full" : "w-0")}></div>
             </div>
           </div>
           <LanguageToggle variant="compact" />
        </header>
      )}

      <div className={cn(
        "flex-1 overflow-y-auto no-scrollbar pb-24 px-5",
        step === 0 ? "pt-6" : "pt-6"
      )}>
        {step === 0 && (
          <div className="h-full flex flex-col justify-between items-center text-center py-4">
            <div className="w-full flex justify-end">
              <LanguageToggle variant="compact" />
            </div>

            <div className="flex flex-col items-center space-y-4 my-auto">
              <div className="icon-solid w-24 h-24 mb-2">
                <HeartPulse className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">
                {t.onboarding.welcomeTitle} <span className="text-sm font-normal text-gray-500">{t.onboarding.welcomeSubtitle}</span>
              </h1>
              <p className="text-gray-500 font-medium px-4 leading-relaxed">
                {t.onboarding.welcomeDesc}
              </p>

              {/* Language Picker on Initial Welcome Screen */}
              <div className="pt-4 w-full max-w-xs space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {t.onboarding.selectLanguage}
                </p>
                <LanguageToggle variant="pill" className="w-full justify-center" />
              </div>
            </div>

            <div className="w-full mt-auto mb-4">
              <button 
                onClick={() => setStep(1)}
                className="w-full btn-primary"
              >
                {t.onboarding.startAssessment}
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">{t.onboarding.step1Title}</h2>
            
            <div className="space-y-6 flex-1">
              <div className="card-duo space-y-3">
                <label className="block text-base font-bold text-gray-700">{t.onboarding.cigsPerDayLabel}</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="1" max="60" value={cigsPerDay} 
                    onChange={e => setCigsPerDay(Number(e.target.value))}
                    className="flex-1 accent-brand cursor-pointer"
                  />
                  <span className="w-12 text-center font-bold text-xl text-brand">{cigsPerDay}</span>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block text-base font-bold text-gray-700">{t.onboarding.yearsSmokingLabel}</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="1" max="50" value={yearsSmoking} 
                    onChange={e => setYearsSmoking(Number(e.target.value))}
                    className="flex-1 accent-brand cursor-pointer"
                  />
                  <span className="w-12 text-center font-bold text-xl text-brand">{yearsSmoking}</span>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block text-base font-bold text-gray-700">{t.onboarding.timeToFirstLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  {timeOptions.map(opt => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => setTimeToFirst(opt.value as any)}
                      className={timeToFirst === opt.value ? "btn-outline btn-outline-active text-xs" : "btn-outline text-xs"}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-full btn-primary"
              >
                {t.common.next} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">{t.onboarding.step2Title}</h2>
            
            <div className="space-y-4 flex-1">
              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">{t.onboarding.difficultForbiddenLabel}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setDifficultForbidden(true)} className={difficultForbidden ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>{t.common.yes}</button>
                  <button type="button" onClick={() => setDifficultForbidden(false)} className={!difficultForbidden ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>{t.common.no}</button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">{t.onboarding.hardestToGiveUpLabel}</label>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setHateToGiveUp('first')} className={hateToGiveUp === 'first' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>
                    {t.onboarding.firstInMorning}
                  </button>
                  <button type="button" onClick={() => setHateToGiveUp('other')} className={hateToGiveUp === 'other' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>
                    {t.onboarding.anyOther}
                  </button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">{t.onboarding.moreInMorningLabel}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setMoreInMorning(true)} className={moreInMorning ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>{t.common.yes}</button>
                  <button type="button" onClick={() => setMoreInMorning(false)} className={!moreInMorning ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>{t.common.no}</button>
                </div>
              </div>
              
              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">{t.onboarding.smokeWhenIllLabel}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSmokeWhenIll(true)} className={smokeWhenIll ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>{t.common.yes}</button>
                  <button type="button" onClick={() => setSmokeWhenIll(false)} className={!smokeWhenIll ? "flex-1 btn-outline btn-outline-active" : "flex-1 btn-outline"}>{t.common.no}</button>
                </div>
              </div>
            </div>

            <button 
                type="button"
                onClick={() => setStep(3)}
                className="w-full btn-primary"
              >
                {t.common.next} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">{t.onboarding.step3Title}</h2>
            
            <div className="space-y-4 flex-1">
              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">{t.onboarding.whenSmokeLabel}</label>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setMethodReason('stress')} className={methodReason === 'stress' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.stressReason}</button>
                  <button type="button" onClick={() => setMethodReason('boredom')} className={methodReason === 'boredom' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.boredomReason}</button>
                  <button type="button" onClick={() => setMethodReason('unconscious')} className={methodReason === 'unconscious' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.unconsciousReason}</button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">{t.onboarding.preferenceLabel}</label>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setMethodApproach('gradual')} className={methodApproach === 'gradual' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.gradualApproach}</button>
                  <button type="button" onClick={() => setMethodApproach('cold')} className={methodApproach === 'cold' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.coldApproach}</button>
                </div>
              </div>

              <div className="card-duo space-y-3">
                <label className="block font-bold text-gray-700">{t.onboarding.dealingAnxietyLabel}</label>
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => setMethodAnxiety('overthink')} className={methodAnxiety === 'overthink' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.overthinkApproach}</button>
                  <button type="button" onClick={() => setMethodAnxiety('action')} className={methodAnxiety === 'action' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.actionApproach}</button>
                  <button type="button" onClick={() => setMethodAnxiety('logical')} className={methodAnxiety === 'logical' ? "btn-outline justify-start btn-outline-active text-sm" : "btn-outline justify-start text-sm"}>{t.onboarding.logicalApproach}</button>
                </div>
              </div>
            </div>

            <button 
                type="button"
                disabled={!methodReason || !methodApproach || !methodAnxiety}
                onClick={() => setStep(4)}
                className={cn("w-full btn-primary", (!methodReason || !methodApproach || !methodAnxiety) ? "opacity-50" : "")}
              >
                {t.common.next} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6 flex flex-col h-full">
            <h2 className="text-2xl font-bold text-gray-800">{t.onboarding.step4Title}</h2>
            
            <div className="space-y-6 flex-1">
              <div className="card-duo">
                <label className="block font-bold text-gray-700 mb-3">{t.onboarding.triggersLabel}</label>
                <div className="flex flex-wrap gap-2">
                  {triggerKeys.map(tKey => {
                    const label = (t.onboarding.triggers as Record<string, string>)[tKey] || tKey;
                    return (
                      <button
                        type="button"
                        key={tKey}
                        onClick={() => toggleTrigger(tKey)}
                        className={triggers.includes(tKey) ? "btn-outline btn-outline-active py-2 px-3 text-xs sm:text-sm h-auto" : "btn-outline py-2 px-3 text-xs sm:text-sm h-auto"}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card-duo">
                <label className="block font-bold text-gray-700 mb-3">{t.onboarding.reasonsLabel}</label>
                <div className="flex flex-col gap-2">
                  {reasonKeys.map(rKey => {
                    const label = (t.onboarding.reasons as Record<string, string>)[rKey] || rKey;
                    return (
                      <button
                        type="button"
                        key={rKey}
                        onClick={() => setQuitReason(rKey)}
                        className={quitReason === rKey ? "btn-outline justify-start btn-outline-active h-auto py-3 text-xs sm:text-sm" : "btn-outline justify-start h-auto py-3 text-xs sm:text-sm"}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button 
                type="button"
                disabled={!quitReason || triggers.length === 0}
                onClick={handleComplete}
                className={cn("w-full btn-primary", (!quitReason || triggers.length === 0) ? "opacity-50" : "")}
              >
                {t.onboarding.finishSetup} <ShieldCheck className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
