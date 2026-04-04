import type { HealthScoreBreakdown } from "@/types/financial";
import type { EmergencyFundStatus } from "./calculations";

interface PartialResults {
  monthlySurplus: number;
  totalMonthlyIncome: number;
  savingsRate: number;
  monthlyDebtToIncomeRatio: number;
  retirementGapPercent: number;
  yearsToRetirement: number;
  emergencyFundGap: number;
  targetEmergencyFund: number;
  emergencyFundMonthsCovered: number;
}

// ─── Health Score (0–100) ─────────────────────────────────────────────────
//
// Component weights (each max 20):
//   1. Cash Flow          — Are monthly inflows > outflows?
//   2. Emergency Fund     — Months of essential expenses covered
//   3. Savings Rate       — % of income being saved/invested
//   4. Debt Burden        — Monthly debt payments vs income
//   5. Retirement Ready   — Projected capital vs required capital
//

export function calcHealthScore(
  results: PartialResults,
  efStatus: EmergencyFundStatus
): { score: number; breakdown: HealthScoreBreakdown } {
  // 1. Cash Flow (0–20)
  // Income-relative threshold: full score at ≥10% of monthly income as surplus
  // (a $500 surplus on $3k/month income is very different from $500 on $12k/month)
  let cashFlow: number;
  const incomeRelativeThreshold = Math.max(300, results.totalMonthlyIncome * 0.10);
  if (results.monthlySurplus >= incomeRelativeThreshold) {
    cashFlow = 20;
  } else if (results.monthlySurplus >= 0) {
    cashFlow = 10 + (results.monthlySurplus / incomeRelativeThreshold) * 10;
  } else {
    // Deficit: scale penalty by how bad it is relative to income
    const deficitRatio = Math.abs(results.monthlySurplus) / Math.max(1, results.totalMonthlyIncome);
    cashFlow = Math.max(0, 10 - deficitRatio * 30);
  }
  cashFlow = Math.round(cashFlow);

  // 2. Emergency Fund (0–20)
  let emergencyFund: number;
  const months = efStatus.monthsCovered;
  if (months >= 6) {
    emergencyFund = 20;
  } else if (months >= 3) {
    emergencyFund = 10 + ((months - 3) / 3) * 10;
  } else if (months >= 1) {
    emergencyFund = 4 + ((months - 1) / 2) * 6;
  } else {
    emergencyFund = 0;
  }
  emergencyFund = Math.round(Math.min(20, emergencyFund));

  // 3. Investment Contribution Rate (0–20)
  // Target rate scales with proximity to retirement — someone 5 years away needs
  // to save much more aggressively than someone with 30 years of compounding ahead.
  // yearsToRetirement < 10  → target ≥ 30%
  // yearsToRetirement 10-20 → target ≥ 20%
  // yearsToRetirement > 20  → target ≥ 15%
  let savingsRate: number;
  const sr = results.savingsRate;
  const ytr = results.yearsToRetirement;
  const srTarget = ytr < 10 ? 30 : ytr < 20 ? 20 : 15;
  const srHalf = srTarget / 2;
  if (sr >= srTarget) {
    savingsRate = 20;
  } else if (sr >= srHalf) {
    savingsRate = 10 + ((sr - srHalf) / srHalf) * 10;
  } else if (sr > 0) {
    savingsRate = (sr / srHalf) * 10;
  } else {
    savingsRate = 0;
  }
  savingsRate = Math.round(Math.min(20, Math.max(0, savingsRate)));

  // 4. Debt Burden (0–20)
  //    Monthly debt payments / monthly income
  //    < 15% = 20, 15-30% = 15, 30-40% = 8, > 40% = 3, no income = 0
  let debtBurden: number;
  const dti = results.monthlyDebtToIncomeRatio;
  if (dti === 0) {
    debtBurden = 20; // No debt = full score
  } else if (dti <= 15) {
    debtBurden = 20;
  } else if (dti <= 30) {
    debtBurden = 20 - ((dti - 15) / 15) * 8;
  } else if (dti <= 40) {
    debtBurden = 12 - ((dti - 30) / 10) * 7;
  } else {
    debtBurden = Math.max(0, 5 - (dti - 40) / 10);
  }
  debtBurden = Math.round(Math.min(20, Math.max(0, debtBurden)));

  // 5. Retirement Readiness (0–20)
  //    Gap % → score: 0% gap = 20, 25% gap = 15, 50% gap = 10, 75% gap = 5, 100% = 0
  let retirementReadiness: number;
  const gap = results.retirementGapPercent;
  if (gap <= 0) {
    retirementReadiness = 20;
  } else if (gap <= 25) {
    retirementReadiness = 20 - (gap / 25) * 5;
  } else if (gap <= 50) {
    retirementReadiness = 15 - ((gap - 25) / 25) * 5;
  } else if (gap <= 75) {
    retirementReadiness = 10 - ((gap - 50) / 25) * 5;
  } else if (gap <= 100) {
    retirementReadiness = 5 - ((gap - 75) / 25) * 5;
  } else {
    retirementReadiness = 0;
  }
  retirementReadiness = Math.round(Math.min(20, Math.max(0, retirementReadiness)));

  const total =
    cashFlow + emergencyFund + savingsRate + debtBurden + retirementReadiness;

  return {
    score: Math.min(100, Math.max(0, total)),
    breakdown: {
      cashFlow,
      emergencyFund,
      savingsRate,
      debtBurden,
      retirementReadiness,
    },
  };
}

export function getScoreLabel(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80)
    return {
      label: "Strong",
      color: "text-emerald-600",
      description: "Your finances are well-managed. Keep up the momentum.",
    };
  if (score >= 60)
    return {
      label: "Moderate",
      color: "text-amber-600",
      description: "Good foundation, but a few areas need attention.",
    };
  if (score >= 40)
    return {
      label: "Needs Work",
      color: "text-orange-500",
      description: "Some key areas require action to improve your financial security.",
    };
  return {
    label: "At Risk",
    color: "text-red-500",
    description: "Immediate attention to debt, savings, and cash flow is recommended.",
  };
}

export function getComponentLabel(key: keyof HealthScoreBreakdown): string {
  const labels: Record<keyof HealthScoreBreakdown, string> = {
    cashFlow: "Cash Flow",
    emergencyFund: "Emergency Fund",
    savingsRate: "Contribution Rate",
    debtBurden: "Debt Burden",
    retirementReadiness: "Retirement Readiness",
  };
  return labels[key];
}
