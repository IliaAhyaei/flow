import { useState, useRef, useCallback } from "react";
import type { FinancialPlan } from "@/types/financial";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

interface UseAdvisorChatOptions {
  plan: FinancialPlan | null;
  currentPage?: string;
}

export function useAdvisorChat({ plan, currentPage = "" }: UseAdvisorChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;

      setError(null);

      const userMsg: ChatMessage = { id: uid(), role: "user", content: userText.trim() };
      setMessages((prev) => [...prev, userMsg]);

      const assistantId = uid();
      const assistantMsg: ChatMessage = { id: assistantId, role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      setIsStreaming(true);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/advisor/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            message: userText.trim(),
            plan: plan ?? null,
            currentPage,
            history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          }),
        });

        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw) continue;

            try {
              const payload = JSON.parse(raw);

              if (payload.delta) {
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (!last || last.id !== assistantId) return prev;
                  return [...prev.slice(0, -1), { ...last, content: last.content + payload.delta }];
                });
              }

              if (payload.done && payload.suggestions?.length) {
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (!last || last.id !== assistantId) return prev;
                  return [...prev.slice(0, -1), { ...last, suggestions: payload.suggestions }];
                });
              }
            } catch {
              // malformed chunk — skip
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // user cancelled
        } else {
          const msg = err instanceof Error ? err.message : "Something went wrong.";
          setError(msg);
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.id !== assistantId) return prev;
            return [...prev.slice(0, -1), { ...last, content: "Sorry, I couldn't get a response right now. Please try again." }];
          });
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, plan, currentPage, isStreaming]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages };
}
