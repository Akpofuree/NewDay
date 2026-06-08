import type { Dispatch, FormEvent, SetStateAction } from "react";
import { X } from "lucide-react";

type NewGroupModalProps = {
  isNewGroupOpen: boolean;
  setIsNewGroupOpen: Dispatch<SetStateAction<boolean>>;
  newGroupName: string;
  setNewGroupName: Dispatch<SetStateAction<string>>;
  newGroupDesc: string;
  setNewGroupDesc: Dispatch<SetStateAction<string>>;
  newGroupColor: string;
  setNewGroupColor: Dispatch<SetStateAction<string>>;
  handleCreateGroup: (e: FormEvent) => Promise<void> | void;
};

export default function NewGroupModal({
  isNewGroupOpen,
  setIsNewGroupOpen,
  newGroupName,
  setNewGroupName,
  newGroupDesc,
  setNewGroupDesc,
  newGroupColor,
  setNewGroupColor,
  handleCreateGroup,
}: NewGroupModalProps) {
  if (!isNewGroupOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-md"
        onClick={() => setIsNewGroupOpen(false)}
      />
      <div className="relative w-full max-w-sm rounded-2xl glass-panel shadow-2xl p-5 z-10 pointer-events-auto">
        <div className="flex items-center justify-between pb-3 border-b border-gray-200/50 dark:border-white/5 mb-4">
          <span className="font-sora font-extrabold text-sm text-gray-900 dark:text-white">
            Initialize Project Group
          </span>
          <button
            onClick={() => setIsNewGroupOpen(false)}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleCreateGroup} className="space-y-4 text-left">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Project Group Name
            </label>
            <input
              type="text"
              placeholder="e.g., Marketing Campaign"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full text-xs bg-white dark:bg-black/15 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none focus:border-[#5C27FE]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
              Brief Workspace Description
            </label>
            <textarea
              placeholder="Review channels, outreach coordinates..."
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              rows={2}
              className="w-full text-xs bg-white dark:bg-black/15 text-gray-900 dark:text-white px-3 py-2 rounded-xl border border-gray-200/50 dark:border-white/10 focus:outline-none focus:border-[#5C27FE]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-550 mb-1.5">
              Select Visual Brand Token Tag
            </label>
            <div className="flex gap-2.5">
              {[
                "#5C27FE",
                "#FF4D4D",
                "#00C48C",
                "#FFB020",
                "#0EA5E9",
                "#EC4899",
              ].map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setNewGroupColor(hex)}
                  className={`w-6 h-6 rounded-full border border-white/45 relative shadow-sm cursor-pointer transition-transform ${
                    newGroupColor === hex
                      ? "scale-115 ring-2 ring-[#5C27FE]/40"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: hex }}
                >
                  {newGroupColor === hex && (
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px]">
                      ✓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-200/50 dark:border-white/5 mt-5">
            <button
              type="button"
              onClick={() => setIsNewGroupOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-shimmer ripple-effect px-4.5 py-1.5 text-xs font-bold text-white bg-[#5C27FE] hover:bg-[#4a1ee3] rounded-lg cursor-pointer shadow-md shadow-[#5C27FE]/20"
            >
              Create Project Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
