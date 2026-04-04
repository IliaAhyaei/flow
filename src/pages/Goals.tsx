import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/store/planStore";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Minus,
  ClipboardList,
  Target,
  Info,
} from "lucide-react";
import { fmt } from "@/lib/calculations";
import { buildGoalNarratives } from "@/lib/interpretation";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  "on-track": {
    label: "On track",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/25",
    bar: "bg-emerald-500",
  },
  "partially-on-track": {
    label: "Needs attention",
    icon: Minus,
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/25",
    bar: "bg-amber-500",
  },
  "off-track": {
    label: "Behind schedule",
    icon: XCircle,
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/25",
    bar: "bg-red-500",
  },
  "no-target": {
    label: "No target set",
    icon: Target,
    color: "text-white/50",
    bg: "bg-white/8",
    border: "border-white/10",
    bar: "bg-white/15",
  },
};

function GoalProgressCard({
  readiness,
  narrative,
}: {
  readiness: any;
  narrative: any;
}) {
  const config =
    STATUS_CONFIG[readiness.status as keyof typeof STATUS_CONFIG];
  const Icon = config.icon;

  const progressPercent =
    readiness.targetAmount && readiness.currentSaved
      ? Math.min(
          100,
          Math.round((readiness.currentSaved / readiness.targetAmount) * 100)
        )
      : null;

  return (
    <div className={cn("glass rounded-xl p-5 border", config.border)}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-card-foreground leading-snug flex-1">
          {readiness.label}
        </h3>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0",
            config.bg,
            config.color
          )}
        >
          <Icon className="h-3 w-3" />
          {config.label}
        </div>
      </div>

      {/* Narrative status statement — consequence-first */}
      {narrative && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 bg-white/5 rounded-lg p-2.5">
          {narrative.statusStatement}
        </p>
      )}

      {readiness.targetAmount && (
        <>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Current progress</span>
            <span className="tabular-nums text-card-foreground font-medium">
              {progressPercent !== null ? `${progressPercent}%` : "—"}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div
              className={cn("h-full rounded-full transition-all", config.bar)}
              style={{ width: `${progressPercent ?? 0}%` }}
            />
          </div>
        </>
      )}

      <div className="space-y-1.5">
        {readiness.currentSaved > 0 && (
          <Row label="Currently saved" value={fmt(readiness.currentSaved)} />
        )}
        {readiness.targetAmount && (
          <Row label="Target amount" value={fmt(readiness.targetAmount)} />
        )}
        {readiness.targetYear && (
          <Row label="Target year" value={String(readiness.targetYear)} />
        )}
        {readiness.monthsRemaining != null && readiness.monthsRemaining > 0 && (
          <Row
            label="Time remaining"
            value={`${readiness.monthsRemaining} months`}
          />
        )}
        {/* Allocation note — how much of the shared budget goes to this goal */}
        {readiness.allocatedMonthly != null && readiness.allocatedMonthly > 0 && (
          <Row
            label="Allocated toward this goal"
            value={`${fmt(readiness.allocatedMonthly)}/mo`}
            valueColor="text-flow-interactive"
          />
        )}
        {readiness.monthlyNeeded != null && readiness.monthlyNeeded > 0 && (
          <Row
            label="Monthly needed to hit target"
            value={`${fmt(readiness.monthlyNeeded)}/mo`}
          />
        )}
        {readiness.monthlyShortfall != null && readiness.monthlyShortfall > 0 && (
          <Row
            label="Monthly shortfall"
            value={`-${fmt(readiness.monthlyShortfall)}/mo`}
            valueColor="text-red-500"
          />
        )}
        {readiness.projectedAtTarget != null && readiness.targetAmount && (
          <Row
            label="Projected at target date"
            value={fmt(readiness.projectedAtTarget)}
            valueColor={
              readiness.projectedAtTarget >= readiness.targetAmount
                ? "text-emerald-400"
                : "text-amber-400"
            }
          />
        )}
      </div>

      {/* Adjustment suggestion */}
      {narrative?.adjustmentStatement && (
        <div className="mt-3 flex items-start gap-2 bg-white/5 rounded-lg p-2.5">
          <Info className="h-3.5 w-3.5 text-flow-interactive shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {narrative.adjustmentStatement}
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          valueColor ?? "text-card-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}

export default function Goals() {
  const navigate = useNavigate();
  const { plan } = usePlanStore();
  const { results, goals } = plan;

  const selectedGoals = goals.filter((g) => g.selected);

  if (!plan.planCompleted || !results) {
    return (
      <div>
        <PageHeader
          title="Goals"
          subtitle="Turn priorities into financial pathways"
        />
        <div className="glass rounded-xl p-8 text-center max-w-lg mx-auto mt-4">
          <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-2">
            No goals yet
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Complete your financial plan to set goals and see your readiness for
            each one.
          </p>
          <Button onClick={() => navigate("/plan")}>
            Build My Plan <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const goalsWithReadiness = results.goalReadinessSummary;
  const goalNarratives = buildGoalNarratives(plan, results);
  const narrativeById = Object.fromEntries(
    goalNarratives.map((n) => [n.goalId, n])
  );

  // Bug fix #5: partiallyOnTrack was previously uncounted, silently dropped
  const { onTrack, partiallyOnTrack, offTrack, noTarget } =
    goalsWithReadiness.reduce(
      (acc, g) => {
        if (g.status === "on-track") acc.onTrack++;
        else if (g.status === "partially-on-track") acc.partiallyOnTrack++;
        else if (g.status === "off-track") acc.offTrack++;
        else if (g.status === "no-target") acc.noTarget++;
        return acc;
      },
      { onTrack: 0, partiallyOnTrack: 0, offTrack: 0, noTarget: 0 }
    );

  // Determine if goals have no priority ranks set (opportunity for guidance)
  const goalsWithTargets = goalsWithReadiness.filter((g) => g.targetAmount && g.targetYear);
  const noPrioritiesSet =
    goalsWithTargets.length > 1 &&
    plan.goals.filter((g) => g.selected && g.topPriorityRank != null).length === 0;

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Goals"
          subtitle="Your selected goals and current readiness status"
        />
        <Button
          size="sm"
          variant="outline"
          className="hidden sm:flex"
          onClick={() => navigate("/plan?step=2")}
        >
          <Plus className="h-4 w-4 mr-1" /> Edit Goals
        </Button>
      </div>

      {/* Summary strip — Bug fix #5: partiallyOnTrack now counted */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-xs font-medium text-foreground">
          <span>{selectedGoals.length} goals selected</span>
        </div>
        {onTrack > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-xs font-medium text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            {onTrack} on track
          </div>
        )}
        {partiallyOnTrack > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 text-xs font-medium text-amber-400">
            <Minus className="h-3 w-3" />
            {partiallyOnTrack} needs attention
          </div>
        )}
        {offTrack > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/15 text-xs font-medium text-red-400">
            <XCircle className="h-3 w-3" />
            {offTrack} behind schedule
          </div>
        )}
        {noTarget > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-xs font-medium text-white/50">
            {noTarget} without targets
          </div>
        )}
      </div>

      {/* Priority allocation notice */}
      {noPrioritiesSet && (
        <div className="mb-5 flex items-start gap-3 glass-subtle rounded-xl px-4 py-3">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Tip:</strong> You have{" "}
              {goalsWithTargets.length} goals competing for the same savings budget but no
              priorities set. Your budget is currently being split by urgency and
              importance defaults. Set priority ranks in your plan to control the
              allocation explicitly.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-1.5 h-7 text-xs px-2"
              onClick={() => navigate("/plan?step=2")}
            >
              Set priorities <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {goalsWithReadiness.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goalsWithReadiness.map((g) => (
            <GoalProgressCard
              key={g.goalId}
              readiness={g}
              narrative={narrativeById[g.goalId]}
            />
          ))}
        </div>
      ) : (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            No goals with targets set yet. Edit your goals to add target amounts
            and dates.
          </p>
          <Button variant="outline" onClick={() => navigate("/plan?step=2")}>
            Set goal targets <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Goals without readiness (no target) hint */}
      {noTarget > 0 && (
        <div className="mt-4 rounded-xl glass-subtle px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <strong>{noTarget} of your goals</strong> don't have target amounts
            or dates set. Add them in your plan to get readiness tracking,
            monthly savings guidance, and goal allocation estimates.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 text-xs px-2"
            onClick={() => navigate("/plan")}
          >
            Add targets <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Mobile FAB */}
      <div className="sm:hidden fixed bottom-6 right-6 z-20">
        <Button
          size="icon"
          className="h-12 w-12 rounded-full flow-shadow-md"
          onClick={() => navigate("/plan")}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
