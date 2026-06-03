import { Task, TaskStatus, TaskPriority, User } from "../types";

export type Metrics = {
  total: number;
  completedToday: number;
  inProgress: number;
  overdue: number;
  totalTodayTasks: number;
  completedTodayTasks: number;
};

export function getCategorizedTasks(
  tasks: Task[],
  activeCategory: string,
  currentUser: User | null,
  searchQuery: string,
  statusFilter: "all" | TaskStatus,
  priorityFilter: "all" | TaskPriority,
  tagFilter: string,
  sortBy: "dueDate" | "priority" | "createdAt" | "title" | "status",
  sortDir: "asc" | "desc",
  activeView: "list" | "kanban",
): Task[] {
  let filtered = [...tasks];

  if (activeCategory === "today") {
    const todayStr = new Date().toISOString().slice(0, 10);
    filtered = tasks.filter((t) => {
      if (t.status === "completed") {
        return t.dueDate && t.dueDate.slice(0, 10) === todayStr;
      }
      const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
      const isDueToday = t.dueDate && t.dueDate.slice(0, 10) === todayStr;
      return isDueToday || isOverdue;
    });
  } else if (activeCategory === "my_tasks") {
    filtered = tasks.filter((t) => t.assigneeId === currentUser?.id);
  } else if (activeCategory === "completed") {
    filtered = tasks.filter((t) => t.status === "completed");
  } else if (activeCategory.startsWith("group_")) {
    const gId = activeCategory;
    filtered = tasks.filter((t) => t.groupId === gId);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags || []).some((tag) => tag.toLowerCase().includes(q)),
    );
  }

  const normalizedTagFilter = tagFilter.trim().toLowerCase();
  if (normalizedTagFilter && normalizedTagFilter !== "all") {
    filtered = filtered.filter((t) =>
      (t.tags || []).some((tag) => tag.toLowerCase() === normalizedTagFilter),
    );
  }

  if (statusFilter !== "all") {
    filtered = filtered.filter((t) => t.status === statusFilter);
  }

  if (priorityFilter !== "all") {
    filtered = filtered.filter((t) => t.priority === priorityFilter);
  }

  if (activeView === "list") {
    const priorityRank: Record<TaskPriority, number> = {
      urgent: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    const compareValues = (a: Task, b: Task) => {
      if (sortBy === "priority") {
        return priorityRank[a.priority] - priorityRank[b.priority];
      }

      if (sortBy === "createdAt") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title, undefined, {
          sensitivity: "base",
        });
      }

      if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }

      return 0;
    };

    if (sortBy === "dueDate") {
      const dated = filtered
        .filter((task) => task.dueDate)
        .slice()
        .sort(
          (a, b) =>
            new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
        );
      if (sortDir === "desc") {
        dated.reverse();
      }
      const undated = filtered.filter((task) => !task.dueDate);
      filtered = [...dated, ...undated];
    } else {
      filtered = filtered.slice().sort((a, b) => {
        const result = compareValues(a, b);
        return sortDir === "asc" ? result : -result;
      });
    }
  }

  return filtered;
}

export function getListSections(categorizedTasks: Task[]) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const overdue: Task[] = [];
  const today: Task[] = [];
  const upcoming: Task[] = [];
  const noDate: Task[] = [];

  categorizedTasks.forEach((t) => {
    if (t.status === "completed") {
      upcoming.push(t);
      return;
    }

    if (!t.dueDate) {
      noDate.push(t);
    } else {
      const dueDateObj = new Date(t.dueDate);
      const taskDateStr = t.dueDate.slice(0, 10);

      if (dueDateObj < now && taskDateStr !== todayStr) {
        overdue.push(t);
      } else if (taskDateStr === todayStr) {
        today.push(t);
      } else {
        upcoming.push(t);
      }
    }
  });

  return { overdue, today, upcoming, noDate };
}

export function getMetrics(tasks: Task[]): Metrics {
  const total = tasks.length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const completedToday = tasks.filter(
    (t) =>
      t.status === "completed" &&
      t.dueDate &&
      t.dueDate.slice(0, 10) === todayStr,
  ).length;

  const inProgress = tasks.filter((t) => t.status === "in_progress").length;

  const overdue = tasks.filter((t) => {
    const isCompleted = t.status === "completed";
    const isPastLimit = t.dueDate && new Date(t.dueDate) < new Date();
    return !isCompleted && isPastLimit;
  }).length;

  const totalTodayTasks = tasks.filter((t) => {
    const dStr = t.dueDate?.slice(0, 10);
    return (
      dStr === todayStr || (!t.status && dStr && new Date(dStr) < new Date())
    );
  }).length;

  const completedTodayTasks = tasks.filter(
    (t) => t.status === "completed" && t.dueDate?.slice(0, 10) === todayStr,
  ).length;

  return {
    total,
    completedToday,
    inProgress,
    overdue,
    totalTodayTasks,
    completedTodayTasks,
  };
}
