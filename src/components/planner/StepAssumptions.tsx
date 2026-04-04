import { usePlanStore } from "@/store/planStore";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import type { StrategyMode } from "@/types/financial";
import { STRATEGY_DESCRIPTIONS, STRATEGY_RETURNS } from "@/lib/canadianRules";
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcMonthlyContributions,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { TrendingUp, Shield, Zap } from "lucide-react";

const STRATEGY_ICONS = {
  conservative: Shield,
  balanced: TrendingUp,
  growth: Zap,
};

const STRATEGY_LABELS = {
  conservative: "Conservative",
  balanced: "Balanced",
  growth: "Growth",
};

export default function StepAssumptions() {
  const { plan, updateAssumptions } = usePlanStore();
  const { assumptions, income, expenses, assets, goals } = plan;

  const wantsBuyHome = goals.some(
    (g) => g.goalType === "buy-home" && g.selected
  );

  const totalIncome = calcMonthlyIncome(income);
  const totalExpenses = calcMonthlyExpenses(expenses);
  const monthlyContribs = calcMonthlyContributions(assets);
  const surplus = totalIncome - totalExpenses;
  const remainingCash = Math.max(0, surplus - monthlyContribs);

  const conservativeAmount = Math.max(100, Math.round(remainingCash * 0.25));
  const comfortableAmount = Math.max(200, Math.round(remainingCash * 0.5));
  const stretchAmount = Math.max(300, Math.round(remainingCash * 0.75));

  const modes: StrategyMode[] = ["conservative", "balanced", "growth"];

  return (
    <div className="space-y-6">
      {/* Remaining cash context */}
      {remainingCash > 200 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium text-white/50">
              Remaining monthly cash
            </p>
            <p className="text-lg font-bold tabular-nums text-white">
              ~${remainingCash.toLocaleString("en-CA")}
            </p>
          </div>
          <p className="text-[11px] text-white/25">
            After expenses &amp; current contributions. Suggested allocation:
          </p>
          <div className="space-y-1.5">
            {(wantsBuyHome
              ? [
                  { label: "FHSA / Down payment savings", pct: 0.4, color: "text-blue-400" },
                  { label: "Emergency fund top-up", pct: 0.25, color: "text-emerald-400" },
                  { label: "RRSP / investing", pct: 0.2, color: "text-violet-400" },
                  { label: "Lifestyle buffer", pct: 0.15, color: "text-amber-400" },
                ]
              : [
                  { label: "TFSA / RRSP investing", pct: 0.5, color: "text-blue-400" },
                  { label: "Emergency fund top-up", pct: 0.25, color: "text-emerald-400" },
                  { label: "Other goals", pct: 0.1, color: "text-violet-400" },
                  { label: "Lifestyle buffer", pct: 0.15, color: "text-amber-400" },
                ]
            ).map(({ label, pct, color }) => (
              <div
                key={label}
                className="flex items-center justify-between"
              >
                <span className={cn("text-[11px]", color)}>{label}</span>
                <span className={cn("text-[11px] tabular-nums font-medium", color)}>
                  ${Math.round(remainingCash * pct).toLocaleString("en-CA")}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly savings capacity */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
          Monthly savings capacity
        </p>
        <p className="text-xs text-white/30 leading-relaxed">
          How much can you comfortably set aside each month for savings and
          investments, on top of existing contributions?
        </p>

        {/* Quick picks */}
        {remainingCash > 0 && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: `Conservative — $${conservativeAmount}/mo`, value: conservativeAmount },
              { label: `Comfortable — $${comfortableAmount}/mo`, value: comfortableAmount },
              { label: `Stretch — $${stretchAmount}/mo`, value: stretchAmount },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() =>
                  updateAssumptions({
                    monthlyAmountUserCanComfortablySetAside: value,
                  })
                }
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  assumptions.monthlyAmountUserCanComfortablySetAside === value
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                    : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/15"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Custom input */}
        <div className="flex items-center gap-3">
          <div className="relative w-44">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/25">
              $
            </span>
            <Input
              type="number"
              value={assumptions.monthlyAmountUserCanComfortablySetAside || ""}
              onChange={(e) =>
                updateAssumptions({
                  monthlyAmountUserCanComfortablySetAside:
                    parseFloat(e.target.value) || 0,
                })
              }
              placeholder="Custom"
              min={0}
              className="pl-6 pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
              /mo
            </span>
          </div>
        </div>
      </div>

      {/* Investment strategy */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
          Investment strategy
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {modes.map((mode) => {
            const Icon = STRATEGY_ICONS[mode];
            const isActive =
              assumptions.preferredStrategyMode === mode &&
              assumptions.expectedAnnualReturn === STRATEGY_RETURNS[mode];
            return (
              <button
                key={mode}
                onClick={() => {
                  updateAssumptions({
                    preferredStrategyMode: mode,
                    expectedAnnualReturn: STRATEGY_RETURNS[mode],
                  });
                }}
                className={cn(
                  "rounded-xl border p-4 text-left transition-all",
                  isActive
                    ? "border-blue-500/30 bg-blue-500/[0.07]"
                    : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12]"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 mb-2",
                    isActive ? "text-blue-400" : "text-white/25"
                  )}
                />
                <p
                  className={cn(
                    "text-xs font-semibold mb-1",
                    isActive ? "text-white" : "text-white/55"
                  )}
                >
                  {STRATEGY_LABELS[mode]}
                </p>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  {STRATEGY_DESCRIPTIONS[mode]}
                </p>
                <p
                  className={cn(
                    "text-[11px] font-medium mt-2",
                    isActive ? "text-blue-400" : "text-white/30"
                  )}
                >
                  ~{STRATEGY_RETURNS[mode]}% annual return
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Planning assumptions */}
      <div className="space-y-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
          Planning assumptions
        </p>

        {/* Expected return slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/55">
              Expected annual investment return
            </label>
            <span className="text-xs font-semibold tabular-nums text-white/70">
              {assumptions.expectedAnnualReturn}%
            </span>
          </div>
          <Slider
            value={[assumptions.expectedAnnualReturn]}
            onValueChange={([v]) =>
              updateAssumptions({ expectedAnnualReturn: v })
            }
            min={1}
            max={12}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-white/22">
            <span>1% (GIC/bonds)</span>
            <span>12% (aggressive)</span>
          </div>
        </div>

        {/* Inflation slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/55">
              Expected annual inflation rate
            </label>
            <span className="text-xs font-semibold tabular-nums text-white/70">
              {assumptions.expectedInflationRate}%
            </span>
          </div>
          <Slider
            value={[assumptions.expectedInflationRate]}
            onValueChange={([v]) =>
              updateAssumptions({ expectedInflationRate: v })
            }
            min={1}
            max={6}
            step={0.1}
            className="w-full"
          />
          <p className="text-[10px] text-white/22">
            Bank of Canada targets 2%. We default to 2.5% as a buffer.
          </p>
        </div>

        {/* Income growth slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/55">
              Expected annual income growth
            </label>
            <span className="text-xs font-semibold tabular-nums text-white/70">
              {(assumptions.annualIncomeGrowthRate ?? 2).toFixed(1)}%
            </span>
          </div>
          <Slider
            value={[assumptions.annualIncomeGrowthRate ?? 2]}
            onValueChange={([v]) =>
              updateAssumptions({ annualIncomeGrowthRate: v })
            }
            min={0}
            max={6}
            step={0.5}
            className="w-full"
          />
          <p className="text-[10px] text-white/22">
            Canadian average wage growth is ~2–3%/yr. Higher growth means
            larger contributions over time.
          </p>
        </div>

        {/* Desired retirement income */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/55 block">
            Desired annual retirement income
          </label>
          <p className="text-[11px] text-white/25">
            In today's dollars. Most Canadians plan for 70–80% of current income.
          </p>
          <div className="relative w-full sm:w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/25">
              $
            </span>
            <Input
              type="number"
              value={assumptions.desiredRetirementIncomeToday || ""}
              onChange={(e) =>
                updateAssumptions({
                  desiredRetirementIncomeToday: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="50,000"
              min={0}
              className="pl-6 pr-14 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
              /year
            </span>
          </div>
        </div>

        {/* CPP */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/55 block">
            Expected CPP benefit
          </label>
          <p className="text-[11px] text-white/25">
            Average ~$10,000/yr ($831/mo); maximum ~$17,200/yr. Check My
            Service Canada for your estimate.
          </p>
          <div className="relative w-full sm:w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/25">
              $
            </span>
            <Input
              type="number"
              value={assumptions.expectedCppBenefit ?? ""}
              onChange={(e) =>
                updateAssumptions({
                  expectedCppBenefit: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="10,000"
              min={0}
              className="pl-6 pr-14 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
              /year
            </span>
          </div>
        </div>

        {/* OAS */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/55 block">
            Expected OAS benefit
          </label>
          <p className="text-[11px] text-white/25">
            Old Age Security — available at 65. Currently ~$8,700/yr ($727/mo).
            Enter 0 if retiring before 65 or deferring.
          </p>
          <div className="relative w-full sm:w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/25">
              $
            </span>
            <Input
              type="number"
              value={assumptions.expectedOasBenefit ?? ""}
              onChange={(e) =>
                updateAssumptions({
                  expectedOasBenefit: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="8,700"
              min={0}
              className="pl-6 pr-14 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
              /year
            </span>
          </div>
        </div>

        {/* Emergency fund target */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-white/55">
              Emergency fund target
            </label>
            <span className="text-xs font-semibold text-white/70">
              {assumptions.emergencyFundTargetMonths} months
            </span>
          </div>
          <Slider
            value={[assumptions.emergencyFundTargetMonths]}
            onValueChange={([v]) =>
              updateAssumptions({ emergencyFundTargetMonths: v })
            }
            min={1}
            max={12}
            step={1}
            className="w-full"
          />
          <p className="text-[10px] text-white/22">
            3 months minimum · 6 months recommended
          </p>
        </div>
      </div>
    </div>
  );
}
