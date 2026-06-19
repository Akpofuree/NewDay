import React, { useState, useEffect, useRef } from "react";
import { socket } from "../lib/socket";
import { ChatChannel, ChatMessageWithExtras, Group, MessageAttachment, User, Task } from "../types";
import {
  Send,
  Hash,
  Bot,
  Paperclip,
  FolderPlus,
  Plus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
  Edit2,
} from "lucide-react";
import { apiFetch } from "../lib/api";

interface ChatViewProps {
  groups: Group[];
  channels: ChatChannel[];
  setChannels: React.Dispatch<React.SetStateAction<ChatChannel[]>>;
  chatMessages: ChatMessageWithExtras[];
  setChatMessages: React.Dispatch<React.SetStateAction<ChatMessageWithExtras[]>>;
  currentUser: User | null;
  users: User[];
  tasks: Task[];
  setSelectedTask: React.Dispatch<React.SetStateAction<Task | null>>;
  setIsDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function ChatView({
  groups,
  channels,
  setChannels,
  chatMessages,
  setChatMessages,
  currentUser,
  users,
  tasks,
  setSelectedTask,
  setIsDetailOpen,
}: ChatViewProps) {
  /*
  ========================================
  LOCAL STATE
  ========================================
  */

  const [activeChannelId, setActiveChannelId] = useState(() => {
    if (typeof window === "undefined") return "chan_general";
    return localStorage.getItem("newday_active_channel") || "chan_general";
  });
  const [activeGroupId, setActiveGroupId] = useState(() => {
    if (typeof window === "undefined") return "group_personal";
    return localStorage.getItem("newday_active_group") || "group_personal";
  });

  // Get current user's role in the active group
  const currentUserRole = groups.find((g) => g.id === activeGroupId)?.role || "member";

  const [loadingMessages, setLoadingMessages] = useState(false);

  const [newMessageText, setNewMessageText] = useState("");
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDescription, setNewChannelDescription] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [pendingAttachments, setPendingAttachments] = useState<MessageAttachment[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [presence, setPresence] = useState<
    Record<string, { status: "online" | "offline"; lastSeenAt: string }>
  >({});

  const [selectedTaskRefId, setSelectedTaskRefId] = useState("");

  const [isSearchingTask, setIsSearchingTask] = useState(false);

  const [searchTaskTerm, setSearchTaskTerm] = useState("");

  const [editingMessageId, setEditingMessageId] = useState("");
  const [editingMessageContent, setEditingMessageContent] = useState("");

  // AI Chat Assistant state
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Mobile view state
  const [mobileView, setMobileView] = useState<"channels" | "chat">("channels");

  // Socket.io connection status for Render free tier
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "disconnected" | "reconnecting"
  >("connected");

  /*
  ========================================
  CHAT CONTAINER REF
  ========================================
  */

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  /*
  ========================================
  AUTO SCROLL
  ========================================
  */

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages, activeChannelId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("newday_active_group", activeGroupId);
  }, [activeGroupId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("newday_active_channel", activeChannelId);
  }, [activeChannelId]);

  useEffect(() => {
    if (!groups.length || !channels.length) return;

    const selectedGroupExists = groups.some((group) => group.id === activeGroupId);
    if (!selectedGroupExists) {
      setActiveGroupId(groups[0].id);
      return;
    }

    const currentActiveChannel = channels.find(
      (channel) => channel.id === activeChannelId && channel.groupId === activeGroupId
    );
    if (!currentActiveChannel) {
      const fallbackChannel =
        channels.find((channel) => channel.groupId === activeGroupId) || channels[0];
      if (fallbackChannel) {
        setActiveChannelId(fallbackChannel.id);
      }
    }
  }, [groups, channels, activeChannelId, activeGroupId]);

  /*
  ========================================
  JOIN ACTIVE CHANNEL
  ========================================
  */

  useEffect(() => {
    if (!activeChannelId) return;

    socket.emit("join_channel", activeChannelId);
    apiFetch(`/api/channels/${activeChannelId}/read`, { method: "POST" }).catch(() => undefined);
    setChannels((prev) =>
      prev.map((channel) =>
        channel.id === activeChannelId ? { ...channel, unreadCount: 0 } : channel
      )
    );

    // On mobile, switch to chat view when channel is selected
    if (window.innerWidth < 768) {
      setMobileView("chat");
    }

    return () => {
      socket.emit("leave_channel", activeChannelId);
    };
  }, [activeChannelId, setChannels]);

  /*
  ========================================
  LOAD MESSAGES FOR ACTIVE CHANNEL
  ========================================
  */

  useEffect(() => {
    if (!activeChannelId) return;

    const loadMessages = async () => {
      try {
        setLoadingMessages(true);
        const response = await apiFetch(`/api/chat/messages?channelId=${activeChannelId}`);
        if (response.ok) {
          const messages = await response.json();
          setChatMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newMessages = messages.filter(
              (m: ChatMessageWithExtras) => !existingIds.has(m.id)
            );
            const filtered = prev.filter((m) => m.channelId === activeChannelId);
            return [...filtered, ...newMessages];
          });
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeChannelId, setChatMessages]);

  useEffect(() => {
    const firstChannel = channels.find((channel) => channel.groupId === activeGroupId);
    if (
      firstChannel &&
      !channels.some(
        (channel) => channel.id === activeChannelId && channel.groupId === activeGroupId
      )
    ) {
      setActiveChannelId(firstChannel.id);
    }
  }, [activeGroupId, activeChannelId, channels]);

  /*
  ========================================
  RECEIVE REALTIME MESSAGES
  ========================================
  */

  useEffect(() => {
    socket.on("receive_message", (message) => {
      setChatMessages((prev) =>
        prev.some((existing) => existing.id === message.id) ? prev : [...prev, message]
      );
      if (message.channelId !== activeChannelId) {
        setChannels((prev) =>
          prev.map((channel) =>
            channel.id === message.channelId
              ? { ...channel, unreadCount: (channel.unreadCount || 0) + 1 }
              : channel
          )
        );
      }
    });
    socket.on("user_typing", ({ channelId, userId, userName }) => {
      if (channelId !== activeChannelId || userId === currentUser?.id) return;
      setTypingUsers((prev) => ({ ...prev, [userId]: userName }));
      window.setTimeout(() => {
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
      }, 3500);
    });
    socket.on("user_stop_typing", ({ userId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });
    socket.on("presence_update", ({ userId, status, lastSeenAt }) => {
      setPresence((prev) => ({ ...prev, [userId]: { status, lastSeenAt } }));
    });

    // Socket.io connection status tracking for Render free tier
    socket.on("connect", () => {
      setConnectionStatus("connected");
    });
    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });
    socket.io.on("reconnect_attempt", () => {
      setConnectionStatus("reconnecting");
    });
    socket.io.on("reconnect", () => {
      setConnectionStatus("connected");
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("presence_update");
      socket.off("connect");
      socket.off("disconnect");
      socket.io.off("reconnect_attempt");
      socket.io.off("reconnect");
    };
  }, [activeChannelId, currentUser?.id, setChannels, setChatMessages]);

  /*
  ========================================
  SEND MESSAGE
  ========================================
  */

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (!newMessageText.trim() && pendingAttachments.length === 0) ||
      !currentUser ||
      !activeChannelId
    )
      return;

    const messageContent = newMessageText.trim();

    const taskReference = selectedTaskRefId || undefined;

    // Check if message is an AI command
    const isAiCommand = messageContent.startsWith("@ai") || messageContent.startsWith("/ai");
    const aiMessage = isAiCommand
      ? messageContent.replace(/^@ai|^\/ai/, "").trim()
      : messageContent;

    /*
    ========================================
    FAST UI CLEAR
    ========================================
    */

    setNewMessageText("");
    setSelectedTaskRefId("");
    setIsSearchingTask(false);

    if (isAiCommand) {
      // Handle AI chat assistant
      setIsAiTyping(true);

      try {
        const response = await apiFetch("/api/ai/chat-assistant", {
          method: "POST",
          body: JSON.stringify({
            message: aiMessage,
            channelId: activeChannelId,
            recentMessages: chatMessages,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const aiMsg: ChatMessageWithExtras = {
            id: `ai_${Date.now()}`,
            channelId: activeChannelId,
            userId: "ai-bot",
            userName: "NewDay AI",
            userAvatar: "https://via.placeholder.com/100",
            content: aiResponse.reply,
            createdAt: new Date().toISOString(),
            isSystem: false,
          };

          setChatMessages((prev) => [...prev, aiMsg]);
        } else {
          const errorText = await response.text();
          console.error("AI assistant failed:", errorText);
          const errorMsg: ChatMessageWithExtras = {
            id: `ai_error_${Date.now()}`,
            channelId: activeChannelId,
            userId: "system",
            userName: "System",
            userAvatar: "",
            content: "AI assistant is temporarily unavailable, please try again in a moment.",
            createdAt: new Date().toISOString(),
            isSystem: true,
          };
          setChatMessages((prev) => [...prev, errorMsg]);
        }
      } catch (err) {
        console.error("AI assistant error:", err);
        const errorMsg: ChatMessageWithExtras = {
          id: `ai_error_${Date.now()}`,
          channelId: activeChannelId,
          userId: "system",
          userName: "System",
          userAvatar: "",
          content: "AI assistant is temporarily unavailable, please try again in a moment.",
          createdAt: new Date().toISOString(),
          isSystem: true,
        };
        setChatMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsAiTyping(false);
      }
      return;
    }

    try {
      const response = await apiFetch("/api/chat/messages", {
        method: "POST",

        body: JSON.stringify({
          channelId: activeChannelId,
          content: messageContent,
          taskRefId: taskReference,
          attachments: pendingAttachments.filter(
            (attachment) => attachment.uploadStatus === "uploaded"
          ),
        }),
      });

      /*
      ========================================
      SAVE SUCCESS
      ========================================
      */

      if (response.ok) {
        const publishedMsg = await response.json();
        setPendingAttachments([]);

        setChatMessages((prev) => {
          if (prev.some((msg) => msg.id === publishedMsg.id)) {
            return prev;
          }
          return [...prev, publishedMsg];
        });

        /*
        ========================================
        SEND REALTIME EVENT
        ========================================
        */

        socket.emit("send_message", publishedMsg);
      }
    } catch (err) {
      console.error("Failed to publish message:", err);
    }
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim() || !activeGroupId) return;

    try {
      setIsCreatingChannel(true);
      const res = await apiFetch("/api/channels", {
        method: "POST",
        body: JSON.stringify({
          groupId: activeGroupId,
          name: newChannelName.trim(),
          description: newChannelDescription.trim() || undefined,
        }),
      });
      if (!res.ok) return;
      const channel = await res.json();
      setChannels((prev) =>
        prev.some((existing) => existing.id === channel.id) ? prev : [...prev, channel]
      );
      setActiveChannelId(channel.id);
      setNewChannelName("");
      setNewChannelDescription("");
    } finally {
      setIsCreatingChannel(false);
    }
  };

  const handleMessageInput = (value: string) => {
    setNewMessageText(value);
    if (!activeChannelId) return;
    socket.emit("user_typing", { channelId: activeChannelId });
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("user_stop_typing", { channelId: activeChannelId });
    }, 1200);
  };

  const handleAttachmentSelection = async (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const allowed = [
      "image/",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument",
      "text/",
    ];
    if (file.size > 5 * 1024 * 1024 || !allowed.some((type) => file.type.startsWith(type))) return;

    const localId = `upload_${Date.now()}`;
    const optimistic: MessageAttachment = {
      id: localId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      fileUrl: "",
      uploadedAt: new Date().toISOString(),
      uploadProgress: 15,
      uploadStatus: "uploading",
    };
    setPendingAttachments((prev) => [...prev, optimistic]);

    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const uploadProgress = Math.min(90, Math.round((event.loaded / event.total) * 90));
      setPendingAttachments((prev) =>
        prev.map((attachment) =>
          attachment.id === localId ? { ...attachment, uploadProgress } : attachment
        )
      );
    };
    reader.onload = async () => {
      try {
        const response = await apiFetch("/api/attachments/upload", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            dataUrl: reader.result,
          }),
        });
        const uploaded = await response.json();
        setPendingAttachments((prev) =>
          prev.map((attachment) =>
            attachment.id === localId
              ? { ...uploaded, uploadProgress: 100, uploadStatus: "uploaded" }
              : attachment
          )
        );
      } catch {
        setPendingAttachments((prev) =>
          prev.map((attachment) =>
            attachment.id === localId ? { ...attachment, uploadStatus: "failed" } : attachment
          )
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteChannel = async (channelId: string) => {
    try {
      const response = await apiFetch(`/api/channels/${channelId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Failed to delete channel");
        return;
      }

      setChannels((prev) => prev.filter((channel) => channel.id !== channelId));

      if (activeChannelId === channelId) {
        const remainingChannel = channels.find((c) => c.id !== channelId);
        if (remainingChannel) {
          setActiveChannelId(remainingChannel.id);
        }
      }
    } catch (err) {
      console.error("Error deleting channel:", err);
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      const response = await apiFetch(`/api/groups/${groupId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error("Failed to delete group");
        return;
      }

      setChannels((prev) => prev.filter((channel) => channel.groupId !== groupId));

      if (activeGroupId === groupId) {
        const remainingGroup = groups.find((g) => g.id !== groupId);
        if (remainingGroup) {
          setActiveGroupId(remainingGroup.id);
        }
      }
    } catch (err) {
      console.error("Error deleting group:", err);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      console.log("Deleting message:", messageId);
      const response = await apiFetch(`/api/chat/messages/${messageId}`, {
        method: "DELETE",
      });

      console.log("Delete response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to delete message:", errorText);
        alert(`Failed to delete message: ${errorText}`);
        return;
      }

      setChatMessages((prev) => prev.filter((message) => message.id !== messageId));
    } catch (err) {
      console.error("Error deleting message:", err);
      alert(`Error deleting message: ${err}`);
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    try {
      console.log("Editing message:", messageId, content);
      const response = await apiFetch(`/api/chat/messages/${messageId}`, {
        method: "PATCH",
        body: JSON.stringify({ content }),
      });

      console.log("Edit response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to edit message:", errorText);
        alert(`Failed to edit message: ${errorText}`);
        return;
      }

      setChatMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? {
                ...message,
                content,
                updatedAt: new Date().toISOString(),
              }
            : message
        )
      );
    } catch (err) {
      console.error("Error editing message:", err);
      alert(`Error editing message: ${err}`);
    }
  };

  /*
  ========================================
  FILTER ACTIVE CHANNEL MESSAGES
  ========================================
  */

  const getFilteredMessages = () => {
    return chatMessages.filter((m) => m.channelId === activeChannelId);
  };

  /*
  ========================================
  CURRENT CHANNEL
  ========================================
  */

  const currentChannel = channels.find((c) => c.id === activeChannelId);
  const visibleChannels = channels.filter((channel) => channel.groupId === activeGroupId);
  const displayChannels = visibleChannels.length > 0 ? visibleChannels : channels;
  const currentGroup = groups.find((group) => group.id === activeGroupId);
  const typingNames = Object.values(typingUsers);

  const activeChanMessages = getFilteredMessages();

  /*
  ========================================
  TASK SEARCH FILTER
  ========================================
  */

  const getFilteredTasksForReference = () => {
    if (!searchTaskTerm) return tasks.slice(0, 4);

    const q = searchTaskTerm.toLowerCase();

    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex h-[600px] md:h-[750px] text-left animate-fadeIn relative w-full">
      {/* Connection Status Banner for Render Free Tier */}
      {connectionStatus !== "connected" && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-amber-100 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center justify-center gap-2">
          {connectionStatus === "reconnecting" ? (
            <>
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Reconnecting to server...</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span>Disconnected - attempting to reconnect</span>
            </>
          )}
        </div>
      )}

      {/* LEFT SIDEBAR - CHANNELS LIST */}

      <div
        className={`
          absolute inset-y-0 left-0 z-10
          bg-white/20 dark:bg-black/15 border-r border-gray-150 dark:border-white/5
          flex flex-col overflow-hidden p-3.5
          transition-transform duration-300 ease-in-out
          ${mobileView === "chat" ? "-translate-x-full" : "translate-x-0"}
          md:relative md:translate-x-0 md:w-[280px] w-full
        `}
      >
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block px-1">
            Workspace Groups
          </span>

          <nav className="space-y-1">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center gap-1 group">
                <button
                  onClick={() => setActiveGroupId(group.id)}
                  className={`flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeGroupId === group.id
                      ? "bg-white/80 dark:bg-white/10 text-[#5C27FE] dark:text-[#a085ff] shadow-sm border border-white/50 dark:border-white/5"
                      : "text-gray-550 dark:text-gray-400 hover:bg-gray-150/40 dark:hover:bg-white/5"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-white/50"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="truncate">{group.name}</span>
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all"
                  title="Delete group"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </nav>

          <div className="pt-2 border-t border-gray-150/70 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Channels
              </span>
              <FolderPlus size={12} className="text-gray-400" />
            </div>

            <nav className="space-y-1">
              {displayChannels.map((chan) => (
                <div key={chan.id} className="flex items-center gap-1 group">
                  <button
                    onClick={() => setActiveChannelId(chan.id)}
                    className={`flex-1 flex items-center justify-between gap-1.5 px-2.5 py-1.75 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                      activeChannelId === chan.id
                        ? "bg-white/80 dark:bg-white/10 text-[#5C27FE] dark:text-[#a085ff] shadow-sm border border-white/50 dark:border-white/5"
                        : "text-gray-550 dark:text-gray-400 hover:bg-gray-150/40 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Hash size={12} className="text-gray-450 flex-shrink-0" />

                      <span className="truncate">{chan.name.replace(/^[^\w]*/, "")}</span>
                    </span>
                    {(chan.unreadCount || 0) > 0 && (
                      <span className="text-[9px] font-extrabold bg-[#FF4D4D]/10 text-[#FF4D4D] px-1.5 py-0.5 rounded-full">
                        {chan.unreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => deleteChannel(chan.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete channel"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </nav>

            <form onSubmit={handleCreateChannel} className="space-y-1.5 pt-1">
              <input
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="New channel"
                className="w-full text-[10px] bg-white/80 dark:bg-black/20 text-gray-800 dark:text-white rounded-lg border border-gray-200/60 dark:border-white/10 px-2 py-1.5 outline-none"
              />
              <input
                value={newChannelDescription}
                onChange={(e) => setNewChannelDescription(e.target.value)}
                placeholder="Description"
                className="w-full text-[10px] bg-white/80 dark:bg-black/20 text-gray-800 dark:text-white rounded-lg border border-gray-200/60 dark:border-white/10 px-2 py-1.5 outline-none"
              />
              <button
                type="submit"
                disabled={isCreatingChannel || !newChannelName.trim()}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#5C27FE] px-2 py-1.5 text-[10px] font-bold text-white disabled:opacity-40"
              >
                <Plus size={11} />
                Create Channel
              </button>
            </form>
          </div>
        </div>

        {/* BOT STATUS */}

        <div className="mt-3 flex-shrink-0 p-2 rounded-xl bg-[#5C27FE]/5 border border-[#5C27FE]/15 text-[10px] space-y-1 leading-relaxed">
          <div className="flex items-center gap-1.5 font-bold text-[#5C27FE]">
            <Bot size={11} className={isAiTyping ? "animate-bounce" : ""} />

            <span>{isAiTyping ? "AI Assistant Responding..." : "Synergy Engine Active"}</span>
          </div>

          <span className="text-gray-400">
            {isAiTyping
              ? "Generating response..."
              : "Type @ai or /ai to trigger AI assistant responses!"}
          </span>
        </div>
      </div>

      {/* MAIN CHAT AREA */}

      <div
        className={`
          flex-1 flex flex-col justify-between bg-white dark:bg-[#121220]/45
          transition-transform duration-300 ease-in-out
          ${mobileView === "channels" ? "translate-x-full" : "translate-x-0"}
          md:translate-x-0
          absolute inset-y-0 right-0 w-full md:relative
        `}
      >
        {/* HEADER */}

        <div className="p-3.5 border-b border-gray-150 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-[#151525] backdrop-blur-xs">
          <div className="flex items-center gap-2">
            {/* Mobile back button */}
            <button
              onClick={() => setMobileView("channels")}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>

            <div>
              <h5 className="font-sora font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1">
                <Hash size={12} className="text-[#5C27FE]" />

                <span>
                  {currentGroup?.name || "Workspace"} / #{currentChannel?.name || "select-channel"}
                </span>
              </h5>

              {currentChannel?.description && (
                <p className="text-[10px] text-gray-400 tracking-tight truncate max-w-sm mt-0.5">
                  {currentChannel.description}
                </p>
              )}
            </div>
          </div>

          <div className="text-[10px] text-gray-400 font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C] animate-ping" />

            <span>
              {users.filter((user) => presence[user.id]?.status === "online").length || 1} online
            </span>
          </div>
        </div>

        {/* MESSAGES */}

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {loadingMessages && activeChanMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block px-4 py-2 rounded-lg bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 mb-3">
                  <div className="w-4 h-4 border-2 border-[#5C27FE] border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
                <p className="text-xs text-gray-400">Loading messages...</p>
              </div>
            </div>
          ) : activeChanMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl mb-3 opacity-30">💬</div>
                <p className="text-xs text-gray-400 font-semibold">No messages yet.</p>
                <p className="text-[10px] text-gray-400 mt-1">Start the conversation!</p>
              </div>
            </div>
          ) : (
            activeChanMessages.map((msg) => {
              const sender = users.find((user) => user.id === msg.userId);

              const timeStr = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              const linkedTask = tasks.find((t) => t.id === msg.taskRefId);
              const senderName = sender?.name || msg.userName || "Teammate";

              if (msg.isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="mx-auto max-w-[88%] rounded-full border border-gray-200/70 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.04] px-3 py-1.5 text-center text-[11px] italic text-gray-500 dark:text-gray-400"
                  >
                    {msg.content}
                  </div>
                );
              }

              return (
                <div key={msg.id} className="flex gap-2.5 items-start text-left group">
                  <img
                    src={sender?.avatarUrl || "https://via.placeholder.com/100"}
                    alt={senderName}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-white/50 object-cover"
                    referrerPolicy="no-referrer"
                  />

                  <div className="space-y-1 max-w-[85%]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-901 dark:text-gray-105">
                        {senderName}
                      </span>

                      <span className="text-[9px] text-gray-400 font-mono">{timeStr}</span>

                      {(msg.userId === currentUser?.id ||
                        currentUserRole === "admin" ||
                        currentUserRole === "owner") && (
                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-all">
                          {msg.userId === currentUser?.id ||
                          currentUserRole === "admin" ||
                          currentUserRole === "owner" ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditingMessageContent(msg.content);
                                }}
                                className="p-1 rounded text-gray-400 hover:text-[#5C27FE] hover:bg-[#5C27FE]/10"
                                title="Edit message"
                              >
                                <Edit2 size={10} />
                              </button>
                              <button
                                onClick={() => deleteMessage(msg.id)}
                                className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Delete message"
                              >
                                <Trash2 size={10} />
                              </button>
                            </>
                          ) : (
                            <div
                              className="text-[9px] text-gray-400 italic"
                              title="Only admins can edit/delete other users' messages"
                            >
                              Admin only
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 rounded-2xl bg-gray-50/75 dark:bg-[#1C1C30]/55 border border-gray-150/50 dark:border-white/5 text-xs text-gray-800 dark:text-gray-250 leading-relaxed font-normal whitespace-pre-line">
                      {editingMessageId === msg.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingMessageContent}
                            onChange={(e) => setEditingMessageContent(e.target.value)}
                            className="w-full bg-white dark:bg-black/30 text-gray-800 dark:text-white rounded-lg border border-gray-200 dark:border-white/10 px-2 py-1.5 outline-none focus:border-[#5C27FE] resize-none"
                            rows={2}
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                editMessage(msg.id, editingMessageContent);
                                setEditingMessageId("");
                                setEditingMessageContent("");
                              }}
                              className="px-2 py-1 bg-[#5C27FE] text-white rounded-lg text-[10px] font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingMessageId("");
                                setEditingMessageContent("");
                              }}
                              className="px-2 py-1 bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-bold"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p>{msg.content}</p>
                      )}

                      {linkedTask && (
                        <div className="mt-2 pt-2 border-t border-gray-150 dark:border-white/5 flex flex-col space-y-1">
                          <span className="text-[9px] font-mono font-bold text-[#5C27FE] uppercase block">
                            Linked Task Reference
                          </span>

                          <button
                            onClick={() => {
                              setSelectedTask(linkedTask);

                              setIsDetailOpen(true);
                            }}
                            className="px-2 py-1 bg-white dark:bg-black/25 rounded-lg border border-gray-250 dark:border-white/10 hover:border-[#5C27FE] hover:shadow-xs transition-all inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-800 dark:text-gray-200 cursor-pointer text-left self-start"
                          >
                            <CheckCircle2
                              size={11}
                              className={
                                linkedTask.status === "completed"
                                  ? "text-emerald-500"
                                  : "text-gray-400"
                              }
                            />

                            <span className="truncate max-w-[200px]">{linkedTask.title}</span>

                            <ChevronRight size={10} className="text-gray-400" />
                          </button>
                        </div>
                      )}
                      {(msg.attachments || []).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-150 dark:border-white/5 flex flex-wrap gap-1.5">
                          {msg.attachments?.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={attachment.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 rounded-lg bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-700 dark:text-gray-200"
                            >
                              {attachment.fileName}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {typingNames.length > 0 && (
            <div className="text-[10px] text-gray-400 font-semibold px-10">
              {typingNames.slice(0, 2).join(", ")} {typingNames.length === 1 ? "is" : "are"}{" "}
              typing...
            </div>
          )}
          {isAiTyping && (
            <div className="flex gap-2.5 items-start text-left px-10">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#5C27FE] to-[#a085ff] border border-white/50 flex items-center justify-center">
                <Bot size={14} className="text-white" />
              </div>
              <div className="space-y-1 max-w-[85%]">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-gray-901 dark:text-gray-105">
                    NewDay AI
                  </span>
                  <span className="text-[9px] text-gray-400 font-mono">now</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-gray-50/75 dark:bg-[#1C1C30]/55 border border-gray-150/50 dark:border-white/5 text-xs text-gray-800 dark:text-gray-250">
                  <div className="flex gap-1 items-center">
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[#5C27FE] animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[#5C27FE] animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-[#5C27FE] animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-white/50 dark:bg-[#151525]/85 border-t border-gray-150 dark:border-white/5 space-y-2">
          {/* TASK LINK BUTTON */}

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSearchingTask(!isSearchingTask)}
              className={`p-1.5 rounded-lg border flex items-center gap-1 text-[10px] font-bold tracking-tight cursor-pointer transition-all ${
                isSearchingTask || selectedTaskRefId
                  ? "bg-[#5C27FE]/10 border-[#5C27FE]/30 text-[#5C27FE] dark:text-[#a085ff]"
                  : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-400 hover:text-gray-600"
              }`}
            >
              <Paperclip size={10} />

              <span>Link Task Element</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => handleAttachmentSelection(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg border bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 text-gray-400 hover:text-gray-600"
              title="Attach file"
            >
              <Paperclip size={11} />
            </button>

            {selectedTaskRefId && (
              <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-[#5C27FE] dark:text-[#a085ff] pl-2 pr-1 py-0.5 rounded-lg">
                <span className="truncate max-w-[155px]">
                  ID Linked: {tasks.find((t) => t.id === selectedTaskRefId)?.title}
                </span>

                <button
                  onClick={() => setSelectedTaskRefId("")}
                  className="p-0.5 text-gray-400 hover:text-[#FF4D4D] cursor-pointer"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>

          {/* TASK SEARCH */}

          {isSearchingTask && (
            <div className="p-2.5 rounded-xl border border-gray-150 dark:border-white/5 bg-gray-50 dark:bg-black/25 text-left space-y-1.5">
              <input
                type="text"
                placeholder="Type task index keywords to link..."
                value={searchTaskTerm}
                onChange={(e) => setSearchTaskTerm(e.target.value)}
                className="w-full pl-2.5 pr-2.5 py-1 text-[10px] bg-white dark:bg-black/15 text-gray-800 dark:text-white rounded-md border border-gray-200/50 outline-none"
              />

              <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto pt-1">
                {getFilteredTasksForReference().map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setSelectedTaskRefId(t.id);

                      setIsSearchingTask(false);

                      setSearchTaskTerm("");
                    }}
                    className="text-[10px] px-2 py-0.75 bg-white dark:bg-white/5 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-white/5 rounded-md hover:bg-gray-100 cursor-pointer truncate max-w-[170px]"
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {pendingAttachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {pendingAttachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="px-2 py-1 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300"
                >
                  {attachment.fileName} ·{" "}
                  {attachment.uploadStatus === "uploaded"
                    ? "ready"
                    : `${attachment.uploadProgress || 0}%`}
                </div>
              ))}
            </div>
          )}

          {/* AI INSTRUCTION - MOBILE ONLY */}
          <div className="md:hidden mt-2 flex-shrink-0 p-2 rounded-xl bg-[#5C27FE]/5 border border-[#5C27FE]/15 text-[10px] space-y-1 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-[#5C27FE]">
              <Bot size={11} className={isAiTyping ? "animate-bounce" : ""} />
              <span>{isAiTyping ? "AI Assistant Responding..." : "Synergy Engine Active"}</span>
            </div>
            <span className="text-gray-400">
              {isAiTyping
                ? "Generating response..."
                : "Type @ai or /ai to trigger AI assistant responses!"}
            </span>
          </div>

          {/* FORM */}

          <form onSubmit={handleSubmitMessage} className="flex gap-2">
            <input
              type="text"
              placeholder={`Collaborate with teammates in #${currentChannel?.name.replace(
                /^[^\w]*/,
                ""
              )}...`}
              value={newMessageText}
              onChange={(e) => handleMessageInput(e.target.value)}
              className="flex-1 text-xs bg-white dark:bg-[#151525]/40 text-gray-901 dark:text-white px-3.5 py-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
            />

            <button
              type="submit"
              disabled={!newMessageText.trim() && pendingAttachments.length === 0}
              className="px-3.5 py-2.5 rounded-xl bg-[#5C27FE] hover:bg-[#4a1ee3] disabled:opacity-40 text-white cursor-pointer shadow-md inline-flex items-center justify-center transition-all"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
