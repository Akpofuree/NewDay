import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
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
import NotesEditor from "./NotesEditor";
import {
  X,
  UserCheck,
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
  FileText,
  BookOpen,
  File,
  Lightbulb,
  Code,
  UserCircle,
  Mail,
  Copy,
  Save,
  Map,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useToast } from "./Toast";

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
  const { showConfirm } = useToast();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"comments" | "activity" | "learning_coach" | "notes">(
    "comments"
  );
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");

  // 3. AI Learning Assistant State
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");
  const [aiChatText, setAiChatText] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [aiChatMessages, setAiChatMessages] = useState<
    Array<{ role: "user" | "model"; text: string }>
  >([]);
  const [selectedAiCapability, setSelectedAiCapability] = useState<string>("task_breakdown");
  const [isProcessingAiRequest, setIsProcessingAiRequest] = useState(false);
  const [aiRequestInput, setAiRequestInput] = useState("");
  const [aiResponse, setAiResponse] = useState<string>("");
  const [aiError, setAiError] = useState<string>("");
  const learningAssistantRef = useRef<HTMLDivElement>(null);
  const [uploadedDocument, setUploadedDocument] = useState<{
    file: File;
    fileName: string;
    extractedText: string;
  } | null>(null);

  // AI Capabilities organized by category
  const aiCapabilities = {
    "Task Management AI": [
      {
        id: "task_breakdown",
        label: "Task Breakdown",
        icon: CheckSquare,
        description: "Break down tasks into actionable subtasks with time estimates",
        placeholder: "Describe the task you want to break down into smaller steps...",
      },
      {
        id: "roadmap",
        label: "Generate Roadmap",
        icon: Map,
        description: "Create a structured learning roadmap with phases and resources",
        placeholder: "Click to generate a learning roadmap for this task...",
      },
    ],
    "Document & Content AI": [
      {
        id: "summarize",
        label: "Documentation Summarization",
        icon: FileText,
        description: "Summarize documents into clear, structured bullet points",
        placeholder: "Upload a document or paste content to summarize...",
      },
      {
        id: "study_notes",
        label: "Study Notes Generator",
        icon: BookOpen,
        description: "Convert content into well-structured study notes with key terms",
        placeholder: "Upload a document or paste content to create study notes...",
      },
    ],
    "Learning & Explanation AI": [
      {
        id: "explain",
        label: "Explain Concepts",
        icon: Lightbulb,
        description: "Explain concepts in plain language with analogies and examples",
        placeholder: "Describe the concept or topic you want explained...",
      },
      {
        id: "code_explain",
        label: "Code Explanation",
        icon: Code,
        description: "Explain code clearly with line-by-line breakdown and patterns",
        placeholder: "Paste the code you want explained...",
      },
      {
        id: "error_explain",
        label: "Error Explanation",
        icon: AlertCircle,
        description: "Analyze errors and provide clear fixes with corrected code",
        placeholder: "Paste the error message or problematic code...",
      },
    ],
    "Creative & Professional AI": [
      {
        id: "brainstorm",
        label: "Brainstorm & Assistance",
        icon: Sparkles,
        description: "Brainstorm ideas and explore possibilities for your task",
        placeholder: "Describe what you want to brainstorm or explore...",
      },
      {
        id: "resume",
        label: "Resume Improvement",
        icon: UserCircle,
        description: "Strengthen language and highlight impact with metrics",
        placeholder: "Paste your resume content or describe your experience...",
      },
      {
        id: "cover_letter",
        label: "Cover Letter Generator",
        icon: Mail,
        description: "Write compelling, specific, and engaging cover letters",
        placeholder: "Describe the job and your qualifications...",
      },
      {
        id: "interview",
        label: "Interview Preparation",
        icon: MessageSquare,
        description: "Generate interview questions and STAR method answers",
        placeholder: "Describe the job role or company you're interviewing with...",
      },
    ],
  };

  // Get placeholder for selected capability
  const getPlaceholder = () => {
    for (const category of Object.values(aiCapabilities)) {
      const capability = category.find((cap) => cap.id === selectedAiCapability);
      if (capability) return capability.placeholder;
    }
    return "Describe what you need help with...";
  };

  useEffect(() => {
    if (task) {
      setTitleValue(task.title);
      setDescriptionValue(task.description || "");
      // Reset timer state when switching tasks to prevent bleeding
      setIsPomodoroActive(false);
      setTimeLeft(1500);
      setPomodoroMode("focus");
      // Reset AI state when switching tasks to prevent bleeding
      setAiRequestInput("");
      setAiResponse("");
      setAiError("");
      setAiChatText("");
      setAiChatMessages([]);
      setRoadmapError("");
      setSelectedAiCapability("task_breakdown");
      setUploadedDocument(null);
      setIsProcessingAiRequest(false);
      setIsAiResponding(false);
      setIsGeneratingRoadmap(false);
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
            "Completed 25-min Pomodoro (🍅) Focus Cycle successfully!"
          );
          onUpdateTask(withAct);
        }

        showToast("success", "Focus session complete. Time for a 5-minute break.");
        setPomodoroMode("break");
        setTimeLeft(300); // 5 minutes breather
      } else {
        showToast("info", "Rest cycle completed. Ready to jump back in?");
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
    const withActivity = addActivity(updated, `renamed outline to "${titleValue}"`);
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
      actionStr = g ? `associated task with group "${g.name}"` : "removed group alignment";
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
    const withActivity = addActivity(updated, `added subtask checklist row "${newSub.title}"`);
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
        subtasks: [...(task.subtasks || []).filter((s) => s.id !== newSub.id), saved],
      };
      onUpdateTask(reconciled);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSubtask = async (subId: string, isCompleted: boolean) => {
    const updatedSubtasks = (task.subtasks || []).map((s) =>
      s.id === subId ? { ...s, isCompleted } : s
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
      const confirmed = await showConfirm("All subtasks are done. Mark this task complete?");
      if (confirmed) {
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
        subtasks: (task.subtasks || []).map((s) => (s.id === saved.id ? saved : s)),
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

    const actionText = targetSub ? `deleted subtask "${targetSub.title}"` : "removed subtask row";
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
      `manually logged ${minutes} minutes of dedicated workflow`
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

  const handleManualFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processAttachmentUpload(files[0]);
    }
  };

  const processAttachmentUpload = async (file: File) => {
    setIsUploadingFile(true);
    setUploadProgress(8);
    setUploadError("");

    try {
      // Create readable simulator Base64 url
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve((ev.target?.result as string) || "");
        reader.readAsDataURL(file);
      });
      const base64Url = await base64Promise;
      setUploadProgress(45);

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
      setUploadProgress(78);

      const fileObj: Attachment = await res.json();

      const currentAttachments = task.attachments || [];
      const updated = {
        ...task,
        attachments: [...currentAttachments, fileObj],
      };
      const withActivity = addActivity(updated, `attached workspace resource "${file.name}"`);
      onUpdateTask(withActivity);

      // Extract text from supported file types (PDF, DOCX, TXT)
      const supportedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ];

      if (supportedTypes.includes(file.type)) {
        try {
          setUploadProgress(88);
          const extractRes = await apiFetch("/api/attachments/extract-text", {
            method: "POST",
            body: JSON.stringify({
              dataUrl: base64Url,
              fileType: file.type,
            }),
          });

          if (extractRes.ok) {
            const { extractedText } = await extractRes.json();
            setUploadedDocument({
              file,
              fileName: file.name,
              extractedText,
            });
          }
        } catch (extractErr) {
          console.error("Failed to extract text:", extractErr);
          // Don't fail the upload if text extraction fails
        }
      }
      setUploadProgress(100);
    } catch (err: any) {
      setUploadError(err.message || "Failure deploying attachment files.");
    } finally {
      setIsUploadingFile(false);
      window.setTimeout(() => setUploadProgress(0), 700);
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
      `removed workspace resources attachment: "${targetFile?.fileName || "Resource"}"`
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
        : "Removed learning goal status constraints"
    );
    onUpdateTask(updated);
    if (toggleVal) {
      setActiveTab("learning_coach");
    } else {
      setActiveTab("comments");
    }
  };

  // AI Learning Coach Request Handler
  const handleGenerateAIResponse = async () => {
    // For roadmap, we don't need user input - just generate it
    if (selectedAiCapability === "roadmap") {
      handleGenerateAI_Roadmap();
      return;
    }

    if (!aiRequestInput.trim()) return;

    setIsProcessingAiRequest(true);
    setAiError("");
    setAiResponse("");

    try {
      const response = await apiFetch("/api/ai/learning-coach", {
        method: "POST",
        body: JSON.stringify({
          feature: selectedAiCapability,
          userRequest: aiRequestInput,
          taskTitle: task.title,
          taskDescription: task.description || "",
          documentText: uploadedDocument?.extractedText || "",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.detail || `AI request failed (${response.status})`
        );
      }

      const data = await response.json();
      setAiResponse(data.text);
    } catch (err: any) {
      setAiError(err.message || "Failed to generate AI response");
    } finally {
      setIsProcessingAiRequest(false);
    }
  };

  // Copy AI response to clipboard
  const handleCopyResponse = () => {
    navigator.clipboard.writeText(aiResponse);
  };

  // Save AI response to task notes
  const handleSaveToNotes = () => {
    const currentNotes = task.notes || "";
    const updatedNotes = currentNotes
      ? `${currentNotes}\n\n--- AI Learning Coach Response ---\n${aiResponse}`
      : `--- AI Learning Coach Response ---\n${aiResponse}`;
    const updated = { ...task, notes: updatedNotes };
    onUpdateTask(updated);
  };

  // Request roadmap via Express using GoogleGenAI SDK in backend server
  const handleGenerateAI_Roadmap = async () => {
    console.log("handleGenerateAI_Roadmap called");
    setIsGeneratingRoadmap(true);
    setRoadmapError("");

    try {
      console.log("Calling /api/ai/roadmap with:", task.title, task.description);
      const response = await apiFetch("/api/ai/roadmap", {
        method: "POST",
        body: JSON.stringify({
          skillName: task.title,
          description: task.description || "Provide progressive technical overview",
        }),
      });

      console.log("Response status:", response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || "Roadmap endpoint failed.");
      }

      const data = await response.json();
      console.log("Response data:", data);

      if (!data.phases || !Array.isArray(data.phases)) {
        console.error("Invalid response format:", data);
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

      console.log("Updating task with roadmap:", updated);
      const withActivity = addActivity(
        updated,
        `Generated custom study roadmap via Google Gemini! ✨`
      );
      onUpdateTask(withActivity);

      // Smooth scroll to roadmap section after generation
      setTimeout(() => {
        const container = document.getElementById("drawer-scroll-container");
        const roadmapSection = document.getElementById("roadmap-section");
        if (container && roadmapSection) {
          container.scrollTo({ top: roadmapSection.offsetTop - 20, behavior: "smooth" });
        }
      }, 200);

      // Inject welcoming AI mentor notification
      setAiChatMessages([
        {
          role: "model",
          text: `Hi ${currentUser?.name || "Developer"}! ✨ I have structured a custom, 3-phase curriculum for "${task.title}". Below are lessons and practice guides. Let me know what you want to learn first!`,
        },
      ]);
    } catch (err: any) {
      console.error("Error in handleGenerateAI_Roadmap:", err);
      setRoadmapError(
        err.message ||
          "Failure prompting virtual teacher. Double-check your API credentials key values."
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
      `${isDone ? "Conquered" : "Reset"} checkpoint sequence Phase ${phaseIndex + 1}: ${progressRoad[phaseIndex].title}`
    );
    onUpdateTask(withAct);
  };

  // Ask Mentor questions
  const askAUMentorCoaching = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatText.trim() || isAiResponding) return;

    const userMsg = aiChatText.trim();
    const updatedHistory = [...aiChatMessages, { role: "user" as const, text: userMsg }];
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
    <div className="fixed inset-0 z-50 flex md:justify-end justify-center items-end md:items-stretch font-sans">
      {/* Translucent backdrop frosted glass overlay */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
        onClick={onClose}
      />

      {/* Slide pane container - drawer on desktop, bottom sheet on mobile */}
      <div
        className="relative w-full md:max-w-xl md:h-full h-[85vh] bg-[#FAFBFD] dark:bg-[#0E0E18] shadow-2xl flex flex-col z-10 border-l border-white/20 dark:border-white/5 md:rounded-none rounded-t-2xl"
        style={{
          animation: isOpen
            ? "slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards"
            : "slideOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Style tag placeholder for dynamic keyframe slider animation */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes slideIn {
            from { transform: translateY(100%); opacity: 0.9; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes slideOut {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100%); opacity: 0.9; }
          }
          @media (min-width: 768px) {
            @keyframes slideIn {
              from { transform: translateX(100%); opacity: 0.9; }
              to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(100%); opacity: 0.9; }
            }
          }
        `,
          }}
        />

        {/* Mobile drag handle */}
        <div className="md:hidden w-full flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

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
              title={task.isLearningGoal ? "Disable Learning Hub" : "Enable Smart Learning Hub"}
              className={`p-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                task.isLearningGoal
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/45 dark:text-amber-400"
                  : "text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
              }`}
            >
              <BrainCircuit size={15} />
              <span className="text-[10px] font-bold uppercase">Learning Coach</span>
            </button>

            <button
              onClick={async () => {
                const confirmed = await showConfirm("Delete this task?");
                if (confirmed) {
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
        <div id="drawer-scroll-container" className="flex-1 overflow-y-auto p-5 space-y-6 relative">
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
              <span className="text-[9px] text-gray-400 font-mono">ID: {task.id}</span>
              {task.assignedByName && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#5C27FE]/10 text-[#5C27FE] dark:bg-[#5C27FE]/20 dark:text-[#a085ff]">
                  <UserCheck size={9} />
                  Assigned by {task.assignedByName}
                </span>
              )}
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
                    <span>🍅 {pomodoroMode === "focus" ? "Focus Work" : "Short Break"}</span>
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
                    {isPomodoroActive ? <Square size={12} /> : <Play size={12} />}
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
                    className="btn-primary-shimmer ripple-effect px-3 py-1.5 max-h-8.5 rounded-lg text-xs font-bold text-white bg-[#5C27FE] hover:bg-[#4a1ee3] transition-all cursor-pointer shadow-sm flex items-center justify-center whitespace-nowrap"
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
                onChange={(e) => handleDirectUpdate("groupId", e.target.value || undefined)}
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
                onChange={(e) => handleDirectUpdate("assigneeId", e.target.value || undefined)}
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
                    className="btn-primary-shimmer ripple-effect px-3 py-1 rounded text-[10px] text-white bg-[#5C27FE] font-bold hover:bg-[#4a1ee3]"
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
                Action Checklist ({(task.subtasks || []).filter((s) => s.isCompleted).length}/
                {(task.subtasks || []).length})
              </h4>
              {(task.subtasks || []).length > 0 && (
                <span className="text-[10px] font-mono font-bold text-[#5C27FE] dark:text-[#a085ff]">
                  {Math.round(
                    ((task.subtasks || []).filter((s) => s.isCompleted).length /
                      (task.subtasks || []).length) *
                      100
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
                      onChange={(e) => handleToggleSubtask(sub.id, e.target.checked)}
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
              <span>File Coordinates & Assets ({task.attachments?.length || 0})</span>
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
                <span className="text-[#5C27FE] dark:text-[#a085ff]">browse local files</span>
              </p>
              <p className="text-[9px] text-gray-400 mt-0.5">
                Supports PDF, PNG, IPG, DOCX indexes.
              </p>

              {isUploadingFile && (
                <div className="absolute inset-0 bg-white/85 dark:bg-[#121220]/88 backdrop-blur-xs flex items-center justify-center flex-col space-y-3 rounded-xl px-4">
                  <div className="w-full max-w-[240px] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#5C27FE]">
                      <span>Uploading file</span>
                      <span>{Math.max(0, Math.min(100, uploadProgress))}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#5C27FE] via-[#0EA5E9] to-[#00C48C] transition-[width] duration-200 ease-out"
                        style={{ width: `${Math.max(0, Math.min(100, uploadProgress))}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] font-extrabold text-[#5C27FE] uppercase tracking-wider text-center">
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

            {/* Uploaded Document with AI Actions */}
            {uploadedDocument && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#5C27FE]/10 to-[#D97706]/10 border border-[#5C27FE]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#5C27FE]" />
                    <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
                      {uploadedDocument.fileName}
                    </span>
                  </div>
                  <button
                    onClick={() => setUploadedDocument(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedAiCapability("summarize");
                      setAiRequestInput(
                        `Please summarize the uploaded document: ${uploadedDocument.fileName}`
                      );
                    }}
                    className="flex-1 px-2 py-1.5 bg-[#5C27FE] text-white text-[9px] font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1"
                  >
                    <Sparkles size={10} />
                    <span>Summarize</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAiCapability("study_notes");
                      setAiRequestInput(
                        `Create study notes from the uploaded document: ${uploadedDocument.fileName}`
                      );
                    }}
                    className="flex-1 px-2 py-1.5 bg-[#D97706] text-white text-[9px] font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1"
                  >
                    <BookOpen size={10} />
                    <span>Study Notes</span>
                  </button>
                </div>
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

              <button
                onClick={() => {
                  setActiveTab("learning_coach");
                  setTimeout(() => {
                    const container = document.getElementById("drawer-scroll-container");
                    const aiHub = document.getElementById("ai-learning-hub");
                    if (container && aiHub) {
                      container.scrollTo({ top: aiHub.offsetTop - 20, behavior: "smooth" });
                    } else if (container && learningAssistantRef.current) {
                      container.scrollTo({
                        top: learningAssistantRef.current.offsetTop - 20,
                        behavior: "smooth",
                      });
                    }
                  }, 200);
                }}
                className={`py-2 text-xs font-bold border-b-2 tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer text-[#D97706] ${
                  activeTab === "learning_coach"
                    ? "border-amber-500 text-amber-600 dark:text-amber-400 dark:border-amber-400"
                    : "border-transparent text-gray-400 hover:text-amber-500"
                }`}
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Learning Assistant</span>
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`py-2 text-xs font-bold border-b-2 tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "notes"
                    ? "border-[#5C27FE] text-[#5C27FE] dark:text-[#a085ff] dark:border-[#a085ff]"
                    : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                }`}
              >
                <Folder size={13} />
                <span>Notes</span>
                {task.notes && <span className="w-1.5 h-1.5 rounded-full bg-[#5C27FE]"></span>}
              </button>
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
                      const formattedTime = new Date(comm.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const formattedDateVal = new Date(comm.createdAt).toLocaleDateString();

                      return (
                        <div key={comm.id} className="flex gap-2.5 text-left items-start">
                          <img
                            src={
                              commenter?.avatarUrl ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
                            }
                            alt={commenter?.name || "User"}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/50 object-cover"
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

                <form onSubmit={handleAddComment} className="flex gap-2 text-left">
                  <input
                    type="text"
                    placeholder="Contribute core findings, ideas, or links..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 text-xs bg-white dark:bg-[#151525] text-gray-900 dark:text-white px-3.5 py-2 rounded-xl border border-gray-200/60 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                  />
                  <button
                    type="submit"
                    className="btn-primary-shimmer ripple-effect px-3 py-2 rounded-xl bg-[#5C27FE] text-white flex items-center justify-center hover:bg-[#4a1ee3] active:scale-95 transition-all shadow-md shadow-[#5C27FE]/20 cursor-pointer"
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
                    const elapsed = new Date(act.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const activityDate = new Date(act.createdAt).toLocaleDateString();

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
            {activeTab === "learning_coach" && (
              <div
                id="ai-learning-hub"
                key={task.id}
                className="text-left space-y-5 animate-fadeIn"
              >
                {!task.isLearningGoal ? (
                  <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 via-pink-500/5 to-indigo-500/10 border border-amber-500/20 text-center space-y-4">
                    <Sparkles size={32} className="mx-auto text-amber-500" />
                    <div className="space-y-2">
                      <h4 className="font-sora font-extrabold text-sm text-gray-900 dark:text-white">
                        Enable Smart Learning Mode
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm mx-auto">
                        Transform this task into an AI-powered learning journey with custom
                        roadmaps, interactive coaching, and curated resources.
                      </p>
                    </div>
                    <button
                      onClick={handleToggleLearningGoal}
                      className="btn-primary-shimmer ripple-effect px-5 py-2.5 bg-gradient-to-r from-[#D97706] to-[#5C27FE] text-white hover:opacity-90 font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-2 transition-all"
                    >
                      <BrainCircuit size={14} />
                      <span>Enable Learning Coach</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Visual Header Spark */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-pink-500/5 to-indigo-500/10 border border-amber-500/20 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1 z-10 max-w-sm">
                        <p className="text-[10px] uppercase font-mono tracking-widest text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Sparkles size={11} className="animate-spin text-amber-500" />
                          AI Smart Learning Hub
                        </p>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          12+ AI capabilities to help you learn, create, and achieve more. Select a
                          capability below to get started.
                        </p>
                      </div>
                    </div>

                    {/* AI Capability Selector */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <BrainCircuit size={12} className="text-amber-500" />
                        <span>Select AI Capability</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {Object.entries(aiCapabilities).map(([category, capabilities]) => (
                          <div key={category} className="space-y-1.5">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 px-1">
                              {category}
                            </p>
                            {capabilities.map((cap) => (
                              <button
                                key={cap.id}
                                onClick={() => setSelectedAiCapability(cap.id)}
                                className={`w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-semibold transition-all ${
                                  selectedAiCapability === cap.id
                                    ? "bg-[#5C27FE] text-white border-2 border-[#5C27FE] shadow-md shadow-[#5C27FE]/20"
                                    : "bg-white dark:bg-[#151525] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-[#5C27FE]/50 hover:shadow-sm"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <cap.icon
                                    size={14}
                                    className={
                                      selectedAiCapability === cap.id
                                        ? "text-white"
                                        : "text-[#5C27FE] dark:text-[#a085ff]"
                                    }
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold">{cap.label}</div>
                                    <div
                                      className={`text-[8px] mt-0.5 leading-tight ${selectedAiCapability === cap.id ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}
                                    >
                                      {cap.description}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Request Input */}
                    <div ref={learningAssistantRef} className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Your Request
                      </label>
                      <textarea
                        value={aiRequestInput}
                        onChange={(e) => setAiRequestInput(e.target.value)}
                        placeholder={getPlaceholder()}
                        className="w-full text-xs bg-white dark:bg-[#151525] text-gray-900 dark:text-white px-3.5 py-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE] resize-none"
                        rows={3}
                      />
                      <button
                        onClick={handleGenerateAIResponse}
                        disabled={isProcessingAiRequest || !aiRequestInput.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-[#D97706] to-[#5C27FE] text-white hover:opacity-90 font-bold text-xs rounded-xl shadow-md cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 transition-all"
                      >
                        {isProcessingAiRequest ? (
                          <>
                            <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            <span>Generate Response</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiError && (
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/20 border border-red-200/20 text-xs text-red-600 dark:text-red-400 mt-2 font-bold leading-relaxed">
                        🚨 {aiError}
                      </div>
                    )}

                    {aiResponse && (
                      <div className="space-y-2">
                        <div className="p-4 rounded-xl bg-white dark:bg-[#151525] border border-gray-200 dark:border-white/10">
                          <div className="prose prose-xs dark:prose-invert max-w-none">
                            <ReactMarkdown>{aiResponse}</ReactMarkdown>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCopyResponse}
                            className="flex-1 px-3 py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Copy size={12} />
                            <span>Copy</span>
                          </button>
                          <button
                            onClick={handleSaveToNotes}
                            className="flex-1 px-3 py-2 bg-[#5C27FE]/10 border border-[#5C27FE]/20 text-[#5C27FE] text-[10px] font-bold rounded-lg hover:bg-[#5C27FE]/20 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Save size={12} />
                            <span>Save to Task Notes</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {roadmapError && (
                      <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/20 border border-red-200/20 text-xs text-amber-550 dark:text-red-400 mt-2 font-bold leading-relaxed">
                        🚨 API Configuration Warning: {roadmapError}
                      </div>
                    )}

                    {/* AI generated structured Roadmap list */}
                    {task.aiRoadmap && (
                      <div id="roadmap-section" className="space-y-4 pt-1">
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
                                  onChange={(e) => handleToggleRoadmapPhase(i, e.target.checked)}
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
                                Ask your virtual AI coach any question regarding this study outline
                                to solidify your understanding...
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
                                    <p className="whitespace-pre-line">{msg.text}</p>
                                  </div>
                                </div>
                              ))
                            )}

                            {isAiResponding && (
                              <div className="flex gap-2 justify-start items-center text-gray-400 italic">
                                <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                                <span>Mentor Coach formulating recommendations...</span>
                              </div>
                            )}
                          </div>

                          {/* Coach Prompt Form */}
                          <form onSubmit={askAUMentorCoaching} className="flex gap-2">
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
                  </>
                )}
              </div>
            )}

            {/* NOTES PANEL */}
            {activeTab === "notes" && (
              <div className="space-y-4 animate-fadeIn">
                <NotesEditor
                  taskId={task.id}
                  initialNotes={task.notes}
                  onNotesSaved={(notes) => onUpdateTask({ ...task, notes })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
