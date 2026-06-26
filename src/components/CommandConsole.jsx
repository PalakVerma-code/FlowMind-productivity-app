import React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import VoiceInput from "./VoiceInput.jsx";

export default function CommandConsole({
  inputText,
  setInputText,
  isProcessing,
  apiError,
  setApiError,
  handleSubmitTaskText,
  handleAddNewTaskManually,
  handleVoiceTranscript
}) {
  return (
    <section id="command-console" className="bg-[#1E293B] rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl mb-10">
      
      <div className="flex items-center gap-2 mb-4 select-none">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Add a Task
        </h3>
      </div>

      <div className="text-xs text-slate-400 mb-4 leading-relaxed select-none">
        Type deadlines and details naturally or dictate directly. AI auto-structures priorities and times.<br />
        <span className="text-slate-500 font-medium">Examples: "Audit Q2 sales before tomorrow 4pm" • "Prepare chemistry presentation by next Monday" • "Pay rent on Friday"</span>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitTaskText();
        }}
        className="space-y-4"
      >
        <div className="relative">
          <textarea
            id="input-natural-task"
            rows={3}
            placeholder={`What do you need to do? 
e.g. Submit assignment by Friday 5pm`}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (apiError) setApiError("");
            }}
            disabled={isProcessing}
            className="w-full bg-[#0F172A] text-white border border-slate-800 rounded-xl p-4 pr-12 text-sm sm:text-base focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition placeholder-slate-600 leading-relaxed resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitTaskText();
              }
            }}
          />
        </div>

        {/* Inputs & Web Speech Integration Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          
          <div className="w-full sm:w-auto">
            <VoiceInput
              onTranscript={handleVoiceTranscript}
              disabled={isProcessing}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Manual Log Button alternate */}
            <button
              id="btn-log-manual"
              type="button"
              onClick={handleAddNewTaskManually}
              disabled={isProcessing || !inputText.trim()}
              className="w-full sm:w-auto px-4 py-3 rounded-xl text-xs font-semibold border border-slate-700 bg-transparent text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition select-none"
              title="Add immediately without AI analysis"
            >
              Add Manually
            </button>

            {/* Submit button utilizing API */}
            <button
              id="btn-process-ai"
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-[#3B82F6]/15 hover:shadow-[#3B82F6]/20 transition cursor-pointer select-none font-sans"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Add Task ✨</span>
                </>
              )}
            </button>
          </div>

        </div>
      </form>

    </section>
  );
}
