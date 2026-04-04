import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/store/planStore";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  Lightbulb,
  ClipboardList,
  Eye,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { getScoreLabel } from "@/lib/scoring";
import { fmt, fmtFull } from "@/lib/calculations";
import {
  getCanadianInvestmentPriorityLadder,
  getProvincialNote,
  getEffectiveMarginNote,
} from "@/lib/canadianRules";
import {
  buildDashboardBrief,
  buildRetirementNarrative,
  buildEmergencyNarrative,
  buildDebtNarrative,
} from "@/lib/interpretation";
import { cn } from "@/lib/utils";
import SectionAssistant from "@/components/SectionAssistant";

const PRIORITY_STYLES = {
  high: {
    border: "border-red-500/25",
    bg: "bg-red-500/8",
    iconColor: "text-red-400",
    badge: "bg-red-500/15 text-red-400",
    icon: AlertCircle,
  },
  medium: {
    border: "border-amber-500/25",
    bg: "bg-amber-500/8",
    iconColor: "text-amber-400",
    badge: "bg-amber-500/15 text-amber-400",
    icon: Info,
  },
  low: {
    border: "border-white/10",
    bg: "bg-transparent",
    iconColor: "text-flow-interactive",
    badge: "bg-white/8 text-white/50",
    icon: Lightbulb,
  },
};

// ─── Advisor Summary section ───────────────────────────────────────────────

