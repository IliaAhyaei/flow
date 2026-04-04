import express from "express";
import cors from "cors";
import { config } from "dotenv";
import advisorRouter from "./routes/advisor.js";
import resourcesRouter from "./routes/resources.js";

config(); // Load .env

const app = express();
const PORT = parseInt(process.env.API_PORT ?? "3001", 10);

// ─── Middleware ───────────────────────────────────────────────────────────

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:8082", "http://localhost:5173"],
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// ─── Routes ───────────────────────────────────────────────────────────────

app.use("/api/advisor", advisorRouter);
app.use("/api/resources", resourcesRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    anthropicConfigured: !!process.env.ANTHROPIC_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🧭 Flow API server running on http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "⚠️  ANTHROPIC_API_KEY not set — advisor chat will return an error."
    );
    console.warn("   Set it in .env: ANTHROPIC_API_KEY=sk-ant-...\n");
  } else {
    console.log("✓  Anthropic API key configured\n");
  }
});

export default app;
