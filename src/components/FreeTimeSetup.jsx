import React, { useState } from "react";
import { Clock, Plus, Trash2, ShieldCheck, ArrowRight, CornerRightDown } from "lucide-react";

export default function FreeTimeSetup({ onSave, initialSettings }) {
  const [wakeTime, setWakeTime] = useState(initialSettings?.wakeTime || "07:00");
  const [sleepTime, setSleepTime] = useState(initialSettings?.sleepTime || "22:00");
  
  // Busy slots local state
  const [busySlots, setBusySlots] = useState(initialSettings?.busySlots || [
    { id: "def-1", label: "Work Sync Meeting", startTime: "09:00", endTime: "10:30" },
    { id: "def-2", label: "Lunch Break", startTime: "12:00", endTime: "13:00" }
  ]);
  
  // New busy slot input fields
  const [newLabel, setNewLabel] = useState("");
  const [newStart, setNewStart] = useState("14:00");
  const [newEnd, setNewEnd] = useState("15:00");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddBusySlot = (e) => {
    e.preventDefault();
    if (!newLabel.trim()) {
      setErrorMsg("Please specify a label or purpose for the busy period.");
      return;
    }
    if (!newStart || !newEnd) {
      setErrorMsg("Please complete start and end times.");
      return;
    }
    if (newStart >= newEnd) {
      setErrorMsg("Start time must be before the end time.");
      return;
    }

    setErrorMsg("");
    const newSlot = {
      id: "busy-" + Math.random().toString(36).substring(2, 6) + Date.now(),
      label: newLabel.trim(),
      startTime: newStart,
      endTime: newEnd
    };

    setBusySlots([...busySlots, newSlot]);
    setNewLabel("");
  };

  const handleDeleteBusySlot = (id) => {
    setBusySlots(busySlots.filter(s => s.id !== id));
  };

  const handleSaveAll = () => {
    if (wakeTime >= sleepTime) {
      setErrorMsg("Wake time must occur before sleep time.");
      return;
    }
    
    setErrorMsg("");
    const settings = {
      wakeTime,
      sleepTime,
      busySlots
    };
    onSave(settings);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-6 select-none">
      <div id="freetime-setup-card" className="w-full max-w-xl bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-800 p-6 sm:p-8 text-white relative">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 bg-[#3B82F6] rounded-xl">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">Phase 2 Integration</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
          Free Time Setup
        </h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          Define your focus schedule block. FlowMind uses these bounds to align your daily tasks around meetings, courses, and rest periods.
        </p>

        <div className="space-y-6">
          {/* Day boundary pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label id="lbl-wake-time" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                🌅 Wake Up Time
              </label>
              <input
                id="input-wake-time"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-[#0F172A] text-white border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition"
              />
            </div>
            <div>
              <label id="lbl-sleep-time" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                🌌 Sleep Time
              </label>
              <input
                id="input-sleep-time"
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
                className="w-full bg-[#0F172A] text-white border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#3B82F6] transition"
              />
            </div>
          </div>

          {/* Add busy slots segment */}
          <div className="border-t border-slate-800/80 pt-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
              <CornerRightDown className="w-4 h-4 text-[#3B82F6]" />
              <span>Define Busy Lockouts (Classes, Meetings, Travel)</span>
            </h3>

            {/* List of current added slots */}
            <div className="space-y-2 mb-4 max-h-[170px] overflow-y-auto pr-1">
              {busySlots.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No locked busy slots configured yet. Feel free to add some below.</p>
              ) : (
                busySlots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between bg-[#0F172A]/50 border border-slate-800 p-3 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{slot.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5">
                        {slot.startTime} to {slot.endTime}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBusySlot(slot.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 hover:bg-slate-800/40 rounded-lg cursor-pointer transition focus:outline-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add busy slot form */}
            <div className="bg-[#0F172A]/40 p-4 border border-slate-800 rounded-xl space-y-3">
              <div>
                <input
                  id="input-busy-label"
                  type="text"
                  placeholder="e.g. Chemistry Workshop"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="w-full bg-[#0F172A] text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">Start Time</span>
                  <input
                    id="input-busy-start"
                    type="time"
                    value={newStart}
                    onChange={(e) => setNewStart(e.target.value)}
                    className="w-full bg-[#0F172A] text-white border border-slate-700 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] text-slate-400 mb-1 uppercase font-semibold">End Time</span>
                  <input
                    id="input-busy-end"
                    type="time"
                    value={newEnd}
                    onChange={(e) => setNewEnd(e.target.value)}
                    className="w-full bg-[#0F172A] text-white border border-slate-700 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    id="btn-add-busy-period"
                    type="button"
                    onClick={handleAddBusySlot}
                    className="h-[34px] px-3 bg-[#3B82F6]/10 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white rounded-lg text-xs font-bold border border-[#3B82F6]/20 hover:border-transparent transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {errorMsg && (
            <p id="freetime-error" className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl text-center font-medium">
              {errorMsg}
            </p>
          )}

          {/* CTA Submit */}
          <button
            id="btn-save-freetime-settings"
            onClick={handleSaveAll}
            className="w-full flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-[#3B82F6]/10 hover:shadow-[#3B82F6]/20 transition cursor-pointer select-none"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Apply Free Time Schedule</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
