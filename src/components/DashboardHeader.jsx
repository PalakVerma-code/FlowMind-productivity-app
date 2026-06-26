import React from "react";
import { Sparkles, Calendar, Settings, LogOut } from "lucide-react";

export default function DashboardHeader({
  profile,
  calendarToken,
  calendarName,
  handleConnectCalendar,
  handleDisconnectCalendar,
  setIsFreeTimeSetupOpen,
  handleResetWorkspace,
  onProfileReset
}) {
  return (
    <header className="relative border-b border-slate-800/80 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-40 select-none">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#3B82F6] rounded-lg shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block leading-none">
              Flow<span className="text-[#3B82F6]">Mind</span>
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 block">
              {profile?.type || "Professional"} Companion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          
          {!calendarToken ? (
            <button
              id="btn-connect-calendar"
              onClick={handleConnectCalendar}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg cursor-pointer transition focus:outline-none shadow-sm font-semibold"
              title="Connect Google Calendar to auto-block focus slots"
            >
              <Calendar className="w-3.5 h-3.5 animate-pulse" />
              <span>Connect Google Calendar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold select-none">
              <span className="max-w-[150px] truncate" title="Calendar Connected">
                📅 Calendar Connected ✅
              </span>
              <button
                id="btn-disconnect-calendar"
                onClick={handleDisconnectCalendar}
                className="ml-1 p-0.5 text-rose-400 hover:bg-rose-500/20 rounded cursor-pointer transition font-bold leading-none"
                title="Disconnect calendar"
              >
                ✕
              </button>
            </div>
          )}

          <button
            id="btn-schedule-settings"
            onClick={() => setIsFreeTimeSetupOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg cursor-pointer transition focus:outline-none border border-transparent hover:border-[#3B82F6]/20"
            title="Edit wake/sleep time and busy periods"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Schedule Settings</span>
          </button>
           
          <button
            id="btn-workspace-reset"
            onClick={() => handleResetWorkspace(onProfileReset)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition focus:outline-none"
            title="Reset profile and clear storage"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Workspace</span>
          </button>
        </div>

      </div>
    </header>
  );
}
