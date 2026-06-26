import { GoogleGenAI } from "@google/genai";

let aiClient = null;

export function logCleanError(context, err) {
  const errString = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err);
  if (
    errString.includes("429") ||
    errString.includes("quota") ||
    errString.includes("quota exceeded") ||
    errString.includes("RESOURCE_EXHAUSTED") ||
    errString.includes("QuotaExceeded")
  ) {
    console.warn(`[GEMINI EXHAUSTED] ${context}: Daily free-tier rate limits reached. Falling back to robust local templates/heuristics.`);
  } else {
    console.warn(`[GEMINI WARNING] ${context}:`, err.message || errString || err);
  }
}

export function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined. Extractor API may fail.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

export async function extractTaskWithAI({ taskText, currentDateContext, userType }) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("AI client not initialized");
  }

  const prompt = `User input task: "${taskText}"
Current reference date/time: ${currentDateContext || new Date().toISOString()}
User Focus Role: ${userType || "Professional"}`;

  const systemInstruction = `Extract metadata from the user's natural language task description.
Analyze the input text and extract parameters:
- taskName: A clear, summarized title for the task (e.g. "Submit report", not "Submit report by Friday"). Keep it beautifully formatted and clean.
- deadline: The calculated deadline formatted as an ISO 8601 string (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ") based on the current reference date/time provided. If no deadline is specified, return null.
- priority: One of "high", "medium", or "low". Estimate based on urgency keywords like "asap", "urgent", "by tonight", "immediately" (high) or standard items (medium/low).
- duration: Estimated duration of the task in minutes as an integer. Estimate standard actions (e.g. "submit report" = 60 mins, "quick call" = 15 mins, "grocery run" = 45 mins), or return null if completely undetermined.
- category: One of "work", "study", "personal", "finance". Choose the best fit based on the user's focus role: Student -> default "study", Professional -> default "work", Entrepreneur -> default "work" or "finance".

Return ONLY a valid, parseable JSON object matching this schema, with no markdown code blocks around it:
{
  "taskName": string,
  "deadline": string | null,
  "priority": "high" | "medium" | "low",
  "duration": number | null,
  "category": "work" | "study" | "personal" | "finance"
}`;

  try {
    console.log("Attempting task extraction via default model (gemini-3.5-flash)...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });
    const text = response.text;
    if (text && text.trim()) {
      return JSON.parse(text.trim());
    }
  } catch (primaryError) {
    logCleanError("Task Extraction (primary)", primaryError);
    
    try {
      // Secondary fallback
      console.log("Attempting task extraction via secondary model (gemini-3.1-flash-lite)...");
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });
      const fallbackText = fallbackResponse.text;
      if (fallbackText && fallbackText.trim()) {
        return JSON.parse(fallbackText.trim());
      }
    } catch (secondaryError) {
      logCleanError("Task Extraction (secondary)", secondaryError);
    }
  }
  throw new Error("Gemini API Rate-limit or Quota boundaries reached.");
}

