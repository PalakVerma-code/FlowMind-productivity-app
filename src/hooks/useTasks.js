import { useState, useEffect } from "react";
import * as calendarService from "../services/calendarService.js";
import { localHeuristicPlanner } from "../utils/heuristics.js";

export function useTasks({
  profile,
  freeTimeSettings,
  calendarToken,
  mockBusySlots,
  setSuccessMessage,
  setApiError,
  setIsFreeTimeSetupOpen,
  setActiveTab,
  clearCalendarState,
  onCalendarEventsScheduled
}) {
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [urgentWarnTask, setUrgentWarnTask] = useState(null);

  // Load existing tasks on mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("flowmind_tasks");
    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Failed to parse tasks list", e);
      }
    }
  }, []);

  // Sync tasks state to local storage
  const saveTasks = (updated) => {
    setTasks(updated);
    localStorage.setItem("flowmind_tasks", JSON.stringify(updated));
  };

  // Proactive 24-Hour Urgent pending objective check
  useEffect(() => {
    if (tasks.length > 0) {
      const now = new Date();
      const urgent = tasks.find(t => {
        if (t.completed || t.status === "completed" || t.status === "in_progress") return false;
        if (!t.deadline) return false;
        const d = new Date(t.deadline);
        if (isNaN(d.getTime())) return false;
        const diffMs = d.getTime() - now.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);
        return diffHrs > 0 && diffHrs <= 24;
      });
      setUrgentWarnTask(urgent || null);
    } else {
      setUrgentWarnTask(null);
    }
  }, [tasks]);

  const handleSubmitTaskText = async (customText) => {
    const text = customText || inputText;
    if (!text.trim()) return;

    setIsProcessing(true);
    setApiError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/extract-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskText: text,
          currentDateContext: new Date().toISOString(),
          userType: profile?.type || "Professional",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process task with Gemini.");
      }

      const extractedInfo = await response.json();

      const newTask = {
        id: "task-" + Date.now() + Math.random().toString(36).substring(2, 6),
        taskName: extractedInfo.taskName || text.trim(),
        deadline: extractedInfo.deadline || null,
        priority: extractedInfo.priority || "medium",
        duration: extractedInfo.duration || null,
        category: extractedInfo.category || "work",
        completed: false,
        createdAt: new Date().toISOString(),
      };

      const updated = [newTask, ...tasks];
      saveTasks(updated);
      setInputText("");

      if (extractedInfo.isLocalHeuristicFallback) {
        setSuccessMessage(`Structured task offline: "${newTask.taskName}"`);
      } else {
        setSuccessMessage(`AI structured task: "${newTask.taskName}" successfully!`);
      }
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Error creating AI task details:", err);
      setApiError(err.message || "Something went wrong. Let's try matching again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewTaskManually = () => {
    if (!inputText.trim()) return;
    const newTask = {
      id: "task-" + Date.now(),
      taskName: inputText.trim(),
      deadline: null,
      priority: "medium",
      duration: 30,
      category: profile?.type === "Student" ? "study" : "work",
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setInputText("");
    setSuccessMessage("Task logged manually.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleToggleComplete = (taskId) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        if (calendarToken && calendarToken !== "mock_token" && t.calendarEventId) {
          calendarService.updateGoogleCalendarEventStatus(
            t.calendarEventId,
            t.taskName,
            nextCompleted,
            t.priority,
            calendarToken
          ).catch(err => {
            console.error("Failed to sync status to Google Calendar:", err);
            setApiError("Failed to sync completed status to Google Calendar.");
            setTimeout(() => setApiError(""), 4000);
          });
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleDeleteTask = (taskId) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    saveTasks(updated);
  };

  const handleUpdateTaskStatus = (taskId, nextStatus) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = nextStatus === "completed";
        if (calendarToken && calendarToken !== "mock_token" && t.calendarEventId) {
          calendarService.updateGoogleCalendarEventStatus(
            t.calendarEventId,
            t.taskName,
            nextCompleted,
            t.priority,
            calendarToken
          ).catch(err => {
            console.error("Failed to sync status:", err);
          });
        }
        return { 
          ...t, 
          status: nextStatus,
          completed: nextCompleted
        };
      }
      return t;
    });
    saveTasks(updated);
  };

  const handleScheduleTasks = async () => {
    if (!freeTimeSettings) {
      setIsFreeTimeSetupOpen(true);
      return;
    }

    setIsScheduling(true);
    setApiError("");
    setSuccessMessage("");

    try {
      let mergedSettings = freeTimeSettings;
      if (calendarToken) {
        setSuccessMessage("Integrating calendar events...");
        
        // Map mock calendar busy slots into scheduler bounds safely
        const mappedBusy = (mockBusySlots || []).map(b => ({
          startTime: b.start || b.startTime,
          endTime: b.end || b.endTime,
          label: b.title || b.label || "Calendar Event"
        }));

        mergedSettings = {
          ...freeTimeSettings,
          busySlots: [...(freeTimeSettings.busySlots || []), ...mappedBusy]
        };
      }

      setSuccessMessage("Optimizing focus slots with AI...");
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks: tasks,
          settings: mergedSettings,
          currentDateContext: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error("Target scheduling services were unavailable.");
      }

      const scheduledSlices = await response.json();

      const updated = tasks.map(task => {
        if (task.completed) return task;
        const match = scheduledSlices.find(s => s.taskName.toLowerCase().trim() === task.taskName.toLowerCase().trim());
        if (match) {
          return {
            ...task,
            scheduledTime: match.scheduledTime,
            scheduledDate: match.scheduledDate || new Date().toISOString(),
            scheduledReason: match.reason,
            duration: match.duration || task.duration,
            status: task.status || "pending"
          };
        }
        return task;
      });

      if (calendarToken) {
        setSuccessMessage("Syncing slots to Google Calendar...");
        const updatedWithCalendar = [];
        const newlyCreated = [];

        for (const task of updated) {
          if (task.completed || !task.scheduledTime) {
            updatedWithCalendar.push(task);
            continue;
          }
          if (!task.calendarEventId) {
            const mockEventId = "mock-event-" + Math.random().toString(36).substring(2, 8);
            const updatedTask = {
              ...task,
              calendarEventId: mockEventId
            };
            updatedWithCalendar.push(updatedTask);
            newlyCreated.push(updatedTask);
          } else {
            updatedWithCalendar.push(task);
          }
        }
        saveTasks(updatedWithCalendar);
        
        if (newlyCreated.length > 0 && onCalendarEventsScheduled) {
          onCalendarEventsScheduled(newlyCreated);
        }
        setSuccessMessage("AI Scheduler built daily timeline and blocked your Google Calendar! ✅");
      } else {
        saveTasks(updated);
        setSuccessMessage("AI Scheduler built your optimized daily timeline!");
      }
      setTimeout(() => setSuccessMessage(""), 5000);
      setActiveTab("todays_plan");
    } catch (err) {
      console.error("Remote smart scheduler failed. Trying client offline heuristics fallback...", err);
      try {
        let mergedSettings = freeTimeSettings;
        if (calendarToken) {
          const mappedBusy = (mockBusySlots || []).map(b => ({
            startTime: b.start || b.startTime,
            endTime: b.end || b.endTime,
            label: b.title || b.label || "Calendar Event"
          }));
          mergedSettings = {
            ...freeTimeSettings,
            busySlots: [...(freeTimeSettings.busySlots || []), ...mappedBusy]
          };
        }

        const localShed = localHeuristicPlanner(tasks, mergedSettings);

        if (calendarToken) {
          setSuccessMessage("Offline fallback schedule built! Syncing to Google Calendar...");
          const updatedWithCalendar = [];
          const newlyCreated = [];

          for (const task of localShed) {
            if (task.completed || !task.scheduledTime) {
              updatedWithCalendar.push(task);
              continue;
            }
            if (!task.calendarEventId) {
              const mockEventId = "mock-event-" + Math.random().toString(36).substring(2, 8);
              const updatedTask = { ...task, calendarEventId: mockEventId };
              updatedWithCalendar.push(updatedTask);
              newlyCreated.push(updatedTask);
            } else {
              updatedWithCalendar.push(task);
            }
          }
          saveTasks(updatedWithCalendar);

          if (newlyCreated.length > 0 && onCalendarEventsScheduled) {
            onCalendarEventsScheduled(newlyCreated);
          }
          setSuccessMessage("Workspace compiled offline using local focus frames & synced to Google Calendar!");
        } else {
          saveTasks(localShed);
          setSuccessMessage("Workspace compiled offline using local focus frames.");
        }
        setTimeout(() => setSuccessMessage(""), 4000);
        setActiveTab("todays_plan");
      } catch (localErr) {
        console.error("Local calendar calculation crashed:", localErr);
        setApiError("Scheduler offline execution error.");
      }
    } finally {
      setIsScheduling(false);
    }
  };

  const handleResetWorkspace = (onProfileReset) => {
    if (confirm("Are you sure you want to reset your FlowMind workspace? This clears all tasks.")) {
      localStorage.removeItem("flowmind_profile");
      localStorage.removeItem("flowmind_tasks");
      localStorage.removeItem("flowmind_freetime_settings");
      localStorage.removeItem("calendar_token");
      localStorage.removeItem("calendar_name");
      localStorage.removeItem("mock_busy_slots");
      setTasks([]);
      setUrgentWarnTask(null);
      setInputText("");
      clearCalendarState();
      onProfileReset();
    }
  };

  const handleVoiceTranscript = (transcriptText) => {
    setInputText(transcriptText);
    handleSubmitTaskText(transcriptText);
  };

  return {
    tasks,
    inputText,
    setInputText,
    isProcessing,
    isScheduling,
    urgentWarnTask,
    setUrgentWarnTask,
    handleSubmitTaskText,
    handleAddNewTaskManually,
    handleToggleComplete,
    handleDeleteTask,
    handleUpdateTaskStatus,
    handleScheduleTasks,
    handleResetWorkspace,
    handleVoiceTranscript
  };
}
