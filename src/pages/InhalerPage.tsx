import React, { useState, useMemo, useEffect } from "react";
import {
  Wind,
  HelpCircle,
  X,
  ChevronDown,
  ChevronRight,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  BrainCircuit,
  ShoppingCart
} from "lucide-react";
import { useAppContext } from "../store/AppContext";
import { cn } from "../lib/utils";
import { InhalerLog } from "../lib/db";
import { useLanguage } from "../contexts/LanguageContext";

const VARIANTS = [
  {
    id: "warm-bitter",
    name: "Warm-Bitter",
    desc: "post-meal craving",
    color: "bg-brand",
  },
  {
    id: "cool-mint",
    name: "Cool-Mint",
    desc: "stress & fatigue",
    color: "bg-brand",
  },
  {
    id: "spicy-herbal",
    name: "Spicy-Herbal",
    desc: "focus & break",
    color: "bg-brand",
  },
  {
    id: "automatic-bypass",
    name: "Auto Bypass",
    desc: "Bluetooth logger",
    color: "bg-indigo-500",
  },
] as const;

const CONTEXTS = [
  "Setelah makan",
  "Stres kerja",
  "Jeda fokus",
  "Bosan",
  "Sosial (kumpul)",
  "Pagi hari",
  "Lainnya",
];

