import React, { useState } from 'react';
import { useAppContext } from '../store/AppContext';
import CBTMethod from '../components/methods/CBTMethod';
import ACTMethod from '../components/methods/ACTMethod';
import MindfulnessMethod from '../components/methods/MindfulnessMethod';
import MIMethod from '../components/methods/MIMethod';
import HabitMethod from '../components/methods/HabitMethod';
import { 
  CheckCircle2, RefreshCcw, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { QuitMethod } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export default function MethodPage() {
  const { state, updateProfile } = useAppContext();
  const { t } = useLanguage();
  const method = state.profile?.quitMethod || 'cbt';
  const [showChangeMethod, setShowChangeMethod] = useState(false);

  const retakeAssessment = async () => {
    if (confirm(t.methods.retakeConfirm)) {
      await updateProfile({ isOnboarded: false });
      window.location.reload();
    }
  };

  const manualChangeMethod = async (newMethod: QuitMethod) => {
    await updateProfile({ quitMethod: newMethod });
    setShowChangeMethod(false);
  };

  // Friendly label for the active method
  const methodBadgeMap: Record<string, string> = {
    cbt: 'CBT Focus',
    act: 'ACT Focus',
    mindfulness: 'Mindfulness Focus',
    mi: 'MI Focus',
    habit: 'Habit Focus',
  };
  const activeBadge = methodBadgeMap[method] || 'Core Focus';

  return (
    <div className="flex-1 overflow-y-auto bg-transparent pb-24 relative flex flex-col">
      {/* Inline header bar — no absolute positioning, zero overlap */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1 shrink-0">
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ background: 'rgba(42,169,126,0.12)', color: '#1C7D5B', border: '1px solid rgba(42,169,126,0.2)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2AA97E] animate-pulse" />
          {activeBadge}
        </div>
        <button
          onClick={() => setShowChangeMethod(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-colors"
          style={{ background: 'rgba(255,255,255,0.9)', color: '#6B7280', border: '1px solid #E5E7EB', boxShadow: '0 2px 0 #E5E7EB' }}
        >
          <RefreshCcw className="w-3 h-3" /> {t.methods.changeMethod}
        </button>
      </div>

      {method === 'cbt' && <CBTMethod />}
      {method === 'act' && <ACTMethod />}
      {method === 'mindfulness' && <MindfulnessMethod />}
      {method === 'mi' && <MIMethod />}
      {method === 'habit' && <HabitMethod />}

      {showChangeMethod && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl border-t-2 border-gray-200 overflow-hidden flex flex-col p-4 max-h-[90vh] overflow-y-auto" style={{boxShadow: '0 -4px 0 #E5E7EB'}}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-gray-900">{t.methods.changeMethodTitle}</h2>
              <button onClick={() => setShowChangeMethod(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 mb-6">
               <p className="text-sm text-gray-500 font-medium mb-2">{t.methods.changeMethodDesc}</p>
               
               <button onClick={() => manualChangeMethod('cbt')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors cursor-pointer", method === 'cbt' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'cbt' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Cognitive Behavioral (CBT)</h4><p className="text-xs text-gray-500 font-medium">Rewire thought patterns</p></div>
                  {method === 'cbt' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>
               
               <button onClick={() => manualChangeMethod('act')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors cursor-pointer", method === 'act' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'act' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Acceptance & Commitment (ACT)</h4><p className="text-xs text-gray-500 font-medium">Surf urges and focus on values</p></div>
                  {method === 'act' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>

               <button onClick={() => manualChangeMethod('mindfulness')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors cursor-pointer", method === 'mindfulness' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'mindfulness' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Mindfulness-Based</h4><p className="text-xs text-gray-500 font-medium">Break the autopilot cycle</p></div>
                  {method === 'mindfulness' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>

               <button onClick={() => manualChangeMethod('mi')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors cursor-pointer", method === 'mi' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'mi' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Gradual Quitter (MI)</h4><p className="text-xs text-gray-500 font-medium">Step-down reduction & motivation</p></div>
                  {method === 'mi' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>

               <button onClick={() => manualChangeMethod('habit')} className={cn("w-full text-left p-4 rounded-2xl border-2 flex justify-between items-center transition-colors cursor-pointer", method === 'habit' ? "bg-brand/10 border-brand" : "border-gray-200 hover:border-gray-300 bg-white")} style={{boxShadow: method === 'habit' ? '0 4px 0 var(--color-brand)' : '0 4px 0 #E5E7EB'}}>
                  <div><h4 className="font-bold text-gray-800 text-sm">Habit Replacement</h4><p className="text-xs text-gray-500 font-medium">Swap the routine, keep the reward</p></div>
                  {method === 'habit' && <CheckCircle2 className="w-5 h-5 text-brand" />}
               </button>
            </div>

            <div className="pt-2">
               <button onClick={retakeAssessment} className="w-full bg-white text-gray-600 border-2 border-gray-200 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:scale-95 transition-all cursor-pointer" style={{boxShadow: '0 4px 0 #E5E7EB'}}>
                 <RefreshCcw className="w-4 h-4" /> {t.methods.retakeAssessment}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

