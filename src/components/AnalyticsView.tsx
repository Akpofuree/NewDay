import React from "react";
import { Task, User, Group, Goal } from "../types";
import {
  BarChart3,
  PieChart,
  Timer,
  Trophy,
  Flame,
  Zap,
  CheckCircle2,
  Clock,
} from "lucide-react";

interface AnalyticsViewProps {
  tasks: Task[];
  goals: Goal[];
  users: User[];
  groups: Group[];
}

function computeGoalProgress(goal: Goal, tasks: Task[]) {
  const milestones = goal.milestones || [];
  const completedMilestones = milestones.filter((m) => m.completed).length;
  const totalMilestones = milestones.length;
  const linkedTasks = tasks.filter((t) => goal.linkedTaskIds.includes(t.id));
  const completedTasks = linkedTasks.filter(
    (t) => t.status === "completed",
  ).length;

  if (totalMilestones > 0 && linkedTasks.length > 0) {
    const milestoneRate = completedMilestones / totalMilestones;
    const taskRate = completedTasks / linkedTasks.length;
    return Math.round(milestoneRate * 0.6 * 100 + taskRate * 0.4 * 100);
  }

  if (totalMilestones > 0) {
    return Math.round((completedMilestones / totalMilestones) * 100);
  }

  if (linkedTasks.length > 0) {
    return Math.round((completedTasks / linkedTasks.length) * 100);
  }

  return goal.progress || 0;
}

