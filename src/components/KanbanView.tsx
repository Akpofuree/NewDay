import type { Dispatch, SetStateAction, DragEvent } from "react";
import { Plus } from "lucide-react";
import type { Task, TaskStatus, Group, User } from "../types";
import TaskCard from "./TaskCard";

type KanbanViewProps = {
  categorizedTasks: Task[];
  users: User[];
  groups: Group[];
  handleDragStart: (e: DragEvent, taskId: string) => void;
  handleDragOver: (e: DragEvent) => void;
  handleDrop: (e: DragEvent, targetStatus: TaskStatus) => void;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  setIsDetailOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateStatus: (taskId: string, targetStatus: TaskStatus) => void;
  handleToggleComplete: (taskId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  setStatusFilter: Dispatch<SetStateAction<"all" | TaskStatus>>;
  setIsNewTaskOpen: Dispatch<SetStateAction<boolean>>;
  // Bulk selection
  isBulkMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelect?: (taskId: string) => void;
};

export default function KanbanView({
  categorizedTasks,
  users,
  groups,
  handleDragStart,
  handleDragOver,
  handleDrop,
  setSelectedTask,
  setIsDetailOpen,
  handleUpdateStatus,
  handleToggleComplete,
  handleDeleteTask,
  setStatusFilter,
  setIsNewTaskOpen,
  isBulkMode = false,
  selectedTaskIds,
  onToggleSelect,
}: KanbanViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
      <div
        className="rounded-xl p-3 bg-white/40 dark:bg-[#1E1E32]/25 border border-gray-150 dark:border-white/5 space-y-3"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "pending")}
      >
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-b-[#FFB020] px-1">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFB020]" />
            Pending
          </span>
          <span className="font-mono text-[10px] font-bold text-gray-400">
            {categorizedTasks.filter((t) => t.status === "pending").length}
          </span>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-0.5">
          {categorizedTasks
            .filter((t) => t.status === "pending")
            .map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleDragStart(e, t.id)}
                className="active:cursor-grabbing cursor-grab"
              >
                <TaskCard
                  task={t}
                  users={users}
                  groups={groups}
                  viewMode="kanban"
                  onOpenDetails={(task) => {
                    setSelectedTask(task);
                    setIsDetailOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  isBulkMode={isBulkMode}
                  isSelected={!!selectedTaskIds?.has(t.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
        </div>
        <button
          onClick={() => {
            setStatusFilter("pending");
            setIsNewTaskOpen(true);
          }}
          className="w-full py-1 text-[10px] font-bold text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] flex items-center justify-center gap-1.5 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 cursor-pointer"
        >
          <Plus size={10} />
          Add task
        </button>
      </div>

      <div
        className="rounded-xl p-3 bg-white/40 dark:bg-[#1E1E32]/25 border border-gray-150 dark:border-white/5 space-y-3"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "in_progress")}
      >
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-b-[#0EA5E9] px-1">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
            In Progress
          </span>
          <span className="font-mono text-[10px] font-bold text-gray-400">
            {categorizedTasks.filter((t) => t.status === "in_progress").length}
          </span>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-0.5">
          {categorizedTasks
            .filter((t) => t.status === "in_progress")
            .map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleDragStart(e, t.id)}
                className="active:cursor-grabbing cursor-grab"
              >
                <TaskCard
                  task={t}
                  users={users}
                  groups={groups}
                  viewMode="kanban"
                  onOpenDetails={(task) => {
                    setSelectedTask(task);
                    setIsDetailOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  isBulkMode={isBulkMode}
                  isSelected={!!selectedTaskIds?.has(t.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
        </div>
        <button
          onClick={() => {
            setStatusFilter("in_progress");
            setIsNewTaskOpen(true);
          }}
          className="w-full py-1 text-[10px] font-bold text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] flex items-center justify-center gap-1.5 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 cursor-pointer"
        >
          <Plus size={10} />
          Add task
        </button>
      </div>

      <div
        className="rounded-xl p-3 bg-white/40 dark:bg-[#1E1E32]/25 border border-gray-150 dark:border-white/5 space-y-3"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "completed")}
      >
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-b-[#00C48C] px-1">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-pulse" />
            Completed
          </span>
          <span className="font-mono text-[10px] font-bold text-gray-400">
            {categorizedTasks.filter((t) => t.status === "completed").length}
          </span>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-0.5">
          {categorizedTasks
            .filter((t) => t.status === "completed")
            .map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleDragStart(e, t.id)}
                className="active:cursor-grabbing cursor-grab"
              >
                <TaskCard
                  task={t}
                  users={users}
                  groups={groups}
                  viewMode="kanban"
                  onOpenDetails={(task) => {
                    setSelectedTask(task);
                    setIsDetailOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  isBulkMode={isBulkMode}
                  isSelected={!!selectedTaskIds?.has(t.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
        </div>
        <button
          onClick={() => {
            setStatusFilter("completed");
            setIsNewTaskOpen(true);
          }}
          className="w-full py-1 text-[10px] font-bold text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] flex items-center justify-center gap-1.5 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 cursor-pointer"
        >
          <Plus size={10} />
          Add task
        </button>
      </div>

      <div
        className="rounded-xl p-3 bg-white/40 dark:bg-[#1E1E32]/25 border border-gray-150 dark:border-white/5 space-y-3"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, "overdue")}
      >
        <div className="flex items-center justify-between pb-1.5 border-b-2 border-b-[#FF4D4D] px-1">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
            Overdue
          </span>
          <span className="font-mono text-[10px] font-bold text-gray-400">
            {categorizedTasks.filter((t) => t.status === "overdue").length}
          </span>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-0.5">
          {categorizedTasks
            .filter((t) => t.status === "overdue")
            .map((t) => (
              <div
                key={t.id}
                draggable
                onDragStart={(e) => handleDragStart(e, t.id)}
                className="active:cursor-grabbing cursor-grab"
              >
                <TaskCard
                  task={t}
                  users={users}
                  groups={groups}
                  viewMode="kanban"
                  onOpenDetails={(task) => {
                    setSelectedTask(task);
                    setIsDetailOpen(true);
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  onToggleComplete={handleToggleComplete}
                  onDeleteTask={handleDeleteTask}
                  isBulkMode={isBulkMode}
                  isSelected={!!selectedTaskIds?.has(t.id)}
                  onToggleSelect={onToggleSelect}
                />
              </div>
            ))}
        </div>
        <button
          onClick={() => {
            setStatusFilter("overdue");
            setIsNewTaskOpen(true);
          }}
          className="w-full py-1 text-[10px] font-bold text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] flex items-center justify-center gap-1.5 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 cursor-pointer"
        >
          <Plus size={10} />
          Add task
        </button>
      </div>
    </div>
  );
}
