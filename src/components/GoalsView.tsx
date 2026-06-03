import React, { useState } from "react";
import { Goal, Task } from "../types";
import { apiFetch } from "../lib/api";
import {
  Target,
  Calendar,
  Plus,
  X,
  ClipboardList,
  TrendingUp,
  Sparkles,
  Trash2,
  CheckCircle2,
} from "lucide-react";

interface GoalsViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  tasks: Task[];
  onOpenTaskDetails?: (task: Task) => void;
}

export default function GoalsView({
  goals,
  setGoals,
  tasks,
  onOpenTaskDetails,
}: GoalsViewProps) {
  const [isCreatingGoal, setIsCreatingGoal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newMilestoneInput, setNewMilestoneInput] = useState("");
  const [tempMilestones, setTempMilestones] = useState<string[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState("");
  const [editingTargetDate, setEditingTargetDate] = useState("");

  const computeGoalProgress = (goal: Goal) => {
    const totalMilestones = goal.milestones?.length || 0;
    const completedMilestones =
      goal.milestones?.filter((m) => m.completed).length || 0;
    const linkedTasks = tasks.filter((t) => goal.linkedTaskIds.includes(t.id));
    const totalTasks = linkedTasks.length;
    const completedTasks = linkedTasks.filter(
      (t) => t.status === "completed",
    ).length;

    if (totalMilestones > 0 && totalTasks > 0) {
      const mRate = (completedMilestones / totalMilestones) * 100;
      const tRate = (completedTasks / totalTasks) * 100;
      return Math.min(100, Math.round(mRate * 0.6 + tRate * 0.4));
    }

    if (totalMilestones > 0) {
      return Math.min(
        100,
        Math.round((completedMilestones / totalMilestones) * 100),
      );
    }

    if (totalTasks > 0) {
      return Math.min(100, Math.round((completedTasks / totalTasks) * 100));
    }

    return goal.progress || 0;
  };

  const initializeEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditingTitle(goal.title);
    setEditingDesc(goal.description || "");
    setEditingTargetDate(goal.targetDate || "");
  };

  const persistGoal = async (goal: Goal) => {
    try {
      const response = await apiFetch(`/api/goals/${goal.id}`, {
        method: "PUT",
        body: JSON.stringify(goal),
      });

      if (!response.ok) {
        console.error("Failed to persist goal:", await response.text());
        return null;
      }

      const updatedGoal = await response.json();
      setGoals((prev) =>
        prev.map((item) => (item.id === goal.id ? updatedGoal : item)),
      );
      return updatedGoal;
    } catch (error) {
      console.error("Failed to persist goal:", error);
      return null;
    }
  };

  const createGoal = async (goal: Goal) => {
    try {
      const response = await apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify(goal),
      });

      if (!response.ok) {
        console.error("Failed to create goal:", await response.text());
        return;
      }

      const createdGoal = await response.json();
      setGoals((prev) => [...prev, createdGoal]);
    } catch (error) {
      console.error("Failed to create goal:", error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (
      !confirm(
        "Are you certain you want to remove this strategic workspace goal?",
      )
    ) {
      return;
    }

    try {
      const response = await apiFetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Failed to delete goal:", await response.text());
        return;
      }

      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (error) {
      console.error("Failed to delete goal:", error);
    }
  };

  const handleAddTempMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneInput.trim()) return;
    setTempMilestones((prev) => [...prev, newMilestoneInput.trim()]);
    setNewMilestoneInput("");
  };

  const handleRemoveTempMilestone = (idx: number) => {
    setTempMilestones((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoalObj: Goal = {
      id: `goal_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      targetDate: newTargetDate || undefined,
      progress: 0,
      linkedTaskIds: selectedTaskIds,
      milestones: tempMilestones.map((title) => ({ title, completed: false })),
    };

    await createGoal(newGoalObj);
    setNewTitle("");
    setNewDesc("");
    setNewTargetDate("");
    setTempMilestones([]);
    setSelectedTaskIds([]);
    setIsCreatingGoal(false);
  };

  const handleToggleMilestone = async (
    goalId: string,
    milestoneIdx: number,
    done: boolean,
  ) => {
    const updatedGoals = goals.map((goal) => {
      if (goal.id !== goalId) return goal;

      const list = goal.milestones ? [...goal.milestones] : [];
      if (list[milestoneIdx]) {
        list[milestoneIdx] = { ...list[milestoneIdx], completed: done };
      }

      const updatedGoal = {
        ...goal,
        milestones: list,
        progress: computeGoalProgress({ ...goal, milestones: list }),
      };

      persistGoal(updatedGoal);
      return updatedGoal;
    });

    setGoals(updatedGoals);
  };

  const handleSaveEdit = async (goal: Goal) => {
    const updated: Goal = {
      ...goal,
      title: editingTitle.trim(),
      description: editingDesc.trim() || undefined,
      targetDate: editingTargetDate || undefined,
    };

    const persisted = await persistGoal(updated);
    if (persisted) {
      setEditingGoalId(null);
    }
  };

  const totalGoalsCount = goals.length;
  const completedGoalsCount = goals.filter((g) => g.progress === 100).length;

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="p-4 rounded-xl bg-white/40 dark:bg-[#1E1E32]/25 border border-gray-150 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF4D4D]/10 text-[#FF4D4D] flex items-center justify-center border border-[#FF4D4D]/20 shrink-0 animate-pulse">
            <Target size={20} />
          </div>
          <div>
            <h4 className="font-sora font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>Goal & Objective Tracking</span>
              <Sparkles size={13} className="text-amber-500 animate-spin" />
            </h4>
            <p className="text-xs text-secondary mt-0.5 leading-relaxed">
              Track multi-level milestones and align related operational task
              elements to monitor combined progress.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="text-center font-mono">
            <span className="text-[10px] uppercase font-bold text-gray-400 block">
              strategic metrics
            </span>
            <span className="text-sm font-black text-gray-800 dark:text-white">
              {completedGoalsCount} of {totalGoalsCount} Complete
            </span>
          </div>

          <button
            onClick={() => setIsCreatingGoal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-[#5C27FE] hover:bg-[#4a1ee3] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <Plus size={13} />
            <span>Formulate Goal</span>
          </button>
        </div>
      </div>

      {isCreatingGoal && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#151525] border-2 border-[#5C27FE]/30 text-left relative flex flex-col space-y-4 shadow-xl">
          <button
            onClick={() => setIsCreatingGoal(false)}
            className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={15} />
          </button>

          <h4 className="font-sora font-bold text-sm text-gray-950 dark:text-white-85 tracking-tight flex items-center gap-1">
            <TrendingUp size={14} className="text-[#5C27FE]" />
            <span>Formulate Next Milestone Goal Target</span>
          </h4>

          <form
            onSubmit={handleSubmitGoal}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Core Objective Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Acquire 1,000 Beta Users"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Strategic Roadmap Description
                </label>
                <textarea
                  placeholder="Outline parameters for campaigns, outreach milestones, or diagnostic targets..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar size={11} />
                  Target Completion Deadline
                </label>
                <input
                  type="date"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                  className="w-full text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-3 py-1.5 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                />
              </div>
            </div>

            <div className="space-y-4 flex flex-col justify-between">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <ClipboardList size={11} />
                  Align Related Workspace Tasks
                </label>
                <div className="max-h-24 overflow-y-auto border border-gray-200/50 dark:border-white/5 rounded-xl p-2.5 space-y-1 bg-gray-50 dark:bg-black/15">
                  {tasks.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 text-xs truncate cursor-pointer text-gray-700 dark:text-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaskIds((prev) => [...prev, t.id]);
                          } else {
                            setSelectedTaskIds((prev) =>
                              prev.filter((x) => x !== t.id),
                            );
                          }
                        }}
                        className="w-3 h-3 text-[#5C27FE] rounded"
                      />
                      <span className="truncate">{t.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">
                  Predefine Target Step Milestones ({tempMilestones.length})
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="e.g. Approve press release copy"
                    value={newMilestoneInput}
                    onChange={(e) => setNewMilestoneInput(e.target.value)}
                    className="flex-1 text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-2.5 py-1.5 rounded-lg border border-gray-200/50 dark:border-white/10 outline-none"
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddTempMilestone(e))
                    }
                  />
                  <button
                    type="button"
                    onClick={(e) => handleAddTempMilestone(e)}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-650 hover:bg-[#5C27FE] hover:text-white transition-all text-xs cursor-pointer font-bold"
                  >
                    Add Step
                  </button>
                </div>

                {tempMilestones.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pt-1">
                    {tempMilestones.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-[#5C27FE] px-2 py-0.5 rounded-full"
                      >
                        <span>{t}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTempMilestone(idx)}
                          className="text-gray-400 hover:text-red-500 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-150 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreatingGoal(false)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 text-xs font-bold text-white bg-[#5C27FE] hover:bg-[#4a1ee3] rounded-lg transition-all cursor-pointer shadow-md shadow-[#5C27FE]/20"
                >
                  Confirm Goal Formulation
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((g) => {
          const linkedTasks = tasks.filter((t) =>
            g.linkedTaskIds.includes(t.id),
          );

          return (
            <div
              key={g.id}
              className="glass-card p-5 rounded-2xl flex flex-col justify-between hover:border-[#5C27FE]/20 hover:shadow-lg transition-all text-left relative group/goal"
            >
              <button
                onClick={() => deleteGoal(g.id)}
                title="Remove Goal"
                className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-[#FF4D4D] opacity-0 group-hover/goal:opacity-100 hover:bg-red-50 dark:hover:bg-red-950/15 cursor-pointer transition-opacity"
              >
                <Trash2 size={13} />
              </button>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 rounded-full bg-[#FF4D4D]" />
                    {editingGoalId === g.id ? (
                      <input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="text-sm font-sora font-extrabold w-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white px-2 py-1 rounded-lg border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                      />
                    ) : (
                      <h5 className="font-sora font-extrabold text-sm text-gray-900 dark:text-white">
                        {g.title}
                      </h5>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {editingGoalId === g.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(g)}
                          className="text-[10px] uppercase font-bold tracking-wider text-[#5C27FE] hover:text-[#3c1cd4]"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGoalId(null)}
                          className="text-[10px] uppercase font-bold tracking-wider text-gray-400 hover:text-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => initializeEdit(g)}
                        className="text-[10px] uppercase font-bold tracking-wider text-gray-500 hover:text-gray-700"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>

                {editingGoalId === g.id ? (
                  <textarea
                    value={editingDesc}
                    onChange={(e) => setEditingDesc(e.target.value)}
                    rows={3}
                    className="w-full text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                    placeholder="Goal description"
                  />
                ) : (
                  g.description && (
                    <p className="text-xs text-gray-550 dark:text-gray-300 mt-2 leading-relaxed">
                      {g.description}
                    </p>
                  )
                )}

                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider inline-flex items-center gap-1">
                  <Calendar size={10} />
                  {editingGoalId === g.id ? (
                    <input
                      type="date"
                      value={editingTargetDate}
                      onChange={(e) => setEditingTargetDate(e.target.value)}
                      className="text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-2 py-1 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                    />
                  ) : (
                    <span>
                      {g.targetDate
                        ? `Due Target: ${new Date(g.targetDate).toLocaleDateString()}`
                        : "No target date set"}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-gray-400">Progression Depth</span>
                    <span className="text-[#FF4D4D] font-mono">
                      {g.progress}% Complete
                    </span>
                  </div>
                  <div className="relative h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-1/4 w-px bg-white/40" />
                    <div className="absolute inset-y-0 left-1/2 w-px bg-white/40" />
                    <div className="absolute inset-y-0 left-3/4 w-px bg-white/40" />
                    <div
                      className="h-full bg-linear-to-r from-[#FF4D4D] to-[#5C27FE] rounded-full transition-all duration-300"
                      style={{ width: `${g.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-400 mt-1">
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                  </div>
                </div>

                {g.milestones && g.milestones.length > 0 && (
                  <div className="space-y-2 pt-2.5 border-t border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                      Milestones Targets Step Checklist
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {g.milestones.map((milestone, idx) => (
                        <label
                          key={idx}
                          className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer p-1.5 rounded hover:bg-gray-50 dark:hover:bg-white/5"
                        >
                          <input
                            type="checkbox"
                            checked={milestone.completed}
                            onChange={(e) =>
                              handleToggleMilestone(g.id, idx, e.target.checked)
                            }
                            className="w-3.5 h-3.5 text-[#FF4D4D] border-gray-300 dark:border-white/20 rounded focus:ring-0"
                          />
                          <span
                            className={`truncate font-medium ${milestone.completed ? "line-through text-gray-400 dark:text-gray-500" : ""}`}
                          >
                            {milestone.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {linkedTasks.length > 0 && (
                  <div className="space-y-1.5 pt-2.5 border-t border-gray-100 dark:border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                      Aligned Workspace Action Tasks
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {linkedTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() =>
                            onOpenTaskDetails && onOpenTaskDetails(task)
                          }
                          className={`text-[10px] font-bold px-2 py-0.75 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                            task.status === "completed"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : "bg-indigo-500/10 border-indigo-500/20 text-[#5C27FE] dark:text-[#a085ff] hover:bg-[#5C27FE]/20"
                          }`}
                          title={`Click to open detail of task ID: ${task.id}`}
                        >
                          <CheckCircle2
                            size={10}
                            className={
                              task.status === "completed"
                                ? "text-emerald-500"
                                : "text-gray-450"
                            }
                          />
                          <span className="truncate max-w-30">
                            {task.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-12 text-center bg-white/20 dark:bg-black/10 border border-dashed border-gray-250 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <Target size={28} className="text-gray-400" />
            <h5 className="font-sora font-extrabold text-sm text-gray-900 dark:text-white">
              Strategic objectives grid is empty
            </h5>
            <p className="text-xs text-gray-500 max-w-sm">
              Formulate strategic milestone indicators and map collaborative
              sprint tasks to monitor progress levels together.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
