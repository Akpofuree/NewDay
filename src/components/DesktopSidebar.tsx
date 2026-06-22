import React, { useRef, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { Task, Group, User } from "../types";
import type { Metrics } from "../utils/taskFilters";
import { apiFetch } from "../lib/api";
import { useToast } from "./Toast";
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
  Mail,
  Copy,
  Link,
  RefreshCw,
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
  activeGroupId?: string;
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
  activeGroupId,
  handleLogout,
}: DesktopSidebarProps) {
  const { showToast } = useToast();
  if (!currentUser) {
    return null;
  }

  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [avatarError, setAvatarError] = React.useState("");
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteLink, setInviteLink] = React.useState("");
  const [inviteLoading, setInviteLoading] = React.useState(false);
  const [invitePanelGroupId, setInvitePanelGroupId] = React.useState<string | null>(null);
  const activeGroup = groups.find((group) => group.id === invitePanelGroupId);
  const canManageActiveGroup = activeGroup?.role === "owner" || activeGroup?.role === "admin";

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

  const sendInvite = async () => {
    if (!activeGroup || !inviteEmail.trim() || inviteLoading) return;
    setInviteLoading(true);
    try {
      const response = await apiFetch(`/api/groups/${activeGroup.id}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail.trim(), role: "member" }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        showToast("error", data?.error || "Failed to send invite.");
        return;
      }
      const data = await response.json();
      setInviteLink(data.inviteUrl || "");
      setInviteEmail("");
      showToast(
        "success",
        `Invite sent! Ask ${inviteEmail.trim()} to check their spam or junk folder if they do not see it within a few minutes.`
      );
    } catch (error) {
      console.error("Failed to send group invite:", error);
      showToast("error", "Failed to send invite. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const generateInviteLink = async () => {
    if (!activeGroup || inviteLoading) return;
    setInviteLoading(true);
    try {
      const response = await apiFetch(`/api/groups/${activeGroup.id}/invite-link`, {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        showToast("error", data?.error || "Failed to generate invite link.");
        return;
      }
      const data = await response.json();
      setInviteLink(data.inviteUrl || "");
      showToast("success", "Invite link generated.");
    } catch (error) {
      console.error("Failed to generate invite link:", error);
      showToast("error", "Failed to generate invite link.");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      showToast("success", "Invite link copied.");
    } catch (error) {
      console.error("Failed to copy invite link:", error);
      showToast("error", "Failed to copy invite link.");
    }
  };

  const openInvitePanel = (groupId: string) => {
    setInvitePanelGroupId(groupId);
    setInviteLink("");
    setInviteEmail("");
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
                className={`group w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
              {groups.map((g) => {
                const canManageGroup = g.role === "owner" || g.role === "admin";
                return (
                  <div key={g.id} className="space-y-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveCategory(g.id)}
                        className={`min-w-0 flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all duration-200 ${
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
                          {tasks.filter((t) => t.groupId === g.id && t.status !== "completed").length}
                        </span>
                      </button>
                      {canManageGroup && (
                        <button
                          type="button"
                          onClick={() => openInvitePanel(g.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[10px] font-bold text-gray-500 hover:text-[#5C27FE] dark:hover:text-[#a085ff] hover:bg-gray-100 dark:hover:bg-white/5"
                          title="Invite members"
                        >
                          <Mail size={14} />
                          <span>Invite</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {activeGroup && canManageActiveGroup && (
              <div className="mt-4 rounded-xl border border-[#5C27FE]/15 bg-[#5C27FE]/5 p-3 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#5C27FE] dark:text-[#a085ff]">
                  <Mail size={12} />
                  Invite Members
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-[10px] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={sendInvite}
                      disabled={inviteLoading || !inviteEmail.trim()}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#5C27FE] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-50"
                    >
                      {inviteLoading ? <RefreshCw size={12} className="animate-spin" /> : <Mail size={12} />}
                      Send
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inviteLink}
                      readOnly
                      placeholder="Generate an invite link"
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-3 py-2 text-[10px] font-semibold"
                    />
                    <button
                      type="button"
                      onClick={inviteLink ? copyInviteLink : generateInviteLink}
                      disabled={inviteLoading}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-[10px] font-bold disabled:opacity-50"
                    >
                      {inviteLink ? <Copy size={12} /> : <Link size={12} />}
                      {inviteLink ? "Copy" : "Link"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 mt-auto pt-3 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between gap-2">
            <div
              className="flex items-center gap-2 min-w-0 cursor-pointer"
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
                  className="w-8 h-8 rounded-full border border-white/65 object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#5C27FE] to-[#0EA5E9] text-white font-bold flex-shrink-0">
                  {(() => {
                    const parts = currentUser.name.split(" ").filter(Boolean);
                    const initials =
                      (parts[0]?.[0] || "").toUpperCase() + (parts[1]?.[0] || "").toUpperCase();
                    return initials;
                  })()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-gray-900 dark:text-white truncate">
                  {currentUser.name}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-white dark:hover:bg-white/5 cursor-pointer"
                title={darkMode ? "Switch to Light" : "Switch to Dark"}
              >
                {darkMode ? <Sun size={12} /> : <Moon size={12} />}
              </button>
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
              >
                <LogOut size={12} />
              </button>
            </div>
          </div>

          {avatarError && (
            <div className="text-[9px] text-red-500 dark:text-red-400 truncate mt-1">
              {avatarError}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
