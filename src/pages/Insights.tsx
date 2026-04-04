import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/store/planStore";
import PageHeader from "@/components/PageHeader";
import CategoryChip from "@/components/CategoryChip";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ShieldAlert,
  DollarSign,
  Target,
  ClipboardList,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildInsightNarratives } from "@/lib/interpretation";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  Spending: TrendingDown,
  Liquidity: ShieldAlert,
  Debt: AlertTriangle,
  Planning: DollarSign,
  Growth: Target,
};

const IMPACT_CONFIG = {
  Positive: {
    badge: "bg-emerald-500/15 text-emerald-400",
    border: "border-emerald-500/20",
    accent: "text-emerald-400",
  },
  High: {
    badge: "bg-red-500/15 text-red-400",
    border: "border-red-500/20",
    accent: "text-red-400",
  },
  Medium: {
    badge: "bg-amber-500/15 text-amber-400",
    border: "border-amber-500/20",
    accent: "text-amber-400",
  },
  Low: {
    badge: "bg-white/8 text-white/50",
    border: "border-white/10",
    accent: "text-white/50",
  },
};

function InsightCard({
  insight,
}: {
  insight: ReturnType<typeof buildInsightNarratives>[number];
}) {
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[insight.category] ?? Lightbulb;
  const impactConfig = IMPACT_CONFIG[insight.impact] ?? IMPACT_CONFIG.Low;

  return (
    <div
      className={cn(
        "glass rounded-xl border p-5 transition-all",
        impactConfig.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Icon className={cn("h-4 w-4", impactConfig.accent)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h3 className="text-sm font-semibold text-card-foreground leading-snug">
              {insight.title}
            </h3>
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                impactConfig.badge
              )}
            >
              {insight.impact}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground/60 uppercase tracking-wider">
            {insight.category}
          </span>
        </div>
      </div>

      {/* What */}
      <p className="text-sm text-muted-foreground leading-relaxed mt-3">
        {insight.what}
      </p>

      {/* So what / Now what — expandable */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-flow-interactive mt-2 hover:underline"
      >
        {expanded ? (
          <>
            Less detail <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Why it matters & what to do <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-foreground mb-1 uppercase tracking-wider">
              So what
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insight.soWhat}
            </p>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-flow-interactive mb-1 uppercase tracking-wider">
              Now what
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insight.nowWhat}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  "All",
  "Spending",
  "Liquidity",
  "Debt",
  "Growth",
  "Planning",
];

export default function Insights() {
  const navigate = useNavigate();
  const { plan } = usePlanStore();
  const [active, setActive] = useState("All");

  const insights = useMemo(
    () =>
      plan.planCompleted && plan.results
        ? buildInsightNarratives(plan, plan.results)
        : null,
    [plan]
  );

  if (!plan.planCompleted || !insights) {
    return (
      <div>
        <PageHeader
          title="Insights"
          subtitle="Patterns, risks, and opportunities from your financial data"
        />
        <div className="max-w-2xl glass rounded-xl p-8 text-center mt-4">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-2">
            No insights yet
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Complete your financial plan to generate personalized insights based
            on your actual income, debts, and goals.
          </p>
          <Button onClick={() => navigate("/plan")}>
            Start My Plan <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const filtered =
    active === "All"
      ? insights
      : insights.filter((i) => i.category === active);

  const highCount = insights.filter((i) => i.impact === "High").length;
  const positiveCount = insights.filter((i) => i.impact === "Positive").length;

  return (
    <div>
      <PageHeader
        title="Insights"
        subtitle="Consequences, opportunities, and next steps — based on your numbers"
      />

      {/* Summary strip */}
      {insights.length > 0 && (
        <div className="flex gap-3 mb-5 flex-wrap">
          <div className="px-3 py-1.5 rounded-full bg-white/8 text-xs font-medium text-foreground">
            {insights.length} insights generated
          </div>
          {highCount > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-red-500/15 text-xs font-medium text-red-400">
              {highCount} high-priority
            </div>
          )}
          {positiveCount > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-xs font-medium text-emerald-400">
              {positiveCount} positive
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map((c) => (
          <CategoryChip
            key={c}
            label={c}
            active={active === c}
            onClick={() => setActive(c)}
          />
        ))}
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No insights in this category.
            </p>
          </div>
        ) : (
          filtered.map((ins, i) => <InsightCard key={i} insight={ins} />)
        )}
      </div>

      {/* Update plan prompt */}
      <div className="max-w-3xl mx-auto mt-6 rounded-xl bg-white/5 border border-border px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Insights update automatically when you edit your financial plan.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => navigate("/plan")}
        >
          Update plan <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