function AdvisorSummaryPanel({
  items,
}: {
  items: { icon: any; label: string; body: string; color: string; border: string; bg: string }[];
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className={cn("rounded-xl border p-4", item.bg, item.border)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className={cn("h-3.5 w-3.5", item.color)} />
              <span className={cn("text-[10px] font-semibold uppercase tracking-wider", item.color)}>
                {item.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function Advisor() {
  const navigate = useNavigate();
  const { plan } = usePlanStore();
  const { results, profile, goals, assumptions, assets } = plan;

  const scoreInfo = useMemo(
    () => (results ? getScoreLabel(results.financialHealthScore) : null),
    [results]
  );
  const selectedGoalTypes = useMemo(
    () => goals.filter((g) => g.selected).map((g) => g.goalType),
    [goals]
  );
  const investmentLadder = useMemo(
    () =>
      results
        ? getCanadianInvestmentPriorityLadder(
            profile,
            selectedGoalTypes,
            results.monthlySurplus,
            assets.homeMarketValue
          )
        : [],
    [profile, selectedGoalTypes, results, assets.homeMarketValue]
  );
  const provincialNote = useMemo(
    () => getProvincialNote(profile.province),
    [profile.province]
  );
  const taxNote = useMemo(
    () => getEffectiveMarginNote(profile.annualGrossIncome),
    [profile.annualGrossIncome]
  );

  // Narrative engines
  const brief = useMemo(
    () => (results ? buildDashboardBrief(plan, results) : null),
    [plan, results]
  );
  const retirementNarrative = useMemo(
    () => (results ? buildRetirementNarrative(plan, results) : null),
    [plan, results]
  );
  const emergencyNarrative = useMemo(
    () => (results ? buildEmergencyNarrative(plan, results) : null),
    [plan, results]
  );
  const debtNarrative = useMemo(
    () => (results ? buildDebtNarrative(plan, results) : null),
    [plan, results]
  );

  if (!plan.planCompleted || !results || !scoreInfo || !brief) {
    return (
      <div>
        <PageHeader
          title="Flow Advisor"
          subtitle="Personalized guidance based on your financial plan"
        />
        <div className="max-w-3xl mx-auto">
          <div className="glass rounded-xl p-8 text-center">
            <ClipboardList className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-base font-semibold text-foreground mb-2">
              Complete your financial plan first
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Flow Advisor generates personalized recommendations based on your
              real income, debts, assets, and goals. Add your details to unlock
              your personalized analysis.
            </p>
            <Button onClick={() => navigate("/app/plan")}>
              Start My Plan <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Build the "what I see / worries / opportunities / prioritize" items
  const summaryItems = [
    {
      icon: Eye,
      label: "What I see",
      body: brief.situationHeadline,
      color: "text-flow-interactive",
      border: "border-primary/20",
      bg: "bg-primary/5",
    },
    {
      icon: AlertTriangle,
      label: "What concerns me most",
      body: brief.biggestRisk.body,
      color: "text-red-400",
      border: "border-red-500/20",
      bg: "bg-red-500/5",
    },
    {
      icon: Lightbulb,
      label: "Biggest opportunity",
      body: brief.biggestOpportunity.body,
      color: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/5",
    },
    {
      icon: Zap,
      label: "What I'd prioritize first",
      body: brief.mostUrgentAction.body,
      color: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/5",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${profile.fullName ? `${profile.fullName.split(" ")[0]}'s` : "Your"} Financial Summary`}
        subtitle="Personalized analysis based on your financial plan"
      />

      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Advisor Summary ──────────────────────────────────────────── */}
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-card-foreground">
              Flow Advisor Summary
            </h2>
            <span className={cn("text-sm font-bold", scoreInfo.color)}>
              {results.financialHealthScore}/100 — {scoreInfo.label}
            </span>
          </div>
          <AdvisorSummaryPanel items={summaryItems} />

          {/* Key metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <Stat
              label="Net Worth"
              value={fmt(results.netWorth)}
              sub={results.netWorth >= 0 ? "positive" : "negative"}
            />
            <Stat
              label="Monthly Surplus"
              value={`${results.monthlySurplus >= 0 ? "+" : ""}${fmtFull(results.monthlySurplus)}`}
              sub={results.monthlySurplus >= 0 ? "positive" : "deficit"}
            />
            <Stat
              label="Contribution Rate"
              value={`${results.savingsRate}%`}
              sub={results.savingsRate >= 10 ? "positive" : "low"}
            />
            <Stat
              label="Emergency Fund"
              value={`${results.emergencyFundMonthsCovered.toFixed(1)} months`}
              sub={
                results.emergencyFundMonthsCovered >=
                assumptions.emergencyFundTargetMonths
                  ? "positive"
                  : "low"
              }
            />
            <Stat
              label="Retirement Gap"
              value={
                results.retirementGap > 0
                  ? fmt(results.retirementGap)
                  : "On track"
              }
              sub={results.retirementGap > 0 ? "negative" : "positive"}
            />
            {results.totalLiabilities > 0 && (
              <Stat
                label="Avg. Debt Rate"
                value={`${results.weightedAverageDebtInterest.toFixed(1)}%`}
                sub={
                  results.weightedAverageDebtInterest >
                  assumptions.expectedAnnualReturn
                    ? "negative"
                    : "positive"
                }
              />
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed bg-white/5 rounded-lg p-3">
            {scoreInfo.description}{" "}
            {results.freeCashAfterContributions > 200
              ? `After your current contributions, you have approximately ${fmt(results.freeCashAfterContributions)}/month in undeployed surplus that could be directed toward your highest-priority goal.`
              : "Focus on the recommendations below to strengthen each area of your financial health."}
          </p>
          <SectionAssistant section="advisor" plan={plan} results={results} label="this summary" />
        </div>

        {/* ── Retirement ───────────────────────────────────────────────── */}
        {retirementNarrative && results.yearsToRetirement > 0 && (
          <div className="glass rounded-xl p-5">
            <h2 className="text-base font-semibold text-card-foreground mb-3">
              Retirement Analysis
            </h2>
            <div className="space-y-2">
              <NarrativeRow icon={TrendingUp} text={retirementNarrative.currentPathStatement} />
              <NarrativeRow icon={Info} text={retirementNarrative.requirementStatement} />
              {retirementNarrative.gapStatement && (
                <NarrativeRow
                  icon={AlertCircle}
                  text={retirementNarrative.gapStatement}
                  accent="text-red-400"
                />
              )}
              {retirementNarrative.closeGapOptions && (
                <NarrativeRow icon={Zap} text={retirementNarrative.closeGapOptions} accent="text-amber-400" />
              )}
              <NarrativeRow icon={Info} text={retirementNarrative.timeframeNote} muted />
            </div>
            <SectionAssistant section="retirement" plan={plan} results={results} label="Retirement" />
          </div>
        )}

        {/* ── Emergency Fund ───────────────────────────────────────────── */}
        {emergencyNarrative && (
          <div className="glass rounded-xl p-5">
            <h2 className="text-base font-semibold text-card-foreground mb-3">
              Emergency Reserve
            </h2>
            <div className="space-y-2">
              <NarrativeRow icon={Info} text={emergencyNarrative.coverageStatement} />
              {emergencyNarrative.gapStatement && (
                <NarrativeRow
                  icon={AlertCircle}
                  text={emergencyNarrative.gapStatement}
                  accent={results.emergencyFundMonthsCovered < 2 ? "text-red-400" : "text-amber-400"}
                />
              )}
              <NarrativeRow
                icon={results.emergencyFundGap === 0 ? CheckCircle2 : AlertTriangle}
                text={emergencyNarrative.urgencyNote}
                accent={results.emergencyFundGap === 0 ? "text-emerald-400" : undefined}
              />
              {emergencyNarrative.actionStatement && (
                <NarrativeRow icon={Zap} text={emergencyNarrative.actionStatement} accent="text-flow-interactive" />
              )}
            </div>
            <SectionAssistant section="emergency" plan={plan} results={results} label="Emergency Reserve" />
          </div>
        )}

        {/* ── Debt ─────────────────────────────────────────────────────── */}
        {debtNarrative && (
          <div className="glass rounded-xl p-5">
            <h2 className="text-base font-semibold text-card-foreground mb-3">
              Debt Analysis
            </h2>
            <div className="space-y-2">
              <NarrativeRow icon={Info} text={debtNarrative.contextStatement} />
              {debtNarrative.riskStatement && (
                <NarrativeRow
                  icon={AlertTriangle}
                  text={debtNarrative.riskStatement}
                  accent="text-red-400"
                />
              )}
              <NarrativeRow icon={Zap} text={debtNarrative.strategyStatement} accent="text-flow-interactive" />
            </div>
          </div>
        )}

        {/* ── Recommendations ──────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3">
            Your Personalized Recommendations
          </h2>
          <div className="space-y-4">
            {results.recommendations.map((rec, idx) => {
              const style = PRIORITY_STYLES[rec.priority];
              const Icon = style.icon;
              return (
                <div
                  key={rec.id}
                  className={cn(
                    "rounded-xl border p-5 space-y-3",
                    style.border,
                    style.bg
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-muted-foreground/60">
                        {idx + 1}
                      </span>
                      <Icon className={cn("h-4 w-4", style.iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-foreground leading-snug flex-1">
                          {rec.title}
                        </h3>
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                            style.badge
                          )}
                        >
                          {rec.priority === "high"
                            ? "High priority"
                            : rec.priority === "medium"
                            ? "Medium priority"
                            : "Consider"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {rec.explanation}
                  </p>

                  <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                    <p className="text-xs font-semibold text-foreground mb-1">
                      Why this matters
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {rec.whyItMatters}
                    </p>
                  </div>

                  {rec.estimatedImpact && (
                    <p className="text-xs font-medium text-flow-interactive">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      {rec.estimatedImpact}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      navigate(
                        rec.actionRoute.startsWith("/plan")
                          ? rec.actionRoute
                          : rec.actionRoute
                      )
                    }
                    className="bg-background"
                  >
                    {rec.actionLabel} <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Canadian account priority ladder ─────────────────────────── */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-base font-semibold text-card-foreground mb-1">
            🍁 Your Canadian Account Priority Ladder
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Based on your goals and income, here's the recommended order to fill
            your accounts — from most tax-efficient to least. Not following this
            order leaves tax savings on the table.
          </p>
          <div className="space-y-3">
            {investmentLadder.map((item, idx) => (
              <div key={item.account} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-card-foreground">
                    {item.account}
                    {item.monthlyTarget && (
                      <span className="text-xs font-normal text-flow-interactive ml-2">
                        ~{fmtFull(item.monthlyTarget)}/mo recommended
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {item.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tax context ───────────────────────────────────────────────── */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-base font-semibold text-card-foreground mb-2">
            Tax Context for Your Situation
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            {taxNote}
          </p>
          {provincialNote && (
            <div className="rounded-lg bg-white/5 border border-white/10 p-3">
              <p className="text-xs font-semibold text-foreground mb-1">
                {profile.province} provincial note
              </p>
              <p className="text-xs text-muted-foreground">{provincialNote}</p>
            </div>
          )}
        </div>

        {/* ── CPP / OAS ────────────────────────────────────────────────── */}
        <div className="glass rounded-xl p-5">
          <h2 className="text-base font-semibold text-card-foreground mb-2">
            Government Retirement Benefits (Context)
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            These estimates are not included in your Flow retirement projection
            — they represent potential additional income on top of your savings.
            Your actual amounts depend on your contribution history with
            Service Canada.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs font-semibold text-foreground">
                CPP/QPP at age 65
              </p>
              <p className="text-sm font-bold text-card-foreground mt-1">
                ~$500–$1,364/month
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Depends on years of contributions and earnings. Contributions
                begin after 1 year in Canada.
              </p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-xs font-semibold text-foreground">
                OAS at age 65
              </p>
              <p className="text-sm font-bold text-card-foreground mt-1">
                ~$727/month (2025)
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Available after 10 years of residency in Canada. Indexed to
                inflation.
              </p>
            </div>
          </div>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <div className="glass-subtle rounded-xl p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Disclaimer:</strong> Flow provides financial education and
            planning tools, not regulated financial advice. All projections are
            estimates based on the assumptions you provided and are not
            guarantees of future performance. For personalized investment
            advice, consult a licensed financial advisor in Canada.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────

function NarrativeRow({
  icon: Icon,
  text,
  accent,
  muted,
}: {
  icon: any;
  text: string;
  accent?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0 mt-0.5",
          accent ?? (muted ? "text-muted-foreground/50" : "text-muted-foreground")
        )}
      />
      <p
        className={cn(
          "text-sm leading-relaxed",
          muted ? "text-muted-foreground/60" : "text-muted-foreground"
        )}
      >
        {text}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: "positive" | "negative" | "low" | "deficit" | string;
}) {
  const isPositive = sub === "positive";
  const isNegative = sub === "negative" || sub === "deficit";
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <p className="text-[11px] text-muted-foreground mb-1">{label}</p>
      <p
        className={cn(
          "text-base font-bold tabular-nums",
          isPositive
            ? "text-emerald-400"
            : isNegative
            ? "text-red-400"
            : "text-amber-400"
        )}
      >
        {value}
      </p>
    </div>
  );
}
