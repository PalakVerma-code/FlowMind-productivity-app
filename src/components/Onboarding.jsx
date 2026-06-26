import React, { useState } from "react";
import { Sparkles, ArrowRight, GraduationCap, Briefcase, TrendingUp } from "lucide-react";

export default function Onboarding({ onComplete }) {
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Please share your name to begin.");
      return;
    }
    if (!selectedType) {
      setErrorMessage("Please select your focus role/profile.");
      return;
    }
    
    setErrorMessage("");
    const profile = {
      name: name.trim(),
      type: selectedType,
    };
    
    // Save to localStorage immediately
    localStorage.setItem("flowmind_profile", JSON.stringify(profile));
    onComplete(profile);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-8 select-none">
      <div id="onboarding-card" className="w-full max-w-lg bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-800/80 p-8 sm:p-10 text-white">
        
        {/* Brand Header */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="p-2.5 bg-[#3B82F6] rounded-xl shadow-lg ring-4 ring-blue-500/10">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Flow<span className="text-[#3B82F6]">Mind</span>
          </span>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Welcome to FlowMind
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            FlowMind helps you stop missing deadlines. Add your tasks below — AI will plan your day.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name input */}
          <div>
            <label id="lbl-name" className="block text-sm font-semibold text-slate-300 mb-2">
              What should we call you?
            </label>
            <input
              id="input-name"
              type="text"
              placeholder="e.g. Alex"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage("");
              }}
              className="w-full bg-[#0F172A] text-white border border-slate-700 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-[#3B82F6] transition placeholder-slate-500 focus:ring-2 focus:ring-[#3B82F6]/20"
              maxLength={30}
              autoFocus
            />
          </div>

          {/* Profile options list */}
          <div>
            <label id="lbl-type" className="block text-sm font-semibold text-slate-300 mb-3">
              Select your primary focus profile:
            </label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { 
                  type: "Student", 
                  desc: "Structure courses, homework schedules, and project timelines", 
                  icon: GraduationCap, 
                  colorClass: "text-[#3B82F6] border-[#3B82F6]/20 hover:border-[#3B82F6]" 
                },
                { 
                  type: "Professional", 
                  desc: "Keep sync appointments, action deliverables, and review plans", 
                  icon: Briefcase, 
                  colorClass: "text-violet-400 border-violet-500/20 hover:border-violet-500" 
                },
                { 
                  type: "Entrepreneur", 
                  desc: "Organize client sales, product pitches, and finances", 
                  icon: TrendingUp, 
                  colorClass: "text-emerald-400 border-emerald-500/20 hover:border-emerald-500" 
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    id={`btn-select-${item.type.toLowerCase()}`}
                    type="button"
                    onClick={() => {
                      setSelectedType(item.type);
                      if (errorMessage) setErrorMessage("");
                    }}
                    className={`flex items-start text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#0F172A] border-[#3B82F6] ring-2 ring-[#3B82F6]/20"
                        : "bg-[#0F172A] border-slate-800 hover:bg-[#0F172A]/80 focus:outline-none"
                    }`}
                  >
                    <div className={`p-2.5 bg-slate-800 rounded-lg mr-3 flex-shrink-0 ${item.colorClass.split(" ")[0]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-100">{item.type}</div>
                      <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert error panel if validating fails */}
          {errorMessage && (
            <p id="error-alert" className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center font-medium">
              {errorMessage}
            </p>
          )}

          {/* Start Actions CTA Button */}
          <button
            id="btn-onboarding-submit"
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 active:transform active:scale-[0.98] text-white py-4 rounded-xl font-bold text-center tracking-wide shadow-lg shadow-[#3B82F6]/15 hover:shadow-[#3B82F6]/25 focus:outline-none transition group cursor-pointer"
          >
            <span>Launch FlowMind Dashboard</span>
            <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
