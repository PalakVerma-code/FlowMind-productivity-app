import React from "react";
import { Calendar } from "lucide-react";

export default function GreetingBanner({ profileName, activeCount, completedCount }) {
  const getDayGreetingDateStr = () => {
    const dateOptions = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return new Date().toLocaleDateString("en-US", dateOptions);
  };

  return (
    <div id="greeting-banner" className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#1E293B]/50 p-6 rounded-2xl border border-slate-800/70">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Hi, {profileName}!
        </h2>
        <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5 select-none">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>Today is {getDayGreetingDateStr()}</span>
        </p>
      </div>

      {/* Productivity stats boxes */}
      <div className="flex items-center gap-3.5 select-none text-xs">
        <div className="bg-[#1E293B] border border-slate-800 px-4 py-2.5 rounded-xl min-w-[90px] text-center">
          <span className="block text-slate-400 mb-0.5">Focus Plan</span>
          <span className="block font-bold text-[#3B82F6] text-lg leading-tight">
            {activeCount}
          </span>
        </div>
        <div className="bg-[#1E293B] border border-slate-800 px-4 py-2.5 rounded-xl min-w-[90px] text-center">
          <span className="block text-slate-400 mb-0.5">Completed</span>
          <span className="block font-bold text-emerald-400 text-lg leading-tight">
            {completedCount}
          </span>
        </div>
      </div>
    </div>
  );
}
