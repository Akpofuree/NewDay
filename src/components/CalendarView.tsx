import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import { Task } from "../types";

interface CalendarViewProps {
  tasks: Task[];
  darkMode: boolean;
  onTaskClick: (task: Task) => void;
  onQuickCreate: (dueDate: string) => void;
}

type ViewMode = "month" | "week";
type FilterType = "all" | "active" | "completed" | "high_priority";

export default function CalendarView({
  tasks,
  darkMode,
  onTaskClick,
  onQuickCreate,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayPanel, setShowDayPanel] = useState(false);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filter === "all") return true;
      if (filter === "active") return task.status !== "completed";
      if (filter === "completed") return task.status === "completed";
      if (filter === "high_priority")
        return task.priority === "high" || task.priority === "urgent";
      return true;
    });
  }, [tasks, filter]);

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return filteredTasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDueDate = new Date(task.dueDate).toISOString().split("T")[0];
      return taskDueDate === dateStr;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30";
      case "medium":
        return "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "low":
        return "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      default:
        return "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];
    const today = new Date();

    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push({ date, isCurrentMonth: true });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false });
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateMonth("prev")}
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5C27FE] text-white hover:bg-[#4a1ee3] transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth("next")}
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2"
            >
              {day}
            </div>
          ))}
          {days.map(({ date, isCurrentMonth }, index) => {
            const dayTasks = getTasksForDate(date);
            const isTodayDate = isToday(date);

            return (
              <button
                key={index}
                onClick={() => {
                  setSelectedDate(date);
                  setShowDayPanel(true);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onQuickCreate(date.toISOString().split("T")[0]);
                }}
                className={`
                  relative p-2 min-h-[80px] rounded-lg border transition-all
                  ${
                    isCurrentMonth
                      ? "bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 hover:border-[#5C27FE]/30"
                      : "bg-gray-50 dark:bg-slate-950/50 border-gray-100 dark:border-white/5 opacity-50"
                  }
                  ${isTodayDate ? "ring-2 ring-[#5C27FE]/50" : ""}
                `}
              >
                <span
                  className={`text-xs font-medium ${
                    isCurrentMonth
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-400"
                  }`}
                >
                  {date.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      className={`text-[9px] px-1.5 py-0.5 rounded truncate border ${getPriorityColor(
                        task.priority
                      )}`}
                      title={task.title}
                    >
                      {task.title.substring(0, 20)}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[9px] text-gray-500 dark:text-gray-400">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateWeek("prev")}
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#5C27FE] text-white hover:bg-[#4a1ee3] transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek("next")}
              className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {days.map((date) => {
            const dayTasks = getTasksForDate(date);
            const isTodayDate = isToday(date);

            return (
              <button
                key={date.toISOString()}
                onClick={() => {
                  setSelectedDate(date);
                  setShowDayPanel(true);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onQuickCreate(date.toISOString().split("T")[0]);
                }}
                className={`
                  p-3 min-h-[120px] rounded-lg border transition-all
                  bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 hover:border-[#5C27FE]/30
                  ${isTodayDate ? "ring-2 ring-[#5C27FE]/50" : ""}
                `}
              >
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onTaskClick(task);
                      }}
                      className={`text-[10px] px-2 py-1 rounded truncate border ${getPriorityColor(
                        task.priority
                      )}`}
                      title={task.title}
                    >
                      {task.title.substring(0, 25)}
                    </div>
                  ))}
                  {dayTasks.length > 4 && (
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      +{dayTasks.length - 4} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const selectedDateTasks = selectedDate
    ? getTasksForDate(selectedDate)
    : [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === "month"
                ? "bg-[#5C27FE] text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === "week"
                ? "bg-[#5C27FE] text-white"
                : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            Week
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(["all", "active", "completed", "high_priority"] as FilterType[]).map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                  filter === f
                    ? "bg-[#5C27FE] text-white"
                    : "bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                }`}
              >
                {f === "high_priority" ? "High Priority" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-auto">
        {viewMode === "month" ? renderMonthView() : renderWeekView()}
      </div>

      {/* Day Panel */}
      {showDayPanel && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden m-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <button
                onClick={() => {
                  setShowDayPanel(false);
                  setSelectedDate(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-2 overflow-auto max-h-[60vh]">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No tasks due on this day
                  </p>
                  <button
                    onClick={() => {
                      onQuickCreate(selectedDate.toISOString().split("T")[0]);
                      setShowDayPanel(false);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-[#5C27FE] text-white hover:bg-[#4a1ee3] transition-colors"
                  >
                    <Plus size={14} />
                    Add Task
                  </button>
                </div>
              ) : (
                <>
                  {selectedDateTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        onTaskClick(task);
                        setShowDayPanel(false);
                      }}
                      className={`w-full p-3 rounded-lg border text-left transition-colors hover:border-[#5C27FE]/30 ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <div className="font-semibold text-sm">{task.title}</div>
                      <div className="text-[10px] opacity-75 mt-1">
                        {task.status} • {task.priority}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      onQuickCreate(selectedDate.toISOString().split("T")[0]);
                      setShowDayPanel(false);
                    }}
                    className="w-full p-3 rounded-lg border border-dashed border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-400 text-xs font-semibold hover:border-[#5C27FE]/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={14} />
                    Add Task
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
