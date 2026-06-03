import type { Dispatch, SetStateAction } from "react";
import {
  Calendar,
  ClipboardList,
  Plus,
  Target,
  MessageSquare,
  Settings,
} from "lucide-react";
import type { ChatMessage } from "../types";

type MobileBottomDockProps = {
  activeCategory: string;
  setActiveCategory: Dispatch<SetStateAction<string>>;
  setIsNewTaskOpen: Dispatch<SetStateAction<boolean>>;
  chatMessages: ChatMessage[];
};

export default function MobileBottomDock({
  activeCategory,
  setActiveCategory,
  setIsNewTaskOpen,
  chatMessages,
}: MobileBottomDockProps) {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 shadow-2xl z-40 flex items-center justify-around px-2 animate-fadeIn">
      <button
        onClick={() => setActiveCategory("today")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
          activeCategory === "today"
            ? "text-[#5C27FE] dark:text-[#a085ff] scale-105 font-bold"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <Calendar size={18} className="mb-0.5" />
        <span className="text-[10px]">Today</span>
      </button>

      <button
        onClick={() => setActiveCategory("my_tasks")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
          activeCategory === "my_tasks"
            ? "text-[#5C27FE] dark:text-[#a085ff] scale-105 font-bold"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <ClipboardList size={18} className="mb-0.5" />
        <span className="text-[10px]">Desk</span>
      </button>

      <div className="flex-1 flex justify-center -mt-6">
        <button
          onClick={() => setIsNewTaskOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5C27FE] to-[#a085ff] text-white flex items-center justify-center shadow-lg shadow-[#5C27FE]/30 hover:shadow-xl hover:shadow-[#5C27FE]/40 transition-all border-4 border-white dark:border-[#0F0F1A] cursor-pointer"
        >
          <Plus size={20} />
        </button>
      </div>

      <button
        onClick={() => setActiveCategory("goals")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
          activeCategory === "goals"
            ? "text-[#5C27FE] dark:text-[#a085ff] scale-105 font-bold"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <Target size={18} className="mb-0.5" />
        <span className="text-[10px]">Goals</span>
      </button>

      <button
        onClick={() => setActiveCategory("chat")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
          activeCategory === "chat"
            ? "text-[#5C27FE] dark:text-[#a085ff] scale-105 font-bold"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <div className="relative">
          <MessageSquare size={18} className="mb-0.5" />
          {chatMessages.length > 0 && (
            <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-[#0EA5E9]" />
          )}
        </div>
        <span className="text-[10px]">Chat</span>
      </button>

      <button
        onClick={() => setActiveCategory("settings")}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
          activeCategory === "settings"
            ? "text-[#5C27FE] dark:text-[#a085ff] scale-105 font-bold"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        <Settings size={18} className="mb-0.5" />
        <span className="text-[10px]">Settings</span>
      </button>
    </div>
  );
}