export default function InhalerPage({ startLogging, setActiveTab }: { startLogging?: boolean, setActiveTab?: (t: any) => void }) {
  const { state, addInhalerLog, deleteInhalerLog } = useAppContext();
  const { t } = useLanguage();
  const [showLogModal, setShowLogModal] = useState(startLogging || false);

  useEffect(() => {
    if (startLogging) setShowLogModal(true);
  }, [startLogging]);

  // Stats & Analytics
  const logs = state.inhalerLogs || [];

  const calculateEffectiveness = (variantId: string) => {
    const vLogs = logs.filter(
      (l) =>
        l.variantUsed === variantId &&
        l.intensityAfter !== null &&
        l.intensityBefore > l.intensityAfter,
    );
    if (vLogs.length === 0)
      return {
        avgReduction: 0,
        count: logs.filter((l) => l.variantUsed === variantId).length,
      };
    const sum = vLogs.reduce(
      (acc, l) => acc + (l.intensityBefore - (l.intensityAfter || 0)),
      0,
    );
    return {
      avgReduction: sum / vLogs.length,
      count: logs.filter((l) => l.variantUsed === variantId).length,
    };
  };

  const variantStats = VARIANTS.map((v) => ({
    ...v,
    stats: calculateEffectiveness(v.id),
  })).sort((a, b) => b.stats.avgReduction - a.stats.avgReduction);

  // Context Analysis
  const topContexts = useMemo(() => {
    const ctxCount: Record<string, number> = {};
    logs.forEach((l) => {
      l.context.forEach((c) => {
        ctxCount[c] = (ctxCount[c] || 0) + 1;
      });
    });
    return Object.entries(ctxCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [logs]);

  const topContextName = topContexts.length > 0 ? topContexts[0][0] : null;
  const bestVariantForTopContext = useMemo(() => {
    if (!topContextName) return null;
    let best = null;
    let maxRed = 0;
    VARIANTS.forEach((v) => {
      const vLogs = logs.filter(
        (l) =>
          l.variantUsed === v.id &&
          l.context.includes(topContextName) &&
          l.intensityAfter !== null,
      );
      if (vLogs.length > 0) {
        const sum = vLogs.reduce(
          (acc, l) => acc + (l.intensityBefore - (l.intensityAfter || 0)),
          0,
        );
        const avg = sum / vLogs.length;
        if (avg > maxRed) {
          maxRed = avg;
          best = v;
        }
      }
    });
    return best;
  }, [logs, topContextName]);

  // Weekly Insight
  const weeklyInsight = useMemo(() => {
    if (logs.length < 5) return null;

    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const weeklyLogs = logs.filter(
      (l) => new Date(l.timestamp) >= last7Days && l.isInhalerAvailable,
    );

    if (weeklyLogs.length === 0) return null;

    const variantCount: Record<string, number> = {};
    let totalReduction = 0;
    let reductionCases = 0;

    weeklyLogs.forEach((l) => {
      variantCount[l.variantUsed] = (variantCount[l.variantUsed] || 0) + 1;
      if (l.intensityAfter !== null && l.intensityBefore > l.intensityAfter) {
        totalReduction += l.intensityBefore - l.intensityAfter;
        reductionCases++;
      }
    });

    let maxVariant = "";
    let maxCount = 0;
    Object.entries(variantCount).forEach(([v, c]) => {
      if (c > maxCount) {
        maxCount = c;
        maxVariant = v;
      }
    });

    const topVarName =
      VARIANTS.find((x) => x.id === maxVariant)?.name || maxVariant;
    const avgRed =
      reductionCases > 0 ? (totalReduction / reductionCases).toFixed(1) : "0";

    return {
      total: weeklyLogs.length,
      topVariant: topVarName,
      avgReduction: avgRed,
      insight: `This week your stress cravings decreased by an average of ${avgRed} points each time you used ${topVarName}.`,
    };
  }, [logs]);

  // Log Form State
  const [variant, setVariant] = useState<string>("");
  const [inhalerAvailable, setInhalerAvailable] = useState(true);
  const [selectedContexts, setSelectedContexts] = useState<string[]>([]);
  const [customContext, setCustomContext] = useState("");
  const [intensityBefore, setIntensityBefore] = useState(5);
  const [intensityAfter, setIntensityAfter] = useState<number | null>(null);

  const toggleContext = (c: string) => {
    if (selectedContexts.includes(c))
      setSelectedContexts(selectedContexts.filter((x) => x !== c));
    else setSelectedContexts([...selectedContexts, c]);
  };

  const saveLog = async () => {
    if (inhalerAvailable && !variant)
      return alert("Select the inhaler variant used");
    if (selectedContexts.length === 0)
      return alert("Select at least 1 craving context");

    let ctx = [...selectedContexts];
    if (ctx.includes("Other") && customContext) {
      ctx = ctx.filter((c) => c !== "Other");
      ctx.push(customContext);
    }

    try {
      await addInhalerLog({
        timestamp: new Date().toISOString(),
        variantUsed: inhalerAvailable ? (variant as any) : "none",
        context: ctx,
        intensityBefore,
        intensityAfter: intensityAfter,
        isInhalerAvailable: inhalerAvailable,
        fallbackMethod: inhalerAvailable ? null : "Sensory Override",
      });
      setShowLogModal(false);

      // Reset form
      setVariant("");
      setSelectedContexts([]);
      setCustomContext("");
      setIntensityBefore(5);
      setIntensityAfter(null);
      setInhalerAvailable(true);
    } catch (err) {
      console.error("Failed to save inhaler log:", err);
      alert("Failed to save log. Please try again.");
    }
  };

  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Fallback view
  if (!showLogModal && logs.length < 5) {
    // We will still show the main view, but with an onboarding prompt.
  }

  return (
    <div className="wellness-page flex flex-col h-full pt-8 px-5 pb-28 overflow-y-auto w-full">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2" style={{ color: '#4A3F35' }}>
            {t.inhaler.title} <Wind className="w-5 h-5" style={{ color: '#5B9BD5' }} />
          </h1>
          <p className="font-semibold" style={{ color: '#8A7A6B' }}>
            {t.inhaler.subtitle}
          </p>
        </div>
        <button
          onClick={() => setShowLogModal(true)}
          className="btn-primary !py-2 !px-4"
        >
          {t.inhaler.logSession}
        </button>
      </header>

      {logs.length < 5 && (
        <div className="p-4 rounded-3xl mb-6 glass-card" style={{ background: 'linear-gradient(180deg,#F2FBF5,#E7F6EE)' }}>
          <h3 className="font-bold flex items-center gap-1" style={{ color: '#1C7D5B' }}>
            <Zap className="w-4 h-4" /> {t.inhaler.aiCalibration}
          </h3>
          <p className="text-sm font-semibold mt-1" style={{ color: '#4A3F35' }}>
            {t.inhaler.aiCalibrationDesc}
          </p>
        </div>
      )}

      {logs.length >= 5 && bestVariantForTopContext && (
        <div className="rounded-3xl p-4 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#3A5A4C,#2A4A3E)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 14px 30px rgba(46,68,59,0.25)' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'rgba(76,195,154,0.25)', filter: 'blur(28px)' }}></div>
          <div className="flex items-center gap-2 font-bold text-[10px] tracking-[0.18em] mb-3 relative z-10" style={{ color: '#8FE3BC' }}>
            <BrainCircuit className="w-4 h-4" /> {t.inhaler.aiRecommendation}
          </div>
          <h3 className="text-white font-bold text-lg mb-2 relative z-10">
            For <span style={{ color: '#FFD964' }}>"{topContextName}"</span> cravings, {bestVariantForTopContext.name} has proven to be the most effective.
          </h3>
          <p className="text-sm font-medium relative z-10" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Keep this variant ready before that situation arises again.
          </p>
        </div>
      )}

      {weeklyInsight && (
        <div className="rounded-3xl p-4 mb-8 glass-card" style={{ background: 'linear-gradient(180deg,#F4FAFF,#E3F0FB)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg,#3FA9E8,#7CC8F5)' }}>
              W
            </div>
            <div>
              <h3 className="font-display font-bold leading-tight" style={{ color: '#2E5E8C' }}>
                {t.inhaler.weeklyInsight}
              </h3>
              <p className="text-[10px] font-bold tracking-wider mt-0.5" style={{ color: '#5B9BD5' }}>
                {t.inhaler.weeklySummary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/90 rounded-2xl p-3 text-center" style={{ border: '1px solid rgba(74,63,53,0.06)' }}>
              <span className="block text-2xl font-bold" style={{ color: '#4A3F35' }}>
                {weeklyInsight.total}
              </span>
              <span className="text-[10px] font-bold" style={{ color: '#B8A99A' }}>
                {t.inhaler.sessions}
              </span>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 text-center" style={{ border: '1px solid rgba(74,63,53,0.06)' }}>
              <span
                className="block text-xl font-bold truncate px-1"
                style={{ color: '#4A3F35' }}
                title={weeklyInsight.topVariant}
              >
                {weeklyInsight.topVariant.split("-")[0]}
              </span>
              <span className="text-[10px] font-bold" style={{ color: '#B8A99A' }}>
                {t.inhaler.topVariant}
              </span>
            </div>
            <div className="bg-white/90 rounded-2xl p-3 text-center" style={{ border: '1px solid rgba(74,63,53,0.06)' }}>
              <span className="block text-2xl font-bold" style={{ color: '#1C7D5B' }}>
                -{weeklyInsight.avgReduction}
              </span>
              <span className="text-[10px] font-bold" style={{ color: '#B8A99A' }}>
                {t.inhaler.cravingPoints}
              </span>
            </div>
          </div>

          <p className="text-sm font-semibold italic p-3 rounded-2xl bg-white/60" style={{ color: '#2E5E8C' }}>
            "{weeklyInsight.insight}"
          </p>
        </div>
      )}

      <section className="mb-8">
        <h2 className="font-display font-bold mb-3 flex items-center justify-between" style={{ color: '#4A3F35' }}>
          {t.inhaler.effectivenessTitle}
          <span className="text-xs font-bold tracking-[0.16em]" style={{ color: '#B8A99A' }}>
            {t.inhaler.scoreboard}
          </span>
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {variantStats.map((v, i) => (
            <div
              key={v.id}
              className="glass-card text-left flex justify-between items-center p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white",
                    v.color,
                  )}
                >
                  <Wind className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm" style={{ color: '#4A3F35' }}>{v.name}</h4>
                  {v.stats.count > 0 ? (
                    <p className="text-xs font-bold mt-0.5 tracking-tight flex items-center gap-0.5" style={{ color: '#1C7D5B' }}>
                      <CheckCircle2 className="w-3 h-3" /> {t.inhaler.dropsPoints.replace('{n}', v.stats.avgReduction.toFixed(1))}
                    </p>
                  ) : (
                    <p className="text-xs font-semibold mt-0.5" style={{ color: '#B8A99A' }}>
                      {t.inhaler.notTriedYet}
                    </p>
                  )}
                </div>
              </div>
              {i === 0 && v.stats.count > 0 && (
                <div className="px-2 py-1 rounded-full text-[10px] font-bold tracking-wide" style={{ background: '#FFF1C4', color: '#7A4D00', border: '1px solid rgba(185,126,12,0.25)' }}>
                  {t.inhaler.mostEffective}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {logs.length > 0 && (
        <section className="mb-8 card-duo">
          <h2 className="font-display font-bold text-sm mb-4" style={{ color: '#4A3F35' }}>
            {t.inhaler.topContexts}
          </h2>
          <div className="space-y-3">
            {topContexts.map(([ctx, count], i) => (
              <div key={ctx}>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span style={{ color: '#4A3F35' }}>{ctx}</span>
                  <span style={{ color: '#B8A99A' }}>{count}x</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(74,63,53,0.07)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(count / topContexts[0][1]) * 100}%`, background: 'linear-gradient(90deg,#2AA97E,#4CC39A)' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display font-bold mb-3 flex items-center justify-between" style={{ color: '#4A3F35' }}>
          {t.inhaler.sessionHistory}
        </h2>
        <div className="space-y-3">
          {logs.slice(0, 10).map((log) => {
            const v = VARIANTS.find((x) => x.id === log.variantUsed);
            const isExpanded = expandedLog === log.id;
            const reduction =
              log.intensityAfter !== null
                ? log.intensityBefore - log.intensityAfter
                : 0;
            return (
              <div
                key={log.id}
                className="glass-card p-4 transition-all"
              >
                <div
                  className="flex justify-between items-start cursor-pointer"
                  onClick={() => setExpandedLog(isExpanded ? null : log.id!)}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          v ? v.color : "bg-gray-300",
                        )}
                      ></div>
                      <span className="font-bold text-sm" style={{ color: '#4A3F35' }}>
                        {v ? v.name : t.inhaler.inhalerFreeFallback}
                      </span>
                      <span className="text-[10px] font-semibold" style={{ color: '#B8A99A' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs font-semibold" style={{ color: '#8A7A6B' }}>
                      {log.context.join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    {log.intensityAfter !== null ? (
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <span style={{ color: '#1C7D5B' }}>
                            {log.intensityBefore}
                          </span>
                          <ChevronRight className="w-3 h-3" style={{ color: '#D9CBB8' }} />
                          <span
                            className={
                              reduction > 0
                                ? ""
                                : ""
                            }
                            style={{ color: reduction > 0 ? '#1C7D5B' : '#8A7A6B' }}
                          >
                            {log.intensityAfter}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#E7F6EE', color: '#1C7D5B' }}>
                        {t.inhaler.pending}
                      </span>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="mt-4 pt-4 animate-in slide-in-from-top-2 flex justify-between items-center" style={{ borderTop: '1px solid rgba(74,63,53,0.08)' }}>
                     <button
                       onClick={() => deleteInhalerLog(log.id!)}
                       className="text-xs font-bold px-2.5 py-1 rounded-full transition-colors cursor-pointer"
                       style={{ color: '#C2542F', background: '#FFE9DB' }}
                     >
                       {t.inhaler.deleteRecord}
                     </button>
                  </div>
                )}
              </div>
            );
          })}
          {logs.length === 0 && (
            <div className="text-center p-8 rounded-3xl" style={{ background: 'rgba(74,63,53,0.03)', border: '1.5px dashed rgba(74,63,53,0.15)' }}>
              <Wind className="w-8 h-8 mx-auto mb-2" style={{ color: '#D9CBB8' }} />
              <p className="text-sm font-semibold" style={{ color: '#8A7A6B' }}>
                {t.inhaler.noSessions}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-t-[1.75rem] flex flex-col h-[90vh]" style={{ background: 'linear-gradient(180deg,#FFFDF7,#FFF8EC)', boxShadow: '0 -12px 40px rgba(74,63,53,0.18)' }}>
            <div className="p-3 flex justify-between items-center shrink-0" style={{ borderBottom: '1px solid rgba(74,63,53,0.07)' }}>
              <h2 className="font-display font-bold text-xl" style={{ color: '#4A3F35' }}>
                {t.inhaler.logModalTitle}
              </h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: 'rgba(74,63,53,0.06)', color: '#8A7A6B' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-gray-800">
                    1. {t.inhaler.variantLabel}
                  </label>
                </div>
                {inhalerAvailable ? (
                  <>
                    <div className="grid grid-cols-1 gap-2 mb-3">
                      {VARIANTS.map((v) => (
                        <button
                          onClick={() => setVariant(v.id)}
                          key={v.id}
                          className={cn(
                            "p-4 rounded-xl border flex items-center justify-between transition-all",
                            variant === v.id
                              ? `bg-gray-900 border-gray-900 text-white ${v.color.replace("bg-", "shadow-")}/20 shadow-lg`
                              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300",
                          )}
                        >
                          <div>
                            <h4 className="font-bold text-sm">{v.name}</h4>
                            <p
                              className={cn(
                                "text-xs font-medium",
                                variant === v.id
                                  ? "text-gray-300"
                                  : "text-gray-400",
                              )}
                            >
                              {v.desc}
                            </p>
                          </div>
                          <div
                            className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                              variant === v.id
                                ? "border-brand bg-brand"
                                : "border-gray-300",
                            )}
                          >
                            {variant === v.id && (
                              <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                       <button
                         onClick={() => setInhalerAvailable(false)}
                         className="text-xs font-bold text-gray-500 underline text-center w-full block hover:text-gray-700"
                       >
                         Craving but no inhaler?
                       </button>
                       <button onClick={() => { setShowLogModal(false); if(setActiveTab) setActiveTab('shop'); }} className="mt-2 bg-gradient-to-r from-brand to-brand-light text-white p-3 rounded-xl flex items-center justify-between shadow-[0_4px_0_var(--color-brand-dark)] active:translate-y-1 active:shadow-none transition-all">
                          <div>
                            <p className="text-[10px] font-bold text-white/80">Need more pods?</p>
                            <p className="text-sm font-bold">Visit the Inhaler Shop</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                             <ShoppingCart className="w-4 h-4 text-white" />
                          </div>
                       </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-brand-surface border border-brand/30 p-4 rounded-2xl">
                    <h3 className="font-bold text-brand-dark flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5" /> Sensory Hack Fallback
                    </h3>
                    <p className="text-sm font-medium text-brand-dark mb-3">
                      Try one of these options based on your situation:
                    </p>
                    <ul className="text-xs font-bold text-brand-dark space-y-2 mb-4">
                      <li>
                        â€¢ After eating: Drink ice water / chew strong gum.
                      </li>
                      <li>
                        â€¢ Stressed: Wash face with cold water / 4-7-8
                        breathing.
                      </li>
                      <li>â€¢ Bored: 2 minutes stretching / quick walk.</li>
                    </ul>
                    <button
                      onClick={() => setInhalerAvailable(true)}
                      className="btn-outline w-full bg-white border-brand/30 text-brand-dark"
                    >
                      Back to Inhaler
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  2. Craving Context (Select &gt; 1)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTEXTS.map((c) => (
                    <button
                      onClick={() => toggleContext(c)}
                      key={c}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors",
                        selectedContexts.includes(c)
                          ? "bg-brand text-white border-brand shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                {selectedContexts.includes("Lainnya") && (
                  <input
                    type="text"
                    value={customContext}
                    onChange={(e) => setCustomContext(e.target.value)}
                    placeholder="Write context..."
                    className="mt-3 w-full border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm focus:border-brand focus:outline-none"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  3. Intensity *Before* (1-10)
                </label>
                <p className="text-xs text-gray-500 font-medium mb-3">
                  How strong was the urge to smoke?
                </p>
                <div className="flex gap-4 items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensityBefore}
                    onChange={(e) => setIntensityBefore(Number(e.target.value))}
                    className="flex-1 accent-rose-500"
                  />
                  <span className="text-xs font-bold text-gray-800 w-4">
                    {intensityBefore}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">
                  4. Intensity *After* (1-10)
                </label>
                <p className="text-xs text-gray-500 font-medium mb-3">
                  Fill it out now or skip it, we'll remind you later.
                </p>
                <div className="flex gap-4 items-center mb-2">
                  <span className="text-xs font-bold text-gray-400">Low</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensityAfter || 1}
                    onChange={(e) => setIntensityAfter(Number(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-xs font-bold text-gray-800 w-4">
                    {intensityAfter !== null ? intensityAfter : "-"}
                  </span>
                </div>
                {intensityAfter === null && (
                  <button
                    onClick={() => setIntensityAfter(intensityBefore)}
                    className="text-xs font-bold text-brand bg-brand-50 px-3 py-1 rounded-full"
                  >
                    Same as Before
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(74,63,53,0.07)', background: '#FFFDF7' }}>
              <button
                onClick={saveLog}
                className="btn-primary w-full"
              >
                Save Inhaler Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
