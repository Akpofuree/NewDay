import React, {
  useRef,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Task, Group, User } from "../types";
import type { Metrics } from "../utils/taskFilters";
import { apiFetch } from "../lib/api";
import {
  Plus,
  Calendar as CalendarIcon,
  ClipboardList,
  CheckCircle2,
  PieChart,
  Target,
  MessageSquare,
  FolderPlus,
  Sun,
  Moon,
  LogOut,
  Settings,
} from "lucide-react";

type DesktopSidebarProps = {
  logoImage: string;
  scrollToTop: () => void;
  setIsNewTaskOpen: Dispatch<SetStateAction<boolean>>;
  groups: Group[];
  activeCategory: string;
  setActiveCategory: Dispatch<SetStateAction<string>>;
  metrics: Metrics;
  setIsNewGroupOpen: Dispatch<SetStateAction<boolean>>;
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  currentUser: User | null;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  tasks: Task[];
  handleLogout: () => Promise<void>;
};

export default function DesktopSidebar({
  logoImage,
  scrollToTop,
  setIsNewTaskOpen,
  groups,
  activeCategory,
  setActiveCategory,
  metrics,
  setIsNewGroupOpen,
  darkMode,
  setDarkMode,
  currentUser,
  setCurrentUser,
  tasks,
  handleLogout,
}: DesktopSidebarProps) {
  if (!currentUser) {
    return null;
  }

  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [avatarError, setAvatarError] = React.useState("");

  const handleAvatarClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be valid and under 5MB.");
      return;
    }
    setAvatarError("");
    const reader = new FileReader();
    reader.onload = async () => {
      const avatarUrl = reader.result as string;
      try {
        const res = await apiFetch("/api/profile", {
          method: "PATCH",
          body: JSON.stringify({ avatarUrl }),
        });
        if (!res.ok) {
          setAvatarError("Failed to update avatar.");
          return;
        }
        const updated = await res.json();
        setCurrentUser(updated);
        localStorage.setItem("newday_current_user", JSON.stringify(updated));
        setAvatarError("");
      } catch (err) {
        console.error("Avatar upload failed:", err);
        setAvatarError("Avatar upload failed.");
      }
    };
    reader.readAsDataURL(file);
  };
  return (
    <aside className="hidden md:flex w-[260px] flex-shrink-0 h-screen sticky top-0 flex-col overflow-hidden p-5 z-20 sidebar-glass">
      <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
        <div className="flex-shrink-0 space-y-6">
        <button
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-[#5C27FE]/40 rounded-full"
          aria-label="Scroll to top"
        >
          <img
            src={logoImage}
            alt="NewDay logo"
            className="h-20 w-20 object-contain cursor-pointer"
          />
          <span className="sr-only">NewDay</span>
        </button>

        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="w-full py-2.5 rounded-xl bg-[#5C27FE] hover:bg-[#4a1ee3] active:scale-[0.98] text-white text-xs font-bold font-inter inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-[#5C27FE]/20 hover:shadow-lg hover:shadow-[#5C27FE]/30 cursor-pointer"
        >
          <span>New Workspace Task</span>
          <Plus size={14} />
        </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pt-1 pr-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-2 px-2">
              Views Categories
            </span>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveCategory("today")}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "today"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CalendarIcon
                    size={13}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                  Today's Focus
                </span>
                {metrics.overdue > 0 && (
                  <span className="text-[9px] font-extrabold bg-[#FF4D4D]/10 text-[#FF4D4D] px-1.5 py-0.5 rounded-full">
                    {metrics.overdue}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveCategory("calendar")}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "calendar"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <CalendarIcon
                  size={13}
                  className="group-hover:translate-x-1 transition-transform"
                />
                Calendar View
              </button>

              <button
                onClick={() => setActiveCategory("my_tasks")}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "my_tasks"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <ClipboardList
                  size={13}
                  className="group-hover:translate-x-1 transition-transform"
                />
                My Work Desk
              </button>

              <button
                onClick={() => setActiveCategory("completed")}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "completed"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#00C48C] dark:text-emerald-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <CheckCircle2
                  size={13}
                  className="text-[#00C48C] group-hover:translate-x-1 transition-transform"
                />
                Completed Archive
              </button>

              <button
                onClick={() => setActiveCategory("analytics")}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "analytics"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <PieChart
                  size={13}
                  className="text-[#5C27FE] dark:text-[#a085ff] group-hover:translate-x-1 transition-transform"
                />
                Team Analytics
              </button>

              <button
                onClick={() => setActiveCategory("goals")}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "goals"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#FF4D4D] dark:text-[#ff7373]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <Target
                  size={13}
                  className="text-[#FF4D4D] dark:text-[#ff7373] group-hover:translate-x-1 transition-transform"
                />
                Goals & Milestones
              </button>

              <button
                onClick={() => setActiveCategory("chat")}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "chat"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#0EA5E9] dark:text-[#38bcfc]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <MessageSquare
                  size={13}
                  className="text-[#0EA5E9] dark:text-[#38bcfc] group-hover:translate-x-1 transition-transform"
                />
                Workspace Chat
              </button>

              <button
                onClick={() => setActiveCategory("settings")}
                className={`group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  activeCategory === "settings"
                    ? "bg-white/80 dark:bg-white/10 shadow-sm border border-white/40 dark:border-white/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                }`}
              >
                <Settings
                  size={13}
                  className="text-[#5C27FE] dark:text-[#a085ff] group-hover:translate-x-1 transition-transform"
                />
                Settings
              </button>
            </nav>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Shared Projects ({groups.length})
              </span>
              <button
                onClick={() => setIsNewGroupOpen(true)}
                title="Create Next Group"
                className="p-1 rounded-md text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
              >
                <FolderPlus size={12} />
              </button>
            </div>

            <div className="space-y-1">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setActiveCategory(g.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
                    activeCategory === g.id
                      ? "bg-white/80 dark:bg-white/10 shadow-xs border border-white/40 dark:border-white/10 text-[#5C27FE] dark:text-[#a085ff]"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/40 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate pr-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/50 flex-shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    <span className="truncate">{g.name}</span>
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono font-bold">
                    {
                      tasks.filter(
                        (t) => t.groupId === g.id && t.status !== "completed",
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 mt-auto space-y-4 pt-4 border-t border-gray-100 dark:border-white/5">
          <div className="flex flex-col gap-2 p-2.5 rounded-xl bg-gray-100/60 dark:bg-white/5 border border-transparent dark:border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Visual Theme
              </span>
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 shadow-xs cursor-pointer"
                title={darkMode ? "Switch to Light" : "Switch to Dark"}
              >
                {darkMode ? <Sun size={13} /> : <Moon size={13} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between group/user relative">
            <div
              className="flex items-center gap-2.5 min-w-0 mr-1.5 cursor-pointer"
              onClick={handleAvatarClick}
              title="Click to upload avatar"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/65 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#5C27FE] to-[#0EA5E9] text-white font-bold">
                  {(() => {
                    const parts = currentUser.name.split(" ").filter(Boolean);
                    const initials =
                      (parts[0]?.[0] || "").toUpperCase() +
                      (parts[1]?.[0] || "").toUpperCase();
                    return initials;
                  })()}
                </div>
              )}
              <div className="min-w-0 text-left">
                <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-gray-400 truncate">
                  Active Member
                </div>
              </div>
            </div>

            {avatarError && (
              <div className="text-[10px] text-red-500 dark:text-red-400 truncate w-full">
                {avatarError}
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Sign Out / Switch Profile"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 flex-shrink-0 cursor-pointer"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