export default function AnalyticsView({
  tasks,
  goals,
  users,
  groups,
}: AnalyticsViewProps) {
  // 1. Completion rate calculations
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const overdue = tasks.filter((t) => t.status === "overdue").length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // 2. Priority metrics configuration
  const priorityCounts = {
    urgent: tasks.filter((t) => t.priority === "urgent").length,
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };
  const maxPriorityCount = Math.max(...Object.values(priorityCounts), 1);

  // 3. User XP calculations & rankings
  const getUserStats = (userId: string) => {
    const userTasks = tasks.filter((t) => t.assigneeId === userId);
    const userCompleted = userTasks.filter(
      (t) => t.status === "completed",
    ).length;
    // Base XP: 100 XP per task completed + 50 XP per active focus timer session simulated + 10 XP per subtask done
    let computedXP = userCompleted * 100;

    // Sum tracked seconds across their tasks
    let trackedSeconds = 0;
    userTasks.forEach((t) => {
      trackedSeconds += t.timeTrackedSeconds || 0;
      (t.subtasks || []).forEach((s) => {
        if (s.isCompleted) computedXP += 10;
      });
    });

    const focusedMinutes = Math.floor(trackedSeconds / 60);
    computedXP += Math.floor(focusedMinutes * 5); // 5 XP per focused minute

    // Streak criteria: if they have any tasks done or in progress
    const streak =
      userCompleted > 0 ? Math.min(7, 2 + Math.floor(userCompleted / 2)) : 1;

    return {
      completedCount: userCompleted,
      totalCount: userTasks.length,
      xp: computedXP,
      minutes: focusedMinutes,
      streak,
    };
  };

  // 4. Group distributions
  const goalProgresses = goals.map((goal) => computeGoalProgress(goal, tasks));
  const totalGoals = goals.length;
  const completedGoals = goalProgresses.filter((value) => value >= 100).length;
  const averageGoalProgress = totalGoals
    ? Math.round(
        goalProgresses.reduce((sum, value) => sum + value, 0) / totalGoals,
      )
    : 0;
  const linkedTaskCount = new Set(goals.flatMap((goal) => goal.linkedTaskIds))
    .size;

  const groupStats = groups.map((g) => {
    const groupTasks = tasks.filter((t) => t.groupId === g.id);
    const done = groupTasks.filter((t) => t.status === "completed").length;
    return {
      name: g.name,
      color: g.color,
      total: groupTasks.length,
      done,
      rate:
        groupTasks.length > 0
          ? Math.round((done / groupTasks.length) * 100)
          : 0,
    };
  });

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Overview Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Radial Donut card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <PieChart size={13} className="text-[#5C27FE]" />
              <span>Completion Index</span>
            </span>
            <span className="bg-[#5C27FE]/10 text-[#5C27FE] text-[10px] uppercase font-bold py-0.5 px-2 rounded-full">
              Real-time Metrics
            </span>
          </div>

          <div className="flex items-center gap-6 py-2">
            {/* SVG Radial progress spinner */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-95">
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  className="stroke-gray-100 dark:stroke-white/5 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="46"
                  className="stroke-[#5C27FE] fill-transparent transition-all duration-1000"
                  strokeWidth="8"
                  strokeDasharray={2 * Math.PI * 46}
                  strokeDashoffset={
                    2 * Math.PI * 46 * (1 - completionRate / 100)
                  }
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-sora font-black text-2xl text-gray-900 dark:text-white">
                  {completionRate}%
                </span>
                <span className="text-[9px] uppercase font-bold text-gray-400">
                  Achieved
                </span>
              </div>
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#00C48C]" />{" "}
                  Completed
                </span>
                <span className="font-bold text-gray-800 dark:text-white font-mono">
                  {completed}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#0EA5E9]" /> In
                  Progress
                </span>
                <span className="font-bold text-gray-800 dark:text-white font-mono">
                  {inProgress}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending
                </span>
                <span className="font-bold text-gray-800 dark:text-white font-mono">
                  {pending}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#FF4D4D]" /> Overdue
                </span>
                <span className="font-bold text-red-500 font-mono">
                  {overdue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Stack Chart Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart3 size={13} className="text-[#FF4D4D]" />
              <span>Priority Density</span>
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">
              Tasks Counted
            </span>
          </div>

          <div className="space-y-3 py-1 flex-1 flex flex-col justify-center">
            {/* Urgent */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-gray-650 dark:text-gray-300">
                <span>🔥 Urgent</span>
                <span className="font-mono">{priorityCounts.urgent}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF4D4D] to-red-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${(priorityCounts.urgent / maxPriorityCount) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* High */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-gray-650 dark:text-gray-300">
                <span>🚀 High</span>
                <span className="font-mono">{priorityCounts.high}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5C27FE] to-indigo-600 rounded-full transition-all duration-500"
                  style={{
                    width: `${(priorityCounts.high / maxPriorityCount) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Medium */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-gray-650 dark:text-gray-300">
                <span>⚡ Medium</span>
                <span className="font-mono">{priorityCounts.medium}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(priorityCounts.medium / maxPriorityCount) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Low */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-semibold text-gray-650 dark:text-gray-300">
                <span>🌱 Low</span>
                <span className="font-mono">{priorityCounts.low}</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00C48C] to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(priorityCounts.low / maxPriorityCount) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Focus Metric Stats */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Timer size={13} className="text-[#0ea5e9]" />
              <span>Pomodoro focus track</span>
            </span>
            <span className="text-emerald-500 text-[10px] font-bold bg-[#00C48C]/10 px-1.5 py-0.5 rounded-full">
              Focus Active
            </span>
          </div>

          <div className="space-y-4 py-2 text-center flex-1 flex flex-col justify-center items-center">
            <div className="w-14 h-14 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] flex items-center justify-center border border-[#0ea5e9]/20 animate-pulse">
              <Timer size={26} />
            </div>

            <div className="text-center">
              <h4 className="font-sora font-black text-3xl text-gray-900 dark:text-white">
                {Math.ceil(
                  tasks.reduce(
                    (sum, t) => sum + (t.timeTrackedSeconds || 0),
                    0,
                  ) / 60,
                )}{" "}
                m
              </h4>
              <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mt-1">
                Total Concentrator Minutes Logged
              </p>
            </div>
            <div className="text-xs text-gray-500 text-center font-medium max-w-[200px]">
              Complete daily Pomodoro chunks to boost user stats on the teammate
              leaderboard!
            </div>
          </div>
        </div>

        {/* Goal Performance Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Trophy size={13} className="text-[#5C27FE]" />
              <span>Goal Performance</span>
            </span>
            <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">
              Strategy
            </span>
          </div>

          <div className="space-y-4 py-2">
            <div className="text-sm font-black text-gray-900 dark:text-white">
              {totalGoals} Goals Active
            </div>
            <div className="text-[11px] text-gray-500">
              Average Goal Completion
            </div>
            <div className="text-[32px] font-extrabold text-[#5C27FE]">
              {averageGoalProgress}%
            </div>
            <div className="grid grid-cols-2 gap-3 text-[11px] text-gray-600 dark:text-gray-300">
              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 p-3">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {completedGoals}
                </div>
                <div className="text-gray-500">Completed Goals</div>
              </div>
              <div className="rounded-2xl bg-gray-50 dark:bg-white/5 p-3">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {linkedTaskCount}
                </div>
                <div className="text-gray-500">Linked Tasks</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gamified Teammate Leaderboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Leaderboard panel: 2 columns */}
        <div className="glass-card p-5 rounded-2xl md:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-500" />
              <span>Synergy Workspace Teammate XP Board</span>
            </span>
            <span className="text-xs font-mono text-gray-400 font-bold">
              XP derived from actions & timer logs
            </span>
          </div>

          <div className="space-y-3.5 max-h-[350px] overflow-y-auto">
            {users.map((u, index) => {
              const stats = getUserStats(u.id);
              const rankColor =
                index === 0
                  ? "text-amber-500"
                  : index === 1
                    ? "text-gray-400"
                    : index === 2
                      ? "text-amber-700"
                      : "text-gray-300";

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3.5 bg-white/20 dark:bg-black/15 border border-gray-150 dark:border-white/5 hover:border-[#5C27FE]/20 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank indicator */}
                    <span
                      className={`font-sora font-black text-sm w-4 text-center ${rankColor}`}
                    >
                      #{index + 1}
                    </span>

                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover border border-white"
                      referrerPolicy="no-referrer"
                    />

                    <div className="min-w-0 text-left">
                      <span className="font-bold text-xs text-gray-905 dark:text-white block truncate">
                        {u.name}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-400 mt-0.5">
                        <CheckCircle2 size={9} className="text-[#00C48C]" />
                        <span>
                          {stats.completedCount} / {stats.totalCount} Done
                        </span>

                        {stats.minutes > 0 && (
                          <>
                            <span>·</span>
                            <Clock size={9} className="text-[#0ea5e9]" />
                            <span>{stats.minutes}m Focus</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Level & Streak metrics */}
                  <div className="flex items-center gap-4 text-right">
                    {/* Daily Streaks indicator */}
                    <div className="flex items-center gap-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full h-fit">
                      <Flame
                        size={12}
                        className="animate-pulse flex-shrink-0"
                      />
                      <span className="font-mono text-xs font-black">
                        {stats.streak}d
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-bold text-gray-400 block">
                        Level {Math.max(1, Math.floor(stats.xp / 400))}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#5C27FE] dark:text-[#a085ff] block">
                        {stats.xp} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shared Project completion progress map */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Project Progress Map
              </span>
              <span className="text-[10px] text-gray-400 font-bold uppercase font-mono">
                Sprints
              </span>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {groupStats.map((g, idx) => (
                <div key={idx} className="space-y-2 text-left">
                  <div className="flex items-center justify-between font-semibold text-xs">
                    <span className="flex items-center gap-2 truncate pr-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: g.color }}
                      />
                      <span className="truncate text-gray-800 dark:text-gray-100">
                        {g.name}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                      {g.done}/{g.total} Completed ({g.rate}%)
                    </span>
                  </div>

                  <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ backgroundColor: g.color, width: `${g.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-[11px] text-gray-500 text-left leading-relaxed mt-4">
            <span className="font-bold text-[#5C27FE] inline-flex items-center gap-0.5 uppercase tracking-wider block mb-0.5">
              <Zap size={11} /> Next Sprint Sprint
            </span>
            Complete tasks of high priority and due dates closer today to
            rapidly enhance overall group coordinates.
          </div>
        </div>
      </div>
    </div>
  );
}
