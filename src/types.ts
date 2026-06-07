/**
 * Types and interfaces for the Collaborative Task Manager
 */

export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  sortOrder: number;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  createdAt: string;
}

export interface AIRoadmapItem {
  phase: number;
  title: string;
  estimatedTime: string;
  description: string;
  resources: {
    type: string;
    title: string;
    url: string;
  }[];
  practiceProject: string;
  completed?: boolean;
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface MessageAttachment extends Attachment {
  uploadProgress?: number;
  uploadStatus?: "uploading" | "uploaded" | "failed";
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO string or YYYY-MM-DDTHH:MM
  assigneeId?: string;
  groupId?: string; // project/group ID if applicable
  tags?: string[];
  subtasks?: Subtask[];
  comments: Comment[];
  activities: Activity[];
  createdAt: string;
  isLearningGoal?: boolean;
  aiRoadmap?: AIRoadmapItem[];
  attachments?: Attachment[];
  timeTrackedSeconds?: number;
}

export interface Group {
  id: string;
  name: string;
  color: string; // e.g., '#FF4D4D'
  description?: string;
  memberIds: string[];
  ownerId?: string | null;
  role?: "owner" | "admin" | "member";
  visibility?: "public" | "private";
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  timezone?: string;
  notificationPreferences?: {
    email?: boolean;
    mentions?: boolean;
    tasks?: boolean;
  };
  xpPoints?: number;
  streakCount?: number;
  lastSeenAt?: string;
  presenceStatus?: "online" | "offline";
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetDate?: string;
  progress: number; // 0-100% computed
  linkedTaskIds: string[];
  milestones?: { title: string; targetDate?: string; completed: boolean }[];
}

export interface ChatMessage {
  id: string;
  channelId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface ChatMessageWithExtras extends ChatMessage {
  attachments?: MessageAttachment[];
  taskRefId?: string;
  updatedAt?: string;
  isSystem?: boolean;
}

export interface ChatChannel {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  createdBy?: string | null;
  createdAt?: string;
  isDM?: boolean;
  memberIds?: string[];
  unreadCount?: number;
}

export interface AppState {
  users: User[];
  currentUser: User | null;
  groups: Group[];
  tasks: Task[];
  activeView: "list" | "kanban";
  activeCategory: "today" | "my_tasks" | "completed" | string; // group id if it's a string, or predefined categories
  filters: {
    status: "all" | TaskStatus;
    priority: "all" | TaskPriority;
    search: string;
  };
  darkMode: boolean;
}
