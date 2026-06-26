import express from "express";

const router = express.Router();

// Mock Calendar Service endpoint (secure, local, and requiring no OAuth keys)
router.get("/api/calendar/mock", (req, res) => {
  res.json([
    { title: "Morning Standup", start: "09:00", end: "09:30" },
    { title: "Lunch Break", start: "13:00", end: "14:00" },
    { title: "Team Meeting", start: "15:00", end: "16:00" }
  ]);
});

export default router;
