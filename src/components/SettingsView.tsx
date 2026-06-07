import {
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
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileDraft, setProfileDraft] = useState({
    name: currentUser.name,
    bio: currentUser.bio || "",
    timezone:
      currentUser.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) || groups[0],
    [groups, selectedGroupId],
  );
  const canManageGroup =
    selectedGroup?.role === "owner" || selectedGroup?.role === "admin";
  const groupChannels = channels.filter(
    (channel) => channel.groupId === selectedGroup?.id,
  );

  useEffect(() => {
    if (!selectedGroupId && groups[0]) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

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
    setStatus("Saving profile...");
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
        } catch (e) {
          // non-json body
        }
        console.warn("Profile save failed:", res.status, text);
        setStatus(errorBody?.error || `Profile update failed. (${res.status})`);
        return;
      }
      const updated = await res.json();
      setCurrentUser(updated);
      localStorage.setItem("newday_current_user", JSON.stringify(updated));
      setStatus("Profile saved.");
    } catch (err) {
      console.error("Profile save error:", err);
      setStatus("Failed to save changes. Check your connection and try again.");
    }
  };

  const replaceAvatar = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith("image/") || file.size > 5 * 1024 * 1024)
      return;
    const reader = new FileReader();
    reader.onload = () => {
      setProfileDraft((prev) => ({
        ...prev,
        avatarUrl: String(reader.result),
      }));
    };
    reader.readAsDataURL(file);
  };

  const saveGroupSettings = async () => {
    if (!selectedGroup) return;
    setStatus("Saving group...");
    const res = await apiFetch(`/api/groups/${selectedGroup.id}`, {
      method: "PATCH",
      body: JSON.stringify(selectedGroup),
    });
    if (!res.ok) {
      setStatus("Group update failed.");
      return;
    }
    const updated = await res.json();
    setGroups((prev) =>
      prev.map((group) => (group.id === updated.id ? updated : group)),
    );
    setStatus("Group saved.");
  };

  const updateSelectedGroup = (changes: Partial<Group>) => {
    if (!selectedGroup) return;
    setGroups((prev) =>
      prev.map((group) =>
        group.id === selectedGroup.id ? { ...group, ...changes } : group,
      ),
    );
  };

  const createInvite = async () => {
    if (!selectedGroup) return;
    setInviteResult("");
    const res = await apiFetch(`/api/groups/${selectedGroup.id}/invitations`, {
      method: "POST",
      body: JSON.stringify({ email: inviteEmail || undefined, role: "member" }),
    });
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      setStatus(errorBody?.error || "Invite could not be generated.");
      return;
    }
    const data = await res.json();
    setInviteResult(data.inviteUrl);
    setInviteEmail("");
    setStatus(inviteEmail ? "Invitation sent." : "Invite link created.");
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard?.writeText(inviteLink);
    setStatus("Invite link copied.");
  };

  const regenerateInviteLink = async () => {
    if (!selectedGroup) return;
    setStatus("Regenerating invite link...");
    const res = await apiFetch(
      `/api/groups/${selectedGroup.id}/invite-link/regenerate`,
      { method: "POST" },
    );
    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      setStatus(errorBody?.error || "Invite link could not be regenerated.");
      return;
    }
    const data = await res.json();
    setInviteLink(data.inviteUrl || "");
    setInviteLinkExpiresAt(data.expiresAt || "");
    setInviteResult("");
    setStatus("Invite link regenerated.");
  };

  const joinByInvite = async () => {
    let token = joinToken.trim();
    if (!token) return;

    const tokenMatch = token.match(/([0-9a-fA-F]{64})$/);
    if (tokenMatch) {
      token = tokenMatch[1];
    }

    try {
      const res = await apiFetch("/api/groups/join", {
        method: "POST",
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        setStatus(errorBody?.error || "Invite link is invalid or expired.");
        return;
      }

      setStatus("Joined group. Syncing workspace...");
      setJoinToken("");
      await syncWithServer();
    } catch (err) {
      console.error("Group join failed:", err);
      setStatus("Invite link is invalid or expired.");
    }
  };

  const updateMemberRole = async (
    memberId: string,
    role: "admin" | "member",
  ) => {
    if (!selectedGroup) return;
    setStatus("Updating member role...");
    const res = await apiFetch(
      `/api/groups/${selectedGroup.id}/members/${memberId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    );
    if (res.ok) {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role } : member,
        ),
      );
      setStatus("Member role updated.");
    } else {
      const errorBody = await res.json().catch(() => null);
      setStatus(errorBody?.error || "Member role could not be updated.");
    }
  };

  const removeMember = async (memberId: string) => {
    if (!selectedGroup) return;
    setStatus("Removing member...");
    const res = await apiFetch(
      `/api/groups/${selectedGroup.id}/members/${memberId}`,
      {
        method: "DELETE",
      },
    );
    if (res.ok) {
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      setStatus("Member removed.");
    } else {
      const errorBody = await res.json().catch(() => null);
      setStatus(errorBody?.error || "Member could not be removed.");
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
                onChange={(event) => replaceAvatar(event.target.files)}
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
            onChange={(event) =>
              setProfileDraft((prev) => ({ ...prev, name: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
            placeholder="Display name"
          />
          <textarea
            value={profileDraft.bio}
            onChange={(event) =>
              setProfileDraft((prev) => ({ ...prev, bio: event.target.value }))
            }
            className="w-full min-h-20 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
            placeholder="Bio"
          />
          <input
            value={profileDraft.timezone}
            onChange={(event) =>
              setProfileDraft((prev) => ({
                ...prev,
                timezone: event.target.value,
              }))
            }
            className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
            placeholder="Timezone"
          />
          <button
            type="button"
            onClick={saveProfile}
            className="rounded-lg bg-[#5C27FE] px-3 py-2 text-xs font-bold text-white"
          >
            Save Profile
          </button>
        </div>

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
                onChange={(event) => setJoinToken(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
                placeholder="Paste invite token"
              />
              <button
                type="button"
                onClick={joinByInvite}
                className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-bold"
              >
                Join
              </button>
            </div>
          </div>
        </div>

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
            onClick={() => setDarkMode((value) => !value)}
            className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-200"
          >
            {darkMode ? "Use Light Mode" : "Use Dark Mode"}
          </button>
        </div>

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
                onChange={(event) =>
                  setProfileDraft((prev) => ({
                    ...prev,
                    notificationPreferences: {
                      ...prev.notificationPreferences,
                      [key]: event.target.checked,
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

      <section className="rounded-lg border border-gray-200/60 dark:border-white/10 bg-white/55 dark:bg-black/15 p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-gray-900 dark:text-white">
            <Shield size={16} className="text-[#5C27FE]" />
            Group Management
          </div>
          <select
            value={selectedGroup?.id || ""}
            onChange={(event) => setSelectedGroupId(event.target.value)}
            className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold"
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGroup && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <input
                value={selectedGroup.name}
                disabled={!canManageGroup}
                onChange={(event) =>
                  updateSelectedGroup({ name: event.target.value })
                }
                className="w-full rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
              />
              <textarea
                value={selectedGroup.description || ""}
                disabled={!canManageGroup}
                onChange={(event) =>
                  updateSelectedGroup({ description: event.target.value })
                }
                className="w-full min-h-20 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
              />
              <div className="flex gap-2">
                <input
                  value={selectedGroup.color}
                  disabled={!canManageGroup}
                  onChange={(event) =>
                    updateSelectedGroup({ color: event.target.value })
                  }
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
                />
                <select
                  value={selectedGroup.visibility || "private"}
                  disabled={!canManageGroup}
                  onChange={(event) =>
                    updateSelectedGroup({
                      visibility: event.target.value as "public" | "private",
                    })
                  }
                  className="rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-xs font-semibold disabled:opacity-60"
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {groupChannels.length} channels · Your role:{" "}
                {selectedGroup.role || "member"}
              </div>
              {canManageGroup && (
                <button
                  type="button"
                  onClick={saveGroupSettings}
                  className="rounded-lg bg-[#5C27FE] px-3 py-2 text-xs font-bold text-white"
                >
                  Save Group
                </button>
              )}
            </div>

            <div className="space-y-3">
              {canManageGroup ? (
                <>
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
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
                      onClick={() =>
                        navigator.clipboard?.writeText(inviteResult)
                      }
                      className="w-full inline-flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-500/20 px-3 py-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                    >
                      <Copy size={12} />
                      {inviteResult}
                    </button>
                  )}
                  <div className="space-y-2 rounded-lg border border-gray-200/70 dark:border-white/10 bg-white/70 dark:bg-black/15 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-extrabold text-gray-900 dark:text-white">
                          Invite via link
                        </div>
                        {inviteLinkExpiresAt && (
                          <div className="text-[10px] font-semibold text-gray-400">
                            Expires{" "}
                            {new Date(inviteLinkExpiresAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={regenerateInviteLink}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-1.5 text-[10px] font-bold"
                      >
                        <RefreshCw size={11} />
                        Regenerate
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={inviteLink}
                        readOnly
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-black/20 px-3 py-2 text-[10px] font-semibold"
                      />
                      <button
                        type="button"
                        onClick={copyInviteLink}
                        disabled={!inviteLink}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#5C27FE] px-3 py-2 text-[10px] font-bold text-white disabled:opacity-40"
                      >
                        <Copy size={11} />
                        Copy
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {members.map((member) => (
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
                            <div className="text-xs font-bold truncate">
                              {member.name}
                            </div>
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
                              member.role === "owner"
                            }
                            onChange={(event) =>
                              updateMemberRole(
                                member.id,
                                event.target.value as "admin" | "member",
                              )
                            }
                            className="rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/30 px-2 py-1 text-[10px] font-bold"
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                          {member.role !== "owner" && (
                            <button
                              type="button"
                              onClick={() => removeMember(member.id)}
                              className="rounded-md px-2 py-1 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-3 text-xs text-gray-500">
                  Owner or admin access is required to manage invitations and
                  members.
                </div>
              )}
            </div>
          </div>
        )}
      </section>

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
