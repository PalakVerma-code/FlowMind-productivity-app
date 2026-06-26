import React, { useState, useEffect } from "react";
import { Sparkles, Calendar, Clock } from "lucide-react";

export default function MorningCheckIn({ tasks, profile, onScheduleTasks }) {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Clear any stale local storage dismissal block so users don't get stuck
    localStorage.removeItem("morning_checkin_dismissed_until");
  }, []);

  useEffect(() => {
    if (isDismissed) {
      setIsVisible(false);
      return;
    }

    // If not dismissed, fetch check-in message
    const fetchCheckIn = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/morning-checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tasks: tasks,
            currentDateContext: new Date().toISOString(),
            userName: profile?.name || "User",
            userType: profile?.type || "Professional"
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.message) {
            setMessage(data.message);
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve proactive morning check-in:", err.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckIn();
  }, [tasks, profile, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  const handlePlanDay = () => {
    onScheduleTasks();
  };

  if (!isVisible || !message) return null;

  return (
    <div id="morning-checkin-bubble" className="mb-6 bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 border border-blue-500/20 rounded-2xl p-5 shadow-xl animate-fadeIn relative overflow-hidden">
      {/* Decorative background light */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-start gap-4">
        {/* AI Avatar */}
        <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/25 flex-shrink-0 flex items-center justify-center animate-pulse">
          <Sparkles className="w-5 h-5" />
        </div>

        <div className="flex-1 space-y-3.5">
          <div className="space-y-1">
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest block select-none">
              Proactive Focus Companion
            </span>
            <p className="text-sm font-medium text-slate-100 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="btn-checkin-plan"
              onClick={handlePlanDay}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Yes, Plan My Day 🚀</span>
            </button>
            <button
              id="btn-checkin-dismiss"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700/80 transition cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Later ⏰</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
