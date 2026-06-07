import { Task, Group, User, TaskStatus, TaskPriority } from "../types";
import {
  Calendar,
  CheckSquare,
  Clock,
  MoreVertical,
  MessageSquare,
  Tag,
  ArrowRight,
  Trash2,
  Edit2,
  Play,
  CheckCircle2,
} from "lucide-react";
import React, { useState } from "react";

interface TaskCardProps {
  key?: React.Key;
  task: Task;
  users: User[];
  groups: Group[];
  viewMode: "list" | "kanban";
  onOpenDetails: (task: Task) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onToggleComplete: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  hoverEffect?: boolean;
  // Bulk selection
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

export default function TaskCard({
  task,
  users,
  groups,
  viewMode,
  onOpenDetails,
  onUpdateStatus,
  onToggleComplete,
  onDeleteTask,
  hoverEffect = true,
  isBulkMode = false,
  isSelected = false,
  onToggleSelect,
}: TaskCardProps) {
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Retrieve details
  const assignee = users.find((u) => u.id === task.assigneeId);
  const group = groups.find((g) => g.id === task.groupId);

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = (task.subtasks || []).filter(
    (s) => s.isCompleted,
  ).length;
  const progressPercent =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 105)
      : 0; // standard progress scaling

  // Calculate overdue state
  const isCompleted = task.status === "completed";
  const isOverdue =
    !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

  // Map priority colors correctly
  const priorityStyles = {
    low: {
      bg: "bg-gray-100 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300",
      dot: "bg-gray-400",
    },
    medium: {
      bg: "bg-emerald-50 dark:bg-emerald-950/20 text-[#00C48C] dark:text-emerald-400",
      dot: "bg-[#00C48C]",
    },
    high: {
      bg: "bg-amber-50 dark:bg-amber-950/20 text-[#FFB020] dark:text-amber-400",
      dot: "bg-[#FFB020]",
    },
    urgent: {
      bg: "bg-rose-50 dark:bg-rose-950/20 text-[#FF4D4D] dark:text-rose-400",
      dot: "bg-[#FF4D4D]",
    },
  };

  const statusStyles = {
    pending: {
      label: "Pending",
      color:
        "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-300/30",
    },
    in_progress: {
      label: "In Progress",
      color: "text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-300/30",
    },
    completed: {
      label: "Completed",
      color:
        "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300/30",
    },
    overdue: {
      label: "Overdue",
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-300/30",
    },
  };

