import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import {
  Task,
  Group,
  User,
  Goal,
  ChatChannel,
  ChatMessageWithExtras,
} from "../types";
import { apiFetch } from "../lib/api";

type UseAuthHandlersProps = {
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  setShowLanding: Dispatch<SetStateAction<boolean>>;
  setAuthLoading: Dispatch<SetStateAction<boolean>>;
  setAuthChecked: Dispatch<SetStateAction<boolean>>;
  setUsers: Dispatch<SetStateAction<User[]>>;
  setGroups: Dispatch<SetStateAction<Group[]>>;
  setTasks: Dispatch<SetStateAction<Task[]>>;
  setGoals: Dispatch<SetStateAction<Goal[]>>;
  setChannels: Dispatch<SetStateAction<ChatChannel[]>>;
  setChatMessages: Dispatch<SetStateAction<ChatMessageWithExtras[]>>;
  currentUser: User | null;
};

export default function useAuthHandlers({
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
  currentUser,
}: UseAuthHandlersProps) {
  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setAuthLoading(false);
      setCurrentUser(null);
      setShowLanding(true);
    }
  };

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
  };

  const handleSignUp = (name: string, email: string) => {
    // Legacy - AuthScreen handles registration directly on server APIs
  };

  const syncWithServer = useCallback(async () => {
    if (!currentUser) return;
    try {
      // Use the consolidated /api/db endpoint only (includes goals)
      const dbRes = await apiFetch("/api/db");
      if (dbRes.ok) {
        const data = await dbRes.json();
        setUsers(data.users || []);
        setGroups(data.groups || []);
        setTasks(data.tasks || []);
        setChannels(data.channels || []);
        setChatMessages(data.chatMessages || []);
        setGoals(data.goals || []);
      }
    } catch (err) {
      console.error("Database connection failed:", err);
    }
  }, [
    currentUser,
    setUsers,
    setGroups,
    setTasks,
    setChannels,
    setChatMessages,
    setGoals,
  ]);

  const verifySession = async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        const user = data.user || data;
        setCurrentUser(user);
        setShowLanding(false);
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.error("Session verification failed:", err);
      setCurrentUser(null);
    } finally {
      setAuthChecked(true);
    }
  };

  return {
    handleLogout,
    handleSelectUser,
    handleSignUp,
    verifySession,
    syncWithServer,
  };
}
