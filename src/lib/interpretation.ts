/**
 * interpretation.ts — Financial Narrative Engine
 *
 * Transforms raw CalculatedResults + FinancialPlan into consequence-oriented,
 * plain-language narratives. Every output is specific to the user's actual
 * numbers — no generic filler.
 *
 * Design principles:
 *   • Consequence first: what happens if nothing changes
 *   • Opportunity second: what is available to improve the situation
 *   • Gap: the distance between where they are and where they need to be
 *   • Time: when this matters
 *   • Action: the single clearest next step
 *   • Why: the reason that action is right given their data
 */

import type { FinancialPlan, CalculatedResults } from "@/types/financial";
import { fmt, fmtFull } from "./calculations";

// ─── Output Types ─────────────────────────────────────────────────────────

export interface NarrativeItem {
  title: string;
  body: string;
  urgency: "high" | "medium" | "low";
  estimatedValue?: string | null;
  route?: string;
}

export interface DashboardBrief {
  /** One or two sentences summarising the user's overall financial position. */
  situationHeadline: string;
  biggestRisk: NarrativeItem;
  biggestOpportunity: NarrativeItem;
  mostUrgentAction: NarrativeItem & { route: string };
  /** Forward-looking consequence for the long-term trajectory. */
  trajectoryNote: string;
}

export interface RetirementNarrative {
  currentPathStatement: string;
  requirementStatement: string;
  gapStatement: string | null;
  closeGapOptions: string | null;
  improvedPathStatement: string | null;
  timeframeNote: string;
}

export interface EmergencyNarrative {
  coverageStatement: string;
  gapStatement: string | null;
  urgencyNote: string;
  actionStatement: string | null;
}

export interface GoalNarrative {
  goalId: string;
  statusStatement: string;
  allocationNote: string | null;
  shortfallStatement: string | null;
  adjustmentStatement: string | null;
}

export interface DebtNarrative {
  contextStatement: string;
  riskStatement: string | null;
  strategyStatement: string;
}

export interface InsightNarrative {
  title: string;
  what: string;
  soWhat: string;
  nowWhat: string;
  category: string;
  impact: "Positive" | "High" | "Medium" | "Low";
}

export interface ScenarioNarrative {
  currentPathSummary: string;
  improvedPathSummary: string;
  differenceStatement: string;
  remainingRisks: string[];
  whatYouBuy: string;
}

