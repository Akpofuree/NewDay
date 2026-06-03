import { useEffect, useState } from "react";
import {
  Task,
  Group,
  User,
  TaskPriority,
  TaskStatus,
  Goal,
  ChatChannel,
  ChatMessage,
} from "../types";
import { apiFetch } from "../lib/api";
import useAuthHandlers from "./useAuthHandlers";
import { useRef } from "react";

export default function useAppState() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserState, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("newday_current_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [authChecked, setAuthChecked] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<"list" | "kanban">(() => {
    return (
      (localStorage.getItem("newday_active_view") as "list" | "kanban") ||
      "list"
    );
  });
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    return localStorage.getItem("newday_active_category") || "today";
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("newday_dark_mode");
    return saved ? JSON.parse(saved) === true : false;
  });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TaskStatus>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>(
    "all",
  );
  const [tagFilter, setTagFilter] = useState("");

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupColor, setNewGroupColor] = useState("#5C27FE");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [mobileNavStyle, setMobileNavStyle] = useState<"top" | "bottom">(() => {
    return (
      (localStorage.getItem("newday_mobile_nav_style") as "top" | "bottom") ||
      "bottom"
    );
  });
  const [showLanding, setShowLanding] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [pendingInviteToken, setPendingInviteToken] = useState<string | null>(
    () => {
      if (typeof window === "undefined") return null;
      return localStorage.getItem("newday_pending_invite_token");
    },
  );

  const {
    handleLogout,
    handleSelectUser,
    handleSignUp,
    verifySession,
    syncWithServer,
  } = useAuthHandlers({
    setCurrentUser,
    setShowLanding,
    setAuthLoading,
    setAuthChecked,
    setUsers,
    setGroups,
    setTasks,
    setGoals,
    setChannels,
    setChatMessages,
    currentUser: currentUserState,
  });

  const lastActivityRef = useRef<number>(Date.now());
  const activityTimerRef = useRef<number | null>(null);
  const pollTimeoutRef = useRef<number | null>(null);
  const [isRetryingConnections, setIsRetryingConnections] = useState(false);

  useEffect(() => {
    const retryHandler = (e: any) => {
      const detail = e?.detail || {};
      const phase = detail.phase;
      if (phase === "start") {
        setIsRetryingConnections(true);
      } else if (phase === "attempt") {
        setIsRetryingConnections(true);
      } else if (phase === "stop") {
        // keep indicator visible if there were many attempts
        const attempts = Number(detail.attempts || 0);
        if (attempts >= 5) {
          setIsRetryingConnections(true);
        } else {
          setIsRetryingConnections(false);
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("newday:retry", retryHandler as EventListener);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(
          "newday:retry",
          retryHandler as EventListener,
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!currentUserState) {
      setShowLanding(true);
    }
  }, [currentUserState]);

  useEffect(() => {
    verifySession();
  }, []);

  useEffect(() => {
    if (!currentUserState) {
      localStorage.removeItem("newday_current_user");
      setUsers([]);
      setGroups([]);
      setTasks([]);
      setGoals([]);
      setChatMessages([]);
      return;
    }

    localStorage.setItem(
      "newday_current_user",
      JSON.stringify(currentUserState),
    );

    // Adaptive polling setup
    let mounted = true;

    const isHidden = () =>
      typeof document !== "undefined" && document.visibilityState === "hidden";

    const getIntervalMs = () => {
      const idle = Date.now() - lastActivityRef.current > 30000; // 30s
      return idle ? 30000 : 5000; // idle:30s, active:5s
    };

    const schedulePoll = () => {
      if (!mounted) return;
      if (isHidden()) return;
      const ms = getIntervalMs();
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = window.setTimeout(async () => {
        try {
          await syncWithServer();
        } catch (err) {
          // ignore — apiFetch will emit retry events
        }
        schedulePoll();
      }, ms) as unknown as number;
    };

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
      // if poll is scheduled at idle interval, reschedule sooner
      schedulePoll();
    };

    const handleVisibility = () => {
      if (isHidden()) {
        if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
      } else {
        // visible again: immediate sync then resume adaptive schedule
        syncWithServer().catch(() => undefined);
        lastActivityRef.current = Date.now();
        schedulePoll();
      }
    };

    // attach listeners
    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    document.addEventListener("visibilitychange", handleVisibility);

    // start
    lastActivityRef.current = Date.now();
    syncWithServer().catch(() => undefined);
    schedulePoll();

    return () => {
      mounted = false;
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (pollTimeoutRef.current) window.clearTimeout(pollTimeoutRef.current);
    };
  }, [currentUserState, syncWithServer]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pathMatch = window.location.pathname.match(
      /^\/invite\/([0-9a-fA-F]{64})(?:\/)?$/,
    );
    const queryToken = new URLSearchParams(window.location.search).get("token");
    const token = pathMatch?.[1] || queryToken;
    if (token) {
      setPendingInviteToken(token);
      localStorage.setItem("newday_pending_invite_token", token);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    const joinPendingInvite = async (token: string) => {
      try {
        const response = await apiFetch("/api/groups/join", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        if (response.ok) {
          await syncWithServer();
        } else {
          console.warn("Invite join failed:", await response.text());
        }
      } catch (err) {
        console.error("Invite join failed:", err);
      } finally {
        localStorage.removeItem("newday_pending_invite_token");
        setPendingInviteToken(null);
      }
    };

    if (authChecked && currentUserState && pendingInviteToken) {
      joinPendingInvite(pendingInviteToken);
    }
  }, [authChecked, currentUserState, pendingInviteToken, syncWithServer]);

  useEffect(() => {
    localStorage.setItem("newday_active_view", activeView);
  }, [activeView]);

  useEffect(() => {
    localStorage.setItem("newday_active_category", activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    localStorage.setItem("newday_dark_mode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return {
    users,
    setUsers,
    currentUser: currentUserState,
    setCurrentUser,
    authChecked,
    setAuthChecked,
    groups,
    setGroups,
    tasks,
    setTasks,
    activeView,
    setActiveView,
    activeCategory,
    setActiveCategory,
    darkMode,
    setDarkMode,
    goals,
    setGoals,
    channels,
    setChannels,
    chatMessages,
    setChatMessages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    selectedTask,
    setSelectedTask,
    isDetailOpen,
    setIsDetailOpen,
    isNewTaskOpen,
    setIsNewTaskOpen,
    isNewGroupOpen,
    setIsNewGroupOpen,
    newGroupName,
    setNewGroupName,
    newGroupColor,
    setNewGroupColor,
    newGroupDesc,
    setNewGroupDesc,
    mobileNavStyle,
    setMobileNavStyle,
    showLanding,
    setShowLanding,
    authLoading,
    setAuthLoading,
    handleLogout,
    handleSelectUser,
    handleSignUp,
    verifySession,
    syncWithServer,
    isRetryingConnections,
  };
}
