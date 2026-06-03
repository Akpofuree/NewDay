import { Task, Group, User } from "./types";

// Mock avatars from dynamic safe sources (Unsplash minimal profile images with referrers)
export const DEFAULT_USERS: User[] = [
  {
    id: "user_1",
    name: "Alex Rivera",
    email: "alex@company.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces&q=80",
  },
  {
    id: "user_2",
    name: "Maria Santos",
    email: "maria@company.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&q=80",
  },
  {
    id: "user_3",
    name: "Marcus Chen",
    email: "marcus@company.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces&q=80",
  },
  {
    id: "user_4",
    name: "Sarah Jenkins",
    email: "sarah@company.com",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces&q=80",
  },
];

export const DEFAULT_GROUPS: Group[] = [
  {
    id: "group_marketing",
    name: "Marketing Launch",
    color: "#FF4D4D", // Vivid Coral
    description: "Q4 Product campaign assets, design, and outreach planning.",
    memberIds: ["user_1", "user_2", "user_4"],
  },
  {
    id: "group_dev",
    name: "Dev Sprint Beta",
    color: "#5C27FE", // Electric Indigo
    description: "Core application performance tuning and high-fidelity views.",
    memberIds: ["user_1", "user_3"],
  },
  {
    id: "group_personal",
    name: "Personal Goals",
    color: "#00C48C", // Emerald Green
    description: "Self-improvement, reading list, and side project planning.",
    memberIds: ["user_1"],
  },
];

// Generates correct relative times based on current date
const now = new Date();
const formatOffsetDate = (days: number, hours: number = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
};

