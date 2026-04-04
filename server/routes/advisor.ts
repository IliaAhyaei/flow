import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { buildFinancialContext, buildSystemPrompt, buildInterpretSystemPrompt } from "../lib/contextBuilder.js";

const router = Router();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── POST /api/advisor/chat ───────────────────────────────────────────────

router.post("/chat", async (req: Request, res: Response) => {
  const { message, plan, currentPage, history, mode } = req.body;

  if (!message?.trim()) {
    res.status(400).json({ error: "Message is required" });
    return;
  }

  // Build financial context from user's plan
  const context = buildFinancialContext(plan ?? {}, currentPage);
  // Interpret mode uses a constrained prompt — explanation only, no advice
  const systemPrompt = mode === "interpret" ? buildInterpretSystemPrompt() : buildSystemPrompt();

  // Build message history for multi-turn conversation
  const messages: Anthropic.MessageParam[] = [];

  // Include prior conversation history (last 8 turns max)
  const recentHistory = (history ?? []).slice(-8);
  for (const msg of recentHistory) {
    messages.push({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    });
  }

  // Add current message with financial context prepended on first user turn
  const userContent =
    messages.length === 0
      ? `Here is my financial context:\n\n${context}\n\n---\n\nMy question: ${message}`
      : message;

  messages.push({ role: "user", content: userContent });

  // Set up SSE streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders();

  try {
    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: mode === "interpret" ? 256 : 1024,
      system: systemPrompt,
      messages,
    });

    let fullResponse = "";

    stream.on("text", (text) => {
      fullResponse += text;
      res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
    });

    stream.on("error", (err) => {
      console.error("[Advisor stream error]", err);
      res.write(`data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`);
      res.end();
    });

    await stream.finalMessage();

    // Extract SUGGESTIONS from the response if present
    const suggestions: string[] = [];
    const suggestionMatch = fullResponse.match(/SUGGESTIONS:\s*\[([^\]]+)\]/);
    if (suggestionMatch) {
      try {
        const raw = "[" + suggestionMatch[1] + "]";
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) suggestions.push(...parsed.slice(0, 3));
      } catch {
        // ignore parse errors
      }
    }

    res.write(
      `data: ${JSON.stringify({ done: true, suggestions })}\n\n`
    );
    res.end();
  } catch (err: any) {
    console.error("[Advisor API error]", err?.message ?? err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get advisor response" });
    } else {
      res.write(
        `data: ${JSON.stringify({
          error:
            "I'm unable to respond right now. Please check that your ANTHROPIC_API_KEY is set correctly.",
        })}\n\n`
      );
      res.end();
    }
  }
});

export default router;
