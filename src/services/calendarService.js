/**
 * Client service to interface with FlowMind's backend Google Calendar proxy routes.
 */

export async function fetchPrimaryCalendarName(token) {
  try {
    const response = await fetch("/api/calendar/primary", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      return data.summary || "Primary Calendar";
    }
    if (response.status === 401) {
      throw new Error("EXPIRED");
    }
  } catch (err) {
    console.error("Error in fetchPrimaryCalendarName service:", err);
    throw err;
  }
}

export async function fetchGoogleEvents(token) {
  try {
    const timeMin = new Date();
    timeMin.setHours(0, 0, 0, 0); // start of today
    
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 1);
    timeMax.setHours(23, 59, 59, 999); // end of tomorrow
    
    const url = `/api/calendar/events?timeMin=${encodeURIComponent(timeMin.toISOString())}&timeMax=${encodeURIComponent(timeMax.toISOString())}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      return data.items || [];
    }
  } catch (err) {
    console.error("Failed to fetch Google Calendar events:", err);
  }
  return [];
}

export function mapGoogleEventsToBusySlots(googleEvents) {
  return googleEvents.map(event => {
    const start = new Date(event.start.dateTime || event.start.date);
    const end = new Date(event.end.dateTime || event.end.date);
    
    const formatHM = (date) => {
      const h = String(date.getHours()).padStart(2, '0');
      const m = String(date.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    };
    
    return {
      startTime: formatHM(start),
      endTime: formatHM(end),
      label: event.summary || "Google Calendar Event"
    };
  });
}

export async function createGoogleCalendarEvent(task, token) {
  let colorId = "5"; // default yellow
  if (task.priority?.toLowerCase() === "high") {
    colorId = "11";
  } else if (task.priority?.toLowerCase() === "low") {
    colorId = "2";
  }

  const startTime = new Date(task.scheduledDate || new Date());
  if (task.scheduledTime) {
    const [h, m] = task.scheduledTime.split(":").map(Number);
    startTime.setHours(h || 0, m || 0, 0, 0);
  }
  const endTime = new Date(startTime.getTime() + (task.duration || 30) * 60 * 1000);

  const eventBody = {
    summary: task.taskName,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    },
    description: "FlowMind: " + (task.scheduledReason || "Automated Focus Slot"),
    colorId: colorId
  };

  const response = await fetch("/api/calendar/events", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(eventBody)
  });

  if (!response.ok) {
    throw new Error(`Google API returned status ${response.status}`);
  }

  const result = await response.json();
  return result.id;
}

export async function updateGoogleCalendarEventStatus(eventId, taskName, isCompleted, priority, token) {
  let title = taskName;
  if (isCompleted) {
    if (!title.startsWith("✅ Completed: ")) {
      title = `✅ Completed: ${title}`;
    }
  } else {
    if (title.startsWith("✅ Completed: ")) {
      title = title.replace("✅ Completed: ", "");
    }
  }

  let colorId = "5"; // default yellow
  if (isCompleted) {
    colorId = "2"; // green
  } else {
    if (priority?.toLowerCase() === "high") {
      colorId = "11";
    } else if (priority?.toLowerCase() === "low") {
      colorId = "2";
    }
  }

  const response = await fetch(`/api/calendar/events/${eventId}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      summary: title,
      colorId: colorId
    })
  });

  if (!response.ok) {
    throw new Error(`Google API returned status ${response.status}`);
  }
  return true;
}