export const DEFAULT_TASKS: Task[] = [
  {
    id: "task_1",
    title: "Design Apple-style UI glass overlays",
    description:
      "Create beautiful frosted glass aesthetics with soft background blurring and sharp translucent borders for high-end feel as requested.",
    status: "in_progress",
    priority: "urgent",
    dueDate: formatOffsetDate(0, 4), // Due today
    assigneeId: "user_1",
    groupId: "group_dev",
    subtasks: [
      {
        id: "sub_1_1",
        parentTaskId: "task_1",
        title: "Write glass-panel component wrappers",
        isCompleted: true,
        createdAt: formatOffsetDate(-2),
        sortOrder: 0,
      },
      {
        id: "sub_1_2",
        parentTaskId: "task_1",
        title: "Calibrate backdrop-filter saturation parameters",
        isCompleted: true,
        createdAt: formatOffsetDate(-2),
        sortOrder: 1,
      },
      {
        id: "sub_1_3",
        parentTaskId: "task_1",
        title: "Implement beautiful dynamic light/dark mode shadows",
        isCompleted: false,
        createdAt: formatOffsetDate(-1),
        sortOrder: 2,
      },
    ],
    comments: [
      {
        id: "c_1_1",
        userId: "user_2",
        text: "This frosted glass style gives it an incredible premium feel, Alex!",
        createdAt: formatOffsetDate(-1),
      },
      {
        id: "c_1_2",
        userId: "user_1",
        text: "Thanks! Adding multi-layered drop shadows next.",
        createdAt: formatOffsetDate(0, -2),
      },
    ],
    activities: [
      {
        id: "act_1_1",
        userId: "user_1",
        userName: "Alex Rivera",
        action: "created the task",
        createdAt: formatOffsetDate(-2),
      },
      {
        id: "act_1_2",
        userId: "user_1",
        userName: "Alex Rivera",
        action:
          'marked subtask "Write glass-panel component wrappers" as completed',
        createdAt: formatOffsetDate(-1),
      },
      {
        id: "act_1_3",
        userId: "user_1",
        userName: "Alex Rivera",
        action: "moved task to In Progress",
        createdAt: formatOffsetDate(0, -5),
      },
    ],
    createdAt: formatOffsetDate(-2),
  },
  {
    id: "task_2",
    title: "Audit marketing launch landing page copies",
    description:
      "Verify all typography is set to Space Grotesk/Sora and Inter, tracking matches perfectly, and copywriting resonates with direct professional messaging.",
    status: "pending",
    priority: "high",
    dueDate: formatOffsetDate(2), // 2 days from now
    assigneeId: "user_2",
    groupId: "group_marketing",
    subtasks: [
      {
        id: "sub_2_1",
        parentTaskId: "task_2",
        title: "Review hero banner slogan",
        isCompleted: false,
        createdAt: formatOffsetDate(-3),
        sortOrder: 0,
      },
      {
        id: "sub_2_2",
        parentTaskId: "task_2",
        title: "Verify value-prop sections layout",
        isCompleted: false,
        createdAt: formatOffsetDate(-3),
        sortOrder: 1,
      },
    ],
    comments: [],
    activities: [
      {
        id: "act_2_1",
        userId: "user_4",
        userName: "Sarah Jenkins",
        action: "created the task and assigned to Maria Santos",
        createdAt: formatOffsetDate(-3),
      },
    ],
    createdAt: formatOffsetDate(-3),
  },
  {
    id: "task_3",
    title: "Fix performance bottle-necks in Kanban re-rendering",
    description:
      "Analyze container resizing and element drag handlers. Optimize rendering using proper debounce inside ResizeObserver hooks.",
    status: "overdue",
    priority: "medium",
    dueDate: formatOffsetDate(-2), // 2 days ago!
    assigneeId: "user_3",
    groupId: "group_dev",
    subtasks: [
      {
        id: "sub_3_1",
        parentTaskId: "task_3",
        title: "Set up Profiler tool",
        isCompleted: true,
        createdAt: formatOffsetDate(-4),
        sortOrder: 0,
      },
      {
        id: "sub_3_2",
        parentTaskId: "task_3",
        title: "Implement custom useResizeObserver hook",
        isCompleted: false,
        createdAt: formatOffsetDate(-3),
        sortOrder: 1,
      },
    ],
    comments: [
      {
        id: "c_3_1",
        userId: "user_3",
        text: "Will need Marcus to take a look at the fluid container wrapper.",
        createdAt: formatOffsetDate(-3),
      },
    ],
    activities: [
      {
        id: "act_3_1",
        userId: "user_1",
        userName: "Alex Rivera",
        action: "created the task",
        createdAt: formatOffsetDate(-4),
      },
      {
        id: "act_3_2",
        userId: "user_3",
        userName: "Marcus Chen",
        action: 'completed subtask "Set up Profiler tool"',
        createdAt: formatOffsetDate(-2),
      },
    ],
    createdAt: formatOffsetDate(-4),
  },
  {
    id: "task_4",
    title: "Publish campaign press material draft",
    description:
      "Finalize core content templates for external press agencies, describing Collaborative Task Manager feature availability.",
    status: "completed",
    priority: "low",
    dueDate: formatOffsetDate(-1), // Due yesterday
    assigneeId: "user_4",
    groupId: "group_marketing",
    subtasks: [
      {
        id: "sub_4_1",
        parentTaskId: "task_4",
        title: "First draft approval",
        isCompleted: true,
        createdAt: formatOffsetDate(-6),
        sortOrder: 0,
      },
      {
        id: "sub_4_2",
        parentTaskId: "task_4",
        title: "Proofreading checklist",
        isCompleted: true,
        createdAt: formatOffsetDate(-5),
        sortOrder: 1,
      },
    ],
    comments: [],
    activities: [
      {
        id: "act_4_1",
        userId: "user_4",
        userName: "Sarah Jenkins",
        action: "created the task",
        createdAt: formatOffsetDate(-5),
      },
      {
        id: "act_4_2",
        userId: "user_4",
        userName: "Sarah Jenkins",
        action: "marked task as Completed",
        createdAt: formatOffsetDate(-1),
      },
    ],
    createdAt: formatOffsetDate(-5),
  },
  {
    id: "task_5",
    title: "Weekly mindfulness self-reflection",
    description:
      "Review productivity, energy focus levels, and schedule regular stretch breaks in between intense coding sprints.",
    status: "completed",
    priority: "low",
    dueDate: formatOffsetDate(-3),
    assigneeId: "user_1",
    groupId: "group_personal",
    subtasks: [],
    comments: [],
    activities: [
      {
        id: "act_5_1",
        userId: "user_1",
        userName: "Alex Rivera",
        action: "marked task as Completed",
        createdAt: formatOffsetDate(-2),
      },
    ],
    createdAt: formatOffsetDate(-4),
  },
];
