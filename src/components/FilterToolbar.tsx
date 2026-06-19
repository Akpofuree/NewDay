import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { TaskPriority, TaskStatus } from "../types";
import { Search, Tag, Filter, ChevronDown, X } from "lucide-react";

type FilterToolbarProps = {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  statusFilter: "all" | TaskStatus;
  setStatusFilter: Dispatch<SetStateAction<"all" | TaskStatus>>;
  priorityFilter: "all" | TaskPriority;
  setPriorityFilter: Dispatch<SetStateAction<"all" | TaskPriority>>;
  tagFilter: string;
  setTagFilter: Dispatch<SetStateAction<string>>;
  allTags: string[];
  sortBy: "dueDate" | "priority" | "createdAt" | "title" | "status";
  setSortBy: Dispatch<SetStateAction<"dueDate" | "priority" | "createdAt" | "title" | "status">>;
  sortDir: "asc" | "desc";
  setSortDir: Dispatch<SetStateAction<"asc" | "desc">>;
  // Bulk selection props
  isBulkMode?: boolean;
  setIsBulkMode?: Dispatch<SetStateAction<boolean>>;
  selectedTaskIds?: Set<string>;
  setSelectedTaskIds?: Dispatch<SetStateAction<Set<string>>>;
  visibleTaskIds?: string[];
};

export default function FilterToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  priorityFilter,
  setPriorityFilter,
  tagFilter,
  setTagFilter,
  allTags,
  sortBy,
  setSortBy,
  sortDir,
  setSortDir,
  isBulkMode = false,
  setIsBulkMode,
  selectedTaskIds,
  setSelectedTaskIds,
  visibleTaskIds = [],
}: FilterToolbarProps) {
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const hasActiveFilter = statusFilter !== "all" || priorityFilter !== "all" || tagFilter !== "";

  return (
    <section
      className={`p-4 rounded-xl bg-white/45 dark:bg-[#1E1E32]/35 border border-gray-200/50 dark:border-white/5 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${isBulkMode ? "bg-[#f6f0ff]/40" : ""}`}
    >
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          placeholder="Search tasks, descriptions, tags, or workspace names..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/75 dark:bg-black/15 text-gray-900 dark:text-white rounded-lg border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Bulk selection controls */}
        {setIsBulkMode && setSelectedTaskIds && (
          <div className="flex items-center gap-2">
            {!isBulkMode ? (
              <button
                onClick={() => setIsBulkMode(true)}
                className="px-3 py-1 text-xs bg-white/50 dark:bg-black/10 rounded-lg border border-gray-200/50 flex items-center gap-2"
              >
                <input type="checkbox" readOnly className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold">Select</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsBulkMode(false);
                    setSelectedTaskIds(new Set());
                  }}
                  className="px-3 py-1 text-xs bg-white/50 dark:bg-black/10 rounded-lg border border-gray-200/50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSelectedTaskIds(new Set(visibleTaskIds));
                  }}
                  className="px-3 py-1 text-xs bg-white/50 dark:bg-black/10 rounded-lg border border-gray-200/50"
                >
                  Select All
                </button>
                <div className="px-2 py-1 text-xs font-bold bg-[#5C27FE]/10 text-[#5C27FE] rounded-full">
                  {selectedTaskIds?.size || 0} selected
                </div>
              </>
            )}
          </div>
        )}
        {/* Mobile filter dropdown button */}
        <div className="sm:hidden relative">
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border ${
              hasActiveFilter
                ? "bg-[#5C27FE]/10 border-[#5C27FE]/30 text-[#5C27FE]"
                : "bg-white/50 dark:bg-black/10 border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-300"
            }`}
          >
            <Filter size={14} />
            <span>Filter{hasActiveFilter ? "s" : ""}</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${isFilterDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isFilterDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 dark:text-white">Filters</span>
                <button
                  onClick={() => setIsFilterDropdownOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}
                  className="w-full text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-2 py-1.5 rounded-lg border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as "all" | TaskPriority)}
                  className="w-full text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-2 py-1.5 rounded-lg border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                >
                  <option value="all">All</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Tag</label>
                <select
                  value={tagFilter || "all"}
                  onChange={(e) => setTagFilter(e.target.value === "all" ? "" : e.target.value)}
                  className="w-full text-xs bg-gray-50 dark:bg-black/15 text-gray-900 dark:text-white px-2 py-1.5 rounded-lg border border-gray-200/50 dark:border-white/10 outline-none focus:border-[#5C27FE]"
                >
                  <option value="all">All Tags</option>
                  {allTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setTagFilter("");
                }}
                className="w-full py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1 bg-white/50 dark:bg-black/10 border border-gray-200/50 dark:border-white/10 px-2 py-1 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | TaskStatus)}
            className="text-xs font-semibold bg-transparent border-none text-gray-700 dark:text-gray-300 outline-none pr-1"
          >
            <option value="all" className="bg-white dark:bg-[#1A1A2E]">
              All
            </option>
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

        <div className="hidden sm:flex items-center gap-1 bg-white/50 dark:bg-black/10 border border-gray-200/50 dark:border-white/10 px-2 py-1 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Priority</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as "all" | TaskPriority)}
            className="text-xs font-semibold bg-transparent border-none text-gray-700 dark:text-gray-300 outline-none pr-1"
          >
            <option value="all" className="bg-white dark:bg-[#1A1A2E]">
              All
            </option>
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

        <div className="hidden sm:flex items-center gap-1 bg-white/50 dark:bg-black/10 border border-gray-200/50 dark:border-white/10 px-2 py-1 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Tag</span>
          <div className="flex items-center gap-2">
            <Tag size={12} className="text-gray-400" />
            <select
              value={tagFilter || "all"}
              onChange={(e) => setTagFilter(e.target.value === "all" ? "" : e.target.value)}
              className="text-xs font-semibold bg-transparent border-none text-gray-700 dark:text-gray-300 outline-none pr-1"
            >
              <option value="all" className="bg-white dark:bg-[#1A1A2E]">
                All Tags
              </option>
              {allTags.map((tag) => (
                <option key={tag} value={tag} className="bg-white dark:bg-[#1A1A2E]">
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 bg-white/50 dark:bg-black/10 border border-gray-200/50 dark:border-white/10 px-2 py-1 rounded-lg">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Sort By</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs font-semibold bg-transparent border-none text-gray-700 dark:text-gray-300 outline-none pr-1"
          >
            <option value="dueDate" className="bg-white dark:bg-[#1A1A2E]">
              Due Date
            </option>
            <option value="priority" className="bg-white dark:bg-[#1A1A2E]">
              Priority
            </option>
            <option value="createdAt" className="bg-white dark:bg-[#1A1A2E]">
              Created
            </option>
            <option value="title" className="bg-white dark:bg-[#1A1A2E]">
              Title
            </option>
            <option value="status" className="bg-white dark:bg-[#1A1A2E]">
              Status
            </option>
          </select>
        </div>

        <button
          type="button"
          onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/50 dark:bg-black/10 border border-gray-200/50 dark:border-white/10 text-gray-700 dark:text-gray-300 text-xs font-bold"
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>
    </section>
  );
}
