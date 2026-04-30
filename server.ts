import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";

interface LogEntry {
  id: string;
  level: "trace" | "debug" | "info" | "warn" | "error";
  message: string;
  timestamp: string;
  metadata?: any;
  source?: string;
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;
let clients: any[] = [];

// API: Submit a log
app.post("/api/logs", (req, res) => {
  const { level, message, metadata, source } = req.body;
  
  const logEntry: LogEntry = {
    id: Math.random().toString(36).substring(7),
    level: level || "info",
    message: message || "",
    timestamp: new Date().toISOString(),
    metadata,
    source: source || "unknown",
  };

  logs.push(logEntry);
  if (logs.length > MAX_LOGS) logs.shift();

  // Notify all SSE clients
  clients.forEach(client => client.res.write(`data: ${JSON.stringify(logEntry)}\n\n`));

  res.status(202).json({ status: "accepted" });
});

// SSE: Stream logs to dashboard
app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  clients.push(newClient);

  // Send initial logs
  res.write(`data: ${JSON.stringify({ type: "init", logs })}\n\n`);

  req.on("close", () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
