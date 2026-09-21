import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Send, Bot, Target, CheckCircle2, ThumbsUp, ThumbsDown, Zap, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';
import { AiConversation, Mission, CoachInsightItem } from '../lib/db';
import ReactMarkdown from 'react-markdown';
import { differenceInDays, subDays } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { CompanionAvatar } from '../components/wellness';
import mascotImg from '../assets/mascot/noconi-mascot.png';

// Keep the coach responsive mid-craving: fail fast rather than hang the UI.
const CHAT_TIMEOUT_MS = 30000;
const MAX_TOOL_ROUNDS = 3;

export function ChatPage({ setActiveTab }: { setActiveTab?: (tab: any) => void }) {
  const { state, addChatMessage, updateProfile, addMission, updateMission, markInsightRead } = useAppContext();
  const { t } = useLanguage();
  const [activeTab, setLocalActiveTab] = useState<'chat' | 'missions'>('chat');

  return (
    <div className="wellness-page flex flex-col h-full relative overflow-hidden">
      <header className="px-5 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 1px 12px rgba(42,169,126,0.06)' }}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Clean circular mascot container — no animation clip */}
          <div className="w-10 h-10 rounded-full bg-[#EAF7EF] border-2 border-[#D5EFE0] flex items-center justify-center shrink-0 overflow-hidden">
            <img src={mascotImg} alt="Coach" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-[17px] font-bold leading-tight truncate">{t.chat.coachTitle}</h1>
            <p className="text-xs font-semibold truncate" style={{ color: '#1C7D5B' }}>{t.chat.online}</p>
          </div>
        </div>
        <div className="flex p-1 rounded-full shrink-0" style={{ background: 'rgba(74,63,53,0.07)' }}>
           <button
              onClick={() => setLocalActiveTab('chat')}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer", activeTab === 'chat' ? "bg-white shadow-sm" : "")}
              style={activeTab === 'chat' ? { color: '#4A3F35' } : { color: '#8A7A6B' }}
           >{t.chat.chatTab}</button>
           <button
              onClick={() => setLocalActiveTab('missions')}
              className={cn("px-4 py-1.5 text-xs font-bold rounded-full transition-all cursor-pointer", activeTab === 'missions' ? "bg-white shadow-sm" : "")}
              style={activeTab === 'missions' ? { color: '#4A3F35' } : { color: '#8A7A6B' }}
           >{t.chat.trackerTab}</button>
        </div>
      </header>

      {activeTab === 'chat' ? <ChatInterface setActiveTab={setActiveTab} /> : <TrackerInterface />}
    </div>
  );
}

