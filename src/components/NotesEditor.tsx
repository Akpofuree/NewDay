import React, { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../lib/api";

interface NotesEditorProps {
  taskId: string;
  initialNotes?: string;
  onNotesSaved?: (notes: string) => void;
}

export default function NotesEditor({ taskId, initialNotes = "", onNotesSaved }: NotesEditorProps) {
  const [content, setContent] = useState(initialNotes);
  const [status, setStatus] = useState<"saved" | "saving" | "">("");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const saveNotes = useCallback(
    async (notes: string) => {
      setStatus("saving");
      try {
        const res = await apiFetch(`/api/tasks/${taskId}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        });
        if (!res.ok) throw new Error("Failed to save notes");
        setStatus("saved");
        setTimeout(() => setStatus(""), 2000);
        if (onNotesSaved) onNotesSaved(notes);
      } catch (err) {
        console.error("Failed to save notes:", err);
        setStatus("");
      }
    },
    [taskId, onNotesSaved]
  );

  useEffect(() => {
    setContent(initialNotes);
  }, [initialNotes]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    if (debounceTimer) clearTimeout(debounceTimer);

    const timer = setTimeout(() => {
      saveNotes(newContent);
    }, 1500);

    setDebounceTimer(timer);
  };

  const handleManualSave = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    saveNotes(content);
  };

  return (
    <div className="relative">
      <textarea
        value={content}
        onChange={handleChange}
        placeholder="Start writing notes for this task..."
        className="w-full min-h-75 p-4 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-gray-800 dark:text-gray-200 text-sm resize-y focus:outline-none focus:border-[#5C27FE] focus:ring-1 focus:ring-[#5C27FE]"
      />
      <div className="absolute bottom-2 right-2 flex items-center gap-2">
        <button
          onClick={handleManualSave}
          disabled={status === "saving"}
          className="px-2 py-1 bg-[#5C27FE] text-white text-[10px] font-bold rounded hover:bg-[#4a1fd9] disabled:opacity-50 cursor-pointer"
        >
          Save
        </button>
        {status && (
          <div className="text-[10px] font-semibold text-gray-400">
            {status === "saving" ? "Saving..." : "Saved"}
          </div>
        )}
      </div>
    </div>
  );
}
