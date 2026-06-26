// Local offline heuristic parsers and smart layout planners to fallback gracefully during remote API outages or rate limit boundaries

export function heuristicFallbackExtract(taskText, userType) {
  const normalized = taskText.toLowerCase();
  
  // Decide category
  let category = "work";
  if (userType === "Student") {
    category = normalized.includes("money") || normalized.includes("pay") || normalized.includes("finance") || normalized.includes("buy") ? "finance" : "study";
  } else {
    if (normalized.includes("course") || normalized.includes("exam") || normalized.includes("lecture") || normalized.includes("study") || normalized.includes("homework")) {
      category = "study";
    } else if (normalized.includes("money") || normalized.includes("pay") || normalized.includes("finance") || normalized.includes("revenue") || normalized.includes("tax")) {
      category = "finance";
    } else if (normalized.includes("gym") || normalized.includes("dentist") || normalized.includes("personal") || normalized.includes("movie") || normalized.includes("dinner") || normalized.includes("buy")) {
      category = "personal";
    }
  }

  // Decide priority
  let priority = "medium";
  if (normalized.includes("asap") || normalized.includes("urgent") || normalized.includes("immediately") || normalized.includes("tonight") || normalized.includes("today") || normalized.includes("high priority")) {
    priority = "high";
  } else if (normalized.includes("whenever") || normalized.includes("low") || normalized.includes("later") || normalized.includes("someday")) {
    priority = "low";
  }

  // Estimate duration
  let duration = 30; // default minutes
  if (normalized.includes("quick") || normalized.includes("minute")) {
    duration = 15;
  } else if (normalized.includes("all day") || normalized.includes("hours")) {
    duration = 120;
  }

  // Estimate deadline
  let deadline = null;
  const now = new Date();
  if (normalized.includes("today") || normalized.includes("tonight")) {
    const today = new Date();
    today.setHours(17, 0, 0, 0); // 5 PM today
    deadline = today.toISOString();
  } else if (normalized.includes("tomorrow")) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(17, 0, 0, 0); // 5 PM tomorrow
    deadline = tomorrow.toISOString();
  } else if (normalized.includes("friday")) {
    const target = new Date();
    const day = target.getDay();
    const diff = (5 - day + 7) % 7 || 7; // next Friday
    target.setDate(target.getDate() + diff);
    target.setHours(17, 0, 0, 0);
    deadline = target.toISOString();
  } else if (normalized.includes("monday")) {
    const target = new Date();
    const day = target.getDay();
    const diff = (1 - day + 7) % 7 || 7; // next Monday
    target.setDate(target.getDate() + diff);
    target.setHours(17, 0, 0, 0);
    deadline = target.toISOString();
  } else if (normalized.includes("sunday")) {
    const target = new Date();
    const day = target.getDay();
    const diff = (7 - day + 7) % 7 || 7; // next Sunday
    target.setDate(target.getDate() + diff);
    target.setHours(17, 0, 0, 0);
    deadline = target.toISOString();
  }

  return {
    taskName: taskText.trim(),
    deadline,
    priority,
    duration,
    category,
    isLocalHeuristicFallback: true
  };
}

export function localHeuristicScheduler(tasks, settings, currentDateContext) {
  const wakeStr = settings?.wakeTime || "07:00";
  const sleepStr = settings?.sleepTime || "22:00";
  const busySlots = settings?.busySlots || [];
  
  const parseTimeToMin = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  
  const minToTimeStr = (totalMin) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const wakeMin = parseTimeToMin(wakeStr);
  const sleepMin = parseTimeToMin(sleepStr);
  
  const busyIntervals = busySlots.map(slot => ({
    start: parseTimeToMin(slot.startTime),
    end: parseTimeToMin(slot.endTime),
    label: slot.label
  })).sort((a, b) => a.start - b.start);

  let currentMin = wakeMin;
  let freeIntervals = [];

  for (const busy of busyIntervals) {
    if (busy.start > currentMin) {
      freeIntervals.push({
        start: currentMin,
        end: busy.start,
        duration: busy.start - currentMin
      });
    }
    if (busy.end > currentMin) {
      currentMin = busy.end;
    }
  }

  if (sleepMin > currentMin) {
    freeIntervals.push({
      start: currentMin,
      end: sleepMin,
      duration: sleepMin - currentMin
    });
  }

  if (freeIntervals.length === 0) {
    freeIntervals.push({
      start: wakeMin,
      end: sleepMin,
      duration: Math.max(60, sleepMin - wakeMin)
    });
  }

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sortedTasks = [...tasks].filter(t => !t.completed).sort((a, b) => {
    const pA = priorityWeight[a.priority?.toLowerCase()] || 2;
    const pB = priorityWeight[b.priority?.toLowerCase()] || 2;
    if (pA !== pB) return pB - pA;
    if (a.deadline && b.deadline) {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }
    return a.deadline ? -1 : (b.deadline ? 1 : 0);
  });

  const scheduled = [];
  const startDay = new Date(currentDateContext || new Date().toISOString());
  const yyyy = startDay.getFullYear();
  const mm = String(startDay.getMonth() + 1).padStart(2, "0");
  const dd = String(startDay.getDate()).padStart(2, "0");
  const baseDateStr = `${yyyy}-${mm}-${dd}`;

  let intervalCursors = freeIntervals.map(interval => ({
    ...interval,
    cursor: interval.start
  }));

  for (const task of sortedTasks) {
    const duration = Number(task.duration) || 30;
    let allocated = false;
    
    for (let ic of intervalCursors) {
      if (ic.cursor + duration <= ic.end) {
        const schedTimeMin = ic.cursor;
        const timeString = minToTimeStr(schedTimeMin);
        const scheduledTimeStr = `${baseDateStr}T${timeString}:00`;
        let isoSched = "";
        try {
          isoSched = new Date(scheduledTimeStr).toISOString();
        } catch {
          isoSched = startDay.toISOString();
        }

        scheduled.push({
          taskName: task.taskName,
          scheduledDate: isoSched,
          scheduledTime: timeString,
          duration: duration,
          reason: `Scheduled in your available slot during ${timeString}. Prioritized based on your ${task.priority || "medium"} urgency.`
        });

        ic.cursor += duration;
        allocated = true;
        break;
      }
    }

    if (!allocated) {
      const firstIc = intervalCursors[0] || { cursor: wakeMin };
      const timeString = minToTimeStr(firstIc.cursor);
      const scheduledTimeStr = `${baseDateStr}T${timeString}:00`;
      let isoSched = "";
      try {
        isoSched = new Date(scheduledTimeStr).toISOString();
      } catch {
        isoSched = startDay.toISOString();
      }
      
      scheduled.push({
        taskName: task.taskName,
        scheduledDate: isoSched,
        scheduledTime: timeString,
        duration: duration,
        reason: `Positioned at ${timeString} to maximize focus for this ${task.priority || "medium"} priority task.`
      });
      firstIc.cursor += duration;
    }
  }

  return scheduled;
}
