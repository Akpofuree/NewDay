import type { Dispatch, SetStateAction } from "react";
import { AlertTriangle, Clock, Calendar, ClipboardList } from "lucide-react";
import type { Task, TaskStatus, Group, User } from "../types";
import TaskCard from "./TaskCard";

type TaskListSections = {
  overdue: Task[];
  today: Task[];
  upcoming: Task[];
  noDate: Task[];
};

type TaskListViewProps = {
  sections: TaskListSections;
  users: User[];
  groups: Group[];
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  setIsDetailOpen: Dispatch<SetStateAction<boolean>>;
  handleUpdateStatus: (taskId: string, targetStatus: TaskStatus) => void;
  handleToggleComplete: (taskId: string) => void;
  handleDeleteTask: (taskId: string) => void;
  // Bulk selection
  isBulkMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelect?: (taskId: string) => void;
};

export default function TaskListView({
  sections,
  users,
  groups,
  setSelectedTask,
  setIsDetailOpen,
  handleUpdateStatus,
  handleToggleComplete,
  handleDeleteTask,
  isBulkMode = false,
  selectedTaskIds,
  onToggleSelect,
}: TaskListViewProps) {
  return (
    <div className="space-y-6">
      {sections.overdue.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#FF4D4D] flex items-center gap-1">
              <AlertTriangle size={12} className="text-[#FF4D4D]" />
              <span>Overdue Tasks</span>
            </span>
            <span className="font-mono text-xs text-gray-400 font-semibold bg-[#FF4D4D]/10 text-[#FF4D4D] px-2 py-0.5 rounded-full">
              {sections.overdue.length}
            </span>
          </div>
          <div className="space-y-2">
            {sections.overdue.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                users={users}
                groups={groups}
                viewMode="list"
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
            ))}
          </div>
        </div>
      )}

      {sections.today.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1 bg-transparent py-0.5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#5C27FE] dark:text-indigo-400 flex items-center gap-1">
              <Clock size={12} />
              <span>Due Today</span>
            </span>
            <span className="font-mono text-xs text-gray-500 font-semibold bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full text-gray-700 dark:text-gray-300">
              {sections.today.length}
            </span>
          </div>
          <div className="space-y-2">
            {sections.today.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                users={users}
                groups={groups}
                viewMode="list"
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
            ))}
          </div>
        </div>
      )}

      {sections.upcoming.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1">
              <Calendar size={12} />
              <span>Upcoming constraints</span>
            </span>
            <span className="font-mono text-xs text-gray-400 font-semibold bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              {sections.upcoming.length}
            </span>
          </div>
          <div className="space-y-2">
            {sections.upcoming.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                users={users}
                groups={groups}
                viewMode="list"
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
            ))}
          </div>
        </div>
      )}

      {sections.noDate.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1">
              <ClipboardList size={12} />
              <span>No Aligned Target Date</span>
            </span>
            <span className="font-mono text-xs text-gray-400 font-semibold bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full">
              {sections.noDate.length}
            </span>
          </div>
          <div className="space-y-2">
            {sections.noDate.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                users={users}
                groups={groups}
                viewMode="list"
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
