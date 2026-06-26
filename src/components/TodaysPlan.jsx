import React from "react";
import { Clock, Play, CheckCircle, RefreshCcw, Sparkles, MessageSquare, AlertCircle, Sun, CloudRain, Moon } from "lucide-react";

export default function TodaysPlan({ tasks, onUpdateTaskStatus, onScheduleTasks, isScheduling, settings, isCalendarConnected, mockBusySlots, onStartFocus }) {
  
  // Filter only tasks that are scheduled and scheduled for today
  const getTodayDateString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };

  const todayStr = getTodayDateString();
  
  const todayTasks = tasks.filter(t => {
    if (!t.scheduledTime) return false;
    if (t.scheduledDate) {
      return t.scheduledDate.startsWith(todayStr);
    }
    return true; // fallback
  });

  // Calculate statistics
  const totalCount = todayTasks.length;
  const completedCount = todayTasks.filter(t => t.completed || t.status === "completed").length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Classify times into morning, afternoon, evening
  const getTimelineSegment = (timeStr) => {
    if (!timeStr) return "evening";
    const [h] = timeStr.split(":").map(Number);
    const hour = h || 0;
    if (hour < 12) return "morning";
    if (hour < 17) return "afternoon";
    return "evening";
  };

  const morningTasks = todayTasks.filter(t => getTimelineSegment(t.scheduledTime) === "morning").sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const afternoonTasks = todayTasks.filter(t => getTimelineSegment(t.scheduledTime) === "afternoon").sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const eveningTasks = todayTasks.filter(t => getTimelineSegment(t.scheduledTime) === "evening").sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const formatDurationText = (minutes) => {
    if (!minutes) return "30m";
    if (minutes < 60) return `${minutes} mins`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Re-trigger scheduling toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-[#1E293B] border border-slate-800 rounded-2xl">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Scheduler</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            Aligns unscheduled workspace objectives into free slots matching sleep patterns: {settings?.wakeTime || "07:00"} to {settings?.sleepTime || "22:00"}.
          </p>
          {!isCalendarConnected && (
            <p className="text-[11px] text-amber-400 font-semibold mt-2.5 flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 p-1.5 px-3 rounded-lg w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Connect Calendar to auto-block time</span>
            </p>
          )}

          {isCalendarConnected && mockBusySlots && mockBusySlots.length > 0 && (
            <div id="detected-busy-times" className="mt-4 pt-3.5 border-t border-slate-800/80">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider block mb-2">
                📅 Detected busy times (AI avoids these slots):
              </span>
              <div className="flex flex-wrap gap-2">
                {mockBusySlots.map((slot, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 text-rose-300 text-[11px] font-semibold rounded-lg border border-rose-500/15">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-rose-200">{slot.title || slot.label}:</span> {slot.start || slot.startTime} - {slot.end || slot.endTime}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          id="btn-re-run-schedule"
          onClick={onScheduleTasks}
          disabled={isScheduling}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/15 cursor-pointer transition focus:outline-none"
        >
          {isScheduling ? (
            <>
              <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Optimizing Slots...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Schedule My Day</span>
              {isCalendarConnected && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-500/30 ml-1.5 font-extrabold tracking-wide">
                  Synced 🔄
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Progress Card */}
      <div id="timeline-progress-card" className="bg-[#1E293B] border border-slate-800 p-5 sm:p-6 rounded-2xl relative overflow-hidden shadow-lg">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Today's Focus Status</span>
            <span className="text-lg font-extrabold text-white">
              {completedCount} of {totalCount} tasks completed today
            </span>
          </div>
          <span className="text-sm font-bold text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            {progressPercent}% Done
          </span>
        </div>

        {/* Real Progress Bar */}
        <div className="w-full bg-[#0F172A] rounded-full h-3.5 overflow-hidden border border-slate-800/60">
          <div 
            className="bg-gradient-to-r from-blue-500 to-[#3B82F6] h-full rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Empty State warning if no schedules exists */}
      {todayTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#1E293B]/20 rounded-2xl border border-dashed border-slate-800 text-center">
          <div className="p-4 bg-slate-900/40 rounded-full mb-3.5">
            <Sparkles className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-slate-300">No scheduled agenda today</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
            Click the "Schedule My Tasks" button above to dynamically organize all pending task queue items into available timeframes today.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 1. MORNING SEGMENT */}
          <div id="timeline-segment-morning" className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-1 border-b border-slate-800/80">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>🌅 Morning</span>
              <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 p-0.5 px-2 rounded-full">
                {morningTasks.length}
              </span>
            </h4>
            
            {morningTasks.length === 0 ? (
              <p className="text-xs text-slate-600 italic pl-1">No tasks scheduled for the morning.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {morningTasks.map(task => (
                  <TimelineTaskCard key={task.id} task={task} onUpdateStatus={onUpdateTaskStatus} formatDuration={formatDurationText} onStartFocus={onStartFocus} />
                ))}
              </div>
            )}
          </div>

          {/* 2. AFTERNOON SEGMENT */}
          <div id="timeline-segment-afternoon" className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-1 border-b border-slate-800/80">
              <Sun className="w-3.5 h-3.5 text-orange-400 animate-pulse" style={{ animationDuration: '6s' }} />
              <span>☀️ Afternoon</span>
              <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 p-0.5 px-2 rounded-full">
                {afternoonTasks.length}
              </span>
            </h4>
            
            {afternoonTasks.length === 0 ? (
              <p className="text-xs text-slate-600 italic pl-1">No tasks scheduled for the afternoon.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {afternoonTasks.map(task => (
                  <TimelineTaskCard key={task.id} task={task} onUpdateStatus={onUpdateTaskStatus} formatDuration={formatDurationText} onStartFocus={onStartFocus} />
                ))}
              </div>
            )}
          </div>

          {/* 3. EVENING SEGMENT */}
          <div id="timeline-segment-evening" className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pb-1 border-b border-slate-800/80">
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Evening Agenda</span>
              <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 p-0.5 px-2 rounded-full">
                {eveningTasks.length}
              </span>
            </h4>
            
            {eveningTasks.length === 0 ? (
              <p className="text-xs text-slate-600 italic pl-1">No tasks scheduled for the evening.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {eveningTasks.map(task => (
                  <TimelineTaskCard key={task.id} task={task} onUpdateStatus={onUpdateTaskStatus} formatDuration={formatDurationText} onStartFocus={onStartFocus} />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// Inner TimelineTaskCard component
function TimelineTaskCard({ task, onUpdateStatus, formatDuration, onStartFocus }) {
  const isPending = !task.status || task.status === "pending";
  const isInProgress = task.status === "in_progress";
  const isCompleted = task.status === "completed" || task.completed;

  return (
    <div id={`timeline-card-${task.id}`} className="bg-[#1E293B] border border-slate-800/80 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-700">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Time and duration banner */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#3B82F6]/10 text-[#3B82F6] font-bold text-xs rounded-md border border-[#3B82F6]/20">
            <Clock className="w-3 h-3" />
            <span>{task.scheduledTime}</span>
          </span>
          <span className="text-[10px] text-slate-400 tracking-wide bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
            Effort: {formatDuration(task.duration)}
          </span>
          {/* Priority flag */}
          <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
            task.priority === "high" 
              ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
              : task.priority === "low"
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }`}>
            {task.priority || "medium"}
          </span>
          {task.calendarEventId && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 font-extrabold text-[10px] rounded border border-emerald-500/20 select-none animate-fadeIn">
              📅 Blocked on Calendar
            </span>
          )}
        </div>

        <h4 className={`text-[15px] font-bold text-white tracking-tight leading-tight truncate ${isCompleted ? 'line-through text-slate-500' : ''}`}>
          {task.taskName}
        </h4>

        {/* AI Explain line */}
        {task.scheduledReason && (
          <p className="text-[11px] text-slate-400 leading-relaxed font-medium bg-[#0F172A]/40 p-2 rounded-lg border border-slate-800/40 flex items-start gap-1">
            <MessageSquare className="w-3 h-3 text-[#3B82F6] mt-0.5 flex-shrink-0" />
            <span className="italic">"{task.scheduledReason}"</span>
          </p>
        )}
      </div>

      {/* Control Segment Status Buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0 select-none">
        
        {/* Focus Start Now button */}
        {!isCompleted && onStartFocus && (
          <button
            id={`btn-timeline-focus-${task.id}`}
            onClick={() => onStartFocus(task)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-bold bg-[#3B82F6] hover:bg-blue-500 text-white transition text-center cursor-pointer shadow-md"
            title="Start Immersive Focus Mode"
          >
            <span>▶ Start</span>
          </button>
        )}

        {/* Pending button */}
        <button
          id={`btn-status-pending-${task.id}`}
          onClick={() => onUpdateStatus(task.id, "pending")}
          className={`flex items-center gap-1 p-2 px-3 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
            isPending 
              ? "bg-slate-800 text-[#3B82F6] border-[#3B82F6]/30" 
              : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
          }`}
          title="Mark Pending"
        >
          <span>⏸</span>
          <span>Pending</span>
        </button>

        {/* In Progress button */}
        <button
          id={`btn-status-progress-${task.id}`}
          onClick={() => onUpdateStatus(task.id, "in_progress")}
          className={`flex items-center gap-1 p-2 px-3 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
            isInProgress 
              ? "bg-blue-500/20 text-[#3B82F6] border-[#3B82F6]" 
              : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
          }`}
          title="Mark In Progress"
        >
          <span>⏳</span>
          <span>In Progress</span>
        </button>

        {/* Done status button toggle */}
        <button
          id={`btn-status-done-${task.id}`}
          onClick={() => onUpdateStatus(task.id, "completed")}
          className={`flex items-center gap-1 p-2 px-3 rounded-lg text-xs font-semibold border transition text-center cursor-pointer ${
            isCompleted 
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" 
              : "bg-transparent text-slate-400 border-transparent hover:text-slate-200"
          }`}
          title="Mark Completed"
        >
          <span>✅</span>
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
