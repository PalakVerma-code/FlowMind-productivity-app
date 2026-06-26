import express from "express";
import { extractTaskWithAI, scheduleTasksWithAI, getMorningCheckInWithAI, getFocusMotivationWithAI, getFocusCompletionMessageWithAI, logCleanError } from "../services/ai.js";
import { heuristicFallbackExtract, localHeuristicScheduler } from "../services/heuristics.js";

const router = express.Router();

// Main proxy route to extract structured task attributes using Gemini with automatic robust fallbacks
router.post("/api/extract-task", async (req, res) => {
  const { taskText, currentDateContext, userType } = req.body;
  
  if (!taskText || typeof taskText !== "string" || taskText.trim() === "") {
    return res.status(400).json({ error: "Task description cannot be empty." });
  }

  try {
    const aiData = await extractTaskWithAI({ taskText, currentDateContext, userType });
    return res.json({ ...aiData, isLocalHeuristicFallback: false });
  } catch (aiError) {
    logCleanError("Route: Task extraction", aiError);
    // Graceful Offline/Transient Error Local Heuristics Fallback - guaranteed success
    try {
      const localExtracted = heuristicFallbackExtract(taskText, userType);
      return res.json(localExtracted);
    } catch (fallbackErr) {
      console.error("Fatal: Local heuristic engine failed:", fallbackErr);
      return res.json({
        taskName: taskText.trim(),
        deadline: null,
        priority: "medium",
        duration: 30,
        category: userType === "Student" ? "study" : "work",
        isLocalHeuristicFallback: true
      });
    }
  }
});

// AI Smart task scheduling route under Phase 2 specifications
router.post(["/api/schedule", "/api/schedule-tasks"], async (req, res) => {
  const { tasks, settings, currentDateContext } = req.body;
  
  if (!Array.isArray(tasks)) {
    return res.status(400).json({ error: "Tasks must be a valid array." });
  }

  try {
    const aiScheduled = await scheduleTasksWithAI({ tasks, settings, currentDateContext });
    return res.json(aiScheduled);
  } catch (aiError) {
    logCleanError("Route: Task scheduling", aiError);
    // Graceful Local Heuristic Fallback - 100% success rate guaranteed
    try {
      console.log("Invoking local heuristic scheduling engine due to AI unavailability.");
      const fallbackScheduled = localHeuristicScheduler(tasks, settings, currentDateContext);
      return res.json(fallbackScheduled);
    } catch (fallbackErr) {
      console.error("Fatal: Local scheduler engine crashed:", fallbackErr);
      // Absolute baseline response
      const baseline = tasks.filter(t => !t.completed).map((t, index) => {
        const hour = 9 + index;
        const hourStr = String(hour).padStart(2, "0") + ":00";
        return {
          taskName: t.taskName,
          scheduledDate: new Date().toISOString(),
          scheduledTime: hourStr,
          duration: t.duration || 30,
          reason: "Allocated to morning slot for prompt starting focus."
        };
      });
      return res.json(baseline);
    }
  }
});

// AI Proactive Morning Check-In endpoint
router.post("/api/morning-checkin", async (req, res) => {
  const { tasks, currentDateContext, userName, userType } = req.body;
  try {
    const message = await getMorningCheckInWithAI({ tasks, currentDateContext, userName, userType });
    return res.json({ message });
  } catch (err) {
    logCleanError("Route: Morning check-in", err);
    return res.json({ message: "Good morning! Ready to optimize your schedule and achieve focus clarity?" });
  }
});

// Pomodoro Motivation endpoint
router.post("/api/focus-motivation", async (req, res) => {
  const { taskName } = req.body;
  try {
    const message = await getFocusMotivationWithAI({ taskName });
    return res.json({ message });
  } catch (err) {
    logCleanError("Route: Focus motivation", err);
    return res.json({ message: "Keep going! You are doing amazing work." });
  }
});

// Focus Completion Celebration endpoint
router.post("/api/focus-completion-message", async (req, res) => {
  const { taskName, actualTime, nextTaskName } = req.body;
  try {
    const message = await getFocusCompletionMessageWithAI({ taskName, actualTime, nextTaskName });
    return res.json({ message });
  } catch (err) {
    logCleanError("Route: Focus celebration", err);
    return res.json({ message: `Amazing work! You completed "${taskName}" in ${actualTime}! Next up: ${nextTaskName || "Enjoy your free time!"}` });
  }
});

export default router;