function ChatInterface({ setActiveTab }: { setActiveTab?: (tab: any) => void }) {
   const { state, addChatMessage, addCraving, addInhalerLog, addMission } = useAppContext();
   const { t, language } = useLanguage();
   const [input, setInput] = useState('');
   const [isTyping, setIsTyping] = useState(false);
   const messagesEndRef = useRef<HTMLDivElement>(null);

   const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   };

   useEffect(() => {
      scrollToBottom();
   }, [state.messages, isTyping]);

   const lastCraving = state.cravings[0];
   const lastCravingMins = lastCraving ? (new Date().getTime() - new Date(lastCraving.timestamp).getTime()) / 60000 : Infinity;
   const streakStartDate = state.profile?.lastSmoked ? new Date(state.profile.lastSmoked) : (state.profile?.quitDate ? new Date(state.profile.quitDate) : new Date());
   const currentDay = differenceInDays(new Date(), streakStartDate);

   // Dynamic Quick Actions
   const quickActions = useMemo(() => {
      let actions = [];
      if (lastCravingMins < 60) {
         if (lastCraving?.outcome === 'smoked') {
            actions = [t.chat.quickSmoked1, t.chat.quickSmoked2, t.chat.quickSmoked3];
         } else if (lastCraving?.intensity >= 7) {
            actions = [t.chat.quickIntense1, t.chat.quickIntense2, language === 'id' ? `Tunjukkan teknik relaksasi` : `Show me relaxation techniques`];
         } else {
            actions = [t.chat.quickFaded, t.chat.quickTrigger];
         }
      } else if (currentDay > 0 && currentDay % 7 === 0) {
         actions = [t.chat.quickCelebrate, t.chat.quickNextGoal, t.chat.quickBodyChange];
      } else {
         actions = [t.chat.quickTips, t.chat.quickMind, t.chat.quickProgress];
      }
      return actions;
   }, [lastCravingMins, lastCraving, currentDay, state.profile, language, t]);

   const emotionRegex = {
      distressed: /(can't|give up|tired|dizzy|stressed|heavy|impossible)/i,
      ambivalent: /(hesitant|unsure|maybe|guess|confused)/i,
      motivated: /(excited|can do this|ready|want to try|keep going|sure)/i
   };

   const detectEmotion = (text: string) => {
      if (emotionRegex.distressed.test(text)) return 'distressed';
      if (emotionRegex.motivated.test(text)) return 'motivated';
      if (emotionRegex.ambivalent.test(text)) return 'ambivalent';
      return 'neutral';
   };

   const postChat = async (payload: any) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CHAT_TIMEOUT_MS);
      try {
         const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal
         });
         const data = await res.json().catch(() => ({}));
         if (!res.ok) {
            const err: any = new Error(data.error || "Request failed");
            err.code = data.code;
            throw err;
         }
         return data;
      } finally {
         clearTimeout(timer);
      }
   };

   // Runs a tool the model asked for against the local database, then hands the
   // outcome back so the model can phrase a natural follow-up itself.
   const executeToolCall = async (call: any) => {
      const args = call.args || {};
      try {
         if (call.name === 'navigate_feature' && typeof setActiveTab === 'function') {
            setActiveTab(args.tabName);
            return { name: call.name, args, response: { output: `Opened the ${args.tabName} tab.` } };
         }

         if (call.name === 'log_craving_for_user' && addCraving) {
            const intensity = Math.min(10, Math.max(1, Number(args.intensity) || 5));
            const unlocked = await addCraving({
               timestamp: new Date().toISOString(),
               intensity,
               trigger_category: args.trigger_category || 'other',
               outcome: args.outcome === 'smoked' ? 'smoked' : 'resisted',
               inhaler_used: false,
               notes: args.notes || 'Logged via AI Coach'
            });
            const output = unlocked && unlocked.length
               ? `Craving logged. Milestone unlocked: ${unlocked.map((m: any) => m.title).join(', ')}. Congratulate them on it.`
               : 'Craving logged successfully.';
            return { name: call.name, args, response: { output } };
         }

         if (call.name === 'log_inhaler_for_user' && addInhalerLog) {
            const before = Math.min(10, Math.max(1, Number(args.intensityBefore) || 5));
            const after = Math.min(10, Math.max(0, Number(args.intensityAfter) || 0));
            await addInhalerLog({
               timestamp: new Date().toISOString(),
               variantUsed: 'none',
               context: ['ai_logged'],
               intensityBefore: before,
               intensityAfter: after,
               isInhalerAvailable: true,
               fallbackMethod: null,
               notes: args.notes || 'Logged via AI Coach'
            });
            return { name: call.name, args, response: { output: `Inhaler use logged, intensity went from ${before} to ${after}.` } };
         }

         if (call.name === 'create_personal_mission' && addMission) {
            await addMission({
               title: args.title,
               description: args.description,
               targetCount: Number(args.targetCount) || 1,
               currentCount: 0,
               status: 'active',
               startDate: new Date().toISOString(),
               endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
               relatedMethod: args.relatedMethod
            });
            return { name: call.name, args, response: { output: `Mission created: "${args.title}".` } };
         }

         return { name: call.name, args, response: { error: `Unsupported tool: ${call.name}` } };
      } catch (err) {
         console.error('Tool call failed:', call.name, err);
         return { name: call.name, args, response: { error: `Failed to run ${call.name}.` } };
      }
   };

   // Only used if the tools ran but the model reply never arrived.
   const toolConfirmation = (names: string[]) => {
      if (names.includes('log_craving_for_user')) return t.chat.savedCraving;
      if (names.includes('log_inhaler_for_user')) return t.chat.savedInhaler;
      if (names.includes('create_personal_mission')) return t.chat.savedMission;
      if (names.includes('navigate_feature')) return t.chat.openedFeature;
      return t.chat.fallbackReply;
   };

   const handleSend = async (messageText: string = input) => {
      if (!messageText.trim() || isTyping) return;

      const userMessage: Omit<AiConversation, 'id'> = {
        role: 'user',
        content: messageText,
        sessionId: 'default_session',
        timestamp: new Date().toISOString()
      };

      try {
         await addChatMessage(userMessage);
      } catch (e) {
         console.error(e);
      }

      setInput('');
      setIsTyping(true);

      const pushAiMessage = async (content: string) => {
         await addChatMessage({
            role: 'ai',
            content,
            sessionId: 'default_session',
            timestamp: new Date().toISOString()
         });
      };

      try {
        const now = new Date();
        const weekAgo = subDays(now, 7);
        const last7cravings = state.cravings.filter(c => new Date(c.timestamp) >= weekAgo);
        const resistedLast7 = last7cravings.filter(c => c.outcome === 'resisted').length;
        const resistanceRate = last7cravings.length ? Math.round((resistedLast7 / last7cravings.length) * 100) : 0;

        // Tailor the coaching context to whichever method the user is on.
        const method = state.profile?.quitMethod || 'None';
        let methodEngagements = 0;
        let methodContext = '';
        switch (method) {
           case 'cbt':
              methodEngagements = state.cbtJournals?.length || 0;
              methodContext = state.cbtJournals?.[0]
                 ? `Last thought journal â€” tagged "${state.cbtJournals[0].situationTag}", reframed to "${state.cbtJournals[0].reframe}".`
                 : 'No thought journals logged yet.';
              break;
           case 'act':
              methodEngagements = state.actUrges?.length || 0;
              methodContext = state.actUrges?.[0]
                 ? `Last urge surf lasted ${state.actUrges[0].durationMinutes} minutes.`
                 : 'No urge surfs logged yet.';
              break;
           case 'mindfulness':
              methodEngagements = state.mindfulnessLogs?.length || 0;
              methodContext = state.mindfulnessLogs?.[0]
                 ? `Last session was a ${state.mindfulnessLogs[0].type} lasting ${state.mindfulnessLogs[0].durationMinutes ?? 0} minutes.`
                 : 'No mindfulness sessions logged yet.';
              break;
           case 'mi':
              methodEngagements = state.miReductionLogs?.length || 0;
              methodContext = state.miReductionLogs?.[0]
                 ? `Latest reduction log: ${state.miReductionLogs[0].cigarettesSmoked} of a ${state.miReductionLogs[0].targetCigarettes} cigarette target on ${state.miReductionLogs[0].date}.`
                 : 'No reduction logs yet.';
              break;
           case 'habit':
              methodEngagements = (state.habitLogs?.length || 0) + (state.habitLoops?.length || 0);
              methodContext = state.habitLoops?.[0]
                 ? `Latest habit loop â€” cue "${state.habitLoops[0].cue}", routine "${state.habitLoops[0].routine}", replacement "${state.habitLoops[0].replacement}".`
                 : 'No habit loops mapped yet.';
              break;
        }

        const emotion = detectEmotion(messageText);

        // Calculate top mood
        const moodCount: Record<string, number> = {};
        last7cravings.forEach(c => {
           if (c.mood) {
              moodCount[c.mood] = (moodCount[c.mood] || 0) + 1;
           }
        });
        const topMood = Object.keys(moodCount).sort((a,b) => moodCount[b] - moodCount[a])[0] || 'Unknown';

        // BHI proxy
        let bhiProxy = 'Moderate';
        if (resistanceRate > 70 && methodEngagements >= 2) bhiProxy = 'Excellent/Near Freedom';
        else if (resistanceRate < 40) bhiProxy = 'Struggling/Beginner';

        const recentHistory = state.messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n');

        const payload = {
           messageText,
           recentHistory,
           methodEngagements,
           currentDay,
           primaryTriggers: state.profile?.primaryTriggers || [],
           resistanceRate,
           last7cravingsCount: last7cravings.length,
           topMood,
           bhiProxy,
           emotion,
           quitMethod: method,
           methodContext,
           language: language || 'id'
        };

        let data = await postChat(payload);
        let rounds = 0;
        const executedTools: string[] = [];

        // The model either answers directly or asks us to run tools first. Run
        // them locally, send the results back, and let it reply for real.
        while ((data.functionCalls || []).length > 0 && rounds < MAX_TOOL_ROUNDS) {
           const results = [];
           for (const call of data.functionCalls) {
              results.push(await executeToolCall(call));
              executedTools.push(call.name);
           }
           data = await postChat({ ...payload, toolResults: results });
           rounds++;
        }

        const finalReply = (data.text || '').trim() || toolConfirmation(executedTools);

        await pushAiMessage(finalReply);
      } catch (error: any) {
        console.error(error);
        // Put their words back so retrying costs nothing.
        setInput(messageText);
        const failureMessage = error?.code === 'AI_NOT_CONFIGURED'
           ? t.chat.notConfigured
           : error?.code === 'AI_KEY_INVALID'
              ? t.chat.keyInvalid
              : error?.name === 'AbortError'
                 ? t.chat.timeout
                 : t.chat.error;
        try {
          await pushAiMessage(failureMessage);
        } catch (innerError) {
          console.error("Failed to add error message:", innerError);
        }
      } finally {
        setIsTyping(false);
      }
   };

   return (
      <div className="flex-1 flex flex-col relative overflow-hidden">
         <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32" style={{ isolation: 'isolate', background: 'linear-gradient(180deg, rgba(220,242,255,0.45) 0%, rgba(232,248,240,0.30) 40%, rgba(255,255,255,0.0) 100%)' }}>
            {state.messages.length === 0 && (
               <div className="flex flex-col items-center text-center my-6 px-2">
                  <CompanionAvatar mood="happy" size={96} grounded />
                  <div className="rounded-3xl bg-white/90 p-4 mt-4 w-full" style={{ border: '1px solid rgba(255,255,255,0.9)', outline: '1px solid rgba(74,63,53,0.07)', boxShadow: '0 10px 30px rgba(74,63,53,0.08)' }}>
                     <p className="text-[15px] font-semibold leading-relaxed" style={{ color: '#4A3F35' }}>
                        {t.chat.emptyGreeting}
                     </p>
                  </div>
               </div>
            )}

            {state.messages.map(msg => (
               <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                     "max-w-[80%] rounded-[1.25rem] px-5 py-3 text-[15px] font-medium shadow-sm border leading-relaxed",
                     msg.role === 'user' ? "rounded-br-sm" : "bg-white/95 rounded-bl-sm prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-strong:font-bold"
                  )}
                  style={
                     msg.role === 'user'
                        ? { background: 'linear-gradient(135deg,#2AA97E,#35BD8D)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 6px 16px rgba(42,169,126,0.28)' }
                        : { color: '#4A3F35', border: '1px solid rgba(255,255,255,0.9)', outline: '1px solid rgba(74,63,53,0.06)' }
                  }>
                     {msg.role === 'user' ? (
                        msg.content
                     ) : (
                        <div className="markdown-body">
                           <ReactMarkdown>{msg.content.replace(/<think>[\s\S]*?<\/think>/g, '')}</ReactMarkdown>
                        </div>
                     )}
                  </div>
               </div>
            ))}

            {isTyping && (
               <div className="flex justify-start">
                  <div className="rounded-[1.25rem] rounded-bl-sm px-5 py-3.5 flex items-center gap-1.5" style={{ background: '#FFFFFF', border: '1px solid rgba(255,255,255,0.9)', outline: '1px solid rgba(74,63,53,0.06)' }}>
                     <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4CC39A', animationDelay: '0ms' }} />
                     <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4CC39A', animationDelay: '150ms' }} />
                     <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: '#4CC39A', animationDelay: '300ms' }} />
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
         </div>

         {/* Input Box and Quick Actions stick to bottom */}
         <div className="absolute bottom-0 w-full shrink-0 z-10 flex flex-col" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.97) 100%)' }}>
            <div className="flex gap-2 overflow-x-auto p-3 scrollbar-hide">
               {quickActions.map((qa, i) => (
                  <button
                     key={i}
                     onClick={() => handleSend(qa)}
                     className="shrink-0 px-4 py-2 rounded-full text-xs font-bold active:scale-95 transition-transform press-soft"
                     style={{ background: '#E7F6EE', color: '#1C7D5B', border: '1px solid rgba(42,169,126,0.25)' }}
                  >
                     {qa}
                  </button>
               ))}
            </div>
            <div className="p-4 pt-1 flex items-center gap-2">
               <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder={t.chat.placeholder}
                  className="flex-1 rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none transition-colors"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(74,63,53,0.12)', color: '#4A3F35' }}
               />
               <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 text-white font-bold rounded-2xl flex items-center justify-center disabled:opacity-50 shrink-0 transition-all press-soft"
                  style={{ background: 'linear-gradient(135deg,#2AA97E,#4CC39A)', boxShadow: '0 5px 0 #1C7D5B, 0 10px 20px rgba(42,169,126,0.3)' }}
               >
                  <Send className="w-5 h-5 ml-1" />
               </button>
            </div>
         </div>
      </div>
   )
}

