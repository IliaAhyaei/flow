import { useState, useRef, useEffect, useMemo, useCallback, memo } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare, X, Send, Square, Compass, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import { useAdvisorChat } from "@/hooks/useAdvisorChat";

// ─── Context-aware suggested prompts ──────────────────────────────────────

function getSuggestedPrompts(pathname: string, hasPlan: boolean): string[] {
  if (!hasPlan) {
    return [
      "I'm new to Canada — where should I start financially?",
      "What is a TFSA and why does it matter?",
      "What accounts should I open first?",
      "How much should I save each month?",
    ];
  }
  if (pathname === "/" || pathname === "/dashboard") {
    return [
      "What does my financial health score mean?",
      "Which recommendation should I act on first?",
      "Am I on track for retirement?",
    ];
  }
  if (pathname.startsWith("/goals")) {
    return [
      "How long will it take to save for a home?",
      "What's a realistic retirement target for me?",
      "How do I build an emergency fund?",
    ];
  }
  if (pathname.startsWith("/advisor")) {
    return [
      "Explain my top recommendation in detail.",
      "What's the FHSA and do I qualify?",
      "How does CPP work for me?",
    ];
  }
  if (pathname.startsWith("/scenarios")) {
    return [
      "What change would make the biggest difference?",
      "How much better off will I be if I follow the plan?",
    ];
  }
  if (pathname.startsWith("/resources")) {
    return [
      "Which programs apply to me right now?",
      "How do I apply for the FHSA?",
      "What newcomer benefits can I access?",
    ];
  }
  if (pathname.startsWith("/insights")) {
    return [
      "Which insight should I act on this month?",
      "Is my savings rate good enough?",
    ];
  }
  return [
    "What should I focus on this month?",
    "Explain my financial health score.",
    "What Canadian programs can I access?",
  ];
}

// ─── Typing indicator ─────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-4">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────

const MessageBubble = memo(function MessageBubble({
  role,
  content,
  suggestions,
  onSuggestion,
}: {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  onSuggestion: (text: string) => void;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
          isUser
            ? "bg-flow text-white rounded-br-sm"
            : "bg-white/8 text-foreground rounded-bl-sm"
        )}
      >
        {content || <TypingDots />}
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-col gap-1.5 max-w-[92%] w-full">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 hover:bg-white/10 hover:border-white/20 transition-all duration-200 text-left text-white/80 leading-snug"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// ─── Main component ───────────────────────────────────────────────────────

export default function FloatingAdvisor() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const location = useLocation();
  const { plan } = usePlanStore();
  const hasPlan = plan.planCompleted;

  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages } =
    useAdvisorChat({ plan: hasPlan ? plan : null, currentPage: location.pathname });

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestedPrompts = useMemo(
    () => getSuggestedPrompts(location.pathname, hasPlan),
    [location.pathname, hasPlan]
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  // Focus input when drawer opens
  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = useCallback((text: string) => {
    if (isStreaming) return;
    sendMessage(text);
  }, [isStreaming, sendMessage]);

  const showEmptyState = messages.length === 0;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-md lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          // Base layout
          "fixed z-50 flex flex-col glass-strong",
          // Desktop: right-side panel, 400px wide, full screen height from bottom
          "sm:bottom-0 sm:right-0 sm:w-[400px] sm:rounded-tl-2xl sm:rounded-bl-none sm:rounded-tr-none sm:rounded-br-none sm:border-r-0 sm:border-b-0",
          // Mobile: bottom sheet, full width
          "bottom-0 right-0 w-full rounded-t-2xl sm:rounded-t-none",
          // Height
          "h-[85vh] sm:h-[min(620px,calc(100vh-3.5rem))]",
          // Shadow
          "shadow-2xl",
          // Transition
          "transition-transform duration-300 ease-in-out",
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-flow flex items-center justify-center shadow-sm">
              <Compass className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">
                Flow Advisor
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isStreaming ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
                  </span>
                ) : (
                  "AI financial guide · Education only"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            {messages.length > 0 && !isStreaming && (
              <button
                onClick={clearMessages}
                title="Clear conversation"
                className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {showEmptyState ? (
            <div className="flex flex-col items-center justify-center h-full gap-5 pb-4">
              <div className="h-14 w-14 rounded-2xl bg-flow/10 flex items-center justify-center">
                <Compass className="h-7 w-7 text-flow" />
              </div>
              <div className="text-center space-y-1.5">
                <p className="text-sm font-semibold text-foreground">
                  {hasPlan ? "Ask about your finances" : "Your AI financial guide"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[260px]">
                  {hasPlan
                    ? "I can see your plan data and answer questions about your specific numbers."
                    : "Complete your plan for personalized advice, or ask me general Canadian finance questions."}
                </p>
              </div>

              <div className="w-full space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground text-center">
                  Suggested questions
                </p>
                <div className="flex flex-col gap-2">
                  {suggestedPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSuggestion(p)}
                      className="text-sm text-left bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 rounded-xl px-4 py-3 transition-all duration-200 text-white/80 leading-snug"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  suggestions={msg.suggestions}
                  onSuggestion={handleSuggestion}
                />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="shrink-0 border-t border-white/[0.08] px-4 py-3">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={1}
              className="flex-1 resize-none min-h-[42px] max-h-[120px] text-sm rounded-xl bg-white/5 border-white/10 placeholder:text-white/30 text-white focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary/50"
            />
            {isStreaming ? (
              <Button
                size="icon"
                variant="outline"
                onClick={stopStreaming}
                title="Stop response"
                className="h-[42px] w-[42px] shrink-0 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim()}
                className="h-[42px] w-[42px] shrink-0 rounded-xl bg-flow hover:bg-flow-dark text-white disabled:opacity-40"

              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center leading-relaxed">
            For educational purposes only — not regulated financial advice.
          </p>
        </div>
      </div>

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Flow Advisor"
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-white",
          "flex items-center justify-center glow-primary-sm",
          "transition-all duration-200 hover:scale-105 active:scale-95 hover:glow-primary",
          open && "opacity-0 pointer-events-none scale-90"
        )}
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </>
  );
}
