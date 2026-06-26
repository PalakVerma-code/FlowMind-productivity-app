import React from "react";
import { AlertCircle } from "lucide-react";

export default function UrgentWarningModal({
  urgentWarnTask,
  onUpdateTaskStatus,
  onScheduleTasks,
  onClose,
  onNotifyProgress
}) {
  if (!urgentWarnTask) return null;

  return (
    <div id="urgent-warning-overlay" className="fixed inset-0 bg-[#020617]/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn text-slate-100">
      <div id="urgent-warning-modal" className="w-full max-w-md bg-[#1E293B] border-2 border-rose-500/35 rounded-3xl p-6 sm:p-8 shadow-2xl relative select-none">
        
        <div className="flex items-center gap-3 mb-4 text-center justify-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 text-rose-400">
            <AlertCircle className="w-6 h-6 animate-bounce" />
          </div>
        </div>
        
        <h2 className="text-xl font-extrabold text-white text-center tracking-tight leading-snug">
          Urgent Objective Warning!
        </h2>
        
        <p className="text-sm text-slate-300 text-center mt-3 leading-relaxed">
          The pending task <span className="text-rose-400 font-bold">"{urgentWarnTask.taskName}"</span> is due within 24 hours!
        </p>

        <div className="mt-5 p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs text-slate-400">
          <div className="flex justify-between items-center bg-[#0F172A] p-2.5 rounded-lg">
            <span>Objective Deadline:</span>
            <span className="font-bold text-slate-200">
              {new Date(urgentWarnTask.deadline).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center bg-[#0F172A] p-2.5 rounded-lg">
            <span>Priority:</span>
            <span className="font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-[10px]">
              {urgentWarnTask.priority || "high"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3.5 mt-6">
          <button
            id="btn-urgent-start"
            onClick={() => {
              onUpdateTaskStatus(urgentWarnTask.id, "in_progress");
              onNotifyProgress(`Focus sequence initiated: "${urgentWarnTask.taskName}" is in progress!`);
              onClose();
            }}
            className="flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-blue-600 active:scale-[0.98] text-white py-3 px-4 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/15 cursor-pointer transition select-none border-transparent"
          >
            <span>🚀 Start Now</span>
          </button>
          
          <button
            id="btn-urgent-reschedule"
            onClick={() => {
              onClose();
              onScheduleTasks();
            }}
            className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] border border-slate-800 text-slate-200 py-3 px-4 rounded-xl text-xs font-bold cursor-pointer transition select-none"
          >
            <span>🔄 Reschedule</span>
          </button>
        </div>

      </div>
    </div>
  );
}
