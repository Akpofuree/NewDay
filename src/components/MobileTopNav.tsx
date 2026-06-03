import type { Dispatch, SetStateAction } from "react";
import { Group } from "../types";
import {
  Calendar,
  ClipboardList,
  CheckCircle2,
  PieChart,
  Target,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import type { Metrics } from "../utils/taskFilters";

type MobileTopNavProps = {
  logoImage: string;
  mobileNavStyle: "top" | "bottom";
  setMobileNavStyle: Dispatch<SetStateAction<"top" | "bottom">>;
  handleLogout: () => Promise<void>;
  scrollToTop: () => void;
  activeCategory: string;
  setActiveCategory: Dispatch<SetStateAction<string>>;
  metrics: Metrics;
  groups: Group[];
  setIsNewGroupOpen: Dispatch<SetStateAction<boolean>>;
};

export default function MobileTopNav({
  logoImage,
  mobileNavStyle,
  setMobileNavStyle,
  handleLogout,
  scrollToTop,
  activeCategory,
  setActiveCategory,
  metrics,
  groups,
  setIsNewGroupOpen,
}: MobileTopNavProps) {
  return mobileNavStyle === "top" ? (
    <div className="md:hidden sticky top-0 z-30 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 animate-fadeIn">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#5C27FE]/60 rounded-full"
          aria-label="Scroll to top"
        >
          <img
            src={logoImage}
            alt="NewDay logo"
            className="h-7 w-auto rounded-lg object-contain shadow-md shadow-[#5C27FE]/20 cursor-pointer"
          />
          <span className="sr-only">NewDay</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-white/5 p-0.5 rounded-lg text-[9px] font-bold">
            <button
              type="button"
              onClick={() => {
                setMobileNavStyle("top");
                localStorage.setItem("newday_mobile_nav_style", "top");
              }}
              className={`px-1.5 py-0.5 rounded-sm transition-all ${
                mobileNavStyle === "top"
                  ? "bg-[#5C27FE] text-white shadow-xs"
                  : "text-gray-400"
              }`}
            >
              Top Nav
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileNavStyle("bottom");
                localStorage.setItem("newday_mobile_nav_style", "bottom");
              }}
              className="px-1.5 py-0.5 rounded-sm transition-all text-gray-400"
            >
              Bottom
            </button>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out / Switch Profile"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 pb-3 pt-1 border-t border-gray-100 dark:border-white/5">
        <button
          onClick={() => setActiveCategory("today")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeCategory === "today"
              ? "bg-[#5C27FE] text-white shadow-md"
              : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Calendar size={12} />
          <span>Today {metrics.overdue > 0 ? `(${metrics.overdue})` : ""}</span>
        </button>
        <button
          onClick={() => setActiveCategory("my_tasks")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeCategory === "my_tasks"
              ? "bg-[#5C27FE] text-white shadow-md"
              : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <ClipboardList size={12} />
          <span>My Desk</span>
        </button>
        <button
          onClick={() => setActiveCategory("completed")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeCategory === "completed"
              ? "bg-[#00C48C] text-white shadow-md"
              : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <CheckCircle2 size={12} />
          <span>Archived</span>
        </button>
        <button
          onClick={() => setActiveCategory("analytics")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeCategory === "analytics"
              ? "bg-[#5C27FE] text-white shadow-md"
              : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <PieChart size={12} />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => setActiveCategory("goals")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeCategory === "goals"
              ? "bg-[#FF4D4D] text-white shadow-md"
              : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Target size={12} />
          <span>Goals</span>
        </button>
        <button
          onClick={() => setActiveCategory("chat")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeCategory === "chat"
              ? "bg-[#0EA5E9] text-white shadow-md"
              : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <MessageSquare size={12} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveCategory("settings")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all ${
            activeCategory === "settings"
              ? "bg-[#5C27FE] text-white shadow-md"
              : "bg-white/50 dark:bg-white/5 text-gray-600 dark:text-gray-400"
          }`}
        >
          <Settings size={12} />
          <span>Settings</span>
        </button>

        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 self-center flex-shrink-0" />
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveCategory(g.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
              activeCategory === g.id
                ? "bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-md border border-gray-200/50 dark:border-white/10"
                : "bg-white/30 dark:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: g.color }}
            />
            <span>{g.name}</span>
          </button>
        ))}

        <button
          onClick={() => setIsNewGroupOpen(true)}
          className="px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#5C27FE]/10 text-[#5C27FE] dark:text-[#a085ff] whitespace-nowrap"
        >
          + Project
        </button>
      </div>
    </div>
  ) : (
    <div className="md:hidden sticky top-0 z-30 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 px-4 py-3 animate-fadeIn">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#5C27FE]/60 rounded-full"
          aria-label="Scroll to top"
        >
          <img
            src={logoImage}
            alt="NewDay logo"
            className="h-7 w-auto rounded-lg object-contain shadow-md shadow-[#5C27FE]/20 cursor-pointer"
          />
          <span className="sr-only">NewDay</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-white/5 p-0.5 rounded-lg text-[9px] font-bold">
            <button
              type="button"
              onClick={() => {
                setMobileNavStyle("top");
                localStorage.setItem("newday_mobile_nav_style", "top");
              }}
              className="px-1.5 py-0.5 rounded-sm transition-all text-gray-400"
            >
              Top Nav
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileNavStyle("bottom");
                localStorage.setItem("newday_mobile_nav_style", "bottom");
              }}
              className={`px-1.5 py-0.5 rounded-sm transition-all ${
                mobileNavStyle === "bottom"
                  ? "bg-[#5C27FE] text-white shadow-xs"
                  : "text-gray-400"
              }`}
            >
              Bottom
            </button>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out / Switch Profile"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 pb-1 text-[10px]">
        <span className="font-bold uppercase tracking-wider text-gray-400 mr-1 shrink-0">
          Projects:
        </span>
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => setActiveCategory(g.id)}
            className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-all ${
              activeCategory === g.id
                ? "bg-[#5C27FE] text-white shadow-xs"
                : "bg-white/55 dark:bg-white/5 text-gray-600 dark:text-gray-400"
            }`}
          >
            {g.name}
          </button>
        ))}
        <button
          onClick={() => setIsNewGroupOpen(true)}
          className="px-2 py-0.5 rounded-md font-bold text-[#5C27FE] dark:text-[#a085ff] bg-[#5C27FE]/10"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
