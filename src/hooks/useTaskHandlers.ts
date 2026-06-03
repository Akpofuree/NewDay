import type { Dispatch, SetStateAction, DragEvent } from "react";
import { Task, TaskStatus, User } from "../types";
import { apiFetch } from "../lib/api";

type UseTaskHandlersProps = {
  tasks: Task[];
  setTasks: Dispatch<SetStateAction<Task[]>>;
  selectedTask: Task | null;
  setSelectedTask: Dispatch<SetStateAction<Task | null>>;
  setIsDetailOpen: Dispatch<SetStateAction<boolean>>;
  currentUser: User | null;
};

export default function useTaskHandlers({
  tasks,
  setTasks,
  selectedTask,
  setSelectedTask,
  setIsDetailOpen,
  currentUser,
}: UseTaskHandlersProps) {
  const logActivity = (task: Task, action: string): Task => {
    const newAct = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.id,
      userName: currentUser?.name || "System",
      action,
      createdAt: new Date().toISOString(),
    };
    return {
      ...task,
      activities: [newAct, ...task.activities],
    };
  };

  const handleCreateTask = async (
    taskData: Omit<Task, "id" | "comments" | "activities" | "createdAt">,
  ) => {
    const rawTask = {
      ...taskData,
      comments: [],
      activities: [
        {
          id: `act_${Date.now()}`,
          userId: currentUser?.id,
          userName: currentUser?.name || "System",
          action: "created this task on workspace",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    try {
      const response = await apiFetch("/api/tasks", {
        method: "POST",
        body: JSON.stringify(rawTask),
      });
      if (response.ok) {
        const saved = await response.json();
        setTasks((prev) => [saved, ...prev]);
      }
    } catch (err) {
      console.error("Failed to preserve task on databank:", err);
    }
  };

  const handleUpdateTask = async (updated: Task) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (selectedTask?.id === updated.id) {
      setSelectedTask(updated);
    }

    try {
      await apiFetch(`/api/tasks/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to persist task update:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
      setIsDetailOpen(false);
    }

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to remove task from databank:", err);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const nextStatus: TaskStatus =
      task.status === "completed" ? "pending" : "completed";
    const updated = logActivity(
      { ...task, status: nextStatus },
      `marked task as ${nextStatus === "completed" ? "Completed" : "Pending/Active"}`,
    );

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (selectedTask?.id === taskId) {
      setSelectedTask(updated);
    }

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to persist complete toggling:", err);
    }
  };

  const handleUpdateStatus = async (
    taskId: string,
    targetStatus: TaskStatus,
  ) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updated = logActivity(
      { ...task, status: targetStatus },
      `moved task to ${targetStatus.replace("_", " ")}`,
    );

    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    if (selectedTask?.id === taskId) {
      setSelectedTask(updated);
    }

    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to persist status change:", err);
    }
  };

  const handleDragStart = (e: DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      handleUpdateStatus(taskId, targetStatus);
    }
  };

  return {
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleToggleComplete,
    handleUpdateStatus,
    logActivity,
    handleDragStart,
    handleDragOver,
    handleDrop,
  };
}