function TrackerInterface() {
   const { state, updateMission, markInsightRead } = useAppContext();
   const { t, language } = useLanguage();
   const activeMission = state.missions.find(m => m.status === 'active');
   const completedMissions = state.missions.filter(m => m.status === 'completed');
   
   return (
      <div className="flex-1 overflow-y-auto wellness-page p-3 space-y-8 pb-32">
         {/* INSIGHT FEED */}
         <section>
            <h3 className="font-bold text-[17px] mb-1 flex items-center gap-2" style={{ color: '#4A3F35' }}><Lightbulb className="w-4 h-4" style={{ color: '#FFC531' }}/> {t.chat.insightFeed}</h3>
            <p className="text-[12px] font-semibold mb-4 ml-1" style={{ color: '#8A7A6B' }}>
               {language === 'id' ? 'pikiran kecil dariku untukmu' : 'little thoughts from me to you'}
            </p>
            <div className="space-y-3">
               {state.coachInsights.length > 0 ? state.coachInsights.map(insight => (
                  <div key={insight.id} className={`glass-card p-3.5 transition-all ${insight.isRead ? 'opacity-70' : ''}`} style={!insight.isRead ? { outline: '1.5px solid rgba(42,169,126,0.45)' } : undefined}>
                     <p className="text-sm font-semibold leading-relaxed mb-4" style={{ color: '#4A3F35' }}>{insight.content}</p>
                     <div className="flex justify-between items-center pt-3" style={{ borderTop: '1px solid rgba(74,63,53,0.08)' }}>
                        <span className="text-[10px] font-bold" style={{ color: '#B8A99A' }}>{new Date(insight.timestamp).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                           <button className="p-1.5 rounded-full hover:bg-black/5 cursor-pointer"><ThumbsUp className="w-4 h-4" style={{ color: '#8A7A6B' }}/></button>
                           <button className="p-1.5 rounded-full hover:bg-black/5 cursor-pointer"><ThumbsDown className="w-4 h-4" style={{ color: '#8A7A6B' }}/></button>
                        </div>
                     </div>
                  </div>
               )) : (
                  <div className="glass-card p-3 text-center" style={{ background: 'linear-gradient(180deg,#F2FBF5,#E7F6EE)' }}>
                     <p className="text-sm font-semibold leading-relaxed py-4" style={{ color: '#4A3F35' }}>{t.chat.noInsight}</p>
                  </div>
               )}
            </div>
         </section>

         {/* MISSION BOARD */}
         <section>
            <h3 className="font-bold text-[17px] mb-1 flex items-center gap-2" style={{ color: '#4A3F35' }}><Target className="w-4 h-4" style={{ color: '#1C7D5B' }}/> {t.chat.personalMission}</h3>
            {activeMission ? (
               <div className="p-5 relative overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(135deg,#3A5A4C,#2A4A3E)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 14px 30px rgba(46,68,59,0.28)' }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-[100px]" style={{ background: 'linear-gradient(to bottom left, rgba(255,255,255,0.1), transparent)' }}></div>
                  <div className="flex justify-between items-center mb-4 relative z-10">
                     <span className="text-[10px] tracking-widest font-bold px-2.5 py-1 rounded-full text-white" style={{ background: 'rgba(255,255,255,0.18)' }}>{t.chat.activeStatus}</span>
                     <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>{activeMission.currentCount} / {activeMission.targetCount} {t.chat.doneStatus}</span>
                  </div>

                  <h4 className="font-display font-bold text-xl leading-tight mb-2 relative z-10 text-white">{activeMission.title}</h4>
                  <p className="text-sm font-medium leading-relaxed mb-6 relative z-10" style={{ color: 'rgba(255,255,255,0.8)' }}>{activeMission.description}</p>

                  <div className="relative z-10 space-y-2">
                     <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.12)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${(activeMission.currentCount / activeMission.targetCount) * 100}%`, background: 'linear-gradient(90deg,#4CC39A,#FFC531)' }}></div>
                     </div>
                     <button
                        onClick={() => updateMission(activeMission.id, { currentCount: activeMission.currentCount + 1 })}
                        className="w-full font-bold py-3 mt-4 rounded-2xl text-sm flex justify-center items-center gap-2 cursor-pointer press-soft"
                        style={{ background: '#FFFDF7', color: '#1C7D5B', boxShadow: '0 4px 0 rgba(0,0,0,0.2)' }}
                     >
                        <CheckCircle2 className="w-4 h-4" /> {t.chat.logProgress}
                     </button>
                  </div>
               </div>
            ) : (
               <div className="rounded-3xl p-6 text-center glass-card">
                  <h4 className="font-bold mb-2" style={{ color: '#4A3F35' }}>{t.chat.noActiveMission}</h4>
                  <p className="text-sm font-semibold" style={{ color: '#8A7A6B' }}>
                     {t.chat.noActiveMissionDesc}
                  </p>
               </div>
            )}

            {completedMissions.length > 0 && (
               <div className="mt-8">
                  <h4 className="text-xs font-bold tracking-[0.16em] mb-3" style={{ color: '#B8A99A' }}>{t.chat.pastMissions}</h4>
                  <div className="space-y-3">
                     {completedMissions.map((m, i) => (
                        <div key={i} className="glass-card p-4">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: '#E7F6EE' }}>
                                 <Zap className="w-5 h-5" style={{ color: '#1C7D5B' }} />
                              </div>
                              <div>
                                 <h5 className="font-bold text-sm" style={{ color: '#4A3F35' }}>{m.title}</h5>
                                 <p className="text-[10px] font-bold tracking-widest mt-0.5" style={{ color: '#B8A99A' }}>{m.targetCount}/{m.targetCount} {t.chat.completedSuffix}</p>
                              </div>
                           </div>
                           {m.reflection && <p className="text-xs font-medium italic mt-3 p-2.5 rounded-xl" style={{ color: '#8A7A6B', background: 'rgba(74,63,53,0.04)' }}>"{m.reflection}"</p>}
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </section>
      </div>
   )
}
