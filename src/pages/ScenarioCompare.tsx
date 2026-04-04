import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/store/planStore";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { fmt, fmtFull } from "@/lib/calculations";
import { buildScenarioNarrative } from "@/lib/interpretation";
import { cn } from "@/lib/utils";

export default function ScenarioCompare() {
  const navigate = useNavigate();
  const { plan } = usePlanStore();
  const { results, profile } = plan;

  const [realDollars, setRealDollars] = useState(false);
  const inflationRate = plan.assumptions.expectedInflationRate / 100;

  const projectionData = useMemo(() => {
    if (!results) return [];
    return results.projectionSeries.map((p) => {
      const deflate = (nominal: number) =>
        p.year === 0
          ? nominal
          : Math.round(nominal / Math.pow(1 + inflationRate, p.year));
      return {
        label: p.label,
        "Current Path": realDollars ? deflate(p.currentPath) : p.currentPath,
        "Recommended Path": realDollars
          ? deflate(p.recommendedPath)
          : p.recommendedPath,
      };
    });
  }, [results, realDollars, inflationRate]);

  const retirementAge = profile.retirementAge;
  const retirementPoint = results?.projectionSeries.find(
    (p) => p.age === retirementAge
  );

  const currentAtRetirement = retirementPoint?.currentPath ?? 0;
  const recommendedAtRetirement = retirementPoint?.recommendedPath ?? 0;
  const difference = recommendedAtRetirement - currentAtRetirement;
  const differencePercent =
    currentAtRetirement > 0
      ? Math.round((difference / currentAtRetirement) * 100)
      : 0;

  const narrative = useMemo(
    () =>
      results
        ? buildScenarioNarrative(
            plan,
            results,
            currentAtRetirement,
            recommendedAtRetirement
          )
        : null,
    [plan, results, currentAtRetirement, recommendedAtRetirement]
  );

  if (!results || !narrative) {
    return (
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <PageHeader
          title="Compare Paths"
          subtitle="Complete your financial plan to see your personalized comparison."
        />
        <Button onClick={() => navigate("/plan")} className="mt-4">
          Start My Plan <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Bug fix #6: use the same label format as the projection series
  const retirementYearsFromNow = retirementAge - profile.age;
  const retirementRefLineX =
    retirementYearsFromNow === 0 ? "Today" : `Yr ${retirementYearsFromNow}`;

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <PageHeader
        title="Compare Your Paths"
        subtitle="See how your current trajectory compares to an optimized plan — based on your actual numbers."
      />

      {/* Headline stat */}
      <div className="glass rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            Potential improvement at retirement (age {retirementAge})
          </p>
          <p
            className={cn(
              "text-3xl font-bold tabular-nums",
              difference > 0 ? "text-emerald-400" : "text-muted-foreground"
            )}
          >
            {difference > 0 ? "+" : ""}
            {fmt(difference)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {differencePercent > 0
              ? `${differencePercent}% more capital with an optimized strategy`
              : "Paths are similar — your current contributions may already be close to optimal"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/advisor")}
        >
          See recommendations <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>

      {/* Two path cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Current Path */}
        <div className="glass rounded-xl p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Current Path
          </span>
          <h3 className="text-base font-semibold text-card-foreground mt-1 mb-2">
            Staying the course
          </h3>
          {/* Narrative */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 bg-white/5 rounded-lg p-2.5">
            {narrative.currentPathSummary}
          </p>
          <div className="space-y-3">
            <MetricRow
              label={`Projected capital at age ${retirementAge}`}
              value={fmt(currentAtRetirement)}
            />
            <MetricRow
              label="Monthly contributions"
              value={`${fmtFull(results.totalMonthlyContributions)}/mo`}
            />
            <MetricRow
              label="Contribution rate"
              value={`${results.savingsRate}% of income`}
            />
            <MetricRow
              label="Retirement capital gap"
              value={fmt(results.retirementGap)}
              valueColor={
                results.retirementGap > 0 ? "text-red-500" : "text-emerald-400"
              }
            />
          </div>
        </div>

        {/* Recommended Path */}
        <div className="glass rounded-xl border-2 border-primary/30 p-5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-flow-interactive">
            Recommended Path
          </span>
          <h3 className="text-base font-semibold text-card-foreground mt-1 mb-2">
            Optimized strategy
          </h3>
          {/* Narrative */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-4 bg-white/5 rounded-lg p-2.5">
            {narrative.improvedPathSummary}
          </p>
          <div className="space-y-3">
            <MetricRow
              label={`Projected capital at age ${retirementAge}`}
              value={fmt(recommendedAtRetirement)}
              valueColor="text-emerald-400"
            />
            <MetricRow
              label="Monthly savings target"
              value={`${fmtFull(plan.assumptions.monthlyAmountUserCanComfortablySetAside)}/mo`}
            />
            <MetricRow
              label="Strategy"
              value={plan.assumptions.preferredStrategyMode}
            />
            <MetricRow
              label="Expected return"
              value={`${plan.assumptions.expectedAnnualReturn}%`}
            />
          </div>
        </div>
      </div>

      {/* What the difference buys */}
      <div className="glass rounded-xl p-4 mb-6 flex items-start gap-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-foreground mb-0.5">
            What the improvement buys
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {narrative.whatYouBuy}
          </p>
          {narrative.differenceStatement && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {narrative.differenceStatement}
            </p>
          )}
        </div>
      </div>

      {/* Remaining risks on both paths */}
      {narrative.remainingRisks.length > 0 && (
        <div className="space-y-2 mb-6">
          {narrative.remainingRisks.map((risk, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3"
            >
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300 leading-relaxed">{risk}</p>
            </div>
          ))}
        </div>
      )}

      {/* Projection chart */}
      <div className="glass rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-card-foreground">
            Wealth Projection Over Time
          </h3>
          {/* Nominal / Real toggle */}
          <div className="flex items-center rounded-lg overflow-hidden border border-white/10 text-[11px] font-medium">
            <button
              onClick={() => setRealDollars(false)}
              className={`px-2.5 py-1 transition-colors ${!realDollars ? "bg-blue-500/20 text-blue-300" : "text-white/40 hover:text-white/60"}`}
            >
              Nominal $
            </button>
            <button
              onClick={() => setRealDollars(true)}
              className={`px-2.5 py-1 transition-colors ${realDollars ? "bg-blue-500/20 text-blue-300" : "text-white/40 hover:text-white/60"}`}
            >
              Today's $
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Net wealth comparison — current path vs. optimized strategy
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={projectionData}>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
              tickFormatter={(v) => fmt(v)}
            />
            <Tooltip
              formatter={(val: number, name: string) => [
                fmt(val),
                `${name}${realDollars ? " (today's $)" : " (nominal $)"}`,
              ]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(5,9,30,0.95)",
                color: "#fff",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="Current Path"
              stroke="#4A87FF"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 3"
            />
            <Line
              type="monotone"
              dataKey="Recommended Path"
              stroke="#34d399"
              strokeWidth={2.5}
              dot={false}
            />
            {retirementAge >= profile.age && (
              <ReferenceLine
                x={retirementRefLineX}
                stroke="rgba(255,255,255,0.25)"
                strokeDasharray="3 3"
                label={{
                  value: "Retirement",
                  position: "top",
                  fontSize: 10,
                  fill: "rgba(255,255,255,0.4)",
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
        <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
          {realDollars
            ? `Showing today's dollar purchasing power, deflated at ${plan.assumptions.expectedInflationRate}%/yr inflation.`
            : "Showing nominal (future) dollars — not adjusted for inflation."}
        </p>
      </div>

      {/* Key recommendations summary */}
      {results.recommendations.length > 0 && (
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            What drives the recommended path?
          </h3>
          <div className="space-y-3">
            {results.recommendations.map((rec) => (
              <div key={rec.id} className="flex items-start gap-3">
                <div className="mt-1 w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {rec.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {rec.explanation}
                  </p>
                  {rec.estimatedImpact && (
                    <p className="text-xs text-flow-interactive mt-0.5">
                      {rec.estimatedImpact}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <Button
            className="w-full mt-4"
            onClick={() => navigate("/advisor")}
          >
            See full recommendations <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Assumptions note */}
      <div className="mt-4 glass-subtle rounded-xl px-4 py-3">
        <p className="text-xs text-muted-foreground">
          <strong>Assumptions used:</strong>{" "}
          {plan.assumptions.expectedAnnualReturn}% annual return,{" "}
          {plan.assumptions.expectedInflationRate}% inflation, age{" "}
          {profile.age} today, retiring at {profile.retirementAge}. Projections
          are estimates, not guarantees. Consult a licensed financial advisor
          for personalized advice.
        </p>
      </div>
    </div>
  );
}

function MetricRow({
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
          "text-sm font-semibold tabular-nums",
          valueColor ?? "text-card-foreground"
        )}
      >
        {value}
      </span>
    </div>
  );
}
