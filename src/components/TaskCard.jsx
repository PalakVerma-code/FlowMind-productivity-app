import React from "react";
import { 
  Briefcase, 
  GraduationCap, 
  User, 
  DollarSign, 
  Calendar, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  Circle,
  Play
} from "lucide-react";

export default function TaskCard({ task, onToggleComplete, onDelete, onStartFocus }) {
  // Map categories to matching icons
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case "work":
        return <Briefcase className="w-4 h-4 text-violet-400" />;
      case "study":
        return <GraduationCap className="w-4 h-4 text-blue-400" />;
      case "personal":
        return <User className="w-4 h-4 text-emerald-400" />;
      case "finance":
        return <DollarSign className="w-4 h-4 text-amber-400" />;
      default:
        return <Briefcase className="w-4 h-4 text-slate-400" />;
    }
  };

  // Map priority strings directly to visually distinctive badge styles
  const getPriorityClasses = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "low":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-700";
    }
  };

  // Convert estimate duration integer value to smart strings
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return "Flexible / Not specified";
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  // Transform deadline string accurately to readable text
  const formatDeadline = (dateStr) => {
    if (!dateStr) return "Flexible / No specific deadline";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Flexible schedule";
      
      const formattedDate = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      
      const hours = date.getHours();
      const mins = date.getMinutes();
      
      // If time was not specified (defaults to midnight)
      if (hours === 0 && mins === 0 && dateStr.indexOf("T00:00:00") !== -1) {
        return formattedDate;
      }
      
      const formattedTime = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      
      return `${formattedDate} at ${formattedTime}`;
    } catch {
      return dateStr;
    }
  };

  const isHighPriority = task.priority?.toLowerCase() === "high";

  return (
    <div
      id={`task-card-${task.id}`}
      className={`relative bg-[#1E293B] rounded-xl border p-5 transition-all duration-300 hover:shadow-lg ${
        task.completed 
          ? "border-slate-800/80 opacity-55" 
          : isHighPriority 
          ? "border-rose-500/20 hover:border-rose-500/35 shadow-rose-950/5" 
          : "border-slate-800/80 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start gap-3.5 justify-between">
        {/* Toggle complete checkpoint */}
        <button
          id={`btn-toggle-${task.id}`}
          onClick={() => onToggleComplete(task.id)}
          className="mt-0.5 text-slate-400 hover:text-[#3B82F6] focus:outline-none transition cursor-pointer flex-shrink-0"
          title={task.completed ? "Mark incomplete" : "Mark complete"}
        >
          {task.completed ? (
            <CheckCircle2 className="w-[1.35rem] h-[1.35rem] text-[#3B82F6] fill-[#3B82F6]/10" />
          ) : (
            <Circle className="w-[1.35rem] h-[1.35rem] text-slate-500 hover:scale-110 duration-200" />
          )}
        </button>

        {/* Task details container */}
        <div className="flex-1 min-w-0">
          <h3
            id={`task-title-${task.id}`}
            className={`font-semibold text-base tracking-tight text-white line-clamp-2 break-words leading-snug transition-all ${
              task.completed ? "line-through text-slate-500" : ""
            }`}
          >
            {task.taskName}
          </h3>

          <div className="flex flex-wrap items-center gap-2 mt-3 select-none">
            {/* Category tag */}
            <div
              id={`task-category-${task.id}`}
              className="flex items-center gap-1.5 bg-slate-900/40 text-slate-300 text-xs px-2.5 py-1 rounded-lg border border-slate-800 font-medium"
            >
              {getCategoryIcon(task.category)}
              <span className="capitalize">{task.category || "work"}</span>
            </div>

            {/* Priority level indicator badge */}
            <span
              id={`task-priority-${task.id}`}
              className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${getPriorityClasses(
                task.priority
              )}`}
            >
              {task.priority || "medium"}
            </span>
          </div>

          {/* Timeline and duration section */}
          <div className="mt-4 pt-3.5 border-t border-slate-800/70 space-y-2 text-xs text-slate-400 select-none">
            {/* Calculated Deadline info block */}
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className={task.deadline && !task.completed ? "text-slate-300" : "text-slate-500"}>
                {formatDeadline(task.deadline)}
              </span>
            </div>

            {/* Human Estimated exertion duration */}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Est. Effort: {formatDuration(task.duration)}</span>
            </div>

            {task.calendarEventId && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-400 font-semibold select-none bg-emerald-500/5 py-1 px-2.5 rounded-lg border border-emerald-500/10 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Added to Calendar ✅</span>
              </div>
            )}

            {!task.completed && onStartFocus && (
              <button
                id={`btn-start-focus-${task.id}`}
                onClick={() => onStartFocus(task)}
                className="mt-3.5 w-full py-2 bg-[#3B82F6]/10 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white rounded-xl text-xs font-bold border border-[#3B82F6]/20 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>▶ Start</span>
              </button>
            )}
          </div>
        </div>

        {/* Delete operations handler */}
        <button
          id={`btn-delete-${task.id}`}
          onClick={() => onDelete(task.id)}
          className="p-1 px-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 focus:outline-none transition cursor-pointer flex-shrink-0"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