export async function scheduleTasksWithAI({ tasks, settings, currentDateContext }) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("AI client not initialized");
  }

  const wakeStr = settings?.wakeTime || "07:00";
  const sleepStr = settings?.sleepTime || "22:00";
  const busySlots = settings?.busySlots || [];
  
  const busyInfo = busySlots.map(b => {
    const label = b.label || b.title || 'Busy';
    const start = b.startTime || b.start || '09:00';
    const end = b.endTime || b.end || '10:00';
    return `${label} (${start}-${end})`;
  }).join(", ");
  const slotsText = `Wake up at ${wakeStr}, Sleep at ${sleepStr}. Busy periods to avoid: ${busyInfo || "None"}.`;

  const pendingTasksList = tasks
    .filter(t => !t.completed)
    .map(t => `- "${t.taskName}" (Priority: ${t.priority || "medium"}, Duration: ${t.duration || 30} mins, Deadline: ${t.deadline || "None"})`)
    .join("\n");

  const prompt = `Pending Tasks:\n${pendingTasksList}\n\nUser Profile & Core Free Slots Info:\n${slotsText}\n\nCurrent local timestamp: ${currentDateContext || new Date().toISOString()}`;

  const systemInstruction = `You are a productivity scheduling AI.
Given these tasks: [tasks]
And these free time slots today: [slots]
Schedule each task into the most suitable free slot based on priority and deadline.
Avoid any overlap with the user busy periods.
Return ONLY valid JSON array:
[{
  "taskName": string,
  "scheduledDate": string (ISO date string),
  "scheduledTime": string (HH:MM format),
  "duration": number (minutes),
  "reason": string (why this slot - one line)
}]
No markdown code blocks or wrapper brackets, JSON only.`;

  try {
    console.log("Attempting task scheduling via default model (gemini-3.5-flash)...");
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });
    const text = response.text;
    if (text && text.trim()) {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (primaryError) {
    logCleanError("Task Scheduling (primary)", primaryError);
    try {
      console.log("Attempting task scheduling via secondary model (gemini-3.1-flash-lite)...");
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.1,
        }
      });
      const text = response.text;
      if (text && text.trim()) {
        const parsed = JSON.parse(text.trim());
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (secondaryError) {
      logCleanError("Task Scheduling (secondary)", secondaryError);
    }
  }
  throw new Error("Gemini API Rate-limit or Quota boundaries reached for scheduling.");
}

export async function getMorningCheckInWithAI({ tasks, currentDateContext, userName, userType }) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("AI client not initialized");
  }

  const pendingTasksList = (tasks || [])
    .filter(t => !t.completed)
    .map(t => `- "${t.taskName}" (Priority: ${t.priority || "medium"}, Duration: ${t.duration || 30} mins, Deadline: ${t.deadline || "None"})`)
    .join("\n");

  const prompt = `Pending Tasks:\n${pendingTasksList || "No pending tasks."}\n\nUser Profile:\nName: ${userName || "User"}\nType: ${userType || "Professional"}\nCurrent local timestamp: ${currentDateContext || new Date().toISOString()}`;

  const systemInstruction = `You are a proactive AI productivity companion.
Analyze the user's pending tasks and current time.
Generate a SHORT, friendly, personalized morning check-in message (max 3 lines).
Mention the most urgent task specifically.
Ask if user wants to schedule now.
Be conversational, not robotic.
Return plain text only.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text?.trim() || "Good morning! Let's schedule your day today.";
  } catch (err) {
    logCleanError("Morning check-in generation", err);
    return "Good morning! Ready to block out some high-focus slots for your outstanding objectives?";
  }
}

export async function getFocusMotivationWithAI({ taskName }) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("AI client not initialized");
  }

  const prompt = `Task: "${taskName}"`;
  const systemInstruction = `Give one short (max 15 words) motivational message for someone working on: [task name]. Be encouraging and specific.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8,
      }
    });
    return response.text?.trim() || "Keep going! You are doing amazing work.";
  } catch (err) {
    logCleanError("Focus motivation generation", err);
    return "Stay focused! You're making great progress.";
  }
}

export async function getFocusCompletionMessageWithAI({ taskName, actualTime, nextTaskName }) {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("AI client not initialized");
  }

  const prompt = `Task Completed: "${taskName}"
Time Spent: ${actualTime}
Next Task: "${nextTaskName || "None (all done!)"}"`;

  const systemInstruction = `You are a warm productivity companion. Express a custom, highly enthusiastic celebration and motivational transition message.
Celebrate that the user completed the task in the specified actual time.
If there is a next task, warmly transition to encouraging them to tackle that next task next. If not, celebrate completing everything.
Keep it extremely friendly, inspiring, and maximum 35 words. Do not use robotic prefixes.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.85,
      }
    });
    return response.text?.trim() || `Amazing work! You completed "${taskName}" in ${actualTime}. ${nextTaskName ? `Next up: ${nextTaskName}` : "All tasks finished!"}`;
  } catch (err) {
    logCleanError("Focus completion message generation", err);
    return `Amazing work! You completed "${taskName}" in ${actualTime}. ${nextTaskName ? `Next up: ${nextTaskName}` : "All tasks finished!"}`;
  }
}