  const formattedDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  // Render Horizontal List View Task Card
  if (viewMode === "list") {
    return (
      <div
        onClick={() => {
          if (isBulkMode && onToggleSelect) {
            onToggleSelect(task.id);
            return;
          }
          onOpenDetails(task);
        }}
        className={`group relative flex items-center justify-between p-4 rounded-xl glass-card transition-all duration-300 cursor-pointer ${
          isCompleted ? "opacity-65 hover:opacity-90" : ""
        } ${isOverdue ? "border-l-4 border-l-[#FF4D4D]" : ""} hover:translate-y-[-2px] hover:shadow-lg dark:hover:shadow-black/45 ${isBulkMode && isSelected ? "border-[#5C27FE]/40 bg-[#5C27FE]/5" : ""}`}
        id={`task-list-card-${task.id}`}
      >
        {isBulkMode && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect?.(task.id);
              }}
              className="w-4 h-4"
            />
          </div>
        )}
        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
          {/* Custom scale checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(task.id);
            }}
            className="flex-shrink-0 w-5 h-5 rounded-md border-2 border-gray-300 dark:border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer bg-white dark:bg-transparent"
            style={{
              borderColor: isCompleted ? "#00C48C" : "",
              backgroundColor: isCompleted ? "#00C48C" : "",
            }}
          >
            {isCompleted && (
              <svg
                className="w-3.5 h-3.5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>

          {/* Core Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {group && (
                <span
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-gray-200 dark:border-white/5"
                  style={{
                    color: group.color,
                    backgroundColor: `${group.color}0E`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </span>
              )}

              <span
                className={`inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityStyles[task.priority].bg}`}
              >
                {task.priority}
              </span>

              {isOverdue && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-[#FF4D4D] dark:bg-rose-950/20 animate-pulse">
                  Overdue
                </span>
              )}
            </div>

            <h3
              className={`text-sm font-semibold text-gray-900 dark:text-white truncate ${isCompleted ? "completed-task-title text-gray-400 dark:text-gray-500" : ""}`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 mb-1">
                {task.description}
              </p>
            )}

            {task.tags?.length ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {task.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-900/70 text-[10px] text-slate-700 dark:text-slate-200 px-2 py-1"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-white/10 text-[10px] text-gray-700 dark:text-gray-300 px-2 py-1">
                    +{task.tags.length - 3} more
                  </span>
                ) : null}
              </div>
            ) : null}

            {/* Subtask micro indicator */}
            {totalSubtasks > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <CheckSquare size={10} />
                  {completedSubtasks}/{totalSubtasks} subtasks
                </span>
                <div className="w-16 h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#5C27FE] to-[#0ea5e9] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Avatars, Meta date and quick action menu */}
        <div className="flex items-center gap-3">
          {/* Due date and Comment Count */}
          <div className="text-right flex flex-col items-end">
            {formattedDate && (
              <span
                className={`text-[11px] font-medium flex items-center gap-1.5 ${isOverdue ? "text-[#FF4D4D] font-bold" : "text-gray-500 dark:text-gray-400"}`}
              >
                <Clock size={11} />
                {formattedDate}
              </span>
            )}

            <div className="flex items-center gap-2 mt-1">
              {task.comments.length > 0 && (
                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                  <MessageSquare size={10} />
                  {task.comments.length}
                </span>
              )}
            </div>
          </div>

          {/* Assignee Avatar */}
          {assignee ? (
            <div className="relative group/avatar" title={assignee.name}>
              <img
                src={assignee.avatarUrl}
                alt={assignee.name}
                className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1E1E32] object-cover hover:scale-105 transition-transform"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div
              className="w-7 h-7 rounded-full border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center text-[9px] text-gray-400"
              title="Unassigned"
            >
              U
            </div>
          )}

          {/* Quick Menu Button */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowQuickMenu(!showQuickMenu);
              }}
              className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <MoreVertical size={14} />
            </button>

            {showQuickMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuickMenu(false);
                  }}
                />
                <div
                  className="absolute right-0 mt-1 w-36 py-1 rounded-lg glass-card shadow-xl border border-gray-200 dark:border-white/10 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => {
                      onUpdateStatus(
                        task.id,
                        isCompleted ? "pending" : "completed",
                      );
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-gray-800 dark:text-gray-200 hover:bg-[#5C27FE]/10 dark:hover:bg-indigo-900/45 hover:text-[#5C27FE] flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>
                      {isCompleted ? "Mark Active" : "Mark Completed"}
                    </span>
                  </button>

                  {!isCompleted && (
                    <button
                      onClick={() => {
                        onUpdateStatus(task.id, "in_progress");
                        setShowQuickMenu(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-gray-800 dark:text-gray-200 hover:bg-[#5C27FE]/10 dark:hover:bg-indigo-900/45 hover:text-[#5C27FE] flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Set In Progress</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      onDeleteTask(task.id);
                      setShowQuickMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={11} />
                    <span>Delete Task</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render Kanban card style
  return (
    <div
      onClick={() => {
        if (isBulkMode && onToggleSelect) {
          onToggleSelect(task.id);
          return;
        }
        onOpenDetails(task);
      }}
      className={`group relative flex flex-col justify-between p-4 rounded-xl glass-card transition-all duration-300 cursor-pointer select-none ${
        isOverdue ? "border-t-2 border-t-[#FF4D4D]" : ""
      } hover:translate-y-[-4px] hover:shadow-xl dark:hover:shadow-black/60 ${isBulkMode && isSelected ? "border-[#5C27FE]/40 bg-[#5C27FE]/5" : ""}`}
      id={`task-kanban-card-${task.id}`}
    >
      {isBulkMode && (
        <div className="absolute left-3 top-3">
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect?.(task.id);
            }}
            className="w-4 h-4"
          />
        </div>
      )}
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          {group && (
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                color: group.color,
                backgroundColor: `${group.color}14`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              {group.name}
            </span>
          )}

          <span
            className={`inline-flex items-center text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ml-auto ${priorityStyles[task.priority].bg}`}
          >
            {task.priority}
          </span>
        </div>

        <h4
          className={`text-xs font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 mb-1.5 ${isCompleted ? "completed-task-title text-gray-400 dark:text-gray-500" : ""}`}
        >
          {task.title}
        </h4>

        {task.description && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
            {task.description}
          </p>
        )}

        {task.tags?.length ? (
          <div className="flex flex-wrap gap-2 mb-3">
            {task.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-900/70 text-[10px] text-slate-700 dark:text-slate-200 px-2 py-1"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
            {task.tags.length > 3 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 dark:bg-white/10 text-[10px] text-gray-700 dark:text-gray-300 px-2 py-1">
                +{task.tags.length - 3} more
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div>
        {/* Kanban Subtask Progress */}
        {totalSubtasks > 0 && (
          <div className="mb-3.5">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span className="font-medium flex items-center gap-1">
                <CheckSquare size={10} />
                Subtasks
              </span>
              <span className="font-mono">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
            <div className="w-full h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#5C27FE] to-[#0ea5e9] transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, progressPercent))}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Bottom Metadata Indicators */}
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-white/5">
          <div className="flex flex-col">
            {formattedDate ? (
              <span
                className={`text-[10px] font-medium flex items-center gap-1 ${isOverdue ? "text-[#FF4D4D] font-bold" : "text-gray-400"}`}
              >
                <Calendar size={10} />
                {new Date(task.dueDate!).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            ) : (
              <span className="text-[9px] text-gray-400">No deadline</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {task.comments.length > 0 && (
              <span
                className="text-[10px] text-gray-400 flex items-center gap-0.5"
                title={`${task.comments.length} comments`}
              >
                <MessageSquare size={10} />
                {task.comments.length}
              </span>
            )}

            {assignee ? (
              <img
                src={assignee.avatarUrl}
                alt={assignee.name}
                title={assignee.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-white dark:border-[#202035] object-cover shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full border border-dashed border-gray-300 dark:border-white/10 flex items-center justify-center text-[8px] text-gray-400"
                title="Unassigned"
              >
                U
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
