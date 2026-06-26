import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  RotateCcw, 
  ListTodo, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

// Original Core Components
import Onboarding from "./components/Onboarding.jsx";
import TaskCard from "./components/TaskCard.jsx";
import FreeTimeSetup from "./components/FreeTimeSetup.jsx";
import TodaysPlan from "./components/TodaysPlan.jsx";

// Refactored Sub-Components
import CommandConsole from "./components/CommandConsole.jsx";
import UrgentWarningModal from "./components/UrgentWarningModal.jsx";
import DashboardHeader from "./components/DashboardHeader.jsx";
import GreetingBanner from "./components/GreetingBanner.jsx";

// Refactored State hooks & Services
import { useGoogleCalendar } from "./hooks/useGoogleCalendar.js";
import { useTasks } from "./hooks/useTasks.js";

// New features
import MorningCheckIn from "./components/MorningCheckIn.jsx";
import FocusMode from "./components/FocusMode.jsx";

export default function App() {
  const [profile, setProfile] = useState(null);
  const [freeTimeSettings, setFreeTimeSettings] = useState(null);
  const [activeTab, setActiveTab] = useState("queue"); // 'queue' | 'todays_plan'
  const [isFreeTimeSetupOpen, setIsFreeTimeSetupOpen] = useState(false);
  const [activeFocusTask, setActiveFocusTask] = useState(null);
  
  // Shared notifications feedback systems
  const [apiError, setApiError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [scheduledEventsPopup, setScheduledEventsPopup] = useState(null);

  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'completed'
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'work' | 'study' | 'personal' | 'finance'

  // Initialize Calendar hook operations
  const calendar = useGoogleCalendar(setSuccessMessage, setApiError);

  // Initialize Tasks hook operations
  const scheduler = useTasks({
    profile,
    freeTimeSettings,
    calendarToken: calendar.calendarToken,
    mockBusySlots: calendar.mockBusySlots,
    setSuccessMessage,
    setApiError,
    setIsFreeTimeSetupOpen,
    setActiveTab,
    clearCalendarState: () => {
      calendar.setCalendarToken(null);
      calendar.setCalendarName("");
    },
    onCalendarEventsScheduled: (events) => setScheduledEventsPopup(events)
  });

  // Load parent profiles on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("flowmind_profile");
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse profile data", e);
      }
    }

    const savedFreeTime = localStorage.getItem("flowmind_freetime_settings");
    if (savedFreeTime) {
      try {
        setFreeTimeSettings(JSON.parse(savedFreeTime));
      } catch (e) {
        console.error("Failed to parse freetime settings", e);
      }
    }
    
    // Check callback session load primary calendar
    const savedToken = localStorage.getItem("calendar_token");
    if (savedToken && typeof calendar.loadPrimaryCalendarName === "function") {
      calendar.loadPrimaryCalendarName(savedToken);
    }
  }, []);

  const handleOnboardingComplete = (newProfile) => {
    setProfile(newProfile);
    localStorage.setItem("flowmind_profile", JSON.stringify(newProfile));
    setSuccessMessage(`Welcome onboard, ${newProfile.name}! Workspace synchronized.`);
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const handleSaveFreeTimeSettings = (settings) => {
    setFreeTimeSettings(settings);
    localStorage.setItem("flowmind_freetime_settings", JSON.stringify(settings));
    setIsFreeTimeSetupOpen(false);
    setSuccessMessage("Focus timeframe settings applied successfully!");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  // Computations for task list aggregations
  const activeCount = scheduler.tasks.filter((t) => !t.completed).length;
  const completedCount = scheduler.tasks.filter((t) => t.completed).length;

  const filteredTasks = scheduler.tasks.filter((t) => {
    const matchesStatus = 
      filter === "all" ? true :
      filter === "active" ? !t.completed :
      t.completed;
    
    const matchesCategory = 
      categoryFilter === "all" ? true :
      t.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesStatus && matchesCategory;
  });

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans antialiased">
        <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  if (!freeTimeSettings) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans antialiased">
        <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <FreeTimeSetup onSave={handleSaveFreeTimeSettings} />
        </div>
      </div>
    );
  }

  if (isFreeTimeSetupOpen) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans antialiased">
        <header className="border-b border-slate-800/80 bg-[#0F172A]/80 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#3B82F6] rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white select-none">
              Flow<span className="text-[#3B82F6]">Mind</span> settings
            </span>
          </div>
          <button
            id="btn-close-settings"
            onClick={() => setIsFreeTimeSetupOpen(false)}
            className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition cursor-pointer select-none"
          >
            Back to Dashboard
          </button>
        </header>
        <div className="w-full max-w-7xl mx-auto py-8">
          <FreeTimeSetup onSave={handleSaveFreeTimeSettings} initialSettings={freeTimeSettings} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans antialiased pb-20">
      
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#1E293B]/20 to-transparent pointer-events-none" />

      {/* Structured Shared Navigation Bar */}
      <DashboardHeader
        profile={profile}
        calendarToken={calendar.calendarToken}
        calendarName={calendar.calendarName}
        handleConnectCalendar={calendar.handleConnectCalendar}
        handleDisconnectCalendar={calendar.handleDisconnectCalendar}
        setIsFreeTimeSetupOpen={setIsFreeTimeSetupOpen}
        handleResetWorkspace={(onReset) => scheduler.handleResetWorkspace(() => {
          onReset();
          setProfile(null);
          setFreeTimeSettings(null);
        })}
        onProfileReset={() => {
          setProfile(null);
          setFreeTimeSettings(null);
        }}
      />

      {/* Main Container Workspace */}
      <main className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Personalized Welcome Greetings Banner */}
        <GreetingBanner
          profileName={profile.name}
          activeCount={activeCount}
          completedCount={completedCount}
        />

        {/* AI Proactive Morning Check-In Bubble */}
        <MorningCheckIn
          tasks={scheduler.tasks}
          profile={profile}
          onScheduleTasks={scheduler.handleScheduleTasks}
        />

        {activeTab === "queue" && (
          <CommandConsole
            inputText={scheduler.inputText}
            setInputText={scheduler.setInputText}
            isProcessing={scheduler.isProcessing}
            apiError={apiError}
            setApiError={setApiError}
            handleSubmitTaskText={() => scheduler.handleSubmitTaskText()}
            handleAddNewTaskManually={scheduler.handleAddNewTaskManually}
            handleVoiceTranscript={scheduler.handleVoiceTranscript}
          />
        )}

        {/* Action alert banner messages */}
        {successMessage && (
          <div id="success-banner" className="mb-6 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 select-none animate-fadeIn">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {apiError && (
          <div id="api-error-banner" className="mb-6 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl px-4 py-3.5 text-sm font-medium flex items-start gap-2.5 shadow-lg shadow-rose-950/10 animate-fadeIn">
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-300">Voice or Text AI breakdown failed</p>
              <p className="text-xs text-rose-400 mt-0.5">{apiError}</p>
              <button
                onClick={scheduler.handleAddNewTaskManually}
                className="mt-2.5 inline-flex items-center gap-1 text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg font-bold border border-rose-500/20 cursor-pointer"
              >
                Log input manually instead
              </button>
            </div>
          </div>
        )}

        {/* Main Application Tabs Selector */}
        <div id="dashboard-tabs" className="flex border-b border-slate-800 mb-8 space-x-6 select-none">
          <button
            id="tab-queue"
            onClick={() => setActiveTab("queue")}
            className={`pb-3 text-sm font-extrabold tracking-tight relative transition cursor-pointer ${
              activeTab === "queue"
                ? "text-[#3B82F6]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>My Tasks</span>
            {activeCount > 0 && (
              <span className="ml-1.5 text-[10px] font-bold bg-[#3B82F6]/10 text-[#3B82F6] px-2.5 py-0.5 rounded-full border border-[#3B82F6]/15">
                {activeCount}
              </span>
            )}
            {activeTab === "queue" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6] rounded-full" />
            )}
          </button>

          <button
            id="tab-plan"
            onClick={() => setActiveTab("todays_plan")}
            className={`pb-3 text-sm font-extrabold tracking-tight relative transition cursor-pointer ${
              activeTab === "todays_plan"
                ? "text-[#3B82F6]"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Today's Plan</span>
            {activeTab === "todays_plan" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6] rounded-full" />
            )}
          </button>
        </div>

        {activeTab === "queue" ? (
          <>
            {/* Task Management Filtering & List Viewports */}
            <section id="task-workspace" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 select-none">
                <div className="flex items-center gap-2">
                  <ListTodo className="w-5 h-5 text-[#3B82F6]" />
                  <h2 className="text-xl font-extrabold tracking-tight text-white">
                    My Tasks
                  </h2>
                  <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-semibold ml-1">
                    {filteredTasks.length} items
                  </span>
                </div>

                {/* Filter configurations */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status segment select buttons */}
                  <div className="flex bg-[#0F172A] border border-slate-800 p-1 rounded-xl text-xs">
                    {[
                      { id: "all", label: "All" },
                      { id: "active", label: "Active" },
                      { id: "completed", label: "Done" },
                    ].map((item) => (
                      <button
                        key={item.id}
                        id={`filter-status-${item.id}`}
                        onClick={() => setFilter(item.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition ${
                          filter === item.id 
                            ? "bg-[#1E293B] text-white" 
                            : "text-slate-400 hover:text-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Category dropdown query selection */}
                  <select
                    id="filter-category"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-[#1E293B] border border-slate-800 rounded-xl p-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-[#3B82F6] cursor-pointer"
                  >
                    <option value="all">⚡ All Categories</option>
                    <option value="work">💼 Work</option>
                    <option value="study">🎓 Study</option>
                    <option value="personal">👤 Personal</option>
                    <option value="finance">💰 Finance</option>
                  </select>
                </div>
              </div>

              {/* Task Cards Renderer */}
              {filteredTasks.length === 0 ? (
                <div id="tasks-empty-state" className="flex flex-col items-center justify-center py-16 px-4 bg-[#1E293B]/20 rounded-2xl border border-dashed border-slate-800 text-center select-none animate-fadeIn">
                  <div className="p-4 bg-slate-900/40 rounded-full mb-4 text-3xl">
                    👋
                  </div>
                  <h3 className="text-lg font-bold text-slate-200">
                    No tasks yet!
                  </h3>
                  <div className="text-xs text-slate-400 max-w-sm mt-2 space-y-1">
                    <p>Type something like:</p>
                    <p className="italic text-[#3B82F6]">'Submit report by tomorrow 5pm'</p>
                    <p>or</p>
                    <p className="italic text-[#3B82F6]">'Pay electricity bill this Friday'</p>
                  </div>
                  {filter !== "all" || categoryFilter !== "all" ? (
                    <button
                      id="btn-clear-task-filters"
                      onClick={() => {
                        setFilter("all");
                        setCategoryFilter("all");
                      }}
                      className="mt-4 text-xs font-semibold text-[#3B82F6] hover:underline cursor-pointer focus:outline-none"
                    >
                      Clear all filters
                    </button>
                  ) : null}
                </div>
              ) : (
                <div id="tasks-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onToggleComplete={scheduler.handleToggleComplete}
                      onDelete={scheduler.handleDeleteTask}
                      onStartFocus={setActiveFocusTask}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <TodaysPlan 
            tasks={scheduler.tasks}
            onUpdateTaskStatus={scheduler.handleUpdateTaskStatus}
            onScheduleTasks={scheduler.handleScheduleTasks}
            isScheduling={scheduler.isScheduling}
            settings={freeTimeSettings}
            isCalendarConnected={!!calendar.calendarToken}
            mockBusySlots={calendar.mockBusySlots}
            onStartFocus={setActiveFocusTask}
          />
        )}
      </main>

      {/* Proactive Warning Alert Modals */}
      <UrgentWarningModal
        urgentWarnTask={scheduler.urgentWarnTask}
        onUpdateTaskStatus={scheduler.handleUpdateTaskStatus}
        onScheduleTasks={scheduler.handleScheduleTasks}
        onNotifyProgress={(msg) => {
          setSuccessMessage(msg);
          setTimeout(() => setSuccessMessage(""), 4000);
        }}
        onClose={() => scheduler.setUrgentWarnTask(null)}
      />

      {/* Mock Calendar Event Popup */}
      {scheduledEventsPopup && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-2xl shadow-2xl p-6 text-center text-white relative">
            <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Google Calendar Sync</h3>
            <div className="my-4 space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {scheduledEventsPopup.map((task, idx) => (
                <div key={idx} className="bg-[#0F172A] p-3.5 rounded-xl border border-slate-800 text-left">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Event Created</p>
                  <p className="text-sm font-bold text-white truncate">{task.taskName}</p>
                  <p className="text-xs text-slate-300 mt-1">
                    Time: <span className="text-[#3B82F6] font-semibold">{task.scheduledTime}</span>
                  </p>
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                    <span>✅ Added to your Google Calendar</span>
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setScheduledEventsPopup(null)}
              className="w-full py-2.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Awesome, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Focus Mode Immersive overlay */}
      {activeFocusTask && (
        <FocusMode
          task={activeFocusTask}
          tasks={scheduler.tasks}
          onComplete={(taskId) => {
            scheduler.handleUpdateTaskStatus(taskId, "completed");
          }}
          onClose={() => setActiveFocusTask(null)}
        />
      )}
    </div>
  );
}
