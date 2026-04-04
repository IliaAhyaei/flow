import type { FinancialPlan, Recommendation } from "@/types/financial";
import type { CalculatedResults } from "@/types/financial";
import {
  calcMonthlyIncome,
  calcMonthlyContributions,
  calcTotalLiabilities,
  calcEmergencyFundStatus,
  calcMonthlyExpenses,
  fmt,
} from "./calculations";
import { isFHSAEligible, GIS_INCOME_THRESHOLD } from "./canadianRules";

type PartialResults = Omit<
  CalculatedResults,
  "recommendations" | "protectionFlags"
>;

// ─── Recommendation Rule Engine ───────────────────────────────────────────

export function generateRecommendations(
  plan: FinancialPlan,
  results: PartialResults
): Recommendation[] {
  const recs: Recommendation[] = [];
  const { profile, goals, assets, liabilities, assumptions, income, expenses } =
    plan;

  const totalIncome = calcMonthlyIncome(income);
  const totalExpenses = calcMonthlyExpenses(expenses);
  const surplus = totalIncome - totalExpenses;
  const totalDebt = calcTotalLiabilities(liabilities);
  const efStatus = calcEmergencyFundStatus(
    assets,
    expenses,
    assumptions.emergencyFundTargetMonths
  );
  const selectedGoalTypes = goals
    .filter((g) => g.selected)
    .map((g) => g.goalType);

  // ── Rule 1: Emergency Fund ──────────────────────────────────────────────
  if (!efStatus.isAdequate && efStatus.monthsCovered < assumptions.emergencyFundTargetMonths) {
    const monthsShort = assumptions.emergencyFundTargetMonths - efStatus.monthsCovered;
    const monthlyNeededForEF =
      efStatus.gap > 0 ? Math.round(efStatus.gap / 12) : 0;
    recs.push({
      id: "emergency-fund",
      title: `Build your emergency fund to ${assumptions.emergencyFundTargetMonths} months`,
      explanation: `Your emergency fund currently covers ${efStatus.monthsCovered.toFixed(1)} months of essential expenses. You need ${monthsShort.toFixed(1)} more months — about $${efStatus.gap.toLocaleString()} more.`,
      whyItMatters:
        "Without an emergency fund, an unexpected expense (medical, job loss, car repair) forces you into high-interest debt or disrupts your long-term plan.",
      priority: "high",
      actionRoute: "/plan?step=4",
      actionLabel: "Update savings",
      estimatedImpact: monthlyNeededForEF > 0
        ? `Set aside ~$${monthlyNeededForEF}/month to reach your target in 12 months`
        : null,
    });
  }

  // ── Rule 2: High-interest debt prioritization ───────────────────────────
  if (
    totalDebt > 0 &&
    results.weightedAverageDebtInterest > assumptions.expectedAnnualReturn
  ) {
    const highRateDebts = liabilities.filter((l) => l.interestRate > assumptions.expectedAnnualReturn);
    const highRateNames = highRateDebts.map((l) => l.type.replace("-", " ")).join(", ");
    const extraPayment = Math.max(100, Math.round(surplus * 0.3));
    recs.push({
      id: "debt-priority",
      title: "Prioritize paying down high-interest debt",
      explanation: `Your debt carries an average rate of ${results.weightedAverageDebtInterest.toFixed(1)}%, which is higher than your expected investment return of ${assumptions.expectedAnnualReturn}%. Affected: ${highRateNames}.`,
      whyItMatters:
        "Every dollar paid toward high-interest debt earns you a guaranteed return equal to that interest rate — better than most investments at the same risk level.",
      priority: "high",
      actionRoute: "/plan?step=5",
      actionLabel: "Review liabilities",
      estimatedImpact:
        extraPayment > 0
          ? `An extra $${extraPayment}/month could reduce your total interest cost significantly`
          : null,
    });
  }

  // ── Rule 3: Retirement gap ──────────────────────────────────────────────
  if (results.retirementGapPercent > 20 && results.yearsToRetirement > 2) {
    const additionalMonthlyNeeded =
      results.retirementGap > 0 && results.yearsToRetirement > 0
        ? Math.round(
            results.retirementGap /
              ((Math.pow(
                1 + assumptions.expectedAnnualReturn / 1200,
                results.yearsToRetirement * 12
              ) -
                1) /
                (assumptions.expectedAnnualReturn / 1200))
          )
        : 0;
    recs.push({
      id: "retirement-gap",
      title: `Increase retirement contributions to close ${results.retirementGapPercent}% gap`,
      explanation: `At current savings, you are projected to have $${(results.projectedRetirementCapital / 1000).toFixed(0)}k at retirement but need $${(results.requiredRetirementCapital / 1000).toFixed(0)}k — a $${(results.retirementGap / 1000).toFixed(0)}k gap.`,
      whyItMatters:
        "A retirement capital gap means running out of money in retirement. The earlier you address this, the less you need to save monthly due to compound growth.",
      priority: results.retirementGapPercent > 50 ? "high" : "medium",
      actionRoute: "/plan?step=6",
      actionLabel: "Adjust savings capacity",
      estimatedImpact:
        additionalMonthlyNeeded > 0
          ? `An additional ~$${additionalMonthlyNeeded}/month could close most of this gap`
          : null,
    });
  }

  // ── Rule 4: FHSA for home buyers ────────────────────────────────────────
  if (
    selectedGoalTypes.includes("buy-home") &&
    isFHSAEligible(profile, selectedGoalTypes) &&
    assets.fhsaBalance === 0 &&
    assets.fhsaMonthlyContribution === 0
  ) {
    recs.push({
      id: "fhsa",
      title: "Open and contribute to an FHSA for your home purchase",
      explanation:
        "As a first-time home buyer, the First Home Savings Account (FHSA) lets you contribute up to $8,000/year ($40,000 lifetime), get a tax deduction, and withdraw tax-free for a home purchase.",
      whyItMatters:
        "The FHSA is the single most tax-efficient account in Canada for first-time buyers — you get the RRSP-style deduction AND the TFSA-style tax-free withdrawal. Not using it means leaving significant value on the table.",
      priority: "high",
      actionRoute: "/plan?step=4",
      actionLabel: "Add FHSA contributions",
      estimatedImpact: "Up to $8,000/year in tax deductions + tax-free growth",
    });
  }

  // ── Rule 5: TFSA for modest income ─────────────────────────────────────
  if (
    assets.tfsaMonthlyContribution === 0 &&
    surplus > 200 &&
    !selectedGoalTypes.includes("buy-home")
  ) {
    recs.push({
      id: "tfsa",
      title: "Start contributing to your TFSA",
      explanation:
        "Your TFSA lets you invest up to $7,000/year (2025). Growth and withdrawals are completely tax-free — with no income restrictions or repayment rules.",
      whyItMatters:
        "For newcomers and low-to-moderate income earners, the TFSA is usually the best first investment account. It's flexible — you can withdraw anytime without penalty, making it ideal while you're still building financial stability.",
      priority: "medium",
      actionRoute: "/plan?step=4",
      actionLabel: "Add TFSA contributions",
      estimatedImpact: `Even $${Math.min(200, Math.round(surplus * 0.3))}/month compounded over ${results.yearsToRetirement} years adds significant wealth`,
    });
  }

  // ── Rule 6: RRSP for tax reduction ─────────────────────────────────────
  if (
    (selectedGoalTypes.includes("pay-less-tax") ||
      selectedGoalTypes.includes("retire-enough")) &&
    profile.annualGrossIncome > 60000 &&
    assets.rrspMonthlyContribution < 200
  ) {
    const maxMonthly = Math.round(
      (Math.min(profile.annualGrossIncome * 0.18, 32490) / 12) * 100
    ) / 100;
    recs.push({
      id: "rrsp",
      title: "Use RRSP contributions to reduce your tax bill",
      explanation: `At your income level ($${(profile.annualGrossIncome / 1000).toFixed(0)}k), RRSP contributions reduce your taxable income. You can contribute up to $${maxMonthly.toFixed(0)}/month (${Math.round(profile.annualGrossIncome * 0.18).toLocaleString()}/year max).`,
      whyItMatters:
        "RRSP contributions generate a tax refund now (typically 26-33 cents per dollar contributed) and grow tax-sheltered until retirement. If your income in retirement will be lower, you'll pay less tax overall.",
      priority: "medium",
      actionRoute: "/plan?step=4",
      actionLabel: "Add RRSP contributions",
      estimatedImpact: `~$${Math.round(profile.annualGrossIncome * 0.18 * 0.26 / 12)}/month in immediate tax savings if at 26% marginal rate`,
    });
  }

  // ── Rule 7: RESP for children ───────────────────────────────────────────
  if (
    profile.numberOfChildren > 0 &&
    assets.respBalance === 0 &&
    assets.respMonthlyContribution === 0 &&
    selectedGoalTypes.includes("save-education")
  ) {
    const optimalMonthly = Math.round(
      (2500 * profile.numberOfChildren) / 12
    );
    recs.push({
      id: "resp",
      title: `Start an RESP for your ${profile.numberOfChildren > 1 ? `${profile.numberOfChildren} children` : "child"}`,
      explanation: `The RESP qualifies for the Canada Education Savings Grant (CESG): the government adds 20% on the first $2,500/year per child. That's $${500 * profile.numberOfChildren}/year in free money from the government.`,
      whyItMatters:
        "Post-secondary education costs are rising. An RESP with CESG not only gives you free government grants, but grows tax-sheltered until your child uses it for education.",
      priority: "medium",
      actionRoute: "/plan?step=4",
      actionLabel: "Add RESP contributions",
      estimatedImpact: `$${optimalMonthly}/month maximizes CESG grants of $${500 * profile.numberOfChildren}/year`,
    });
  }

  // ── Rule 7b: RESP opened but contributions stopped ──────────────────────
  // Account exists and has a balance, but $0/mo contribution — full CESG missed.
  // Common pattern: contributions quietly stopped when life got busier.
  // With the account already open, resuming requires no new setup.
  if (
    profile.numberOfChildren > 0 &&
    assets.respBalance > 0 &&
    assets.respMonthlyContribution === 0 &&
    selectedGoalTypes.includes("save-education")
  ) {
    const optimalMonthly = Math.round((2500 * profile.numberOfChildren) / 12);
    const annualGrant = 500 * profile.numberOfChildren;
    recs.push({
      id: "resp-resume",
      title: `Your RESP has savings but no contributions — $${annualGrant}/year in government grants is going uncaptured`,
      explanation: `Your RESP holds $${assets.respBalance.toLocaleString()} but you're currently contributing $0/month. The federal CESG adds 20% on the first $2,500/year per child — contributing $${optimalMonthly}/month captures the full $${annualGrant}/year grant automatically.`,
      whyItMatters:
        "CESG is a guaranteed 20% return on the first $2,500 contributed per year — among the best risk-free returns available in Canada. The account is already open; resuming contributions is a one-step change.",
      priority: "medium",
      actionRoute: "/plan?step=4",
      actionLabel: "Resume RESP contributions",
      estimatedImpact: `$${annualGrant}/year in grants for each remaining eligible year, compounding inside the RESP tax-sheltered`,
    });
  }

  // ── Rule 8: Insufficient surplus / cash flow ────────────────────────────
  if (surplus < 0 && totalIncome > 0) {
    const deficit = Math.abs(surplus);
    recs.push({
      id: "cash-flow",
      title: "Address negative monthly cash flow",
      explanation: `Your current expenses exceed your income by $${deficit.toFixed(0)}/month. This means you are drawing down savings or taking on debt to cover living costs.`,
      whyItMatters:
        "Negative cash flow is unsustainable and makes all other financial goals impossible until resolved. Focus on reducing discretionary spending or increasing income before investing.",
      priority: "high",
      actionRoute: "/plan?step=3",
      actionLabel: "Review income & expenses",
      estimatedImpact: `Reducing expenses by $${Math.round(deficit / 3)}/month in 3 categories would bring you to breakeven`,
    });
  }

  // ── Rule 9: Surplus not being invested ────────────────────────────────
  if (
    surplus > 500 &&
    calcMonthlyContributions(assets) < surplus * 0.3 &&
    recs.length < 4
  ) {
    recs.push({
      id: "invest-surplus",
      title: `Put your $${Math.round(surplus)} monthly surplus to work`,
      explanation: `You have $${Math.round(surplus)}/month in surplus but only $${Math.round(calcMonthlyContributions(assets))} is currently going to investments. The remaining surplus is sitting idle.`,
      whyItMatters:
        "Uninvested cash loses value to inflation over time. Even modest regular contributions grow significantly due to compound interest over decades.",
      priority: "medium",
      actionRoute: "/plan?step=6",
      actionLabel: "Set savings capacity",
      estimatedImpact: `Investing $${Math.round(surplus * 0.5)}/month more could meaningfully change your retirement outlook`,
    });
  }

  // ── Rule 10: CPP deferral bonus ─────────────────────────────────────────
  // Delaying CPP from 65 to 70 increases the benefit by 42% (0.7%/month × 60 months).
  // This is one of the highest guaranteed returns available to Canadians.
  if (
    profile.age >= 55 &&
    profile.retirementAge <= 65 &&
    (assumptions.expectedCppBenefit ?? 0) > 0 &&
    results.yearsToRetirement <= 15
  ) {
    const currentCpp = assumptions.expectedCppBenefit ?? 8500;
    const deferredCpp = Math.round(currentCpp * 1.42);
    recs.push({
      id: "cpp-deferral",
      title: "Consider deferring CPP to age 70 for a 42% boost",
      explanation: `Taking CPP at 65 gives you ~$${currentCpp.toLocaleString()}/year. Waiting until 70 increases it to ~$${deferredCpp.toLocaleString()}/year permanently — a 42% lifetime increase.`,
      whyItMatters:
        "CPP deferral is one of the best guaranteed returns available. If you can fund the gap between 65 and 70 from TFSA or other savings, the break-even is typically around age 74–75 — worth it for anyone with a normal life expectancy.",
      priority: "medium",
      actionRoute: "/app/advisor",
      actionLabel: "Ask the advisor",
      estimatedImpact: `+$${(deferredCpp - currentCpp).toLocaleString()}/year of guaranteed inflation-indexed income`,
    });
  }

  // ── Rule 11: Spousal RRSP for income splitting ──────────────────────────
  // If married/common-law and meaningful income gap, spousal RRSP allows income
  // splitting at retirement which can reduce combined tax by 15-25%.
  const isCouple =
    profile.maritalStatus === "married" || profile.maritalStatus === "common-law";
  const hasSpouse = plan.spouse !== null;
  const incomeGap = hasSpouse
    ? Math.abs(profile.annualGrossIncome - (plan.spouse?.spouseAnnualGrossIncome ?? 0))
    : 0;
  if (
    isCouple &&
    hasSpouse &&
    incomeGap > 25000 &&
    profile.annualGrossIncome > 70000 &&
    assets.rrspMonthlyContribution > 0
  ) {
    recs.push({
      id: "spousal-rrsp",
      title: "Use spousal RRSP to split retirement income and reduce taxes",
      explanation: `There is a $${incomeGap.toLocaleString()} income gap between spouses. Contributing to a spousal RRSP now means your partner withdraws that income in retirement — taxed at their (lower) rate instead of yours.`,
      whyItMatters:
        "Income splitting in retirement is one of the most effective legal tax reduction strategies for Canadian couples. It can reduce your combined annual tax bill by thousands of dollars.",
      priority: "medium",
      actionRoute: "/plan?step=4",
      actionLabel: "Adjust RRSP contributions",
      estimatedImpact: "Potentially $2,000–$5,000/year in reduced combined retirement taxes",
    });
  }

  // ── Rule 12: GIS eligibility for low-income retirees ────────────────────
  // The Guaranteed Income Supplement adds up to ~$12,780/year for low-income seniors.
  // Many eligible Canadians don't know they qualify.
  if (
    assumptions.desiredRetirementIncomeToday < GIS_INCOME_THRESHOLD + 8500 &&
    profile.retirementAge >= 60
  ) {
    recs.push({
      id: "gis",
      title: "You may qualify for the Guaranteed Income Supplement (GIS)",
      explanation: `If your total retirement income (excluding OAS) is below ~$${GIS_INCOME_THRESHOLD.toLocaleString()}/year, you likely qualify for GIS — up to $1,065/month of additional government income.`,
      whyItMatters:
        "GIS is a non-taxable supplement that significantly reduces the capital you need to self-fund retirement. Many eligible Canadians miss it because they don't apply. You must apply annually through Service Canada.",
      priority: "low",
      actionRoute: "/app/resources",
      actionLabel: "View government benefits",
      estimatedImpact: "Up to $12,780/year in additional non-taxable retirement income",
    });
  }

  // ── Rule 13: Withdrawal ordering in retirement ───────────────────────────
  // TFSA last, non-reg before RRSP in many cases — order dramatically affects lifetime tax.
  if (
    results.yearsToRetirement <= 5 &&
    assets.tfsaBalance > 0 &&
    assets.rrspBalance > 0
  ) {
    recs.push({
      id: "withdrawal-ordering",
      title: "Plan your withdrawal order before retirement — it affects taxes significantly",
      explanation:
        "The order you draw from RRSP, TFSA, and non-registered accounts in retirement can mean tens of thousands of dollars in tax differences over 20–30 years.",
      whyItMatters:
        "General principle: draw from non-registered first (capital gains tax now while in a lower bracket), then RRSP (delay fully taxable withdrawals), and leave TFSA last (tax-free, no OAS clawback risk). But the optimal order depends on your specific income sources — discuss with a tax advisor.",
      priority: "medium",
      actionRoute: "/app/advisor",
      actionLabel: "Ask the advisor",
      estimatedImpact: "Potentially $20,000–$60,000 in lifetime tax savings with the right draw-down order",
    });
  }

  // ── Rule 14: Stressed scenario warning ──────────────────────────────────
  // If the stressed retirement capital (return - 2%) still results in a significant gap,
  // the plan is fragile to underperformance.
  const stressedGap = results.requiredRetirementCapital - (results.stressedRetirementCapital ?? 0);
  if (
    stressedGap > results.requiredRetirementCapital * 0.30 &&
    results.yearsToRetirement > 5 &&
    results.retirementGapPercent < 30 // only warn if main scenario looks ok — otherwise redundant
  ) {
    recs.push({
      id: "stressed-scenario",
      title: "Your plan is sensitive to lower-than-expected returns",
      explanation: `If markets deliver 2% less per year than expected, your retirement capital drops to ${fmt(results.stressedRetirementCapital ?? 0)} — leaving a significant gap versus your target.`,
      whyItMatters:
        "A good financial plan should be stress-tested. Consider increasing contributions or being open to a slightly later retirement as a buffer against a decade of lower returns (which history shows occurs regularly).",
      priority: "low",
      actionRoute: "/plan?step=6",
      actionLabel: "Adjust savings capacity",
      estimatedImpact: "Increasing contributions by 20% substantially reduces this sensitivity",
    });
  }

  // Limit to top 6 recommendations, sorted by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recs
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 6);
}
