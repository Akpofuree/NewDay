import React, { useState, useEffect, useRef } from "react";
import { Task, Group, User, TaskStatus, TaskPriority } from "../types";
import { X, Sparkles, Folder, UserCheck, Calendar, AlertTriangle, Play } from "lucide-react";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: Omit<Task, "id" | "comments" | "activities" | "createdAt">) => void;
  users: User[];
  groups: Group[];
  activeGroupId?: string;
}

export default function NewTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  users,
  groups,
  activeGroupId,
}: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("pending");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [validationError, setValidationError] = useState("");

  const tagColors = [
    "#5C27FE",
    "#0EA5E9",
    "#00C48C",
    "#FFB020",
    "#FF4D4D",
    "#EC4899",
    "#8B5CF6",
    "#F97316",
  ];

  const prevIsOpenRef = useRef(isOpen);

  // Pre-fill active group alignment when modal is triggered
  useEffect(() => {
    // Only reset form when modal transitions from closed to open
    if (isOpen && !prevIsOpenRef.current) {
      // Clean states on opening
      setTitle("");
      setDescription("");
      setStatus("pending");
      setPriority("medium");
      setDueDate("");
      setAssigneeId("");
      setTags([]);
      setTagInput("");
      setValidationError("");
    }

    // Update group ID when activeGroupId changes (but don't reset other fields)
    if (activeGroupId && groups.some((g) => g.id === activeGroupId)) {
      setGroupId(activeGroupId);
    } else if (!isOpen) {
      // Only clear groupId when modal is closed
      setGroupId("");
    }

    prevIsOpenRef.current = isOpen;
  }, [isOpen, activeGroupId, groups]);

  if (!isOpen) return null;

  const normalizeTag = (value: string) => {
    return value.trim().toLowerCase().slice(0, 20);
  };

  const handleAddTag = (rawValue: string) => {
    const normalized = normalizeTag(rawValue.replace(/,/g, ""));
    if (!normalized || tags.includes(normalized) || tags.length >= 8) return;
    setTags((prev) => [...prev, normalized]);
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((item) => item !== tag));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (tagInput) {
        handleAddTag(tagInput);
        setTagInput("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!title.trim()) {
      setValidationError("A clear and descriptive task Title represents a required field.");
      return;
    }

    onCreateTask({
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || undefined,
      groupId: groupId || undefined,
      tags,
      subtasks: [],
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      {/* Backdrop glass blurring */}
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Glass Panel Card */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl glass-panel shadow-2xl overflow-hidden animate-zoom-in pointer-events-auto"
        style={{
          animation: "zoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        }}
      >
        {/* CSS Transition animations inline overrides */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes zoomIn {
            from { transform: scale(0.92); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `,
          }}
        />

        {/* Modal Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 pb-4 border-b border-gray-200/50 dark:border-white/5">
          <div className="flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-lg bg-[#5C27FE]/15 flex items-center justify-center text-[#5C27FE] dark:text-[#a085ff]">
              <Sparkles size={14} />
            </div>
            <div>
              <h3 className="font-sora font-extrabold text-sm text-gray-900 dark:text-white leading-none">
                Spawn Collective Task
              </h3>
              <p className="text-[10px] text-gray-500 mt-1">
                Populates current workspace instantly
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body - scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
              <div className="p-3 text-xs text-[#FF4D4D] bg-red-50 dark:bg-red-950/20 rounded-lg flex items-center gap-2 border border-[#FF4D4D]/25">
                <AlertTriangle size={14} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Title and Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Task Title <span className="text-[#FF4D4D]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Calibrate CSS grid constraints"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationError) setValidationError("");
                }}
                className="w-full text-xs bg-white dark:bg-black/20 text-gray-900 dark:text-white px-3 py-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] dark:focus:border-indigo-400"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Descriptive Notes (optional)
              </label>
              <textarea
                placeholder="Add comprehensive specifications, details..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-white dark:bg-black/20 text-gray-900 dark:text-white px-3 py-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] dark:focus:border-indigo-400"
              />
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Tags (optional)
              </label>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                {tags.map((tag, index) => (
                  <button
                    key={`${tag}-${index}`}
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white"
                    style={{
                      backgroundColor: tagColors[index % tagColors.length],
                    }}
                  >
                    {tag}
                    <X size={10} />
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter or comma"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className="w-full text-xs bg-white dark:bg-black/20 text-gray-900 dark:text-white px-3 py-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none focus:border-[#5C27FE] dark:focus:border-indigo-400"
              />
              <p className="text-[9px] text-gray-400 mt-1">
                Add up to 8 tags. Tags are lowercase, unique, and max 20 characters.
              </p>
            </div>

            {/* Double Column Parameters */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Status Type Column */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="w-full text-xs bg-white dark:bg-black/20 text-gray-800 dark:text-white py-2 px-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none"
                >
                  <option value="pending" className="bg-white dark:bg-[#1A1A2E]">
                    Pending
                  </option>
                  <option value="in_progress" className="bg-white dark:bg-[#1A1A2E]">
                    In Progress
                  </option>
                  <option value="completed" className="bg-white dark:bg-[#1A1A2E]">
                    Completed
                  </option>
                  <option value="overdue" className="bg-white dark:bg-[#1A1A2E]">
                    Overdue
                  </option>
                </select>
              </div>

              {/* Priority State */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                  Priority Rank
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full text-xs bg-white dark:bg-black/20 text-gray-800 dark:text-white py-2 px-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none"
                >
                  <option value="low" className="bg-white dark:bg-[#1A1A2E]">
                    Low
                  </option>
                  <option value="medium" className="bg-white dark:bg-[#1A1A2E]">
                    Medium
                  </option>
                  <option value="high" className="bg-white dark:bg-[#1A1A2E]">
                    High
                  </option>
                  <option value="urgent" className="bg-white dark:bg-[#1A1A2E]">
                    Urgent
                  </option>
                </select>
              </div>

              {/* Group Project */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Folder size={11} />
                  Project Bucket
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-black/20 text-gray-800 dark:text-white py-2 px-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none"
                >
                  <option value="" className="bg-white dark:bg-[#1A1A2E]">
                    None (My Standalone Tasks)
                  </option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id} className="bg-white dark:bg-[#1A1A2E]">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assignee */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <UserCheck size={11} />
                  Partner Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-black/20 text-gray-800 dark:text-white py-2 px-2.5 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none"
                >
                  <option value="" className="bg-white dark:bg-[#1A1A2E]">
                    Unassigned
                  </option>
                  {users
                    .filter((u) => {
                      if (!groupId) return true;
                      const group = groups.find((g) => g.id === groupId);
                      return group?.memberIds?.includes(u.id);
                    })
                    .map((u) => (
                      <option key={u.id} value={u.id} className="bg-white dark:bg-[#1A1A2E]">
                        {u.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date-picker limit */}
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                  <Calendar size={11} />
                  Timeline Due Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs bg-white dark:bg-black/20 text-gray-800 dark:text-white py-2 px-3 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Sticky footer for form actions */}
        <div className="flex-shrink-0 sticky bottom-0 bg-white dark:bg-[#1A1A2E] pt-3 pb-4 px-6 border-t border-gray-200/50 dark:border-white/5">
          <div className="flex justify-end gap-3.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl cursor-pointer"
            >
              Cancel Row
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary-shimmer ripple-effect px-4 py-2.5 text-xs font-bold text-white bg-[#5C27FE] hover:bg-[#4a1ee3] rounded-xl flex items-center gap-1 shadow-md shadow-[#5C27FE]/20 cursor-pointer"
            >
              <span>Build Active Task</span>
              <Sparkles size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
