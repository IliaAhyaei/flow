import { usePlanStore } from "@/store/planStore";
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcTotalAssets,
  calcTotalLiabilities,
  calcTotalMonthlyDebtPayments,
  calcWeightedAverageDebtRate,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";

interface LiveSummaryPanelProps {
  mode?: "income" | "assets" | "liabilities" | "full";
}

function Stat({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("text-xs font-semibold tabular-nums", valueColor)}>
        {value}
      </span>
    </div>
  );
}

function fmt(n: number, prefix = "$"): string {
  return `${prefix}${Math.abs(n).toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export default function LiveSummaryPanel({ mode = "full" }: LiveSummaryPanelProps) {
  const { plan } = usePlanStore();
  const { income, expenses, assets, liabilities } = plan;

  const totalIncome = calcMonthlyIncome(income);
  const totalExpenses = calcMonthlyExpenses(expenses);
  const surplus = totalIncome - totalExpenses;
  const totalAssets = calcTotalAssets(assets);
  const totalDebt = calcTotalLiabilities(liabilities);
  const netWorth = totalAssets - totalDebt;
  const monthlyDebt = calcTotalMonthlyDebtPayments(liabilities);
  const avgRate = calcWeightedAverageDebtRate(liabilities);

  return (
    <div className="glass rounded-xl p-4 space-y-2 min-w-[180px]">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        Live Summary
      </p>

      {(mode === "income" || mode === "full") && (
        <>
          <Stat label="Monthly income" value={fmt(totalIncome)} />
          <Stat label="Monthly expenses" value={fmt(totalExpenses)} />
          <Stat
            label="Monthly surplus"
            value={(surplus >= 0 ? "+" : "-") + fmt(surplus)}
            valueColor={surplus >= 0 ? "text-emerald-400" : "text-red-400"}
          />
        </>
      )}

      {(mode === "assets" || mode === "full") && (
        <>
          {mode === "full" && (
            <div className="border-t border-white/[0.08] pt-2 mt-2" />
          )}
          <Stat label="Total assets" value={fmt(totalAssets)} />
          <Stat
            label="Total debt"
            value={fmt(totalDebt)}
            valueColor={totalDebt > 0 ? "text-amber-400" : undefined}
          />
          <Stat
            label="Net worth"
            value={(netWorth >= 0 ? "" : "-") + fmt(netWorth)}
            valueColor={netWorth >= 0 ? "text-emerald-400" : "text-red-400"}
          />
        </>
      )}

      {mode === "liabilities" && (
        <>
          <Stat
            label="Total debt"
            value={fmt(totalDebt)}
            valueColor={totalDebt > 0 ? "text-amber-400" : undefined}
          />
          <Stat label="Monthly payments" value={fmt(monthlyDebt)} />
          {avgRate > 0 && (
            <Stat
              label="Avg. interest rate"
              value={`${avgRate.toFixed(1)}%`}
              valueColor={avgRate > 6 ? "text-red-400" : "text-amber-400"}
            />
          )}
        </>
      )}
    </div>
  );
}
