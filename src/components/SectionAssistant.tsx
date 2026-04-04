// ─── Section Assistant ────────────────────────────────────────────────────────
//
// A controlled, inline Q&A panel embedded within each major dashboard section.
// Uses pre-built structured answers populated with the user's actual data.
// Free-text input is constrained to interpretation-only queries.
//
// Design principles:
//   • Collapsible — never intrudes when not needed
//   • Structured answers only — no open-ended AI generation for preset questions
//   • Free-text input is clearly scoped and routes to a constrained API mode
//   • Matches existing glass/dark design system exactly

import { useState, useRef, useCallback } from "react";
import {
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialPlan, CalculatedResults } from "@/types/financial";
import {
  SECTION_QUESTIONS,
  type SectionId,
  type StructuredAnswer,
} from "@/lib/assistantQuestions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SectionAssistantProps {
  section: SectionId;
  plan: FinancialPlan;
  results: CalculatedResults;
  /** Optional display name for the section, e.g. "Cash Flow" */
  label?: string;
  /** Render as a standalone card (not nested inside another card) */
  standalone?: boolean;
}

// ─── Answer display ──────────────────────────────────────────────────────────

function AnswerPanel({ answer }: { answer: StructuredAnswer }) {
  return (
    <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] overflow-hidden">
      <div className="divide-y divide-white/[0.06]">
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-flow-interactive mb-1.5">
            What it means
          </p>
          <p className="text-xs text-white/75 leading-relaxed">{answer.what}</p>
        </div>
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80 mb-1.5">
            Why it matters
          </p>
          <p className="text-xs text-white/75 leading-relaxed">{answer.why}</p>
        </div>
        {answer.action && (
          <div className="px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400/80 mb-1.5">
              What to consider
            </p>
            <p className="text-xs text-white/75 leading-relaxed">{answer.action}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Free-text panel ─────────────────────────────────────────────────────────

function FreeTextPanel({
  plan,
  section,
}: {
  plan: FinancialPlan;
  section: SectionId;
}) {
  const [input, setInput] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleAsk = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setLoading(true);
    setAnswer(null);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/advisor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          plan,
          currentPage: section,
          mode: "interpret",
          history: [],
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Unable to get a response. Make sure the server is running.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.delta) {
              accumulated += parsed.delta;
              setAnswer(accumulated);
            }
            if (parsed.done || parsed.error) break;
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError("Could not get a response. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [input, loading, plan, section]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="rounded-lg bg-primary/10 border border-primary/20 px-3 py-2 flex-1">
          <p className="text-[10px] font-semibold text-primary/80 uppercase tracking-wider mb-1">
            Interpretation only
          </p>
          <p className="text-[10px] text-white/40 leading-relaxed">
            Ask to explain what a number, metric, or chart means. For recommendations and
            strategies, see the Advisor tab.
          </p>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. What does my savings rate of 8% mean?"
          rows={2}
          className="flex-1 resize-none text-xs rounded-xl bg-white/5 border border-white/10 placeholder:text-white/25 text-white px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary/50 min-h-[52px]"
        />
        <button
          onClick={handleAsk}
          disabled={!input.trim() || loading}
          className={cn(
            "h-[52px] w-10 shrink-0 rounded-xl flex items-center justify-center transition-all",
            input.trim() && !loading
              ? "bg-primary hover:bg-primary/90 text-white"
              : "bg-white/5 text-white/20 cursor-not-allowed"
          )}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {answer && (
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3">
          <p className="text-xs text-white/75 leading-relaxed whitespace-pre-wrap">{answer}</p>
          <p className="text-[10px] text-white/25 mt-2 italic">
            Interpretation of your plan data · Not financial advice
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SectionAssistant({
  section,
  plan,
  results,
  label,
  standalone = false,
}: SectionAssistantProps) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showFreeText, setShowFreeText] = useState(false);

  const questions = SECTION_QUESTIONS[section] ?? [];

  if (questions.length === 0) return null;

  const selectedQ = questions.find((q) => q.id === selectedId);
  const selectedAnswer = selectedQ ? selectedQ.build(plan, results) : null;

  const sectionLabel = label ?? section.charAt(0).toUpperCase() + section.slice(1);

  const handleQuestionClick = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
    } else {
      setSelectedId(id);
      setShowFreeText(false);
    }
  };

  const inner = (
    <>
      {/* ── Trigger bar ────────────────────────────────────────────── */}
      <button
        onClick={() => {
          setOpen((v) => !v);
          if (open) {
            setSelectedId(null);
            setShowFreeText(false);
          }
        }}
        className={cn(
          "w-full flex items-center justify-between px-1 py-2.5 transition-colors group",
          open ? "text-white/70" : "text-white/40 hover:text-white/60"
        )}
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-3.5 w-3.5 shrink-0 text-flow-interactive/70" />
          <span className="text-xs font-medium">
            Questions about {sectionLabel}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-white/30 mr-0.5">
            {questions.length} questions
          </span>
          {open ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* ── Expanded content ────────────────────────────────────────── */}
      {open && (
        <div className="pt-1 pb-3 space-y-4">
          {/* Question chips */}
          <div className="flex flex-wrap gap-2">
            {questions.map((q) => (
              <button
                key={q.id}
                onClick={() => handleQuestionClick(q.id)}
                className={cn(
                  "text-xs rounded-full px-3 py-1.5 border transition-all duration-150 leading-snug text-left",
                  selectedId === q.id
                    ? "bg-primary/15 border-primary/35 text-white"
                    : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white/80"
                )}
              >
                {selectedId === q.id && (
                  <CheckCircle2 className="h-3 w-3 inline mr-1.5 text-flow-interactive" />
                )}
                {q.label}
              </button>
            ))}
          </div>

          {/* Selected answer */}
          {selectedAnswer && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35 px-0.5">
                {selectedQ?.label}
              </p>
              <AnswerPanel answer={selectedAnswer} />
            </div>
          )}

          {/* Free-text toggle */}
          <div className="pt-1">
            <button
              onClick={() => {
                setShowFreeText((v) => !v);
                if (!showFreeText) setSelectedId(null);
              }}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                showFreeText
                  ? "text-white/60"
                  : "text-white/35 hover:text-white/55"
              )}
            >
              <HelpCircle className="h-3 w-3 shrink-0" />
              {showFreeText ? "Hide" : "Ask something specific about this section"}
            </button>

            {showFreeText && (
              <div className="mt-3">
                <FreeTextPanel plan={plan} section={section} />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  if (standalone) {
    return (
      <div className="glass rounded-xl px-5 pt-1 pb-1">
        <div className="border-t border-white/[0.06] pt-1">{inner}</div>
      </div>
    );
  }

  // Inline: renders as a bottom strip inside a parent card
  // Wrap in a border-top divider that matches the existing card style
  return (
    <div className="border-t border-white/[0.06] mt-4 px-0.5">
      {inner}
    </div>
  );
}
