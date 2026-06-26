import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, CheckCircle2, Coffee, Sparkles, ArrowLeft, RefreshCw, Trophy } from "lucide-react";

export default function FocusMode({ task, tasks = [], onComplete, onClose }) {
  const initialDuration = task.duration && task.duration > 0 ? task.duration * 60 : 25 * 60;
  const [timeLeft, setTimeLeft] = useState(initialDuration);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsFocused, setSecondsFocused] = useState(0);
  const [secondsElapsedTotal, setSecondsElapsedTotal] = useState(0);

  // Pomodoro motivation popup state
  const [motivationMessage, setMotivationMessage] = useState("");
  const [isMotivationOpen, setIsMotivationOpen] = useState(false);
  const [motivationCountdown, setMotivationCountdown] = useState(0);

  // Celebration state
  const [isCompletedState, setIsCompletedState] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");
  const [isCompletionLoading, setIsCompletionLoading] = useState(false);

  // Next task calculation
  const nextTask = tasks.find(t => !t.completed && t.id !== task.id);
  const nextTaskName = nextTask ? nextTask.taskName : "";

  // Interval reference
  const timerRef = useRef(null);

  // Main countdown tick
  useEffect(() => {
    if (isPaused || isCompletedState || isMotivationOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      setSecondsFocused(prev => prev + 1);
      setSecondsElapsedTotal(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isCompletedState, isMotivationOpen]);

  // Track 25-minute Pomodoro cycles
  useEffect(() => {
    if (secondsFocused > 0 && secondsFocused % (25 * 60) === 0) {
      // Trigger Pomodoro motivation Break
      triggerPomodoroMotivation();
    }
  }, [secondsFocused]);

  const triggerPomodoroMotivation = async () => {
    setIsPaused(true);
    setMotivationMessage("Loading motivation...");
    setIsMotivationOpen(true);
    setMotivationCountdown(10);

    try {
      const response = await fetch("/api/focus-motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskName: task.taskName })
      });
      if (response.ok) {
        const data = await response.json();
        setMotivationMessage(data.message || "You're making incredible progress! Keep pushing forward.");
      } else {
        setMotivationMessage("Keep going! You are doing amazing work.");
      }
    } catch (err) {
      setMotivationMessage("Stay focused! You're making great progress.");
    }
  };

  // Motivation Countdown auto-resume
  useEffect(() => {
    let interval = null;
    if (isMotivationOpen && motivationCountdown > 0) {
      interval = setInterval(() => {
        setMotivationCountdown(prev => prev - 1);
      }, 1000);
    } else if (isMotivationOpen && motivationCountdown === 0) {
      // Auto resume
      setIsMotivationOpen(false);
      setIsPaused(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMotivationOpen, motivationCountdown]);

  // Format helper for timer
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
  };

  // Format helper for actual duration spent
  const formatActualTimeSpent = (secs) => {
    if (secs < 60) {
      return `${secs} second${secs !== 1 ? "s" : ""}`;
    }
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return remainingSecs > 0 ? `${mins}m ${remainingSecs}s` : `${mins} min${mins !== 1 ? "s" : ""}`;
  };

  // Handle completion trigger
  const handleCompleteTask = async () => {
    setIsCompletedState(true);
    setIsCompletionLoading(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpentString = formatActualTimeSpent(secondsElapsedTotal);

    try {
      const response = await fetch("/api/focus-completion-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: task.taskName,
          actualTime: timeSpentString,
          nextTaskName: nextTaskName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCompletionMessage(data.message);
      } else {
        setCompletionMessage(`Outstanding! You completed "${task.taskName}" in ${timeSpentString}! ${nextTaskName ? `Next focus session: ${nextTaskName}` : "All tasks completed!"}`);
      }
    } catch (err) {
      setCompletionMessage(`Outstanding! You completed "${task.taskName}" in ${timeSpentString}! ${nextTaskName ? `Next up: ${nextTaskName}` : "All tasks completed!"}`);
    } finally {
      setIsCompletionLoading(false);
    }
  };

  const handleFinishAndReturn = () => {
    onComplete(task.id);
    onClose();
  };

  // Calculate progress percent
  const progressPercent = Math.min(100, Math.max(0, ((initialDuration - timeLeft) / initialDuration) * 100));

  return (
    <div id="focus-mode-viewport" className="fixed inset-0 bg-[#0B0F19] text-white flex flex-col items-center justify-between p-6 sm:p-10 z-50 animate-fadeIn select-none">
      {/* Immersive ambient animation effects */}
      <div className="absolute inset-0 bg-radial-at-t from-blue-600/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-10 left-10 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition bg-slate-900/60 hover:bg-slate-800 border border-slate-800 px-3 py-2 rounded-xl cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Focus Mode</span>
        </button>

        <div className="flex items-center gap-2 text-xs text-blue-400 font-bold bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/15">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span>IMMERSIVE MODE ACTIVE</span>
        </div>
      </div>

      {/* Main Focus Area */}
      {!isCompletedState ? (
        <div className="w-full max-w-2xl text-center space-y-10 z-10 flex-1 flex flex-col justify-center">
          <div className="space-y-4">
            <span className="text-xs text-[#3B82F6] font-bold uppercase tracking-widest bg-[#3B82F6]/10 px-3 py-1 rounded-full border border-[#3B82F6]/15">
              CURRENT FOCUS MISSION
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {task.taskName}
            </h1>
          </div>

          {/* Large countdown timer displaying hours/minutes/seconds */}
          <div className="space-y-2">
            <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 select-all leading-none">
              {formatTime(timeLeft)}
            </div>
            <p className="text-xs text-slate-500 font-semibold tracking-widest uppercase">
              Remaining of {task.duration || 25} minute session
            </p>
          </div>

          {/* Progress Bar with elegant layout and glow */}
          <div className="space-y-3">
            <div className="w-full h-3.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-blue-500/30"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 font-bold px-1">
              <span>{Math.round(progressPercent)}% COMPLETE</span>
              <span className="flex items-center gap-1">
                ⏱ {formatActualTimeSpent(secondsElapsedTotal)} spent focus time
              </span>
            </div>
          </div>

          {/* Interactive controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Pause / Play Trigger button */}
            <button
              id="btn-focus-pause"
              onClick={() => setIsPaused(!isPaused)}
              className={`p-4 px-6 rounded-2xl text-sm font-bold transition flex items-center gap-2 cursor-pointer border shadow-lg ${
                isPaused
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/20"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-100 border-slate-800"
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Resume Focus ⚡</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Take a Break ☕</span>
                </>
              )}
            </button>

            {/* Completion checkpoint button */}
            <button
              id="btn-focus-done"
              onClick={handleCompleteTask}
              className="p-4 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-sm transition flex items-center gap-2 cursor-pointer border border-blue-500/20 shadow-lg shadow-blue-500/10"
            >
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>I'm Done! ✅</span>
            </button>
          </div>
        </div>
      ) : (
        /* Immersive Task Completion/Celebration Slate */
        <div className="w-full max-w-xl text-center space-y-8 z-10 flex-1 flex flex-col justify-center animate-fadeIn">
          {/* Confetti Celebration visual icon wrapper */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-gradient-to-b from-amber-400/20 to-yellow-500/10 border border-amber-400/30 rounded-full text-amber-400 animate-bounce mb-2">
            <Trophy className="w-12 h-12" />
            <div className="absolute inset-0 bg-amber-400/5 rounded-full blur-md animate-ping" />
          </div>

          <div className="space-y-3">
            <span className="text-xs text-amber-400 font-extrabold tracking-widest bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/20 uppercase select-none">
              MISSION ACCOMPLISHED! 🎉
            </span>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Aesthetic Clarity Unlocked!
            </h1>
          </div>

          <div className="bg-[#111827]/80 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-w-lg mx-auto relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Gemini companion evaluation
            </span>
            {isCompletionLoading ? (
              <div className="flex items-center gap-3 text-sm text-slate-400 font-semibold py-4">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>AI is compiling your performance...</span>
              </div>
            ) : (
              <p className="text-sm font-semibold text-slate-200 leading-relaxed italic">
                "{completionMessage}"
              </p>
            )}
          </div>

          <button
            id="btn-focus-return"
            onClick={handleFinishAndReturn}
            className="p-4 px-10 bg-amber-500 hover:bg-amber-400 text-[#0F172A] font-black rounded-2xl text-sm tracking-tight transition shadow-lg cursor-pointer max-w-xs mx-auto w-full border border-amber-400/20"
          >
            Awesome, Return to Dashboard
          </button>
        </div>
      )}

      {/* Pomodoro break motivation Modal Popup */}
      {isMotivationOpen && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <div className="w-full max-w-md bg-[#131A2A] border border-blue-500/20 rounded-2xl shadow-2xl p-6 text-center text-white relative overflow-hidden">
            {/* Ambient blue background light */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />

            <div className="mx-auto w-12 h-12 bg-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20">
              <Coffee className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold tracking-tight text-white flex items-center justify-center gap-2">
              <span>Pomodoro Break Interval</span>
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            </h3>
            
            <p className="text-xs text-slate-400 mt-1 font-bold">
              FOCUS SUSPENDED FOR 10 SECONDS
            </p>

            <div className="my-5 p-4.5 bg-[#0F172A] rounded-xl border border-slate-800 text-left relative overflow-hidden">
              <div className="absolute top-0 bottom-0 left-0 w-1 bg-blue-500" />
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                Gemini's Motivation Spark
              </p>
              <p className="text-sm text-slate-200 font-medium italic leading-relaxed">
                "{motivationMessage}"
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs text-slate-500 font-semibold">
                Auto-resuming in <span className="text-white font-black">{motivationCountdown}s</span>
              </div>
              <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-1000 ease-linear" 
                  style={{ width: `${(motivationCountdown / 10) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-[10px] text-slate-600 font-mono select-none">
        FLOWMIND COMPANION FOCUS FRAME V1.0
      </div>
    </div>
  );
}
