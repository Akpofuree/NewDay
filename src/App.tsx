import { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage";
import TaskDetailDrawer from "./components/TaskDetailDrawer";
import NewTaskModal from "./components/NewTaskModal";
import AnalyticsView from "./components/AnalyticsView";
import GoalsView from "./components/GoalsView";
import ChatView from "./components/ChatView";
import CalendarView from "./components/CalendarView";
import LogoLoader from "./components/animations/LogoLoader";
import MobileTopNav from "./components/MobileTopNav";
import MobileBottomDock from "./components/MobileBottomDock";
import DesktopSidebar from "./components/DesktopSidebar";
import NewGroupModal from "./components/NewGroupModal";
import MetricsRow from "./components/MetricsRow";
import FilterToolbar from "./components/FilterToolbar";
import TaskListView from "./components/TaskListView";
import KanbanView from "./components/KanbanView";
import SettingsView from "./components/SettingsView";
import TermsPage from "./components/TermsPage";
import PrivacyPage from "./components/PrivacyPage";
import useAppState from "./hooks/useAppState";
import useTaskHandlers from "./hooks/useTaskHandlers";
import useGroupHandlers from "./hooks/useGroupHandlers";
import { getCategorizedTasks, getListSections, getMetrics } from "./utils/taskFilters";
import { getGreeting, getUserLanguage } from "./utils/greeting";
import {
  List,
  LayoutGrid,
  ClipboardList,
  PieChart,
  Target,
  MessageSquare,
  X,
  Sparkles,
  Plus,
  Calendar,
} from "lucide-react";

const logoImage = new URL("./images/logo.png", import.meta.url).href;

export default function App() {
  const {
    users,
    currentUser,
    authChecked,
    groups,
    tasks,
    activeView,
    activeCategory,
    darkMode,
    goals,
    channels,
    chatMessages,
    searchQuery,
    statusFilter,
    priorityFilter,
    selectedTask,
    isDetailOpen,
    isNewTaskOpen,
    isNewGroupOpen,
    newGroupName,
    newGroupColor,
    newGroupDesc,
    mobileNavStyle,
    showLanding,
    authLoading,
    setCurrentUser,
    setGroups,
    setTasks,
    setActiveView,
    setActiveCategory,
    setDarkMode,
    setGoals,
    setChannels,
    setChatMessages,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    tagFilter,
    setTagFilter,
    setSelectedTask,
    setIsDetailOpen,
    setIsNewTaskOpen,
    setIsNewGroupOpen,
    setNewGroupName,
    setNewGroupColor,
    setNewGroupDesc,
    setMobileNavStyle,
    setShowLanding,
    handleLogout,
    syncWithServer,
    isRetryingConnections,
  } = useAppState();

  const {
    handleCreateTask,
    handleUpdateTask,
    handleDeleteTask,
    handleToggleComplete,
    handleUpdateStatus,
    handleDragStart,
    handleDragOver,
    handleDrop,
  } = useTaskHandlers({
    tasks,
    setTasks,
    selectedTask,
    setSelectedTask,
    setIsDetailOpen,
    currentUser,
  });

  const { handleCreateGroup } = useGroupHandlers({
    newGroupName,
    newGroupColor,
    newGroupDesc,
    currentUser,
    setGroups,
    setNewGroupName,
    setNewGroupDesc,
    setIsNewGroupOpen,
    setActiveCategory,
  });

  // First-time onboarding tooltip state
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (currentUser && authChecked) {
      const onboarded = localStorage.getItem("newday_onboarded");
      if (!onboarded) {
        setShowOnboarding(true);
      }
    }
  }, [currentUser, authChecked]);

  const handleDismissOnboarding = () => {
    localStorage.setItem("newday_onboarded", "true");
    setShowOnboarding(false);
  };

  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "createdAt" | "title" | "status">(
    () => {
      return (
        (localStorage.getItem("newday_sort_by") as
          | "dueDate"
          | "priority"
          | "createdAt"
          | "title"
          | "status") || "dueDate"
      );
    }
  );

  const [sortDir, setSortDir] = useState<"asc" | "desc">(() => {
    return (localStorage.getItem("newday_sort_dir") as "asc" | "desc") || "asc";
  });

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(() => new Set());
  const [isBulkMode, setIsBulkMode] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("newday_sort_by", sortBy);
  }, [sortBy]);

  useEffect(() => {
    localStorage.setItem("newday_sort_dir", sortDir);
  }, [sortDir]);

  // Escape key exits bulk mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsBulkMode(false);
        setSelectedTaskIds(new Set());
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Changing activeCategory should clear bulk mode
  useEffect(() => {
    setIsBulkMode(false);
    setSelectedTaskIds(new Set());
  }, [activeCategory]);

  const onToggleSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const categorizedTasks = getCategorizedTasks(
    tasks,
    activeCategory,
    currentUser,
    searchQuery,
    statusFilter,
    priorityFilter,
    tagFilter,
    sortBy,
    sortDir,
    activeView
  );

  const allTags = Array.from(new Set(tasks.flatMap((task) => task.tags || []))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  const sections = getListSections(categorizedTasks);
  const metrics = getMetrics(tasks);
  const currentCategoryObj = groups.find((g) => g.id === activeCategory);
  const [greetingLanguage] = useState(() => getUserLanguage());
  const [greetingNow, setGreetingNow] = useState(() => new Date());
  const [currentPath, setCurrentPath] = useState(() =>
    typeof window === "undefined" ? "/" : window.location.pathname
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setGreetingNow(new Date());
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const greeting =
    currentUser &&
    getGreeting({
      name: currentUser.name.split(" ").filter(Boolean)[0] || currentUser.name,
      language: greetingLanguage,
      timezone: currentUser.timezone,
      now: greetingNow,
    });

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const exitLegalPage = () => {
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", "/");
      setCurrentPath("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (currentPath === "/terms") {
    return <TermsPage darkMode={darkMode} onBack={exitLegalPage} />;
  }

  if (currentPath === "/privacy") {
    return <PrivacyPage darkMode={darkMode} onBack={exitLegalPage} />;
  }

  if (!authChecked) {
    return (
      <div className="min-h-screen w-full grid place-items-center bg-[#FAFBFD] text-gray-500 text-sm font-semibold">
        <div className="space-y-4 p-6 rounded-3xl bg-white/90 shadow-xl shadow-slate-200/60 dark:bg-slate-950/95 dark:shadow-black/30">
          <LogoLoader />
          <div className="text-center text-sm text-slate-500 dark:text-slate-300">
            Loading workspace...
          </div>
        </div>
      </div>
    );
  }

  if (showLanding || !currentUser) {
    return (
      <LandingPage
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setShowLanding(false);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onEnterDashboard={() => setShowLanding(false)}
      />
    );
  }

  const getCategoryTitle = () => {
    if (activeCategory === "today") return "Today's Focus";
    if (activeCategory === "calendar") return "Calendar View";
    if (activeCategory === "my_tasks") return "My Work Desk";
    if (activeCategory === "completed") return "Completed Workspace Archive";
    if (activeCategory === "analytics") return "Team Analytics Insights";
    if (activeCategory === "goals") return "Strategic Goals & Milestones";
    if (activeCategory === "chat") return "Synergy Chat Desk";
    if (activeCategory === "settings") return "Settings";
    const grp = groups.find((g) => g.id === activeCategory);
    return grp ? grp.name : "Workspace";
  };

  return (
    <div className="min-h-screen w-full relative gradient-bg text-gray-900 dark:text-gray-100 font-sans selection:bg-[#5C27FE]/20 flex flex-col md:flex-row pb-24 md:pb-0">
      {authLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/85 backdrop-blur-sm px-4 py-8">
          <div className="w-full max-w-sm rounded-[32px] bg-slate-900/95 p-6 shadow-2xl shadow-black/40 border border-white/10">
            <LogoLoader />
            <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-slate-300">
              Signing out of workspace...
            </p>
          </div>
        </div>
      )}

      {isRetryingConnections && (
        <div className="fixed top-6 right-6 z-60 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
          Connection issues — retrying...
        </div>
      )}

      <div className="absolute top-10 left-10 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#5C27FE]/15 to-[#0EA5E9]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-72 h-72 sm:w-[450px] sm:h-[450px] rounded-full bg-gradient-to-tr from-[#FF4D4D]/10 to-[#FFB020]/10 blur-3xl pointer-events-none" />

      <MobileTopNav
        logoImage={logoImage}
        mobileNavStyle={mobileNavStyle}
        setMobileNavStyle={setMobileNavStyle}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        metrics={metrics}
        groups={groups}
        setIsNewGroupOpen={setIsNewGroupOpen}
        handleLogout={handleLogout}
        scrollToTop={scrollToTop}
      />

      <DesktopSidebar
        logoImage={logoImage}
        scrollToTop={scrollToTop}
        setIsNewTaskOpen={setIsNewTaskOpen}
        groups={groups}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        metrics={metrics}
        setIsNewGroupOpen={setIsNewGroupOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        tasks={tasks}
        handleLogout={handleLogout}
      />

      <main
        className={`flex-1 min-w-0 ${activeCategory === "chat" ? "w-full max-w-none mx-0" : "max-w-[1020px] mx-auto"} flex flex-col space-y-6 ${
          activeCategory === "chat" ? "px-1 sm:px-2 md:px-6 py-4 md:py-8" : "px-6 py-8"
        }`}
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-xs font-semibold text-[#5C27FE] dark:text-[#a085ff] tracking-wide uppercase">
              {currentCategoryObj ? "Project Category Details" : "Desk dashboard"}
            </p>
            <h2 className="font-sora font-extrabold text-2xl text-gray-900 dark:text-white flex items-center gap-2 mt-0.5">
              {getCategoryTitle()}
              {currentCategoryObj && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentCategoryObj.color }}
                />
              )}
            </h2>
            {currentCategoryObj?.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                {currentCategoryObj.description}
              </p>
            )}
            {activeCategory === "today" && (
              <p className="text-xs text-gray-900 dark:text-white mt-1">
                {greeting || `Good morning, ${currentUser.name}`}. Let's make today remarkably
                cohesive.
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 bg-white/50 dark:bg-[#1A1A2E]/50 border border-gray-200/50 dark:border-white/5 p-1 rounded-xl self-start md:self-center backdrop-blur-md">
            <button
              onClick={() => setActiveView("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${activeView === "list" ? "bg-[#5C27FE] text-white shadow-xs" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"}`}
              title="See all tasks as a simple list"
            >
              <List size={13} />
              <span>List View</span>
            </button>
            <button
              onClick={() => setActiveView("kanban")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${activeView === "kanban" ? "bg-[#5C27FE] text-white shadow-xs" : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"}`}
              title="Visualize tasks as cards across status columns"
            >
              <LayoutGrid size={13} />
              <span>Board View</span>
            </button>
          </div>
        </header>

        {activeCategory === "analytics" ? (
          <AnalyticsView tasks={tasks} goals={goals} users={users} groups={groups} />
        ) : activeCategory === "calendar" ? (
          <CalendarView
            tasks={tasks}
            darkMode={darkMode}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setIsDetailOpen(true);
            }}
            onQuickCreate={(dueDate) => {
              setIsNewTaskOpen(true);
            }}
          />
        ) : activeCategory === "goals" ? (
          <GoalsView
            goals={goals}
            setGoals={setGoals}
            tasks={tasks}
            onOpenTaskDetails={(t) => {
              setSelectedTask(t);
              setIsDetailOpen(true);
            }}
          />
        ) : activeCategory === "chat" ? (
          <ChatView
            groups={groups}
            channels={channels}
            setChannels={setChannels}
            chatMessages={chatMessages}
            setChatMessages={setChatMessages}
            currentUser={currentUser}
            users={users}
            tasks={tasks}
            setSelectedTask={setSelectedTask}
            setIsDetailOpen={setIsDetailOpen}
          />
        ) : activeCategory === "settings" ? (
          <SettingsView
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            groups={groups}
            setGroups={setGroups}
            channels={channels}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
            setIsNewGroupOpen={setIsNewGroupOpen}
            syncWithServer={syncWithServer}
            handleLogout={handleLogout}
          />
        ) : (
          <>
            {activeCategory === "today" && <MetricsRow metrics={metrics} />}

            <FilterToolbar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              priorityFilter={priorityFilter}
              setPriorityFilter={setPriorityFilter}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
              allTags={allTags}
              sortBy={sortBy}
              setSortBy={setSortBy}
              sortDir={sortDir}
              setSortDir={setSortDir}
              isBulkMode={isBulkMode}
              setIsBulkMode={setIsBulkMode}
              selectedTaskIds={selectedTaskIds}
              setSelectedTaskIds={setSelectedTaskIds}
              visibleTaskIds={categorizedTasks.map((t) => t.id)}
            />

            {categorizedTasks.length === 0 ? (
              <div className="p-12 rounded-2xl glass-card text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5C27FE]/10 to-[#0EA5E9]/10 flex items-center justify-center text-[#5C27FE]">
                  <Sparkles size={28} />
                </div>
                <div className="max-w-sm space-y-2">
                  <h4 className="font-sora font-extrabold text-base text-gray-900 dark:text-white">
                    You're all set up — let's add your first task
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    Create a task, assign it to yourself, and track it here
                  </p>
                </div>
                <button
                  onClick={() => setIsNewTaskOpen(true)}
                  className="px-6 py-3 rounded-xl bg-[#5C27FE] hover:bg-[#4a1ee3] text-white text-xs font-bold inline-flex items-center gap-2 transition-all shadow-md shadow-[#5C27FE]/20 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Create your first task</span>
                </button>
                <div className="flex items-center gap-6 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Calendar size={11} />
                    <span>Today</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <LayoutGrid size={11} />
                    <span>Board</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Target size={11} />
                    <span>Goals</span>
                  </div>
                </div>
              </div>
            ) : activeView === "list" ? (
              <TaskListView
                sections={sections}
                users={users}
                groups={groups}
                setSelectedTask={setSelectedTask}
                setIsDetailOpen={setIsDetailOpen}
                handleUpdateStatus={handleUpdateStatus}
                handleToggleComplete={handleToggleComplete}
                handleDeleteTask={handleDeleteTask}
                isBulkMode={isBulkMode}
                selectedTaskIds={selectedTaskIds}
                onToggleSelect={onToggleSelect}
              />
            ) : (
              <KanbanView
                categorizedTasks={categorizedTasks}
                users={users}
                groups={groups}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                setSelectedTask={setSelectedTask}
                setIsDetailOpen={setIsDetailOpen}
                handleUpdateStatus={handleUpdateStatus}
                handleToggleComplete={handleToggleComplete}
                handleDeleteTask={handleDeleteTask}
                setStatusFilter={setStatusFilter}
                setIsNewTaskOpen={setIsNewTaskOpen}
                isBulkMode={isBulkMode}
                selectedTaskIds={selectedTaskIds}
                onToggleSelect={onToggleSelect}
              />
            )}
          </>
        )}
      </main>

      {/* Bulk Action Bar */}
      {selectedTaskIds.size > 0 && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-[#0F0F18]/95 border border-gray-200/40 dark:border-white/5 rounded-full px-3 py-2 flex items-center gap-2 shadow-lg">
          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F3F0FF] text-[#5C27FE]">
            {selectedTaskIds.size} selected
          </div>
          <button
            onClick={async () => {
              const ids = Array.from(selectedTaskIds);
              await Promise.all(ids.map((id) => handleUpdateStatus(id, "completed")));
              setSelectedTaskIds(new Set());
              setIsBulkMode(false);
            }}
            className="px-3 py-1 text-xs bg-[#5C27FE] text-white rounded-full font-semibold"
          >
            Mark Complete
          </button>

          <button
            onClick={async () => {
              const ids = Array.from(selectedTaskIds);
              await Promise.all(ids.map((id) => handleUpdateStatus(id, "pending")));
              setSelectedTaskIds(new Set());
              setIsBulkMode(false);
            }}
            className="px-3 py-1 text-xs bg-gray-100 dark:bg-white/5 rounded-full font-semibold"
          >
            Mark Pending
          </button>

          <button
            onClick={async () => {
              if (!confirm(`Delete ${selectedTaskIds.size} tasks?`)) return;
              const ids = Array.from(selectedTaskIds);
              await Promise.all(ids.map((id) => handleDeleteTask(id)));
              setSelectedTaskIds(new Set());
              setIsBulkMode(false);
            }}
            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded-full font-semibold"
          >
            Delete Selected
          </button>
        </div>
      )}

      <TaskDetailDrawer
        isOpen={isDetailOpen}
        task={selectedTask}
        users={users}
        groups={groups}
        currentUser={currentUser}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        handleToggleComplete={handleToggleComplete}
      />

      <NewTaskModal
        isOpen={isNewTaskOpen}
        onClose={() => setIsNewTaskOpen(false)}
        onCreateTask={handleCreateTask}
        users={users}
        groups={groups}
        activeGroupId={activeCategory.startsWith("group_") ? activeCategory : undefined}
      />

      {isNewGroupOpen && (
        <NewGroupModal
          isNewGroupOpen={isNewGroupOpen}
          setIsNewGroupOpen={setIsNewGroupOpen}
          newGroupName={newGroupName}
          setNewGroupName={setNewGroupName}
          newGroupColor={newGroupColor}
          setNewGroupColor={setNewGroupColor}
          newGroupDesc={newGroupDesc}
          setNewGroupDesc={setNewGroupDesc}
          handleCreateGroup={handleCreateGroup}
        />
      )}

      <MobileBottomDock
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        setIsNewTaskOpen={setIsNewTaskOpen}
        chatMessages={chatMessages}
      />

      {showOnboarding && (
        <div className="fixed bottom-20 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-96 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#5C27FE]/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-[#5C27FE]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    Welcome to NewDay!
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Quick navigation guide:
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismissOnboarding}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-[#5C27FE]" />
                <span>
                  <strong>Today</strong> — Your tasks due today
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                <span>
                  <strong>Desk</strong> — All your assigned tasks
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <div className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D]" />
                <span>
                  <strong>Goals</strong> — Your personal and team goals
                </span>
              </div>
            </div>
            <button
              onClick={handleDismissOnboarding}
              className="w-full py-2 rounded-lg bg-[#5C27FE] hover:bg-[#4a1ee3] text-white text-xs font-bold transition-all cursor-pointer"
            >
              Got it, let's start!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
