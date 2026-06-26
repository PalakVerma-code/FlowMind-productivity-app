import express from "express";
import path from "path";
import dotenv from "dotenv";
import calendarRouter from "./server/routes/calendar.js";
import tasksRouter from "./server/routes/tasks.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Main modular sub-routers
app.use(calendarRouter);
app.use(tasksRouter);

// Serve frontend assets or fall back to single page application router in production
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FlowMind companion backend running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("Critical: Companion backend failed to build/start:", error);
});
