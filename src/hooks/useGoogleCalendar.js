import { useState, useEffect } from "react";

export function useGoogleCalendar(setSuccessMessage, setApiError) {
  const [calendarToken, setCalendarToken] = useState(localStorage.getItem("calendar_token") || null);
  const [calendarName, setCalendarName] = useState(localStorage.getItem("calendar_name") || "");
  const [mockBusySlots, setMockBusySlots] = useState(() => {
    try {
      const saved = localStorage.getItem("mock_busy_slots");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleDisconnectCalendar = () => {
    setCalendarToken(null);
    setCalendarName("");
    setMockBusySlots([]);
    localStorage.removeItem("calendar_token");
    localStorage.removeItem("calendar_name");
    localStorage.removeItem("mock_busy_slots");
    setSuccessMessage("Google Calendar disconnected.");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleConnectCalendar = async () => {
    try {
      setSuccessMessage("Connecting to Google Calendar...");
      const response = await fetch("/api/calendar/mock");
      if (!response.ok) {
        throw new Error("Failed to connect to Mock Calendar.");
      }
      const data = await response.json();
      
      const token = "mock_token";
      const name = "Google Calendar";
      
      setCalendarToken(token);
      setCalendarName(name);
      setMockBusySlots(data);
      
      localStorage.setItem("calendar_token", token);
      localStorage.setItem("calendar_name", name);
      localStorage.setItem("mock_busy_slots", JSON.stringify(data));
      
      setSuccessMessage("Google Calendar connected successfully! ✅");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Failed to connect calendar:", error);
      setApiError("Unable to connect calendar: " + error.message);
      setTimeout(() => setApiError(""), 4000);
    }
  };

  return {
    calendarToken,
    calendarName,
    mockBusySlots,
    handleConnectCalendar,
    handleDisconnectCalendar,
    setCalendarToken,
    setCalendarName,
    setMockBusySlots
  };
}
