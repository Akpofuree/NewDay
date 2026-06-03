import { type FC } from "react";
import {
  Timer,
  BarChart3,
  Flame,
  PauseCircle,
  ShieldCheck,
} from "lucide-react";

interface FocusAnalyticsSectionProps {
  focusCounterSeconds: number;
  focusSelectedPeriod: number;
  focusStatusActive: boolean;
  percentComplete: number;
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const FocusAnalyticsSection: FC<FocusAnalyticsSectionProps> = ({
  focusCounterSeconds,
  focusSelectedPeriod,
  focusStatusActive,
  percentComplete,
}) => {
  return (
    <section
      id="performance-engine"
      className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 lg:py-24 relative z-10"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] items-stretch">
        <article className="rounded-[32px] border border-gray-200/70 dark:border-white/10 bg-white/95 dark:bg-slate-950/75 shadow-2xl shadow-slate-900/5 dark:shadow-black/20 overflow-hidden">
          <div className="p-8 xl:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-950 dark:text-white">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5C27FE]/10 text-[#5C27FE] shadow-sm">
                  <Timer size={20} />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#5C27FE] font-mono">
                    Deep Work Module
                  </p>
                  <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
                    Isolate Focus Hour Timer
                  </h3>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#5C27FE]/20 bg-[#5C27FE]/10 px-3 py-1 text-[11px] font-bold text-[#5C27FE]">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                {focusStatusActive ? "Active Isolate" : "Paused"}
              </span>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Isolate critical tasks. Start a dedicated sprint to mute
              surrounding workspace notifications, block background chat noise,
              and focus on one specific item.
            </p>

            <div className="rounded-[28px] border border-gray-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/70 p-8 relative overflow-hidden">
              <div className="absolute right-6 top-6 h-24 w-24 rounded-full bg-[#5C27FE]/10 blur-3xl" />
              <div className="absolute left-6 bottom-6 h-24 w-24 rounded-full bg-[#0EA5E9]/10 blur-3xl" />

              <div className="relative z-10 space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400 font-bold">
                      Focus Target
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {focusSelectedPeriod} minutes sprint
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-950/90 px-3 py-2 text-[11px] font-bold text-slate-700 dark:text-slate-100 shadow-sm border border-gray-200 dark:border-white/10">
                    <Flame size={14} className="text-[#FF4D4D]" />
                    {focusStatusActive ? "+50 XP" : "+0 XP"}
                  </div>
                </div>

                <div className="rounded-[28px] bg-white dark:bg-slate-950 px-8 py-10 border border-gray-200 dark:border-white/10 shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500 font-bold">
                        Remaining
                      </p>
                      <p className="text-5xl sm:text-6xl font-black text-slate-950 dark:text-white">
                        {formatTime(focusCounterSeconds)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 dark:text-gray-500 font-bold">
                        Status
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {focusStatusActive ? "In progress" : "Paused"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {[15, 25, 45].map((minutes) => (
                      <div
                        key={minutes}
                        className={`rounded-2xl border px-3 py-2 text-center text-xs font-bold transition ${
                          minutes === focusSelectedPeriod
                            ? "border-[#5C27FE] bg-[#5C27FE]/10 text-[#5C27FE]"
                            : "border-gray-200 bg-white text-slate-600 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300"
                        }`}
                      >
                        {minutes}m
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-[#FFB020] px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-[#FFB020]/20 hover:bg-[#f2a000] transition-all"
            >
              <PauseCircle size={18} />
              Pause Active Focus
            </button>

            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Complete focus grants +50 XP multiplier points. Keep the timer
              active to maintain flow and reduce task switching.
            </p>
          </div>
        </article>

        <article className="rounded-[32px] border border-gray-200/70 dark:border-white/10 bg-white/95 dark:bg-slate-950/75 shadow-2xl shadow-slate-900/5 dark:shadow-black/20 overflow-hidden">
          <div className="p-8 xl:p-10 space-y-6">
            <div className="flex items-center gap-3 text-slate-950 dark:text-white">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0EA5E9]/10 text-[#0EA5E9] shadow-sm">
                <BarChart3 size={20} />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#0EA5E9] font-mono">
                  Workspace Importance Triage
                </p>
                <h3 className="text-xl sm:text-2xl font-extrabold leading-tight">
                  Important vs. Non-Important Analytics
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              NewDay automatically splits your task list by importance tiers.
              Urgent & High tasks represent crucial focus priorities, while
              Medium & Low are categorized as day-to-day operational items.
            </p>

            <div className="space-y-5">
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 p-5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.35em] font-bold text-gray-500 dark:text-gray-400">
                    Important (Urgent & High)
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                    3 of 4 done
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF4D4D] to-[#FFB020]"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>

              <div className="rounded-3xl bg-slate-50 dark:bg-slate-900/60 p-5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <span className="text-[10px] uppercase tracking-[0.35em] font-bold text-gray-500 dark:text-gray-400">
                    Non-Important (Medium & Low)
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white">
                    5 of 6 done
                  </span>
                </div>
                <div className="h-3 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#14B8A6] to-[#0EA5E9]"
                    style={{ width: "83%" }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-4 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300">
                <span className="text-[#EF4444]">Urgent Safety Limit</span>
                <p className="mt-2 text-sm text-slate-950 dark:text-white">
                  2 active tasks
                </p>
              </div>
              <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 p-4 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-700 dark:text-slate-300">
                <span className="text-[#10B981]">Milestone Streak</span>
                <p className="mt-2 text-sm text-slate-950 dark:text-white">
                  +12 days consistent
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-900/70 p-4 text-[11px] text-slate-500 dark:text-slate-400">
              Our database synchronization metrics map progress updates in 24ms
              live latency cycles.
            </div>

            <div className="rounded-3xl bg-[#5C27FE]/10 border border-[#5C27FE]/15 p-4 text-[11px] text-[#5C27FE] font-bold text-center">
              +1420 XP
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default FocusAnalyticsSection;