export interface ResourcesNarrative {
  summaryStatement: string;
  estimatedValueStatement: string | null;
  topOpportunities: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function plural(n: number, singular: string, pluralForm?: string): string {
  return n === 1 ? singular : (pluralForm ?? `${singular}s`);
}

/** Approximate marginal rate based on gross income. */
function getMarginalRate(annualGrossIncome: number): number {
  if (annualGrossIncome < 55867) return 20.5;
  if (annualGrossIncome < 111733) return 26;
  if (annualGrossIncome < 154906) return 29;
  return 33;
}

/** True if the user's debt rate is a meaningful problem relative to returns. */
function isHighInterestDebtProblem(results: CalculatedResults, expectedReturn: number): boolean {
  return (
    results.totalLiabilities > 0 &&
    results.weightedAverageDebtInterest > expectedReturn
  );
}

// ─── Dashboard Brief ──────────────────────────────────────────────────────

export function buildDashboardBrief(
  plan: FinancialPlan,
  results: CalculatedResults
): DashboardBrief {
  const { profile, assumptions } = plan;
  const score = results.financialHealthScore;

  // ── Situation Headline ────────────────────────────────────────────────
  let situationHeadline: string;
  if (results.monthlySurplus < 0) {
    situationHeadline = `Your expenses currently exceed your income by ${fmtFull(Math.abs(results.monthlySurplus))}/month. Every other goal depends on resolving this first.`;
  } else if (results.retirementGapPercent > 50 && results.emergencyFundMonthsCovered < 2) {
    situationHeadline = `Two areas need immediate attention: your emergency reserve covers only ${results.emergencyFundMonthsCovered.toFixed(1)} months, and at your current pace your retirement may be short by ${fmt(results.retirementGap)}.`;
  } else if (results.emergencyFundMonthsCovered < 2) {
    situationHeadline = `Your emergency reserve covers only ${results.emergencyFundMonthsCovered.toFixed(1)} months of essential expenses — your most urgent priority is building that buffer before investing further.`;
  } else if (results.retirementGapPercent > 40) {
    situationHeadline = `Your finances are ${score >= 60 ? "reasonably solid" : "developing"}, but at your current contribution pace you may retire short by approximately ${fmt(results.retirementGap)}.`;
  } else if (isHighInterestDebtProblem(results, assumptions.expectedAnnualReturn)) {
    situationHeadline = `Your average debt rate (${results.weightedAverageDebtInterest.toFixed(1)}%) is outpacing your expected investment return (${assumptions.expectedAnnualReturn}%) — paying down debt is currently your highest-certainty investment.`;
  } else if (results.freeCashAfterContributions > 800 && results.savingsRate < 10) {
    situationHeadline = `You have ${fmt(results.freeCashAfterContributions)}/month in available cash flow beyond current contributions — there may be meaningful untapped investing or tax-saving capacity.`;
  } else if (score >= 75) {
    situationHeadline = `Your financial position is strong. The focus now is optimizing what you have and ensuring your trajectory holds over time.`;
  } else {
    situationHeadline = `Your financial health score is ${score}/100. Below you'll find the most impactful areas to focus on.`;
  }

  // ── Biggest Risk ──────────────────────────────────────────────────────
  let biggestRisk: NarrativeItem;
  if (results.monthlySurplus < 0) {
    biggestRisk = {
      title: "Negative cash flow",
      body: `Your monthly expenses exceed income by ${fmtFull(Math.abs(results.monthlySurplus))}. Over a year, that is ${fmt(Math.abs(results.monthlySurplus) * 12)} drawn from savings or added to debt. No other financial goal can progress until this is addressed.`,
      urgency: "high",
      route: "/plan?step=3",
    };
  } else if (results.emergencyFundMonthsCovered < 2) {
    biggestRisk = {
      title: "Very thin emergency reserve",
      body: `If your income stopped today, your accessible reserve would cover roughly ${results.emergencyFundMonthsCovered.toFixed(1)} ${plural(Math.round(results.emergencyFundMonthsCovered), "month")} of essential expenses. You are ${fmt(results.emergencyFundGap)} short of your ${assumptions.emergencyFundTargetMonths}-month target. An unexpected event could force high-interest debt.`,
      urgency: "high",
      route: "/plan?step=4",
    };
  } else if (isHighInterestDebtProblem(results, assumptions.expectedAnnualReturn)) {
    biggestRisk = {
      title: "Debt costing more than investments earn",
      body: `Your debt carries a weighted average rate of ${results.weightedAverageDebtInterest.toFixed(1)}%, while your expected investment return is ${assumptions.expectedAnnualReturn}%. Every dollar invested instead of used to pay debt is a net loss at current rates.`,
      urgency: "high",
      route: "/plan?step=5",
    };
  } else if (results.retirementGapPercent > 30) {
    biggestRisk = {
      title: `Retirement gap: ${fmt(results.retirementGap)}`,
      body: `At your current contribution pace, you are projected to reach ${fmt(results.projectedRetirementCapital)} by retirement — versus a target of ${fmt(results.requiredRetirementCapital)}. You have ${results.yearsToRetirement} ${plural(results.yearsToRetirement, "year")} to close a ${results.retirementGapPercent}% gap. Waiting makes each year more expensive to recover.`,
      urgency: results.retirementGapPercent > 50 ? "high" : "medium",
      route: "/plan?step=6",
    };
  } else if (results.emergencyFundMonthsCovered < assumptions.emergencyFundTargetMonths) {
    biggestRisk = {
      title: "Emergency fund below target",
      body: `Your reserve covers ${results.emergencyFundMonthsCovered.toFixed(1)} of ${assumptions.emergencyFundTargetMonths} target months. You are ${fmt(results.emergencyFundGap)} short. Until this gap closes, unexpected costs carry real financial risk.`,
      urgency: "medium",
      route: "/plan?step=4",
    };
  } else {
    biggestRisk = {
      title: "No critical risks identified",
      body: `Your key financial buffers appear to be in reasonable shape. Continue reviewing periodically — conditions change.`,
      urgency: "low",
    };
  }

  // ── Biggest Opportunity ────────────────────────────────────────────────
  let biggestOpportunity: NarrativeItem;
  const selectedGoalTypes = plan.goals.filter((g) => g.selected).map((g) => g.goalType);
  const hasBuyHome = selectedGoalTypes.includes("buy-home");
  const hasEducation = selectedGoalTypes.includes("save-education");
  const hasPayLessTax = selectedGoalTypes.includes("pay-less-tax") || selectedGoalTypes.includes("retire-enough");

  const fhsaUnused =
    hasBuyHome && plan.assets.fhsaBalance === 0 && plan.assets.fhsaMonthlyContribution === 0;
  const respUnused =
    hasEducation &&
    profile.numberOfChildren > 0 &&
    plan.assets.respBalance === 0 &&
    plan.assets.respMonthlyContribution === 0;
  const rrspUnused =
    hasPayLessTax &&
    profile.annualGrossIncome > 60000 &&
    plan.assets.rrspMonthlyContribution < 200;

  const undeployedSurplus = results.freeCashAfterContributions;

  if (fhsaUnused) {
    const annualDeduction = Math.min(8000, profile.annualGrossIncome * 0.18);
    const taxSaving = Math.round(annualDeduction * (getMarginalRate(profile.annualGrossIncome) / 100));
    biggestOpportunity = {
      title: "FHSA: potentially ~$" + taxSaving.toLocaleString() + "/year in tax savings",
      body: `As a first-time home buyer, the FHSA allows up to $8,000/year in tax-deductible contributions that also grow and withdraw tax-free for your home purchase. It is the most tax-efficient account available to you right now.`,
      urgency: "high",
      estimatedValue: `Up to ${fmt(taxSaving)}/year in tax savings + tax-free growth`,
      route: "/plan?step=4",
    };
  } else if (respUnused) {
    const cesgPerYear = 500 * profile.numberOfChildren;
    biggestOpportunity = {
      title: `RESP: ${fmt(cesgPerYear)}/year in free government grants`,
      body: `The government adds 20% on the first $2,500/year per child through the CESG — that's ${fmt(cesgPerYear)}/year in free money. An RESP also grows tax-sheltered. Every month without one is a grant uncollected.`,
      urgency: "medium",
      estimatedValue: `${fmt(cesgPerYear)}/year in CESG grants (${profile.numberOfChildren} ${plural(profile.numberOfChildren, "child", "children")})`,
      route: "/plan?step=4",
    };
  } else if (rrspUnused) {
    const maxContrib = Math.min(profile.annualGrossIncome * 0.18, 32490);
    const marginalRate = getMarginalRate(profile.annualGrossIncome);
    const annualRefund = Math.round(maxContrib * (marginalRate / 100));
    biggestOpportunity = {
      title: `RRSP: potentially ~${fmt(annualRefund)}/year in tax refunds`,
      body: `At your income level, RRSP contributions reduce your taxable income at a ${marginalRate}% marginal rate. Contributing up to ${fmt(maxContrib)}/year could generate a refund of approximately ${fmt(annualRefund)} annually — money that can be reinvested.`,
      urgency: "medium",
      estimatedValue: `~${fmt(annualRefund)}/year in potential refunds at ${marginalRate}% marginal rate`,
      route: "/plan?step=4",
    };
  } else if (undeployedSurplus > 500 && results.savingsRate < 15) {
    biggestOpportunity = {
      title: `${fmt(undeployedSurplus)}/month in available but uninvested cash flow`,
      body: `After contributions, you have approximately ${fmt(undeployedSurplus)}/month that is not being actively invested. At ${assumptions.expectedAnnualReturn}% annual return, investing even half of that over ${results.yearsToRetirement} ${plural(results.yearsToRetirement, "year")} could add significantly to your retirement capital.`,
      urgency: "medium",
      estimatedValue: null,
      route: "/plan?step=6",
    };
  } else if (results.retirementGap > 0) {
    biggestOpportunity = {
      title: `Close the ${fmt(results.retirementGap)} retirement gap`,
      body: `Increasing monthly contributions now is more powerful than increasing them later — compound growth means each additional dollar contributed today is worth more at retirement than a dollar contributed in 10 years.`,
      urgency: "medium",
      route: "/plan?step=6",
    };
  } else {
    biggestOpportunity = {
      title: "Maintain and optimize your current trajectory",
      body: `Your key metrics are on track. Consider reviewing your account mix, ensuring contributions are in the most tax-efficient vehicles, and setting or updating goal targets.`,
      urgency: "low",
    };
  }

  // ── Most Urgent Action ─────────────────────────────────────────────────
  let mostUrgentAction: NarrativeItem & { route: string };
  if (results.monthlySurplus < 0) {
    mostUrgentAction = {
      title: "Review income and expenses",
      body: `Reduce monthly expenses or increase income by at least ${fmtFull(Math.abs(results.monthlySurplus))} to stop drawing down savings or adding debt. This is the prerequisite for every other financial goal.`,
      urgency: "high",
      route: "/plan?step=3",
    };
  } else if (results.emergencyFundMonthsCovered < 1.5) {
    const monthlyTarget = Math.round(results.emergencyFundGap / 6);
    mostUrgentAction = {
      title: "Build emergency fund first",
      body: `Set aside approximately ${fmtFull(monthlyTarget)}/month until your emergency fund reaches ${fmt(results.targetEmergencyFund)} (${assumptions.emergencyFundTargetMonths} months of essential expenses). This protects all other financial goals from disruption.`,
      urgency: "high",
      route: "/plan?step=4",
    };
  } else if (fhsaUnused) {
    mostUrgentAction = {
      title: "Open an FHSA",
      body: `As a first-time buyer, opening and contributing to an FHSA is your highest-value available action. You can contribute up to $8,000 this year, deduct it from income, and later withdraw tax-free for your home purchase.`,
      urgency: "high",
      route: "/plan?step=4",
    };
  } else if (isHighInterestDebtProblem(results, assumptions.expectedAnnualReturn)) {
    mostUrgentAction = {
      title: "Accelerate high-interest debt repayment",
      body: `Your debt costs ${results.weightedAverageDebtInterest.toFixed(1)}% versus an expected investment return of ${assumptions.expectedAnnualReturn}%. Any extra payment earns you a guaranteed ${results.weightedAverageDebtInterest.toFixed(1)}% return — better than most investments at this risk level.`,
      urgency: "high",
      route: "/plan?step=5",
    };
  } else if (respUnused) {
    mostUrgentAction = {
      title: "Open an RESP for your child",
      body: `Each year without an RESP is a CESG grant unclaimed. The government will not backfill missed grant years. Starting now ensures maximum lifetime grant accumulation of $7,200 per child.`,
      urgency: "medium",
      route: "/plan?step=4",
    };
  } else if (results.retirementGapPercent > 20) {
    mostUrgentAction = {
      title: "Increase monthly retirement contributions",
      body: `With a ${results.retirementGapPercent}% retirement gap and ${results.yearsToRetirement} ${plural(results.yearsToRetirement, "year")} remaining, each year of inaction compounds the required catch-up amount.`,
      urgency: results.retirementGapPercent > 40 ? "high" : "medium",
      route: "/plan?step=6",
    };
  } else {
    mostUrgentAction = {
      title: "Review your goal allocations",
      body: `Set target amounts and years for each of your selected goals to unlock detailed tracking and monthly savings guidance for each.`,
      urgency: "low",
      route: "/goals",
    };
  }

  // ── Trajectory Note ────────────────────────────────────────────────────
  let trajectoryNote: string;
  if (results.yearsToRetirement <= 5 && results.yearsToRetirement > 0) {
    trajectoryNote =
      results.retirementGap > 0
        ? `You are ${results.yearsToRetirement} ${plural(results.yearsToRetirement, "year")} from your target retirement age with a ${fmt(results.retirementGap)} shortfall. Each remaining year is critical — small changes now have large impact.`
        : `You are ${results.yearsToRetirement} ${plural(results.yearsToRetirement, "year")} from retirement and appear on track. Focus on capital preservation and transition planning.`;
  } else if (profile.age <= 30) {
    trajectoryNote = `At age ${profile.age}, time is your most valuable financial asset. Consistent contributions at ${assumptions.expectedAnnualReturn}% return double roughly every 12 years — starting or increasing contributions now is more powerful than any other action.`;
  } else if (results.retirementGap === 0) {
    trajectoryNote = `Your retirement projection appears on track. Maintaining consistent contributions and reviewing your plan annually will help ensure this continues.`;
  } else {
    trajectoryNote = `With ${results.yearsToRetirement} ${plural(results.yearsToRetirement, "year")} to retirement, there is time to meaningfully close the ${fmt(results.retirementGap)} gap — but the window narrows each year. The recommendations below show the highest-impact paths.`;
  }

  return { situationHeadline, biggestRisk, biggestOpportunity, mostUrgentAction, trajectoryNote };
}

// ─── Retirement Narrative ─────────────────────────────────────────────────

export function buildRetirementNarrative(
  plan: FinancialPlan,
  results: CalculatedResults,
  recommendedRetirementCapital?: number
): RetirementNarrative {
  const { profile, assumptions } = plan;

  const currentPathStatement = results.yearsToRetirement > 0
    ? `At your current contribution pace, you are projected to retire at age ${profile.retirementAge} with approximately ${fmt(results.projectedRetirementCapital)}.`
    : `You have reached your target retirement age. Your current investable capital is approximately ${fmt(results.projectedRetirementCapital)}.`;

  const withdrawalRatePct = results.safeWithdrawalRate
    ? (results.safeWithdrawalRate * 100).toFixed(1)
    : "4.0";
  const retirementYrs = results.retirementYears ?? 25;
  const requirementStatement = `To support ${fmt(assumptions.desiredRetirementIncomeToday)}/year in today's dollars, after CPP/OAS you may need approximately ${fmt(results.requiredRetirementCapital)} in after-tax retirement capital (${withdrawalRatePct}% withdrawal rate for a ${retirementYrs}-year retirement, adjusted for ${assumptions.expectedInflationRate}% inflation).`;

  let gapStatement: string | null = null;
  let closeGapOptions: string | null = null;
  if (results.retirementGap > 0) {
    gapStatement = `That leaves an estimated shortfall of ${fmt(results.retirementGap)} — a ${results.retirementGapPercent}% gap versus your target.`;
    if (results.yearsToRetirement > 1) {
      const mr = assumptions.expectedAnnualReturn / 1200;
      const months = results.yearsToRetirement * 12;
      const additionalMonthlyNeeded = mr > 0
        ? Math.round(results.retirementGap / ((Math.pow(1 + mr, months) - 1) / mr))
        : Math.round(results.retirementGap / months);
      const yearsToDelay = results.retirementGap > 0
        ? Math.round((results.retirementGap / results.requiredRetirementCapital) * results.yearsToRetirement * 0.5)
        : 0;
      closeGapOptions = `Closing this gap may require: increasing monthly contributions by approximately ${fmt(additionalMonthlyNeeded)}/month, delaying retirement by ${yearsToDelay > 0 ? `~${yearsToDelay} ${plural(yearsToDelay, "year")}` : "a few years"}, adjusting your target income, or a combination of these.`;
    }
  }

  let improvedPathStatement: string | null = null;
  if (recommendedRetirementCapital && recommendedRetirementCapital > results.projectedRetirementCapital) {
    const improvement = recommendedRetirementCapital - results.projectedRetirementCapital;
    improvedPathStatement = `With an optimized contribution strategy, your projected retirement capital could reach approximately ${fmt(recommendedRetirementCapital)} — an improvement of ${fmt(improvement)} over your current path.`;
  }

  const timeframeNote = results.yearsToRetirement > 10
    ? `With ${results.yearsToRetirement} years ahead, consistent contributions now will compound significantly. A 1% increase in annual contributions today adds more than a 2% increase in 10 years.`
    : results.yearsToRetirement > 0
    ? `With ${results.yearsToRetirement} years to retirement, every additional contribution carries amplified importance. Capital preservation alongside growth becomes more relevant.`
    : `You are at or past your target retirement age. The focus should be on sustainable withdrawal strategies and capital protection.`;

  return {
    currentPathStatement,
    requirementStatement,
    gapStatement,
    closeGapOptions,
    improvedPathStatement,
    timeframeNote,
  };
}

// ─── Emergency Fund Narrative ─────────────────────────────────────────────

export function buildEmergencyNarrative(
  plan: FinancialPlan,
  results: CalculatedResults
): EmergencyNarrative {
  const { assumptions } = plan;
  const months = results.emergencyFundMonthsCovered;
  const target = assumptions.emergencyFundTargetMonths;

  const coverageStatement = `If your income stopped today, your accessible reserve (emergency fund + 50% of savings) would cover approximately ${months.toFixed(1)} ${plural(Math.round(months), "month")} of essential expenses.`;

  let gapStatement: string | null = null;
  if (results.emergencyFundGap > 0) {
    gapStatement = `Your target is ${target} months, so you currently have a gap of approximately ${fmt(results.emergencyFundGap)}. Essential expenses are estimated at ${fmt(Math.round(results.targetEmergencyFund / target))}/month.`;
  }

  let urgencyNote: string;
  if (months < 1) {
    urgencyNote = "Critical: less than 1 month of cover. An unexpected car repair or medical expense could force high-interest debt immediately.";
  } else if (months < 2) {
    urgencyNote = "Very low: under 2 months of cover. This is below the minimum safety threshold — building this reserve should come before additional investments.";
  } else if (months < target) {
    urgencyNote = `Below target: you have ${months.toFixed(1)} of ${target} months covered. Until this gap is reduced, unexpected events carry real financial risk.`;
  } else {
    urgencyNote = `Your emergency fund meets your ${target}-month target. This provides a solid foundation for all other financial goals.`;
  }

  let actionStatement: string | null = null;
  if (results.emergencyFundGap > 0) {
    const monthlyToClose = Math.round(results.emergencyFundGap / 12);
    actionStatement = `Setting aside approximately ${fmtFull(monthlyToClose)}/month would close this gap in about 12 months.`;
  }

  return { coverageStatement, gapStatement, urgencyNote, actionStatement };
}

// ─── Goal Narratives ──────────────────────────────────────────────────────

export function buildGoalNarratives(
  _plan: FinancialPlan,
  results: CalculatedResults
): GoalNarrative[] {
  return results.goalReadinessSummary.map((g) => {
    if (g.status === "no-target" || !g.targetAmount || !g.targetYear) {
      return {
        goalId: g.goalId,
        statusStatement: `No target amount or year set for this goal yet. Add them to unlock tracking and monthly savings guidance.`,
        allocationNote: null,
        shortfallStatement: null,
        adjustmentStatement: null,
      };
    }

    const monthsLeft = g.monthsRemaining ?? 0;
    const yearsLeft = Math.round(monthsLeft / 12);

    let statusStatement: string;
    if (g.status === "on-track") {
      statusStatement = `At your current pace, this goal appears on track — you are projected to reach approximately ${fmt(g.projectedAtTarget!)} by ${g.targetYear}, versus a target of ${fmt(g.targetAmount)}.`;
    } else if (g.status === "partially-on-track") {
      statusStatement = `This goal is partially on track — you are projected to reach approximately ${fmt(g.projectedAtTarget!)} by ${g.targetYear} (${Math.round((g.projectedAtTarget! / g.targetAmount) * 100)}% of your ${fmt(g.targetAmount)} target).`;
    } else {
      statusStatement = `This goal is behind schedule — at your current pace you are projected to reach only ${fmt(g.projectedAtTarget!)} by ${g.targetYear}, versus a target of ${fmt(g.targetAmount)}.`;
    }

    let allocationNote: string | null = null;
    if (g.allocatedMonthly != null) {
      allocationNote = `${fmt(g.allocatedMonthly)}/month is allocated toward this goal from your shared savings budget (based on your priorities and timeline).`;
    }

    let shortfallStatement: string | null = null;
    if (g.status !== "on-track" && g.targetAmount && g.projectedAtTarget != null) {
      const shortfall = g.targetAmount - g.projectedAtTarget;
      if (shortfall > 0) {
        shortfallStatement = `You may be short by approximately ${fmt(shortfall)} at your target date.`;
      }
    }

    let adjustmentStatement: string | null = null;
    if (g.monthlyShortfall != null && g.monthlyShortfall > 0) {
      adjustmentStatement = yearsLeft > 0
        ? `To stay on track, you may need to increase monthly savings toward this goal by ${fmt(g.monthlyShortfall)}, extend the timeline by roughly ${Math.round(g.monthlyShortfall * monthsLeft / (g.monthlyNeeded ?? 1))} months, or reduce the target.`
        : `The target date has passed or is very close. Consider extending the timeline or adjusting the target amount.`;
    }

    return { goalId: g.goalId, statusStatement, allocationNote, shortfallStatement, adjustmentStatement };
  });
}

// ─── Debt Narrative ───────────────────────────────────────────────────────

export function buildDebtNarrative(
  plan: FinancialPlan,
  results: CalculatedResults
): DebtNarrative | null {
  if (results.totalLiabilities === 0) return null;

  const { assumptions } = plan;
  const contextStatement = `You carry ${fmt(results.totalLiabilities)} in total debt across ${plan.liabilities.length} ${plural(plan.liabilities.length, "account")}. Monthly payments total ${fmtFull(results.totalMonthlyDebtPayments)}, representing ${results.monthlyDebtToIncomeRatio.toFixed(1)}% of your monthly income.`;

  let riskStatement: string | null = null;
  if (isHighInterestDebtProblem(results, assumptions.expectedAnnualReturn)) {
    riskStatement = `Your weighted average debt rate (${results.weightedAverageDebtInterest.toFixed(1)}%) currently exceeds your expected investment return (${assumptions.expectedAnnualReturn}%). This means every dollar invested instead of used to pay debt costs you the difference in net return. Debt repayment is your highest-certainty financial move right now.`;
  }

  let strategyStatement: string;
  if (results.monthlyDebtToIncomeRatio > 40) {
    strategyStatement = `Your monthly debt payments represent ${results.monthlyDebtToIncomeRatio.toFixed(1)}% of income — above the 40% threshold where financial flexibility is meaningfully constrained. Reducing this ratio should be a priority.`;
  } else if (isHighInterestDebtProblem(results, assumptions.expectedAnnualReturn)) {
    strategyStatement = `Consider the avalanche method: direct any extra monthly cash toward the highest-rate debt first while paying minimums on others. Once high-rate debts are eliminated, redirect those payments to lower-rate debts.`;
  } else {
    strategyStatement = `Your debt-to-income ratio appears manageable. Maintaining minimum payments while building investments is reasonable at these interest rates.`;
  }

  return { contextStatement, riskStatement, strategyStatement };
}

// ─── Insight Narratives ───────────────────────────────────────────────────

export function buildInsightNarratives(
  plan: FinancialPlan,
  results: CalculatedResults
): InsightNarrative[] {
  const { profile, assumptions } = plan;
  const narratives: InsightNarrative[] = [];
  const selectedGoalTypes = plan.goals.filter((g) => g.selected).map((g) => g.goalType);

  // 1. Cash flow
  if (results.monthlySurplus < 0) {
    narratives.push({
      title: `Spending exceeds income by ${fmtFull(Math.abs(results.monthlySurplus))}/month`,
      what: `Your current monthly expenses (${fmtFull(results.totalMonthlyExpenses)}) exceed your income (${fmtFull(results.totalMonthlyIncome)}) by ${fmtFull(Math.abs(results.monthlySurplus))}.`,
      soWhat: `Over a full year, that is ${fmt(Math.abs(results.monthlySurplus) * 12)} drawn from savings or added to debt. Every other financial goal — investing, debt paydown, goal savings — is disrupted until cash flow is positive.`,
      nowWhat: `Review which expense categories have the most room. Reducing three categories by ${fmt(Math.round(Math.abs(results.monthlySurplus) / 3))} each would bring you to breakeven.`,
      category: "Spending",
      impact: "High",
    });
  } else if (results.monthlySurplus > 0) {
    const undeployed = results.freeCashAfterContributions;
    if (undeployed > 300) {
      narratives.push({
        title: `${fmt(undeployed)}/month in surplus is not yet going to investments`,
        what: `After expenses and current investment contributions, you have approximately ${fmt(undeployed)}/month in available cash flow that is not being actively invested.`,
        soWhat: `Uninvested cash loses purchasing power to inflation over time. At ${assumptions.expectedInflationRate}% inflation, ${fmt(undeployed)}/month left idle loses roughly ${fmt(Math.round(undeployed * assumptions.expectedInflationRate / 100))}/month in real value.`,
        nowWhat: `Consider directing ${fmt(Math.round(undeployed * 0.5))}/month or more toward registered accounts (TFSA, RRSP, FHSA, or RESP depending on your goals).`,
        category: "Planning",
        impact: "Medium",
      });
    } else {
      narratives.push({
        title: `Monthly surplus of ${fmtFull(results.monthlySurplus)}`,
        what: `You have ${fmtFull(results.monthlySurplus)}/month available after all expenses. You are currently investing ${fmtFull(results.totalMonthlyContributions)}/month.`,
        soWhat: `A positive cash flow means you have the ability to make progress on your financial goals each month. The question is whether that surplus is being directed optimally.`,
        nowWhat: `Review your investment contribution breakdown to ensure contributions are going to the most tax-efficient accounts in the right order.`,
        category: "Planning",
        impact: "Positive",
      });
    }
  }

  // 2. Emergency fund
  if (results.emergencyFundMonthsCovered < assumptions.emergencyFundTargetMonths) {
    const gap = results.emergencyFundGap;
    const monthlyToClose = Math.round(gap / 12);
    narratives.push({
      title: `Emergency reserve covers ${results.emergencyFundMonthsCovered.toFixed(1)} of ${assumptions.emergencyFundTargetMonths} target months`,
      what: `Your accessible emergency reserve (emergency fund + 50% of savings) covers approximately ${results.emergencyFundMonthsCovered.toFixed(1)} months of essential expenses. Your target is ${assumptions.emergencyFundTargetMonths} months.`,
      soWhat: `You are ${fmt(gap)} short. Without adequate reserves, a single unexpected event — job loss, medical expense, car repair — may force you into high-interest debt or require liquidating investments at an inopportune time.`,
      nowWhat: `Setting aside approximately ${fmtFull(monthlyToClose)}/month in a dedicated high-interest savings account would close this gap in approximately 12 months.`,
      category: "Liquidity",
      impact: results.emergencyFundMonthsCovered < 2 ? "High" : "Medium",
    });
  } else {
    narratives.push({
      title: `Emergency fund target met (${results.emergencyFundMonthsCovered.toFixed(1)} months)`,
      what: `Your accessible reserve covers ${results.emergencyFundMonthsCovered.toFixed(1)} months — meeting your ${assumptions.emergencyFundTargetMonths}-month target.`,
      soWhat: `This buffer protects all other financial goals. If income stops, you have time to respond without forced debt or investment liquidation.`,
      nowWhat: `Maintain this reserve. If your expenses increase meaningfully, recalculate the required amount and top up accordingly.`,
      category: "Liquidity",
      impact: "Positive",
    });
  }

  // 3. Debt analysis
  if (results.totalLiabilities > 0) {
    if (isHighInterestDebtProblem(results, assumptions.expectedAnnualReturn)) {
      narratives.push({
        title: `Debt rate (${results.weightedAverageDebtInterest.toFixed(1)}%) exceeds expected return (${assumptions.expectedAnnualReturn}%)`,
        what: `Your average debt interest rate is ${results.weightedAverageDebtInterest.toFixed(1)}%, higher than your expected investment return of ${assumptions.expectedAnnualReturn}%.`,
        soWhat: `Every dollar you invest rather than use to pay down this debt earns you a net negative return of ${(results.weightedAverageDebtInterest - assumptions.expectedAnnualReturn).toFixed(1)}% after accounting for interest cost. Debt repayment is your highest-certainty investment.`,
        nowWhat: `Identify your highest-rate debt and direct any extra monthly surplus toward it. Once eliminated, redirect those payments to the next highest-rate debt (avalanche method).`,
        category: "Debt",
        impact: "High",
      });
    } else {
      narratives.push({
        title: `Total debt: ${fmt(results.totalLiabilities)} at ${results.weightedAverageDebtInterest.toFixed(1)}% avg rate`,
        what: `You carry ${fmt(results.totalLiabilities)} in total debt with a weighted average rate of ${results.weightedAverageDebtInterest.toFixed(1)}%, below your expected investment return of ${assumptions.expectedAnnualReturn}%.`,
        soWhat: `At these rates, it is reasonable to continue investing while making scheduled payments. However, the ${results.monthlyDebtToIncomeRatio.toFixed(1)}% of income going to debt reduces your flexibility.`,
        nowWhat: `Ensure minimum payments are always made. If surplus allows, extra payments on the highest-rate debt will reduce total interest over the loan's life.`,
        category: "Debt",
        impact: results.monthlyDebtToIncomeRatio > 35 ? "Medium" : "Low",
      });
    }
  } else {
    narratives.push({
      title: "Debt-free",
      what: "You have no reported debts. All monthly surplus is available for savings and investment goals.",
      soWhat: "Without debt obligations, every dollar of surplus has full productive potential. Your financial flexibility is at its highest.",
      nowWhat: "Ensure your surplus is being directed to the highest-value accounts in priority order: emergency fund → FHSA/TFSA → RRSP → RESP → non-registered.",
      category: "Debt",
      impact: "Positive",
    });
  }

  // 4. Investment contribution rate
  if (results.savingsRate > 0) {
    const rateCategory = results.savingsRate >= 20 ? "strong" : results.savingsRate >= 10 ? "moderate" : "low";
    narratives.push({
      title: `Investment contribution rate: ${results.savingsRate}% of income`,
      what: `You are currently directing ${results.savingsRate}% of monthly income (${fmtFull(results.totalMonthlyContributions)}/month) into registered or investment accounts.`,
      soWhat:
        rateCategory === "strong"
          ? `A ${results.savingsRate}% contribution rate is strong. At this pace, compound growth will work meaningfully in your favour over time.`
          : rateCategory === "moderate"
          ? `A ${results.savingsRate}% contribution rate is a reasonable foundation but below the 15–20% range that financial planning benchmarks suggest for long-term wealth building.`
          : `A contribution rate below 10% may leave significant wealth-building potential unrealized over time. Even modest increases compound meaningfully over decades.`,
      nowWhat:
        results.freeCashAfterContributions > 200
          ? `Your available surplus suggests room to increase contributions by approximately ${fmt(Math.round(results.freeCashAfterContributions * 0.4))}/month without impacting your lifestyle significantly.`
          : `Focus first on cash flow improvement, then gradually increase contributions as surplus grows.`,
      category: "Planning",
      impact: rateCategory === "strong" ? "Positive" : rateCategory === "moderate" ? "Medium" : "High",
    });
  }

  // 5. Retirement gap
  if (results.retirementGapPercent > 10) {
    narratives.push({
      title: `Retirement projection may fall short by ${fmt(results.retirementGap)}`,
      what: `At current contributions, you are projected to have ${fmt(results.projectedRetirementCapital)} at retirement versus a target of ${fmt(results.requiredRetirementCapital)} — a ${results.retirementGapPercent}% shortfall.`,
      soWhat: `A retirement gap means your savings may not sustain your desired lifestyle throughout retirement. The longer this gap remains, the larger the monthly catch-up required.`,
      nowWhat: `With ${results.yearsToRetirement} ${plural(results.yearsToRetirement, "year")} remaining, increasing contributions now reduces the required monthly catch-up exponentially. See the Scenario Compare page for a side-by-side projection.`,
      category: "Planning",
      impact: results.retirementGapPercent > 40 ? "High" : "Medium",
    });
  } else if (results.yearsToRetirement > 0) {
    narratives.push({
      title: "Retirement projection looks on track",
      what: `You are projected to reach ${fmt(results.projectedRetirementCapital)} at retirement — ${results.retirementGap === 0 ? "meeting" : "approaching"} your ${fmt(results.requiredRetirementCapital)} target.`,
      soWhat: "Maintaining your current contribution rate and investment strategy should support your retirement goal.",
      nowWhat: "Review annually. If your income increases, consider whether to increase contributions proportionally to maintain the same standard of living at retirement.",
      category: "Planning",
      impact: "Positive",
    });
  }

  // 6. FHSA opportunity
  if (
    selectedGoalTypes.includes("buy-home") &&
    plan.assets.fhsaBalance === 0 &&
    plan.assets.fhsaMonthlyContribution === 0
  ) {
    const marginalRate = getMarginalRate(profile.annualGrossIncome);
    const annualTaxSaving = Math.round(8000 * (marginalRate / 100));
    narratives.push({
      title: `FHSA may save you ~${fmt(annualTaxSaving)}/year in taxes`,
      what: `You have a home purchase goal but no FHSA contributions. The FHSA lets first-time buyers contribute up to $8,000/year, deduct it from income, and withdraw tax-free for a home purchase.`,
      soWhat: `At your income level (${marginalRate}% marginal rate), contributing the maximum $8,000 could reduce your tax bill by approximately ${fmt(annualTaxSaving)} per year — money that would otherwise go to the government instead of your home purchase fund.`,
      nowWhat: `Open an FHSA through your bank or brokerage. The sooner it is open, the sooner contribution room accumulates. Maximum lifetime room is $40,000.`,
      category: "Growth",
      impact: "High",
    });
  }

  // 7. RESP opportunity
  if (
    selectedGoalTypes.includes("save-education") &&
    profile.numberOfChildren > 0 &&
    plan.assets.respBalance === 0 &&
    plan.assets.respMonthlyContribution === 0
  ) {
    const cesgPerYear = 500 * profile.numberOfChildren;
    narratives.push({
      title: `You may be missing ${fmt(cesgPerYear)}/year in CESG grants`,
      what: `You have an education savings goal and ${profile.numberOfChildren} ${plural(profile.numberOfChildren, "child", "children")}, but no RESP open. The CESG adds 20% on the first $2,500/year per child — ${fmt(cesgPerYear)}/year in free government contributions.`,
      soWhat: `Every year without an RESP is a grant year permanently forfeited. Over 18 years, unclaimed CESG can total up to ${fmt(7200 * profile.numberOfChildren)} per child.`,
      nowWhat: `Open an RESP. Contributing just ${fmt(Math.round(208.33 * profile.numberOfChildren))}/month per child ($2,500/year) maximizes the annual CESG grant.`,
      category: "Growth",
      impact: "Medium",
    });
  }

  // 8. Goal-specific shortfalls
  results.goalReadinessSummary
    .filter((g) => g.status === "off-track" && g.monthlyShortfall != null && g.monthlyShortfall > 100)
    .slice(0, 2)
    .forEach((g) => {
      narratives.push({
        title: `"${g.label}" goal needs ${fmt(g.monthlyShortfall!)}/month more`,
        what: `Your "${g.label}" goal is projected to reach only ${fmt(g.projectedAtTarget!)} by ${g.targetYear} — short of the ${fmt(g.targetAmount!)} target by approximately ${fmt(g.targetAmount! - g.projectedAtTarget!)}.`,
        soWhat: `Without adjustment, you may reach your target date without sufficient capital, requiring either a delayed timeline or a reduced outcome.`,
        nowWhat: `You may need to increase monthly savings toward this goal by ${fmt(g.monthlyShortfall!)}, extend the target year, or reduce the target amount.`,
        category: "Growth",
        impact: "Medium",
      });
    });

  return narratives.slice(0, 8);
}

// ─── Scenario Narrative ───────────────────────────────────────────────────

export function buildScenarioNarrative(
  plan: FinancialPlan,
  results: CalculatedResults,
  currentAtRetirement: number,
  recommendedAtRetirement: number
): ScenarioNarrative {
  const { profile, assumptions } = plan;
  const difference = recommendedAtRetirement - currentAtRetirement;
  const differencePercent =
    currentAtRetirement > 0 ? Math.round((difference / currentAtRetirement) * 100) : 0;
  const currentMonthly = results.totalMonthlyContributions;
  const recommendedMonthly = Math.max(
    currentMonthly,
    assumptions.monthlyAmountUserCanComfortablySetAside
  );

  const currentPathSummary =
    currentAtRetirement > 0
      ? `At your current contribution rate (${fmtFull(currentMonthly)}/month, ${results.savingsRate}% of income), you are projected to reach approximately ${fmt(currentAtRetirement)} at age ${profile.retirementAge}.`
      : `At your current pace, your projected retirement capital at age ${profile.retirementAge} is limited.`;

  const improvedPathSummary =
    difference > 0
      ? `By increasing monthly contributions to ${fmtFull(recommendedMonthly)} — your stated comfortable amount — and applying the account priority ladder, your projected capital at retirement reaches approximately ${fmt(recommendedAtRetirement)}.`
      : `Your current and recommended contributions are similar. The two paths closely align.`;

  const differenceStatement =
    difference > 0
      ? `That is approximately ${fmt(difference)} more (${differencePercent}% improvement) for the same ${results.yearsToRetirement}-year period — the result of ${fmtFull(recommendedMonthly - currentMonthly)}/month more in contributions compounding at ${assumptions.expectedAnnualReturn}% annually.`
      : `The two paths are very similar — your current contributions may already be close to the recommended level. Focus on account optimization rather than contribution increases.`;

  const remainingRisks: string[] = [];
  if (results.emergencyFundGap > 0) {
    remainingRisks.push(`Emergency fund gap of ${fmt(results.emergencyFundGap)} remains on both paths — this is a liquidity risk independent of investment growth.`);
  }
  if (isHighInterestDebtProblem(results, assumptions.expectedAnnualReturn)) {
    remainingRisks.push(`High-interest debt (${results.weightedAverageDebtInterest.toFixed(1)}%) continues to cost more than the expected return (${assumptions.expectedAnnualReturn}%) on the recommended path — debt reduction may still outperform investing at this rate.`);
  }
  if (results.retirementGap > 0 && recommendedAtRetirement < results.requiredRetirementCapital) {
    const remainingGap = results.requiredRetirementCapital - recommendedAtRetirement;
    remainingRisks.push(`Even the recommended path may leave a ${fmt(remainingGap)} gap versus your retirement target. Additional contribution increases or a retirement timeline adjustment may be needed.`);
  }

  const whatYouBuy =
    difference > 0
      ? `The ${fmt(difference)} improvement buys approximately ${fmt(Math.round(difference * 0.04))}/year in additional sustainable retirement income (at 4% withdrawal rate) — that is ${fmt(Math.round((difference * 0.04) / 12))}/month more in retirement purchasing power.`
      : `Maintaining your current trajectory while optimizing account selection and tax efficiency may improve your after-tax outcome without requiring higher contributions.`;

  return {
    currentPathSummary,
    improvedPathSummary,
    differenceStatement,
    remainingRisks,
    whatYouBuy,
  };
}

// ─── Resources Narrative ──────────────────────────────────────────────────

export function buildResourcesNarrative(
  plan: FinancialPlan,
  matchedCount: number,
  totalCount: number
): ResourcesNarrative {
  const { profile } = plan;
  const selectedGoalTypes = plan.goals.filter((g) => g.selected).map((g) => g.goalType);

  let summaryStatement: string;
  if (matchedCount === 0) {
    summaryStatement = `No programs were matched based on your current plan data. Try adjusting your search or category filters.`;
  } else if (matchedCount >= 10) {
    summaryStatement = `${matchedCount} programs appear relevant to your province (${profile.province}), goals, and circumstances — a higher-than-average match for your profile.`;
  } else {
    summaryStatement = `${matchedCount} ${plural(matchedCount, "program")} matched to your province, goals, and financial profile. Review each for eligibility — confirmed benefits can be applied immediately.`;
  }

  let estimatedValueStatement: string | null = null;
  const hasBuyHome = selectedGoalTypes.includes("buy-home");
  const hasEducation = selectedGoalTypes.includes("save-education") && profile.numberOfChildren > 0;
  const hasPayLessTax = selectedGoalTypes.includes("pay-less-tax");
  const hasChildren = profile.numberOfChildren > 0;

  const items: string[] = [];
  if (hasBuyHome) items.push("home purchase programs (FHSA, FHBP, provincial grants)");
  if (hasEducation) items.push(`education savings grants (CESG: ~${fmt(500 * profile.numberOfChildren)}/year)`);
  if (hasChildren) items.push("family benefit programs (CCB, childcare subsidies)");
  if (hasPayLessTax) items.push("tax reduction accounts (RRSP, TFSA)");
  if (items.length > 0) {
    estimatedValueStatement = `Based on your goals, you may have access to benefits related to: ${items.join(", ")}. Amounts vary — confirm through official sources.`;
  }

  const topOpportunities: string[] = [];
  if (hasBuyHome && plan.assets.fhsaBalance === 0) {
    topOpportunities.push("FHSA: up to $8,000/year tax-deductible + tax-free for home purchase");
  }
  if (hasEducation && plan.assets.respBalance === 0) {
    topOpportunities.push(`RESP + CESG: ${fmt(500 * profile.numberOfChildren)}/year in free government grants`);
  }
  if (hasChildren) {
    topOpportunities.push("Canada Child Benefit (CCB): monthly tax-free payments per child");
  }

  return { summaryStatement, estimatedValueStatement, topOpportunities };
}
