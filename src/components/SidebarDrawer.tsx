import React, { useState } from "react";
import {
  X,
  LogOut,
  Sun,
  Moon,
  Settings,
  Calendar,
  ClipboardList,
  Target,
  MessageSquare,
  PieChart,
  FolderPlus,
  Copy,
  Check,
  Mail,
  UserPlus,
} from "lucide-react";
import type { User, Group } from "../types";
import { apiFetch } from "../lib/api";
import { useToast } from "./Toast";

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  groups: Group[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
  setIsNewTaskOpen: (open: boolean) => void;
  setIsNewGroupOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  handleLogout: () => Promise<void>;
  tasks: any[];
  activeGroupId?: string;
}

export default function SidebarDrawer({
  isOpen,
  onClose,
  currentUser,
  groups,
  activeCategory,
  setActiveCategory,
  setIsNewTaskOpen,
  setIsNewGroupOpen,
  darkMode,
  setDarkMode,
  handleLogout,
  tasks,
  activeGroupId,
}: SidebarDrawerProps) {
  const { showToast } = useToast();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [addEmailGroupId, setAddEmailGroupId] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState("");
  const [addingUser, setAddingUser] = useState(false);

  if (!isOpen) return null;

  const handleNavClick = (category: string) => {
    setActiveCategory(category);
    onClose();
  };

  const handleGenerateInviteLink = async (groupId: string) => {
    try {
      const response = await apiFetch(`/api/groups/${groupId}/invite-link`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.inviteUrl);
        showToast("success", "Invite link generated.");
      }
    } catch (error) {
      console.error("Failed to generate invite link:", error);
      showToast("error", "Failed to generate invite link.");
    }
  };

  const handleCopyToClipboard = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handleAddUserByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmailGroupId || !addEmail.trim()) return;

    setAddingUser(true);
    try {
      const response = await apiFetch(`/api/groups/${addEmailGroupId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: addEmail }),
      });
      if (response.ok) {
        setAddEmail("");
        setAddEmailGroupId(null);
        showToast("success", "User added successfully!");
      } else {
        const data = await response.json();
        showToast("error", data.error || "Failed to add user.");
      }
    } catch (error) {
      console.error("Failed to add user:", error);
      showToast("error", "Failed to add user.");
    } finally {
      setAddingUser(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-[#0F0F1A] shadow-2xl transform transition-transform duration-300 ease-in-out md:hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center gap-3">
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full border border-white/50 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#5C27FE] to-[#0EA5E9] text-white font-bold">
                {currentUser?.name
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase() || "U"}
              </div>
            )}
            <div>
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                {currentUser?.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Main Navigation */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Navigation
            </div>
            <nav className="space-y-1">
              <button
                onClick={() => handleNavClick("today")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                  activeCategory === "today"
                    ? "bg-[#5C27FE]/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <Calendar size={18} />
                <span>Today's Focus</span>
              </button>

              <button
                onClick={() => handleNavClick("my_tasks")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                  activeCategory === "my_tasks"
                    ? "bg-[#5C27FE]/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <ClipboardList size={18} />
                <span>My Work Desk</span>
              </button>

              <button
                onClick={() => handleNavClick("goals")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                  activeCategory === "goals"
                    ? "bg-[#FF4D4D]/10 text-[#FF4D4D] dark:text-[#ff7373]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <Target size={18} />
                <span>Goals & Milestones</span>
              </button>

              <button
                onClick={() => handleNavClick("chat")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                  activeCategory === "chat"
                    ? "bg-[#0EA5E9]/10 text-[#0EA5E9] dark:text-[#38bcfc]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <MessageSquare size={18} />
                <span>Workspace Chat</span>
              </button>

              <button
                onClick={() => handleNavClick("analytics")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                  activeCategory === "analytics"
                    ? "bg-[#5C27FE]/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <PieChart size={18} />
                <span>Team Analytics</span>
              </button>

              <button
                onClick={() => handleNavClick("settings")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                  activeCategory === "settings"
                    ? "bg-[#5C27FE]/10 text-[#5C27FE] dark:text-[#a085ff]"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Workspace Groups */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Shared Projects ({groups.length})
              </div>
              <button
                onClick={() => {
                  setIsNewGroupOpen(true);
                  onClose();
                }}
                className="p-1.5 rounded-md text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <FolderPlus size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center gap-1">
                  <button
                    onClick={() => handleNavClick(g.id)}
                    className={`flex-1 flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                      activeCategory === g.id
                        ? "bg-white/80 dark:bg-white/10 shadow-xs border border-white/40 dark:border-white/10 text-[#5C27FE] dark:text-[#a085ff]"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
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
                  {(g.role === "admin" || g.role === "owner") && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddEmailGroupId(g.id);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] hover:bg-gray-100 dark:hover:bg-white/5"
                        title="Add user by email"
                      >
                        <Mail size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGenerateInviteLink(g.id);
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-[#5C27FE] dark:hover:text-[#a085ff] hover:bg-gray-100 dark:hover:bg-white/5"
                        title="Generate invite link"
                      >
                        <Copy size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add User by Email Form */}
            {addEmailGroupId && (
              <div className="mt-3 p-3 bg-[#5C27FE]/5 border border-[#5C27FE]/20 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] font-bold text-[#5C27FE] dark:text-[#a085ff]">
                    Add User by Email
                  </div>
                  <button
                    onClick={() => {
                      setAddEmailGroupId(null);
                      setAddEmail("");
                    }}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </div>

                <form onSubmit={handleAddUserByEmail} className="space-y-2">
                  <input
                    type="email"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full text-[10px] bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10"
                    required
                  />
                  <button
                    type="submit"
                    disabled={addingUser}
                    className="w-full text-[10px] font-bold py-1.5 rounded-lg bg-[#5C27FE] text-white hover:bg-[#4a1ee3] disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                  >
                    {addingUser ? (
                      "Adding..."
                    ) : (
                      <>
                        <UserPlus size={12} /> Add User
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Invite Link Display */}
            {inviteLink && (
              <div className="mt-3 p-3 bg-[#5C27FE]/5 border border-[#5C27FE]/20 rounded-xl">
                <div className="text-[10px] font-bold text-[#5C27FE] dark:text-[#a085ff] mb-2">
                  Invite Link Generated
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 text-[10px] bg-white dark:bg-black/20 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-white/10"
                  />
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-1.5 rounded-lg bg-[#5C27FE] text-white hover:bg-[#4a1ee3] transition-colors"
                    title={copiedToClipboard ? "Copied!" : "Copy to clipboard"}
                  >
                    {copiedToClipboard ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-white/5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
              title={darkMode ? "Switch to Light" : "Switch to Dark"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
