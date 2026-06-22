import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  Bell,
  Copy,
  ImagePlus,
  Link,
  Lock,
  LogOut,
  Moon,
  Plus,
  RefreshCw,
  Shield,
  Sun,
  UserRound,
  Workflow,
} from "lucide-react";
import type { ChatChannel, Group, User } from "../types";
import { apiFetch } from "../lib/api";
import { useToast } from "./Toast";

type SettingsViewProps = {
  currentUser: User;
  setCurrentUser: Dispatch<SetStateAction<User | null>>;
  groups: Group[];
  setGroups: Dispatch<SetStateAction<Group[]>>;
  channels: ChatChannel[];
  darkMode: boolean;
  setDarkMode: Dispatch<SetStateAction<boolean>>;
  setIsNewGroupOpen: Dispatch<SetStateAction<boolean>>;
  syncWithServer: () => Promise<void>;
  handleLogout: () => Promise<void>;
};

type GroupMember = User & {
  role: "owner" | "admin" | "member";
  joinedAt: string;
};

export default function SettingsView({
  currentUser,
  setCurrentUser,
  groups,
  setGroups,
  channels,
  darkMode,
  setDarkMode,
  setIsNewGroupOpen,
  syncWithServer,
  handleLogout,
}: SettingsViewProps) {
  const { showConfirm, showToast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [profileDraft, setProfileDraft] = useState({
    name: currentUser.name,
    bio: currentUser.bio || "",
    timezone: currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    avatarUrl: currentUser.avatarUrl,
    notificationPreferences: {
      email: currentUser.notificationPreferences?.email ?? true,
      mentions: currentUser.notificationPreferences?.mentions ?? true,
      tasks: currentUser.notificationPreferences?.tasks ?? true,
    },
  });
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || "");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteResult, setInviteResult] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteLinkExpiresAt, setInviteLinkExpiresAt] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [status, setStatus] = useState("");

  // Scoped loading states — each section is independent
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isGroupSaving, setIsGroupSaving] = useState(false);
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isMemberUpdating, setIsMemberUpdating] = useState(false);

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId),
    [groups, selectedGroupId]
  );
  const canManageGroup = useMemo(() => {
    const canManage = selectedGroup?.role === "owner" || selectedGroup?.role === "admin";
    console.log(
      "[SettingsView] canManageGroup:",
      canManage,
      "selectedGroup.role:",
      selectedGroup?.role,
      "selectedGroup:",
      selectedGroup
    );
    return canManage;
  }, [selectedGroup?.role, selectedGroup]);
  const groupChannels = channels.filter((channel) => channel.groupId === selectedGroup?.id);

  useEffect(() => {
    if (!selectedGroupId && groups[0]) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  // Re-sync form if currentUser is updated externally (e.g. after syncWithServer)
  useEffect(() => {
    setProfileDraft({
      name: currentUser.name,
      bio: currentUser.bio || "",
      timezone: currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      avatarUrl: currentUser.avatarUrl,
      notificationPreferences: {
        email: currentUser.notificationPreferences?.email ?? true,
        mentions: currentUser.notificationPreferences?.mentions ?? true,
        tasks: currentUser.notificationPreferences?.tasks ?? true,
      },
    });
  }, [currentUser]);

  // Status that auto-clears after 4s, safe on unmount
  const setTimedStatus = useCallback((msg: string) => {
    setStatus(msg);
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus(""), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedGroup?.id || !canManageGroup) {
      setMembers([]);
      return;
    }
    apiFetch(`/api/groups/${selectedGroup.id}/members`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [canManageGroup, selectedGroup?.id]);

  useEffect(() => {
    if (!selectedGroup?.id || !canManageGroup) {
      setInviteLink("");
      setInviteLinkExpiresAt("");
      return;
    }
    apiFetch(`/api/groups/${selectedGroup.id}/invite-link`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setInviteLink(data.inviteUrl || "");
        setInviteLinkExpiresAt(data.expiresAt || "");
      })
      .catch(() => {
        setInviteLink("");
        setInviteLinkExpiresAt("");
      });
  }, [canManageGroup, selectedGroup?.id]);

  const saveProfile = async () => {
    if (isProfileSaving) return;
    setIsProfileSaving(true);
    setTimedStatus("Saving profile...");
    try {
      const res = await apiFetch("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(profileDraft),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => null);
        let errorBody = null;
        try {
          errorBody = text ? JSON.parse(text) : null;
        } catch {
          // non-json body
        }
        const message = errorBody?.error || `Profile update failed. (${res.status})`;
        setTimedStatus(message);
        showToast("error", message);
        return;
      }
      const updated = await res.json();
      setCurrentUser(updated);
      localStorage.setItem("newday_current_user", JSON.stringify(updated));
      setTimedStatus("Profile saved.");
      showToast("success", "Profile saved.");
    } catch (err) {
      console.error("Profile save error:", err);
      setTimedStatus("Failed to save changes. Check your connection and try again.");
      showToast("error", "Failed to save changes. Check your connection and try again.");
    } finally {
      setIsProfileSaving(false);
    }
  };

  const replaceAvatar = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileDraft((prev) => ({ ...prev, avatarUrl: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const saveGroupSettings = async () => {
    if (!selectedGroup || isGroupSaving) return;
    setIsGroupSaving(true);
    setTimedStatus("Saving group...");
    try {
      const res = await apiFetch(`/api/groups/${selectedGroup.id}`, {
        method: "PATCH",
        body: JSON.stringify(selectedGroup),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || "Group update failed.";
        setTimedStatus(message);
        showToast("error", message);
        return;
      }
      const updated = await res.json();
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      setTimedStatus("Group saved.");
      showToast("success", "Group saved.");
    } catch (err) {
      console.error("Group save error:", err);
      setTimedStatus("Failed to save group. Check your connection and try again.");
      showToast("error", "Failed to save group. Check your connection and try again.");
    } finally {
      setIsGroupSaving(false);
    }
  };

  const updateSelectedGroup = (changes: Partial<Group>) => {
    if (!selectedGroup) return;
    setGroups((prev) => prev.map((g) => (g.id === selectedGroup.id ? { ...g, ...changes } : g)));
  };

  const createInvite = async () => {
    if (!selectedGroup) return;
    setInviteResult("");
    try {
      const res = await apiFetch(`/api/groups/${selectedGroup.id}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail || undefined, role: "member" }),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || "Invite could not be generated.";
        setTimedStatus(message);
        showToast("error", message);
        return;
      }
      const data = await res.json();
      setInviteResult(data.inviteUrl);
      setInviteEmail("");
      setTimedStatus(inviteEmail ? "Invitation sent." : "Invite link created.");
      showToast(
        "success",
        inviteEmail
          ? `Invite sent! Ask ${inviteEmail} to check their spam or junk folder if they do not see it within a few minutes.`
          : "Invite link created."
      );
    } catch (err) {
      console.error("Create invite error:", err);
      setTimedStatus("Failed to send invite. Check your connection.");
      showToast("error", "Failed to send invite. Please try again.");
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard?.writeText(inviteLink);
      setTimedStatus("Invite link copied.");
      showToast("success", "Invite link copied.");
    } catch (err) {
      console.error("Clipboard error:", err);
      setTimedStatus("Failed to copy link.");
      showToast("error", "Failed to copy invite link.");
    }
  };

  // Unified handler: creates link on first use, regenerates if one already exists
  const handleInviteLink = async () => {
    if (!selectedGroup || isLinkLoading) return;
    setIsLinkLoading(true);
    const isCreating = !inviteLink;
    setTimedStatus(isCreating ? "Generating invite link..." : "Regenerating invite link...");
    try {
      const endpoint = isCreating
        ? `/api/groups/${selectedGroup.id}/invite-link`
        : `/api/groups/${selectedGroup.id}/invite-link/regenerate`;
      const res = await apiFetch(endpoint, { method: "POST" });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || "Could not generate invite link.";
        setTimedStatus(message);
        showToast("error", message);
        return;
      }
      const data = await res.json();
      setInviteLink(data.inviteUrl || "");
      setInviteLinkExpiresAt(data.expiresAt || "");
      setInviteResult("");
      setTimedStatus(isCreating ? "Invite link generated." : "Invite link regenerated.");
      showToast("success", isCreating ? "Invite link generated." : "Invite link regenerated.");
    } catch (err) {
      console.error("Invite link error:", err);
      setTimedStatus("Failed to generate link. Check your connection.");
      showToast("error", "Failed to generate invite link.");
    } finally {
      setIsLinkLoading(false);
    }
  };

  const joinByInvite = async () => {
    if (isJoining) return;
    let token = joinToken.trim();
    if (!token) return;
    try {
      if (token.startsWith("http://") || token.startsWith("https://") || token.includes("/join")) {
        const urlObj = new URL(token.startsWith("http") ? token : `http://${token}`);
        const urlToken = urlObj.searchParams.get("token");
        if (urlToken) {
          token = urlToken;
        }
      }
    } catch (e) {
      // ignore URL parsing errors, fallback to regex
    }
    const tokenMatch = token.match(/([0-9a-fA-F]{64})/);
    if (tokenMatch) token = tokenMatch[1];
    setIsJoining(true);
    setTimedStatus("Joining group...");
    try {
      const res = await apiFetch("/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || "Invite link is invalid or expired.";
        setTimedStatus(message);
        showToast("error", message);
        return;
      }
      setTimedStatus("Joined group. Syncing workspace...");
      showToast("success", "Joined group successfully.");
      setJoinToken("");
      await syncWithServer();
    } catch (err) {
      console.error("Group join failed:", err);
      setTimedStatus("Invite link is invalid or expired.");
      showToast("error", "Failed to join the group. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: "admin" | "member") => {
    if (!selectedGroup || isMemberUpdating) return;
    setIsMemberUpdating(true);
    setTimedStatus("Updating member role...");
    try {
      const res = await apiFetch(`/api/groups/${selectedGroup.id}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
        setTimedStatus("Member role updated.");
        showToast("success", "Member role updated.");
      } else {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || "Member role could not be updated.";
        setTimedStatus(message);
        showToast("error", message);
      }
    } catch (err) {
      console.error("Member role update error:", err);
      setTimedStatus("Failed to update role. Check your connection and try again.");
      showToast("error", "Failed to update role. Please try again.");
    } finally {
      setIsMemberUpdating(false);
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (!selectedGroup || isMemberUpdating) return;
    const confirmed = await showConfirm(`Remove ${memberName} from this group?`);
    if (!confirmed) return;
    setIsMemberUpdating(true);
    setTimedStatus("Removing member...");
    try {
      const res = await apiFetch(`/api/groups/${selectedGroup.id}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        setTimedStatus("Member removed.");
        showToast("success", "Member removed.");
      } else {
        const errorBody = await res.json().catch(() => null);
        const message = errorBody?.error || "Member could not be removed.";
        setTimedStatus(message);
        showToast("error", message);
      }
    } catch (err) {
      console.error("Member removal error:", err);
      setTimedStatus("Failed to remove member. Check your connection and try again.");
      showToast("error", "Failed to remove member. Please try again.");
    } finally {
      setIsMemberUpdating(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 text-left space-y-5 animate-fadeIn">
      {status && (
        <div className="rounded-lg border border-[#5C27FE]/20 bg-[#5C27FE]/10 px-3 py-2 text-xs font-bold text-[#5C27FE] dark:text-[#a085ff]">
          {status}
        </div>
      )}

      <section className="grid md:grid-cols-2 gap-4">
        {/* Profile */}
        <div className="rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/55 dark:bg-black/15 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
            <UserRound size={16} className="text-[#5C27FE]" />
            Profile
          </div>
          <div className="flex items-center gap-3">
            <img
              src={profileDraft.avatarUrl}
              alt={profileDraft.name}
              className="w-14 h-14 rounded-full object-cover border border-white/60"
              referrerPolicy="no-referrer"
            />
            <div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => replaceAvatar(e.target.files)}
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200"
              >
                <ImagePlus size={13} />
                Replace Avatar
              </button>
            </div>
          </div>
          <input
            value={profileDraft.name}
            onChange={(e) => setProfileDraft((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
            placeholder="Display name"
          />
          <textarea
            value={profileDraft.bio}
            onChange={(e) => setProfileDraft((prev) => ({ ...prev, bio: e.target.value }))}
            className="w-full min-h-20 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
            placeholder="Bio"
          />
          <input
            value={profileDraft.timezone}
            onChange={(e) => setProfileDraft((prev) => ({ ...prev, timezone: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
            placeholder="Timezone"
          />
          <button
            type="button"
            onClick={saveProfile}
            disabled={isProfileSaving}
            className="rounded-lg bg-[#5C27FE] px-3 py-2 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProfileSaving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Workspace */}
        <div className="rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/55 dark:bg-black/15 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
            <Workflow size={16} className="text-[#00C48C]" />
            Workspace
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {groups.length} groups · {channels.length} channels
          </div>
          <button
            type="button"
            onClick={() => setIsNewGroupOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#5C27FE] px-3 py-2 text-xs font-bold text-white"
          >
            <Plus size={13} />
            Create Group
          </button>
          <div className="pt-3 border-t border-gray-200/60 dark:border-white/10 space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
              Join By Invite Link
            </label>
            <div className="flex gap-2">
              <input
                value={joinToken}
                onChange={(e) => setJoinToken(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
                placeholder="Paste invite token"
              />
              <button
                type="button"
                onClick={joinByInvite}
                disabled={isJoining}
                className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/55 dark:bg-black/15 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
            {darkMode ? (
              <Moon size={16} className="text-[#0EA5E9]" />
            ) : (
              <Sun size={16} className="text-[#FFB020]" />
            )}
            Appearance
          </div>
          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200"
          >
            {darkMode ? "Use Light Mode" : "Use Dark Mode"}
          </button>
        </div>

        {/* Notifications */}
        <div className="rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/55 dark:bg-black/15 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
            <Bell size={16} className="text-[#FF4D4D]" />
            Notifications
          </div>
          {(["email", "mentions", "tasks"] as const).map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-gray-300"
            >
              <input
                type="checkbox"
                checked={profileDraft.notificationPreferences[key]}
                onChange={(e) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      [key]: e.target.checked,
                    },
                  }))
                }
                className="accent-[#5C27FE]"
              />
              {key === "email"
                ? "Email alerts"
                : key === "mentions"
                  ? "Mention alerts"
                  : "Task alerts"}
            </label>
          ))}
        </div>
      </section>

      {/* Group Management */}
      <section className="rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/55 dark:bg-black/15 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
            <Shield size={16} className="text-[#5C27FE]" />
            Group Management
          </div>
          <select
            value={selectedGroup?.id || ""}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGroup ? (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Left: group settings */}
            <div className="space-y-2">
              <input
                value={selectedGroup.name}
                disabled={!canManageGroup}
                onChange={(e) => updateSelectedGroup({ name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
              />
              <textarea
                value={selectedGroup.description || ""}
                disabled={!canManageGroup}
                onChange={(e) => updateSelectedGroup({ description: e.target.value })}
                className="w-full min-h-20 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
              />
              <div className="flex gap-2">
                <input
                  value={selectedGroup.color}
                  disabled={!canManageGroup}
                  onChange={(e) => updateSelectedGroup({ color: e.target.value })}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
                />
                <select
                  value={selectedGroup.visibility || "private"}
                  disabled={!canManageGroup}
                  onChange={(e) =>
                    updateSelectedGroup({ visibility: e.target.value as "public" | "private" })
                  }
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {groupChannels.length} channels · Your role: {selectedGroup.role || "member"}
              </div>
              {canManageGroup && (
                <button
                  type="button"
                  onClick={saveGroupSettings}
                  disabled={isGroupSaving}
                  className="rounded-lg bg-[#5C27FE] px-3 py-2 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGroupSaving ? "Saving..." : "Save Group"}
                </button>
              )}
            </div>

            {/* Right: invitations and members */}
            <div className="space-y-3">
              {canManageGroup ? (
                <>
                  {/* Email invite */}
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
                      placeholder="Invite by email"
                    />
                    <button
                      type="button"
                      onClick={createInvite}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-bold"
                    >
                      <Link size={12} />
                      Invite
                    </button>
                  </div>

                  {inviteResult && (
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(inviteResult)}
                      className="w-full inline-flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-500/20 px-3 py-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                    >
                      <Copy size={12} />
                      {inviteResult}
                    </button>
                  )}

                  {/* Invite via link */}
                  <div className="space-y-2 rounded-lg border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-black/15 p-3">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                          Invite via link
                        </div>
                        {inviteLinkExpiresAt && (
                          <div className="text-[10px] font-semibold text-gray-400">
                            Expires {new Date(inviteLinkExpiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={inviteLink}
                          readOnly
                          placeholder="No link generated yet"
                          className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-[10px] font-semibold cursor-default select-all"
                        />
                        {inviteLink && (
                          <button
                            type="button"
                            onClick={copyInviteLink}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#5C27FE] px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-[#4b1fd3]"
                          >
                            <Copy size={11} />
                            Copy
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleInviteLink}
                          disabled={isLinkLoading}
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                          <RefreshCw size={11} className={isLinkLoading ? "animate-spin" : ""} />
                          {isLinkLoading
                            ? inviteLink
                              ? "Regenerating..."
                              : "Generating..."
                            : inviteLink
                              ? "Regenerate"
                              : "Generate"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Members list */}
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {members.length === 0 ? (
                      <div className="rounded-lg border border-gray-200/70 dark:border-white/10 px-3 py-3 text-xs text-gray-500">
                        No members found.
                      </div>
                    ) : (
                      members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-black/15 px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold truncate">{member.name}</div>
                              <div className="text-[10px] text-gray-400 truncate">
                                {member.email}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <select
                              value={member.role}
                              disabled={
                                selectedGroup.role !== "owner" ||
                                member.role === "owner" ||
                                isMemberUpdating
                              }
                              onChange={(e) =>
                                updateMemberRole(member.id, e.target.value as "admin" | "member")
                              }
                              className="rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 px-2 py-1 text-[10px] font-bold disabled:opacity-60"
                            >
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                            </select>
                            {member.role !== "owner" && (
                              <button
                                type="button"
                                onClick={() => removeMember(member.id, member.name)}
                                disabled={isMemberUpdating}
                                className="rounded-md px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-3 text-xs text-gray-500">
                  Owner or admin access is required to manage invitations and members.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-3 text-xs text-gray-500">
            Select a group to manage its settings.
          </div>
        )}
      </section>

      {/* Security */}
      <section className="rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/55 dark:bg-black/15 p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
          <Lock size={16} className="text-[#5C27FE]" />
          Security
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 dark:border-red-500/20 dark:bg-red-950/20"
        >
          <LogOut size={13} />
          Logout
        </button>
      </section>
    </div>
  );
}
