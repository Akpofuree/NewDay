import React, { useState, useEffect } from "react";
import {
  Task,
  Subtask,
  Group,
  User,
  TaskStatus,
  TaskPriority,
  Comment,
  AIRoadmapItem,
  Attachment,
} from "../types";
import {
  X,
  Calendar,
  Plus,
  MessageSquare,
  Activity,
  UserPlus,
  Folder,
  Clock,
  CheckSquare,
  Trash2,
  Send,
  CheckCircle2,
  Play,
  Square,
  Sparkles,
  UploadCloud,
  Paperclip,
  AlertCircle,
  RotateCcw,
  BrainCircuit,
  ExternalLink,
  Flame,
} from "lucide-react";
import { apiFetch } from "../lib/api";

interface TaskDetailDrawerProps {
  isOpen: boolean;
  task: Task | null;
  users: User[];
  groups: Group[];
  currentUser: User | null;
  onClose: () => void;
  onUpdateTask: (updated: Task) => void;
  onDeleteTask: (taskId: string) => void;
  handleToggleComplete?: (taskId: string) => void;
}

export default function TaskDetailDrawer({
  isOpen,
  task,
  users,
  groups,
  currentUser,
  onClose,
  onUpdateTask,
  onDeleteTask,
  handleToggleComplete,
}: TaskDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "comments" | "activity" | "learning_coach"
  >("comments");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [tagInput, setTagInput] = useState("");

  // For inline editing states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // 1. Pomodoro Focus Timer State
  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1500); // 25 Minutes (1500 seconds)
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");
  const [manualTimeMinutes, setManualTimeMinutes] = useState("");

  // 2. Drag and Drop File Attachments State
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // 3. AI Learning Assistant State
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");
  const [aiChatText, setAiChatText] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<
    Array<{ role: "user" | "model"; text: string }>
  >([]);

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description || "");
      // If task already has a roadmap, switch active tab to learning coach so they see it!
      if (task.isLearningGoal && task.aiRoadmap) {
        setActiveTab("learning_coach");
      } else {
        setActiveTab("comments");
      }
    }
  }, [task]);

  // Pomodoro Interval Cycle Tick
  useEffect(() => {
    let timerID: any = null;
    if (isPomodoroActive && timeLeft > 0) {
      timerID = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isPomodoroActive && timeLeft === 0) {
      setIsPomodoroActive(false);

      if (pomodoroMode === "focus") {
        // Complete current Focus session and log 25 minutes!
        const logSeconds = 1500;
        const currentSeconds = task?.timeTrackedSeconds || 0;

        if (task) {
          const updated = {
            ...task,
            timeTrackedSeconds: currentSeconds + logSeconds,
          };
          const withAct = addActivity(
            updated,
            "Completed 25-min Pomodoro (🍅) Focus Cycle successfully!",
          );
          onUpdateTask(withAct);
        }

        alert(
          "🍅 Focus Session complete! Time for a well-deserved 5-minute break.",
        );
        setPomodoroMode("break");
        setTimeLeft(300); // 5 minutes breather
      } else {
        alert(
          " Breathe in... Breath out. Rest cycle completed, ready to jump back in?",
        );
        setPomodoroMode("focus");
        setTimeLeft(1500); // Back to focus!
      }
    }
    return () => {
      if (timerID) clearInterval(timerID);
    };
  }, [isPomodoroActive, timeLeft, pomodoroMode, task]);

  if (!isOpen || !task) return null;

  // Automated Activity Log Generator Helper
  const addActivity = (taskObj: Task, actionText: string): Task => {
    const newAct = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      userId: currentUser?.id,
      userName: currentUser?.name || "Unknown",
      action: actionText,
      createdAt: new Date().toISOString(),
    };
    return {
      ...taskObj,
      activities: [newAct, ...taskObj.activities],
    };
  };

  // Title Update Saver
  const handleSaveTitle = () => {
    if (!titleValue.trim() || titleValue === task.title) {
      setIsEditingTitle(false);
      return;
    }
    const updated = { ...task, title: titleValue };
    const withActivity = addActivity(
      updated,
      `renamed outline to "${titleValue}"`,
    );
    onUpdateTask(withActivity);
    setIsEditingTitle(false);
  };

  // Description Update Saver
  const handleSaveDescription = () => {
    if (descriptionValue === task.description) {
      setIsEditingDesc(false);
      return;
    }
    const updated = { ...task, description: descriptionValue };
    const withActivity = addActivity(updated, `updated description details`);
    onUpdateTask(withActivity);
    setIsEditingDesc(false);
  };

  const normalizeTag = (value: string) => {
    return value.trim().toLowerCase().slice(0, 20);
  };

  const handleAddTag = (rawValue: string) => {
    const value = normalizeTag(rawValue.replace(/,/g, ""));
    if (!value || task.tags?.includes(value)) {
      return;
    }

    const nextTags = [...(task.tags || []), value].slice(0, 8);
    const updated = { ...task, tags: nextTags };
    const withActivity = addActivity(updated, `added tag "${value}"`);
    onUpdateTask(withActivity);
    setTagInput("");
  };

  const handleRemoveTag = (tag: string) => {
    const nextTags = (task.tags || []).filter((existing) => existing !== tag);
    const updated = { ...task, tags: nextTags };
    const withActivity = addActivity(updated, `removed tag "${tag}"`);
    onUpdateTask(withActivity);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput) {
        handleAddTag(tagInput);
      }
    }
  };

  // Property Changer (Status, Priority, Group, Assignee, Deadlines)
  const handleDirectUpdate = (field: keyof Task, value: any) => {
    const updated = { ...task, [field]: value };
    let actionStr = "";

    if (field === "status") {
      actionStr = `changed status to ${value.replace("_", " ")}`;
    } else if (field === "priority") {
      actionStr = `raised priority level to ${value}`;
    } else if (field === "assigneeId") {
      const u = users.find((x) => x.id === value);
      actionStr = u ? `assigned task to ${u.name}` : "removed assignee";
    } else if (field === "groupId") {
      const g = groups.find((x) => x.id === value);
      actionStr = g
        ? `associated task with group "${g.name}"`
        : "removed group alignment";
    } else if (field === "dueDate") {
      actionStr = value
        ? `set deadline date to ${new Date(value).toLocaleDateString()}`
        : "removed deadline";
    } else {
      actionStr = `updated ${field}`;
    }

    const withActivity = addActivity(updated, actionStr);
    onUpdateTask(withActivity);
  };

  // Subtask Checklists Handler
  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub: Subtask = {
      id: `sub_${Date.now()}`,
      parentTaskId: task.id,
      title: newSubtaskTitle.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
      sortOrder: (task.subtasks || []).length,
    };

    // Optimistic update
    const updated = {
      ...task,
      subtasks: [...(task.subtasks || []), newSub],
    };
    const withActivity = addActivity(
      updated,
      `added subtask checklist row "${newSub.title}"`,
    );
    onUpdateTask(withActivity);
    setNewSubtaskTitle("");

    try {
      const res = await apiFetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        body: JSON.stringify({
          id: newSub.id,
          title: newSub.title,
          sortOrder: newSub.sortOrder,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to save subtask");
      }
      const saved = await res.json();
      // Replace optimistic subtask id/details if server returned authoritative data
      const reconciled = {
        ...task,
        subtasks: [
          ...(task.subtasks || []).filter((s) => s.id !== newSub.id),
          saved,
        ],
      };
      onUpdateTask(reconciled);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subId: string, isCompleted: boolean) => {
    const updatedSubtasks = (task.subtasks || []).map((s) =>
      s.id === subId ? { ...s, isCompleted } : s,
    );
    let updated = { ...task, subtasks: updatedSubtasks } as Task;

    const targetSub = (task.subtasks || []).find((s) => s.id === subId);
    let actionText = "";
    if (targetSub) {
      actionText = isCompleted
        ? `completed subtask "${targetSub.title}"`
        : `re-opened subtask "${targetSub.title}"`;
    }

    const allCompletedAfterThis =
      updatedSubtasks.length > 0 && updatedSubtasks.every((s) => s.isCompleted);
    if (allCompletedAfterThis && task.status !== "completed") {
      if (confirm("All subtasks done. Mark task as complete?")) {
        // Prefer calling handleToggleComplete if available
        if (typeof handleToggleComplete === "function") {
          handleToggleComplete(task.id);
        } else {
          updated.status = "completed";
        }
        actionText += " and requested parent completion";
      }
    }

    const withActivity = addActivity(updated, actionText);
    onUpdateTask(withActivity);

    try {
      const res = await apiFetch(`/api/tasks/${task.id}/subtasks/${subId}`, {
        method: "PUT",
        body: JSON.stringify({ isCompleted }),
      });
      if (!res.ok) throw new Error("Failed to update subtask");
      const saved = await res.json();
      // Update with server result
      const reconciled = {
        ...task,
        subtasks: (task.subtasks || []).map((s) =>
          s.id === saved.id ? saved : s,
        ),
      };
      onUpdateTask(reconciled);
    } catch (err) {
      console.error(err);
      // Optionally TODO: revert optimistic change
    }
  };

  const handleDeleteSubtask = async (subId: string) => {
    const targetSub = (task.subtasks || []).find((s) => s.id === subId);
    const updatedSubtasks = (task.subtasks || []).filter((s) => s.id !== subId);
    const updated = { ...task, subtasks: updatedSubtasks };

    const actionText = targetSub
      ? `deleted subtask "${targetSub.title}"`
      : "removed subtask row";
    const withActivity = addActivity(updated, actionText);
    onUpdateTask(withActivity);

    try {
      const res = await apiFetch(`/api/tasks/${task.id}/subtasks/${subId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete subtask");
    } catch (err) {
      console.error(err);
    }
  };

  // Discussion Comments Add
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !currentUser) return;

    const newComment: Comment = {
      id: `com_${Date.now()}`,
      userId: currentUser.id,
      text: newCommentText.trim(),
      createdAt: new Date().toISOString(),
    };

    const updated = {
      ...task,
      comments: [...task.comments, newComment],
    };

    const withActivity = addActivity(updated, `added a comment in team chat`);
    onUpdateTask(withActivity);
    setNewCommentText("");
  };

  // --- MANUAL TIME LOGGING ---
  const handleLogManualTime = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(manualTimeMinutes);
    if (isNaN(minutes) || minutes <= 0) return;

    const addedSeconds = minutes * 60;
    const currentSeconds = task.timeTrackedSeconds || 0;
    const updated = {
      ...task,
      timeTrackedSeconds: currentSeconds * 1 + addedSeconds,
    };
    const withActivity = addActivity(
      updated,
      `manually logged ${minutes} minutes of dedicated workflow`,
    );
    onUpdateTask(withActivity);
    setManualTimeMinutes("");
  };

  const formatTrackedTime = (seconds?: number) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // --- ATTACHMENTS DRAG & DROP MULTIPART SIMULATION ---
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    setUploadError("");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processAttachmentUpload(files[0]);
    }
  };

  const handleManualFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAttachmentUpload(files[0]);
    }
  };

  const processAttachmentUpload = async (file: File) => {
    setIsUploadingFile(true);
    setUploadError("");

    try {
      // Create readable simulator Base64 url
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve((ev.target?.result as string) || "");
        reader.readAsDataURL(file);
      });
      const base64Url = await base64Promise;

      // Submit to real Express proxy endpoint!
      const res = await apiFetch("/api/attachments/upload", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          dataUrl: base64Url,
        }),
      });

      if (!res.ok) {
        throw new Error("Upload request rejected on primary gateway server.");
      }

      const fileObj: Attachment = await res.json();

      const currentAttachments = task.attachments || [];
      const updated = {
        ...task,
        attachments: [...currentAttachments, fileObj],
      };
      const withActivity = addActivity(
        updated,
        `attached workspace resource "${file.name}"`,
      );
      onUpdateTask(withActivity);
    } catch (err: any) {
      setUploadError(err.message || "Failure deploying attachment files.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    const currents = task.attachments || [];
    const targetFile = currents.find((a) => a.id === attachmentId);
    const updated = {
      ...task,
      attachments: currents.filter((a) => a.id !== attachmentId),
    };
    const withActivity = addActivity(
      updated,
      `removed workspace resources attachment: "${targetFile?.fileName || "Resource"}"`,
    );
    onUpdateTask(withActivity);
  };

  // --- AI STUDY COACH: GEN ROADMAPS AND COACH CHATS ---
  const handleToggleLearningGoal = () => {
    const toggleVal = !task.isLearningGoal;
    const updated = { ...task, isLearningGoal: toggleVal };
    const withActivity = addActivity(
      updated,
      toggleVal
        ? "Configured task as an Intelligent Learning Goal"
        : "Removed learning goal status constraints",
    );
    onUpdateTask(updated);
    if (toggleVal) {
      setActiveTab("learning_coach");
    } else {
      setActiveTab("comments");
    }
  };

  // Request roadmap via Express using GoogleGenAI SDK in backend server
  const handleGenerateAI_Roadmap = async () => {
    setIsGeneratingRoadmap(true);
    setRoadmapError("");

    try {
      const response = await apiFetch("/api/ai/roadmap", {
        method: "POST",
        body: JSON.stringify({
          skillName: task.title,
          description:
            task.description || "Provide progressive technical overview",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Roadmap endpoint failed.");
      }

      const data = await response.json();
      if (!data.phases || !Array.isArray(data.phases)) {
        throw new Error("Response format is missing direct phases vectors.");
      }

      // Initialize completed properties for checklist
      const mappedPhases: AIRoadmapItem[] = data.phases.map((p: any) => ({
        ...p,
        completed: false,
      }));

      const updated = {
        ...task,
        isLearningGoal: true,
        aiRoadmap: mappedPhases,
      };

      const withActivity = addActivity(
        updated,
        `Generated custom study roadmap via Google Gemini! ✨`,
      );
      onUpdateTask(withActivity);

      // Inject welcoming AI mentor notification
      setAiChatMessages([
        {
          role: "model",
          text: `Hi ${currentUser?.name || "Developer"}! ✨ I have structured a custom, 3-phase curriculum for "${task.title}". Below are lessons and practice guides. Let me know what you want to learn first!`,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setRoadmapError(
        err.message ||
          "Failure prompting virtual teacher. Double-check your API credentials key values.",
      );
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Trigger curriculum checkpoints completion
  const handleToggleRoadmapPhase = (phaseIndex: number, isDone: boolean) => {
    if (!task.aiRoadmap) return;
    const progressRoad = [...task.aiRoadmap];
    progressRoad[phaseIndex] = {
      ...progressRoad[phaseIndex],
      completed: isDone,
    };

    const updated = { ...task, aiRoadmap: progressRoad };
    const withAct = addActivity(
      updated,
      `${isDone ? "Conquered" : "Reset"} checkpoint sequence Phase ${phaseIndex + 1}: ${progressRoad[phaseIndex].title}`,
    );
    onUpdateTask(withAct);
  };

  // Ask Mentor questions
  const askAUMentorCoaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatText.trim() || isAiResponding) return;

    const userMsg = aiChatText.trim();
    const updatedHistory = [
      ...aiChatMessages,
      { role: "user" as const, text: userMsg },
    ];
    setAiChatMessages(updatedHistory);
    setAiChatText("");
    setIsAiResponding(true);

    try {
      const res = await apiFetch("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          taskId: task.id,
          taskTitle: task.title,
          message: userMsg,
          history: updatedHistory,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Mentor endpoint failure.");
      }

      const ans = await res.json();
      setAiChatMessages((prev) => [...prev, { role: "model", text: ans.text }]);
    } catch (err: any) {
      setAiChatMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `⚠️ Error contacting Mentor: ${err.message || "Verification token issue."}`,
        },
      ]);
    } finally {
      setIsAiResponding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Translucent backdrop frosted glass overlay */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
      />

      {/* Slide pane container */}
      <div
        className="relative w-full max-w-xl h-full bg-[#FAFBFD] dark:bg-[#0E0E18] shadow-2xl flex flex-col z-10 border-l border-white/20 dark:border-white/5"
        style={{
          animation: "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Style tag placeholder for dynamic keyframe slider animation */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0.9; }
            to { transform: translateX(0); opacity: 1; }
          }
        `,
          }}
        />

        {/* Header toolbar */}
        <div className="p-4 border-b border-gray-200/60 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#151525]/90 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#5C27FE] dark:text-[#a085ff]">
            <Clock size={12} className="text-[#5C27FE] dark:text-[#a085ff]" />
            <span>Task Detail Workspace Drawer</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Learning goal quick control */}
            <button
              onClick={handleToggleLearningGoal}
              title={
                task.isLearningGoal
                  ? "Disable Learning Hub"
                  : "Enable Smart Learning Hub"
              }
              className={`p-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                task.isLearningGoal
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-400"
                  : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              }`}
            >
              <BrainCircuit size={15} />
              <span className="text-[10px] font-bold uppercase">
                Learning Coach
              </span>
            </button>

            <button
              onClick={() => {
                if (
                  confirm("Are you strictly sure you want to delete this task?")
                ) {
                  onDeleteTask(task.id);
                  onClose();
                }
              }}
              title="Delete Task"
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF4D4D] hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Title */}
          <div>
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
                  autoFocus
                  className="w-full font-sora font-bold text-lg text-gray-900 dark:text-white px-2.5 py-1.5 bg-white dark:bg-[#1A1A2E]/70 rounded-lg border border-[#5C27FE] outline-none"
                />
              </div>
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="font-sora font-extrabold text-lg tracking-tight text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100/50 dark:hover:bg-white/5 px-2 py-1 rounded-xl transition-all duration-200 text-left border border-transparent hover:border-gray-200/30"
                title="Click to rename"
              >
                {task.title}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1.5 px-2">
              <span className="text-[9px] text-gray-400 font-mono">
                ID: {task.id}
              </span>
              {task.isLearningGoal && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                  <Flame size={8} className="animate-pulse" />
                  Smart Learning Task
                </span>
              )}
            </div>
          </div>

          {/* Pomodoro Focus & Time Tracking Widget Card */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#151525] border border-gray-100 dark:border-white/5 shadow-xs space-y-4 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF4D4D]/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                <Clock size={13} className="text-[#FF4D4D]" />
                <span>Timer Focus Engine</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">
                  TOTAL ENTRANCE TRACKED
                </span>
                <span className="font-mono text-xs font-bold text-[#5C27FE] dark:text-[#a085ff]">
                  {formatTrackedTime(task.timeTrackedSeconds)}
                </span>
              </div>
            </div>

            {/* Interactive Grid: Pomodoro Clock left + manual hour logs right */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* Pomodoro interface */}
              <div className="p-3 bg-red-500/5 dark:bg-[#FF4D4D]/5 border border-red-500/10 dark:border-red-500/10 rounded-xl flex items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-500">
                    <span>
                      🍅{" "}
                      {pomodoroMode === "focus" ? "Focus Work" : "Short Break"}
                    </span>
                  </div>
                  <div className="font-mono font-black text-2xl text-gray-900 dark:text-white">
                    {Math.floor(timeLeft / 60)
                      .toString()
                      .padStart(2, "0")}
                    :{(timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsPomodoroActive(!isPomodoroActive)}
                    className={`p-2 rounded-lg text-white font-bold cursor-pointer transition-all ${
                      isPomodoroActive
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {isPomodoroActive ? (
                      <Square size={12} />
                    ) : (
                      <Play size={12} />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsPomodoroActive(false);
                      setPomodoroMode("focus");
                      setTimeLeft(1500);
                    }}
                    title="Reset Focus Clock"
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>

              {/* Manual Time Logger Form */}
              <form onSubmit={handleLogManualTime} className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Manual Entry (Minutes)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 45"
                    value={manualTimeMinutes}
                    onChange={(e) => setManualTimeMinutes(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-gray-55/40 dark:bg-black/15 text-gray-900 dark:text-white rounded-lg border border-gray-200/50 dark:border-white/10 outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 max-h-8.5 rounded-lg text-xs font-bold text-white bg-[#5C27FE] hover:bg-[#4a1ee3] transition-all cursor-pointer shadow-sm flex items-center justify-center whitespace-nowrap"
                  >
                    + Log Time
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Properties Meta fields */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white dark:bg-[#151525] border border-gray-100 dark:border-white/5 text-left">
            {/* Status Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Status
              </label>
              <select
                value={task.status}
                onChange={(e) => handleDirectUpdate("status", e.target.value)}
                className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-white/5 py-1.5 px-2.5 rounded-lg focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Priority
              </label>
              <select
                value={task.priority}
                onChange={(e) => handleDirectUpdate("priority", e.target.value)}
                className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-white/5 py-1.5 px-2.5 rounded-lg focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Group/Project Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Folder size={10} />
                Project Group
              </label>
              <select
                value={task.groupId || ""}
                onChange={(e) =>
                  handleDirectUpdate("groupId", e.target.value || undefined)
                }
                className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-white/5 py-1.5 px-2.5 rounded-lg focus:outline-none"
              >
                <option value="">Standard Task Bucket</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <UserPlus size={10} />
                Assignee
              </label>
              <select
                value={task.assigneeId || ""}
                onChange={(e) =>
                  handleDirectUpdate("assigneeId", e.target.value || undefined)
                }
                className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-white/5 py-1.5 px-2.5 rounded-lg focus:outline-none"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(task.tags || []).slice(0, 8).map((tag, index) => (
                  <button
                    key={`${tag}-${index}`}
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                    style={{
                      backgroundColor: [
                        "#5C27FE",
                        "#0EA5E9",
                        "#00C48C",
                        "#FFB020",
                        "#FF4D4D",
                        "#EC4899",
                        "#8B5CF6",
                        "#F97316",
                      ][index % 8],
                    }}
                  >
                    {tag}
                    <X size={10} />
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Add a tag and press Enter or comma"
                className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/20 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-white/5 py-2 px-3 rounded-lg focus:outline-none"
              />
              <p className="text-[9px] text-gray-500 mt-1">
                Up to 8 tags, lowercase only, max 20 chars.
              </p>
            </div>

            {/* Date-picker Row */}
            <div className="col-span-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Calendar size={10} />
                Target Due Date & Hour
              </label>
              <input
                type="datetime-local"
                value={task.dueDate || ""}
                onChange={(e) => handleDirectUpdate("dueDate", e.target.value)}
                className="w-full text-xs font-semibold bg-gray-50 dark:bg-black/30 text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-white/10 py-1.5 px-2.5 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5 text-left">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Workspace Description & Core Guidelines
            </h4>

            {isEditingDesc ? (
              <div className="space-y-2">
                <textarea
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  rows={4}
                  placeholder="Insert notes, references, checklist outline guidelines here..."
                  className="w-full text-xs bg-white dark:bg-[#1A1A2E]/70 text-gray-900 dark:text-white p-3 rounded-xl border border-[#5C27FE] outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditingDesc(false)}
                    className="px-2.5 py-1 rounded text-[10px] text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveDescription}
                    className="px-3 py-1 rounded text-[10px] text-white bg-[#5C27FE] font-bold hover:bg-[#4a1ee3]"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingDesc(true)}
                className="p-3.5 text-xs text-gray-800 dark:text-gray-200 rounded-xl bg-white dark:bg-[#151525] border border-dashed border-gray-200 dark:border-white/5 min-h-16 cursor-pointer hover:border-gray-300 dark:hover:border-white/10 transition-all text-left whitespace-pre-wrap"
                title="Click to edit notes"
              >
                {task.description ||
                  "No descriptive details entered. Click to supply guidelines..."}
              </div>
            )}
          </div>

          {/* Action Subtasks Checklist */}
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Action Checklist (
                {(task.subtasks || []).filter((s) => s.isCompleted).length}/
                {(task.subtasks || []).length})
              </h4>
              {(task.subtasks || []).length > 0 && (
                <span className="text-[10px] font-mono font-bold text-[#5C27FE] dark:text-[#a085ff]">
                  {Math.round(
                    ((task.subtasks || []).filter((s) => s.isCompleted).length /
                      (task.subtasks || []).length) *
                      100,
                  )}
                  % Complete
                </span>
              )}
            </div>

            {/* List subtasks */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {(task.subtasks || []).map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-[#151525] border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.isCompleted}
                      onChange={(e) =>
                        handleToggleSubtask(sub.id, e.target.checked)
                      }
                      className="w-3.5 h-3.5 rounded border-gray-300 dark:border-white/20 text-[#5C27FE] focus:ring-0 cursor-pointer"
                    />
                    <span
                      className={`text-xs text-gray-800 dark:text-gray-200 truncate ${sub.isCompleted ? "line-through text-gray-400 dark:text-gray-500 font-medium" : ""}`}
                    >
                      {sub.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="p-1 rounded-md text-gray-400 hover:text-[#FF4D4D] hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:opacity-100 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick subtask create form */}
            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                placeholder="Add checklist item..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="flex-1 text-xs bg-white dark:bg-[#151525] text-gray-900 dark:text-white px-3.5 py-1.5 rounded-lg border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#5C27FE] dark:bg-white/5 hover:text-white text-gray-700 dark:text-gray-300 flex items-center justify-center cursor-pointer transition-colors"
                title="Create Checklist Row"
              >
                <Plus size={14} />
              </button>
            </form>
          </div>

          {/* REAL FILE ATTACHMENTS SECURED PANEL */}
          <div className="space-y-3.5 text-left">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
              <Paperclip size={11} />
              <span>
                File Coordinates & Assets ({task.attachments?.length || 0})
              </span>
            </h4>

            {/* Drag Zone Container */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-4.5 text-center transition-all cursor-pointer flex flex-col items-center justify-center relative ${
                isDraggingFile
                  ? "border-[#5C27FE] bg-[#5C27FE]/10"
                  : "border-gray-200 dark:border-white/15 bg-white/20 dark:bg-[#151525]/30"
              }`}
            >
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleManualFileSelect}
                title="Drag or click here to upload workspace files"
              />
              <UploadCloud size={24} className="text-gray-400 mb-1" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Drag workspace resources directly, or{" "}
                <span className="text-[#5C27FE] dark:text-[#a085ff]">
                  browse local files
                </span>
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                Supports PDF, PNG, IPG, DOCX indexes.
              </p>

              {isUploadingFile && (
                <div className="absolute inset-0 bg-white/80 dark:bg-[#121220]/85 backdrop-blur-xs flex items-center justify-center flex-col space-y-1 rounded-xl">
                  <div className="w-4.5 h-4.5 rounded-full border-2 border-[#5C27FE] border-t-transparent animate-spin" />
                  <p className="text-[10px] font-extrabold text-[#5C27FE] uppercase tracking-wider">
                    Sending secure buffers to network...
                  </p>
                </div>
              )}
            </div>

            {uploadError && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF4D4D] bg-[#FF4D4D]/10 p-1.5 rounded-lg">
                <AlertCircle size={12} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Attachments List */}
            {task.attachments && task.attachments.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {task.attachments.map((file) => (
                  <div
                    key={file.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#151525] border border-gray-150 dark:border-white/5 flex items-center justify-between gap-1.5"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {file.fileType.startsWith("image/") ? (
                        <img
                          src={file.fileUrl}
                          alt={file.fileName}
                          className="w-8 h-8 rounded-lg object-cover border border-gray-100"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 flex-shrink-0">
                          <Paperclip size={13} />
                        </div>
                      )}

                      <div className="min-w-0 text-left">
                        <p
                          className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate"
                          title={file.fileName}
                        >
                          {file.fileName}
                        </p>
                        <p className="text-[9px] text-gray-400 font-mono">
                          {Math.round(file.fileSize / 1024)} KB ·{" "}
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="View Asset"
                        className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        <ExternalLink size={12} />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(file.id)}
                        title="Delete Attachment"
                        className="p-1 rounded-md text-gray-400 hover:text-[#FF4D4D] hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tab Panel Selection Navigation Menu */}
          <div className="border-b border-gray-250 dark:border-white/5 text-left">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab("comments")}
                className={`py-2 text-xs font-bold border-b-2 tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "comments"
                    ? "border-[#5C27FE] text-[#5C27FE] dark:text-[#a085ff] dark:border-[#a085ff]"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                }`}
              >
                <MessageSquare size={13} />
                <span>Comments ({task.comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("activity")}
                className={`py-2 text-xs font-bold border-b-2 tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "activity"
                    ? "border-[#5C27FE] text-[#5C27FE] dark:text-[#a085ff] dark:border-[#a085ff]"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                }`}
              >
                <Activity size={13} />
                <span>Audit Logs ({task.activities.length})</span>
              </button>

              {task.isLearningGoal && (
                <button
                  onClick={() => setActiveTab("learning_coach")}
                  className={`py-2 text-xs font-bold border-b-2 tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer text-[#D97706] ${
                    activeTab === "learning_coach"
                      ? "border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400"
                      : "border-transparent text-gray-400 hover:text-amber-500"
                  }`}
                >
                  <Sparkles size={13} className="text-amber-500" />
                  <span>Learning Assistant</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Tab Elements */}
          <div className="space-y-4">
            {/* COMMENTS PANEL */}
            {activeTab === "comments" && (
              <div className="space-y-4">
                <div className="space-y-3.5 max-h-56 overflow-y-auto">
                  {task.comments.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400 italic">
                      No team discussions yet. Start the conversation below!
                    </div>
                  ) : (
                    task.comments.map((comm) => {
                      const commenter = users.find((u) => u.id === comm.userId);
                      const formattedTime = new Date(
                        comm.createdAt,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const formattedDateVal = new Date(
                        comm.createdAt,
                      ).toLocaleDateString();

                      return (
                        <div
                          key={comm.id}
                          className="flex gap-2.5 text-left items-start"
                        >
                          <img
                            src={
                              commenter?.avatarUrl ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                            }
                            alt={commenter?.name || "User"}
                            className="w-7 h-7 rounded-full border border-white/50 object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 p-2.5 rounded-xl bg-white dark:bg-[#151525] border border-gray-100 dark:border-white/5 shadow-xs text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-gray-900 dark:text-gray-100">
                                {commenter?.name || "Contributor"}
                              </span>
                              <span
                                className="text-[9px] text-gray-400 font-mono"
                                title={comm.createdAt}
                              >
                                {formattedDateVal} {formattedTime}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                              {comm.text}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form
                  onSubmit={handleAddComment}
                  className="flex gap-2 text-left"
                >
                  <input
                    type="text"
                    placeholder="Contribute core findings, ideas, or links..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 text-xs bg-white dark:bg-[#151525] text-gray-900 dark:text-white px-3.5 py-2 rounded-xl border border-gray-200/60 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[#5C27FE] text-white flex items-center justify-center hover:bg-[#4a1ee3] active:scale-95 transition-all shadow-md shadow-[#5C27FE]/20 cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            )}

            {/* AUDIT LOG ACTION PATHS */}
            {activeTab === "activity" && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {task.activities.length === 0 ? (
                  <div className="text-center py-6 text-xs text-gray-400 italic">
                    Audit trail clean. No operations completed yet.
                  </div>
                ) : (
                  task.activities.map((act) => {
                    const elapsed = new Date(act.createdAt).toLocaleTimeString(
                      [],
                      { hour: "2-digit", minute: "2-digit" },
                    );
                    const activityDate = new Date(
                      act.createdAt,
                    ).toLocaleDateString();

                    return (
                      <div
                        key={act.id}
                        className="text-xs text-gray-600 dark:text-gray-400 flex justify-between items-start gap-3 p-2.5 rounded bg-white dark:bg-[#151525]/45 border border-transparent hover:border-white/5 transition-colors text-left font-medium"
                      >
                        <div className="flex-1 leading-relaxed">
                          <span className="font-bold text-gray-900 dark:text-gray-200">
                            {act.userName || "System Engine"}
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {act.action}
                          </span>
                        </div>
                        <span className="text-[8.5px] text-gray-400 font-mono flex-shrink-0 mt-0.5">
                          {activityDate} · {elapsed}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* INTENSITY AI LEARNING HUB & SMART ROADMAP CURATOR */}
            {activeTab === "learning_coach" && task.isLearningGoal && (
              <div className="text-left space-y-5 animate-fadeIn">
                {/* Visual Header Spark */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-pink-500/5 to-indigo-500/10 border border-amber-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 z-10 max-w-sm">
                    <p className="text-[10px] uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                      <Sparkles
                        size={11}
                        className="animate-spin text-amber-500"
                      />
                      Gemini Educational Architect
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      Transform this workspace task into a full curriculums
                      roadmap. Gemini constructs study phases, resources, and
                      custom practice sandboxes immediately.
                    </p>
                  </div>

                  {!task.aiRoadmap && (
                    <button
                      onClick={handleGenerateAI_Roadmap}
                      disabled={isGeneratingRoadmap}
                      className="px-4 py-2 bg-gradient-to-r from-[#D97706] to-[#5C27FE] text-white hover:opacity-90 font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 transition-all self-start"
                    >
                      {isGeneratingRoadmap ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Mapping Curriculum...</span>
                        </>
                      ) : (
                        <>
                          <BrainCircuit size={13} />
                          <span>Generate Roadmap</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {roadmapError && (
                  <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/20 border border-red-200/20 text-xs text-amber-550 dark:text-red-400 mt-2 font-bold leading-relaxed">
                    🚨 API Configuration Warning: {roadmapError}
                  </div>
                )}

                {/* AI generated structured Roadmap list */}
                {task.aiRoadmap && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        DYNAMIC ROADMAP STEPS
                      </span>
                      <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2.5 py-0.5 rounded-full font-mono">
                        {task.aiRoadmap.filter((p) => p.completed).length} /{" "}
                        {task.aiRoadmap.length} COMPLETED
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {task.aiRoadmap.map((phase, i) => (
                        <div
                          key={i}
                          className={`p-4 rounded-xl border transition-all text-left relative ${
                            phase.completed
                              ? "bg-amber-500/5 border-amber-500/30"
                              : "bg-white dark:bg-[#151525] border-gray-150 dark:border-white/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2.5">
                            <div>
                              <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                Phase {phase.phase} · Est: {phase.estimatedTime}
                              </p>
                              <h5 className="font-sora font-extrabold text-sm text-gray-900 dark:text-white mt-0.5">
                                {phase.title}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-300 mt-1.5 leading-relaxed font-normal">
                                {phase.description}
                              </p>
                            </div>

                            <input
                              type="checkbox"
                              checked={phase.completed || false}
                              onChange={(e) =>
                                handleToggleRoadmapPhase(i, e.target.checked)
                              }
                              className="w-4.5 h-4.5 text-amber-500 rounded border-amber-300 focus:ring-0 cursor-pointer flex-shrink-0 mt-0.5"
                              title="Toggle Milestone Accomplished"
                            />
                          </div>

                          {/* Suggested Core External Resource Links */}
                          <div className="mt-3.5 pt-3.5 border-t border-gray-100 dark:border-white/5">
                            <p className="text-[9px] font-extrabold uppercase tracking-wider text-gray-400">
                              Curated Learning Assets
                            </p>

                            <div className="mt-2 space-y-1.5">
                              {phase.resources?.map((res, rIdx) => (
                                <a
                                  key={rIdx}
                                  href={res.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 group/link text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#5C27FE] dark:hover:text-[#a085ff] transition-all"
                                >
                                  <span className="text-[9px] font-extrabold uppercase tracking-widest bg-gray-100 dark:bg-white/5 group-hover/link:bg-[#5C27FE]/15 px-1.5 py-0.5 rounded text-gray-450">
                                    {res.type}
                                  </span>
                                  <span className="truncate flex-1 text-left decoration-solid group-hover/link:underline">
                                    {res.title}
                                  </span>
                                  <ExternalLink
                                    size={10}
                                    className="text-gray-400 group-hover/link:text-[#5C27FE] flex-shrink-0"
                                  />
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Suggesed Active Sandbox Hands-On Project */}
                          <div className="mt-3.5 p-3 rounded-xl bg-gray-100/50 dark:bg-black/20 border border-gray-200/20 text-xs">
                            <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase block mb-1">
                              💪 CHALENGE BENCHMARK SANDBOX
                            </span>
                            <span className="text-gray-700 dark:text-gray-200 leading-relaxed font-bold block">
                              {phase.practiceProject}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* AI COACH DISCUSSIONS MINI BOX */}
                    <div className="pt-4 border-t border-gray-200/50 dark:border-white/5 space-y-3.5">
                      <div className="flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
                        <BrainCircuit size={12} className="text-amber-500" />
                        <span>Interactive Coaching Workspace Sandbox</span>
                      </div>

                      {/* Coaching Messages logs panel */}
                      <div className="bg-white/45 dark:bg-black/20 p-3.5 rounded-xl border border-gray-150 dark:border-white/10 text-xs space-y-3.5 max-h-56 overflow-y-auto">
                        {aiChatMessages.length === 0 ? (
                          <p className="italic text-gray-400 text-center py-2.5">
                            Ask your virtual AI coach any question regarding
                            this study outline to solidify your understanding...
                          </p>
                        ) : (
                          aiChatMessages.map((msg, mIdx) => (
                            <div
                              key={mIdx}
                              className={`flex gap-2 text-left ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                              {msg.role === "model" && (
                                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white font-extrabold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                  AI
                                </div>
                              )}
                              <div
                                className={`p-3.5 rounded-xl max-w-[85%] leading-relaxed ${
                                  msg.role === "user"
                                    ? "bg-[#5C27FE] text-white font-semibold"
                                    : "bg-white dark:bg-[#1A1A2E]/55 border border-gray-150 dark:border-white/5 text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                <p className="whitespace-pre-line">
                                  {msg.text}
                                </p>
                              </div>
                            </div>
                          ))
                        )}

                        {isAiResponding && (
                          <div className="flex gap-2 justify-start items-center text-gray-400 italic">
                            <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                            <span>
                              Mentor Coach formulating recommendations...
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Coach Prompt Form */}
                      <form
                        onSubmit={askAUMentorCoaching}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          placeholder="Discuss lessons, ask for debugging tips or quiz questions..."
                          value={aiChatText}
                          onChange={(e) => setAiChatText(e.target.value)}
                          disabled={isAiResponding}
                          className="flex-1 text-xs bg-white dark:bg-[#151525] text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-amber-500 disabled:opacity-50"
                        />
                        <button
                          type="submit"
                          disabled={isAiResponding || !aiChatText.trim()}
                          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white cursor-pointer shadow-md inline-flex items-center justify-center transition-all"
                        >
                          <Send size={13} />
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
