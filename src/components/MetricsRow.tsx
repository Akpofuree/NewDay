import type { Metrics } from "../utils/taskFilters";

type MetricsRowProps = {
  metrics: Metrics;
};

export default function MetricsRow({ metrics }: MetricsRowProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 rounded-xl glass-card text-left relative overflow-hidden border-l-4 border-l-[#5C27FE]">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#5C27FE]/5 rounded-full blur-md pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Total Workspace Tasks
        </p>
        <h3 className="font-sora font-black text-2xl text-gray-900 dark:text-white mt-1">
          {metrics.total}
        </h3>
        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
          <span>Active coordinates</span>
        </p>
      </div>

      <div className="p-4 rounded-xl glass-card text-left relative overflow-hidden border-l-4 border-l-[#00C48C]">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#00C48C]/5 rounded-full blur-md pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Completed Today
        </p>
        <h3 className="font-sora font-black text-2xl text-[#00C48C] mt-1">
          {metrics.completedToday}
        </h3>
        <p className="text-[10px] text-gray-500 mt-1">Archived in index</p>
      </div>

      <div className="p-4 rounded-xl glass-card text-left relative overflow-hidden border-l-4 border-l-[#0EA5E9]">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#0EA5E9]/5 rounded-full blur-md pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Active In Progress
        </p>
        <h3 className="font-sora font-black text-2xl text-[#0EA5E9] mt-1">
          {metrics.inProgress}
        </h3>
        <p className="text-[10px] text-gray-500 mt-1">
          Under current execution
        </p>
      </div>

      <div className="p-4 rounded-xl glass-card text-left relative overflow-hidden border-l-4 border-l-[#FF4D4D]">
        <div className="absolute top-0 right-0 w-16 h-16 bg-[#FF4D4D]/5 rounded-full blur-md pointer-events-none" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#FF4D4D]">
          Overdue Alerts
        </p>
        <h3 className="font-sora font-black text-2xl text-[#FF4D4D] mt-1">
          {metrics.overdue}
        </h3>
        <p className="text-[10px] text-[#FF4D4D]/85 mt-1 font-semibold">
          Requires immediate trace
        </p>
      </div>

      {metrics.totalTodayTasks > 0 && (
        <div className="col-span-2 lg:col-span-4 p-3.5 rounded-xl bg-white dark:bg-[#1C1C30]/50 border border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div className="text-xs">
            <span className="font-bold text-gray-900 dark:text-white">
              Workspace Completion Progress:
            </span>
            <span className="text-gray-500 ml-1.5">
              You've completed{" "}
              <span className="text-[#00C48C] font-semibold">
                {metrics.completedTodayTasks}
              </span>{" "}
              of your{" "}
              <span className="font-semibold">{metrics.totalTodayTasks}</span>{" "}
              target today constraints.
            </span>
          </div>
          <div className="w-full sm:w-48 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-gradient-to-r from-[#00C48C] to-[#0ea5e9] rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (metrics.completedTodayTasks / metrics.totalTodayTasks) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
