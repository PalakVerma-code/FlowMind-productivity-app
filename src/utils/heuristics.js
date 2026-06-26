/**
 * Client-Side offline fallback planner layout.
 */

export const localHeuristicPlanner = (allTasks, settings) => {
  const wakeStr = settings?.wakeTime || "07:00";
  const sleepStr = settings?.sleepTime || "22:00";
  const busySlots = settings?.busySlots || [];
  
  const parseTimeToMin = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  
  const minToTimeStr = (totalMin) => {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const wakeMin = parseTimeToMin(wakeStr);
  const sleepMin = parseTimeToMin(sleepStr);
  
  const busyIntervals = busySlots.map(s => ({
    start: parseTimeToMin(s.startTime),
    end: parseTimeToMin(s.endTime)
  })).sort((a, b) => a.start - b.start);

  let currentMin = wakeMin;
  let freeIntervals = [];

  for (const b of busyIntervals) {
    if (b.start > currentMin) {
      freeIntervals.push({ start: currentMin, end: b.start });
    }
    currentMin = Math.max(currentMin, b.end);
  }
  if (sleepMin > currentMin) {
    freeIntervals.push({ start: currentMin, end: sleepMin });
  }
  if (freeIntervals.length === 0) {
    freeIntervals.push({ start: wakeMin, end: sleepMin });
  }

  const priorityWeight = { high: 3, medium: 2, low: 1 };
  const sorted = [...allTasks].filter(t => !t.completed).sort((a, b) => {
    const pA = priorityWeight[a.priority?.toLowerCase()] || 2;
    const pB = priorityWeight[b.priority?.toLowerCase()] || 2;
    if (pA !== pB) return pB - pA;
    return 0;
  });

  let cursors = freeIntervals.map(i => ({ ...i, cursor: i.start }));

  return allTasks.map(task => {
    if (task.completed) return task;
    const duration = Number(task.duration) || 30;
    let allocated = false;
    
    for (let c of cursors) {
      if (c.cursor + duration <= c.end) {
        const timeStr = minToTimeStr(c.cursor);
        c.cursor += duration;
        allocated = true;
        return {
          ...task,
          scheduledTime: timeStr,
          scheduledDate: new Date().toISOString(),
          scheduledReason: `Allocated to focus slot by offline heuristics during ${timeStr}.`,
          status: task.status || "pending"
        };
      }
    }
    
    const first = cursors[0] || { cursor: wakeMin };
    const timeStr = minToTimeStr(first.cursor);
    first.cursor += duration;
    return {
      ...task,
      scheduledTime: timeStr,
      scheduledDate: new Date().toISOString(),
      scheduledReason: "Positioned to maximize offline focus balance.",
      status: task.status || "pending"
    };
  });
};
