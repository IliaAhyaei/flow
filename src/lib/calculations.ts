import type {
  UserProfile,
  IncomeBreakdown,
  ExpensesBreakdown,
  AssetsBreakdown,
  Liability,
  Goal,
  PlanningAssumptions,
  FinancialPlan,
  CalculatedResults,
  ProjectionPoint,
  GoalReadiness,
} from "@/types/financial";
import { calcHealthScore } from "./scoring";
import { generateRecommendations } from "./recommendations";
import {
  estimateMarginalRateAtRetirement,
  getSafeWithdrawalMultiplier,
} from "./canadianRules";

// ─── Income ────────────────────────────────────────────────────────────────

export function calcMonthlyIncome(income: IncomeBreakdown): number {
  return (
    income.employmentIncome +
    income.sideIncome +
    income.governmentBenefits +
    income.familyIncome +
    income.otherIncome
  );
}

// ─── Expenses ─────────────────────────────────────────────────────────────

export function calcMonthlyExpenses(expenses: ExpensesBreakdown): number {
  return (
    expenses.rentOrMortgage +
    expenses.homeInsurance +
    expenses.propertyTax +
    expenses.utilities +
    expenses.carPayment +
    expenses.fuelTransit +
    expenses.autoInsurance +
    expenses.groceries +
    expenses.diningOut +
    expenses.clothing +
    expenses.childCare +
    expenses.personalCare +
    expenses.cellPhone +
    expenses.internet +
    expenses.streamingCable +
    expenses.gymMemberships +
    expenses.entertainment +
    expenses.giftsCharity +
    expenses.creditCardPayment +
    expenses.studentLoanPayment +
    expenses.personalLoanPayment +
    expenses.lineOfCreditPayment +
    expenses.familySupport +
    expenses.miscellaneous
  );
}

export function calcEssentialMonthlyExpenses(expenses: ExpensesBreakdown): number {
  // Essential = housing + transport + food + utilities + childcare + debt minimums
  return (
    expenses.rentOrMortgage +
    expenses.homeInsurance +
    expenses.propertyTax +
    expenses.utilities +
    expenses.carPayment +
    expenses.fuelTransit +
    expenses.autoInsurance +
    expenses.groceries +
    expenses.childCare +
    expenses.creditCardPayment +
    expenses.studentLoanPayment +
    expenses.personalLoanPayment +
    expenses.lineOfCreditPayment
  );
}

// ─── Assets ───────────────────────────────────────────────────────────────

export function calcInvestableAssets(assets: AssetsBreakdown): number {
  return (
    assets.tfsaBalance +
    assets.rrspBalance +
    assets.fhsaBalance +
    assets.nonRegisteredInvestments +
    assets.pensionValue +
    assets.otherInvestments +
    assets.respBalance
  );
}

export function calcLiquidAssets(assets: AssetsBreakdown): number {
  return assets.chequing + assets.savings + assets.emergencyFund;
}

export function calcRealAssets(assets: AssetsBreakdown): number {
  return (
    assets.homeMarketValue +
    assets.otherRealEstate +
    assets.vehicleValue +
    assets.valuablesOther
  );
}

export function calcTotalAssets(assets: AssetsBreakdown): number {
  return (
    calcLiquidAssets(assets) +
    calcInvestableAssets(assets) +
    calcRealAssets(assets)
  );
}

export function calcMonthlyContributions(assets: AssetsBreakdown): number {
  return (
    assets.tfsaMonthlyContribution +
    assets.rrspMonthlyContribution +
    assets.respMonthlyContribution +
    assets.fhsaMonthlyContribution +
    assets.nonRegisteredMonthlyContribution
  );
}

// ─── Liabilities ──────────────────────────────────────────────────────────

export function calcTotalLiabilities(liabilities: Liability[]): number {
  return liabilities.reduce((sum, l) => sum + l.outstandingBalance, 0);
}

export function calcTotalMonthlyDebtPayments(liabilities: Liability[]): number {
  return liabilities.reduce((sum, l) => sum + l.minimumMonthlyPayment, 0);
}

export function calcWeightedAverageDebtRate(liabilities: Liability[]): number {
  const totalBalance = calcTotalLiabilities(liabilities);
  if (totalBalance === 0) return 0;
  const weightedSum = liabilities.reduce(
    (sum, l) => sum + l.interestRate * l.outstandingBalance,
    0
  );
  return weightedSum / totalBalance;
}

// ─── Retirement Projection ────────────────────────────────────────────────

function fvLumpSum(pv: number, annualRate: number, years: number): number {
  if (annualRate === 0) return pv;
  return pv * Math.pow(1 + annualRate, years);
}

function fvAnnuityMonthly(
  monthlyPayment: number,
  annualRate: number,
  months: number
): number {
  if (monthlyPayment <= 0) return 0;
  const mr = annualRate / 12;
  if (mr === 0) return monthlyPayment * months;
  return monthlyPayment * ((Math.pow(1 + mr, months) - 1) / mr);
}

// Future value of a growing annuity (contributions that increase at annualGrowthRate per year).
// Models the reality that as income rises, contributions tend to grow over time.
// Formula: PMT × [(1+r)^n - (1+g)^n] / (r - g)   when r ≠ g
//          PMT × n × (1+r)^(n-1)                   when r = g  (L'Hôpital)
function fvGrowingAnnuityMonthly(
  monthlyPayment: number,
  annualReturn: number,
  annualGrowth: number,
  months: number
): number {
  if (monthlyPayment <= 0 || months <= 0) return 0;
  const r = annualReturn / 12;
  const g = annualGrowth / 12;
  if (Math.abs(r - g) < 1e-9) {
    // r ≈ g case
    return monthlyPayment * months * Math.pow(1 + r, months - 1);
  }
  return (
    monthlyPayment *
    ((Math.pow(1 + r, months) - Math.pow(1 + g, months)) / (r - g))
  );
}

// Months until a loan is fully amortized given a constant payment.
// Returns Infinity if the payment doesn't cover interest.
function monthsUntilPaidOff(
  balance: number,
  annualInterestRate: number,
  monthlyPayment: number
): number {
  if (balance <= 0 || monthlyPayment <= 0) return 0;
  const mr = annualInterestRate / 100 / 12;
  if (mr <= 0) return Math.ceil(balance / monthlyPayment);
  const interestOnly = balance * mr;
  if (monthlyPayment <= interestOnly) return Infinity; // never paid off
  return Math.ceil(
    Math.log(monthlyPayment / (monthlyPayment - interestOnly)) / Math.log(1 + mr)
  );
}

export interface RetirementProjection {
  yearsToRetirement: number;
  retirementYears: number;
  safeWithdrawalRate: number;
  projectedRetirementCapital: number;
  afterTaxProjectedRetirementCapital: number;
  stressedRetirementCapital: number;
  futureRetirementIncomeNeed: number;
  requiredRetirementCapital: number;
  retirementGap: number;
  retirementGapPercent: number;
  estimatedMarginalRateAtRetirement: number;
}

export function calcRetirementProjection(
  profile: UserProfile,
  assets: AssetsBreakdown,
  assumptions: PlanningAssumptions,
  monthlyContributionOverride?: number
): RetirementProjection {
  const yearsToRetirement = Math.max(0, profile.retirementAge - profile.age);
  const monthsToRetirement = yearsToRetirement * 12;

  const annualReturn = assumptions.expectedAnnualReturn / 100;
  const annualInflation = assumptions.expectedInflationRate / 100;
  const annualGrowth = (assumptions.annualIncomeGrowthRate ?? 2) / 100;
  const stressedReturn = Math.max(0.01, annualReturn - 0.02); // bear-case: 2% below expected

  // ── Dynamic retirement horizon → dynamic withdrawal multiplier ───────────
  const retirementYears = Math.max(10, profile.lifeExpectancyAge - profile.retirementAge);
  const { rate: safeWithdrawalRate, multiplier: withdrawalMultiplier } =
    getSafeWithdrawalMultiplier(retirementYears);

  // ── Per-account growth (gross, pre-tax) ──────────────────────────────────
  // Each account type grows its existing balance + its specific monthly contributions.
  // Contributions grow at annualGrowth (income growth rate) over time — growing annuity.
  const dcPensionBalance = assets.pensionType === "dc" ? assets.pensionValue : 0;

  const tfsaFV =
    fvLumpSum(assets.tfsaBalance, annualReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.tfsaMonthlyContribution, annualReturn, annualGrowth, monthsToRetirement);

  const rrspFV =
    fvLumpSum(assets.rrspBalance, annualReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.rrspMonthlyContribution, annualReturn, annualGrowth, monthsToRetirement);

  const nonRegFV =
    fvLumpSum(assets.nonRegisteredInvestments, annualReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.nonRegisteredMonthlyContribution, annualReturn, annualGrowth, monthsToRetirement);

  const dcPensionFV = fvLumpSum(dcPensionBalance, annualReturn, yearsToRetirement);

  const otherFV = fvLumpSum(assets.otherInvestments, annualReturn, yearsToRetirement);

  // RESP is excluded — legally restricted to education, not retirement capital.
  // FHSA: if used for home purchase it won't exist; treat as RRSP-equivalent tax-wise for retirement.
  const fhsaFV =
    fvLumpSum(assets.fhsaBalance, annualReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.fhsaMonthlyContribution, annualReturn, annualGrowth, monthsToRetirement);

  const projectedRetirementCapital = Math.round(
    tfsaFV + rrspFV + nonRegFV + dcPensionFV + otherFV + fhsaFV
  );

  // ── After-tax capital (critical: $1 in RRSP ≠ $1 in TFSA after withdrawal tax) ──
  // marginalRate is based on expected retirement income (what taxes will apply to withdrawals)
  const marginalRate = estimateMarginalRateAtRetirement(assumptions.desiredRetirementIncomeToday);

  const afterTaxTfsa = tfsaFV * 1.0; // fully tax-free
  const afterTaxRrsp = rrspFV * (1 - marginalRate); // 100% taxable on withdrawal (pre-tax money in)
  const afterTaxFhsa = fhsaFV * (1 - marginalRate); // FHSA → RRSP if not used for home
  const afterTaxDcPension = dcPensionFV * (1 - marginalRate); // taxable like RRSP (pre-tax contributions)

  // Non-registered: only the GAIN is taxable, not the original principal (already after-tax money).
  // Canadian capital gains: 50% inclusion rate → effective tax = marginalRate × 0.50.
  // We blend with a 10% weight for interest/dividend income taxed more heavily,
  // giving effective rate on gain ≈ marginalRate × 0.55 as a conservative blended estimate.
  const nonRegPrincipal = assets.nonRegisteredInvestments; // already after-tax
  const nonRegGain = Math.max(0, nonRegFV - nonRegPrincipal);
  const afterTaxNonReg = nonRegPrincipal + nonRegGain * (1 - marginalRate * 0.55);

  const otherPrincipal = assets.otherInvestments;
  const otherGain = Math.max(0, otherFV - otherPrincipal);
  const afterTaxOther = otherPrincipal + otherGain * (1 - marginalRate * 0.55);

  const afterTaxProjectedRetirementCapital = Math.round(
    afterTaxTfsa + afterTaxRrsp + afterTaxFhsa + afterTaxDcPension + afterTaxNonReg + afterTaxOther
  );

  // ── Stressed scenario: return - 2% (sequence-of-returns / bear-market proxy) ──
  const stressedTfsaFV =
    fvLumpSum(assets.tfsaBalance, stressedReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.tfsaMonthlyContribution, stressedReturn, annualGrowth, monthsToRetirement);
  const stressedRrspFV =
    fvLumpSum(assets.rrspBalance, stressedReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.rrspMonthlyContribution, stressedReturn, annualGrowth, monthsToRetirement);
  const stressedNonRegFV =
    fvLumpSum(assets.nonRegisteredInvestments, stressedReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.nonRegisteredMonthlyContribution, stressedReturn, annualGrowth, monthsToRetirement);
  const stressedDcFV = fvLumpSum(dcPensionBalance, stressedReturn, yearsToRetirement);
  const stressedOtherFV = fvLumpSum(assets.otherInvestments, stressedReturn, yearsToRetirement);
  const stressedFhsaFV =
    fvLumpSum(assets.fhsaBalance, stressedReturn, yearsToRetirement) +
    fvGrowingAnnuityMonthly(assets.fhsaMonthlyContribution, stressedReturn, annualGrowth, monthsToRetirement);

  const stressedGross = stressedTfsaFV + stressedRrspFV + stressedNonRegFV + stressedDcFV + stressedOtherFV + stressedFhsaFV;
  const stressedNonRegGain = Math.max(0, stressedNonRegFV - nonRegPrincipal);
  const stressedOtherGain = Math.max(0, stressedOtherFV - otherPrincipal);
  const stressedRetirementCapital = Math.round(
    stressedTfsaFV * 1.0 +
    stressedRrspFV * (1 - marginalRate) +
    stressedFhsaFV * (1 - marginalRate) +
    stressedDcFV * (1 - marginalRate) +
    nonRegPrincipal + stressedNonRegGain * (1 - marginalRate * 0.55) +
    otherPrincipal + stressedOtherGain * (1 - marginalRate * 0.55)
  );
  void stressedGross; // suppress unused warning

  // ── Income need and required capital ─────────────────────────────────────
  const futureRetirementIncomeNeed = Math.round(
    assumptions.desiredRetirementIncomeToday *
      Math.pow(1 + annualInflation, yearsToRetirement)
  );

  // Government benefits (CPP + OAS + DB pension) offset the self-funded income need
  const cppToday = assumptions.expectedCppBenefit ?? 0;
  const oasToday = assumptions.expectedOasBenefit ?? 0;
  const dbPensionToday = assets.pensionType === "db" ? (assets.pensionAnnualBenefit ?? 0) : 0;
  const futureGovernmentAndPensionBenefit = Math.round(
    (cppToday + oasToday + dbPensionToday) * Math.pow(1 + annualInflation, yearsToRetirement)
  );

  const selfFundedIncomeNeed = Math.max(0, futureRetirementIncomeNeed - futureGovernmentAndPensionBenefit);

  // Required capital uses the dynamic withdrawal multiplier (not a fixed 25x).
  // Longer retirement horizons (early retirees) demand larger multiples.
  const requiredRetirementCapital = Math.round(selfFundedIncomeNeed * withdrawalMultiplier);

  // Compare after-tax capital to required — this is the correct comparison since
  // required capital is based on desired spending (after-tax dollars).
  const retirementGap = Math.max(0, requiredRetirementCapital - afterTaxProjectedRetirementCapital);

  const retirementGapPercent =
    requiredRetirementCapital > 0
      ? Math.round((retirementGap / requiredRetirementCapital) * 100)
      : 0;

  return {
    yearsToRetirement,
    retirementYears,
    safeWithdrawalRate,
    projectedRetirementCapital,
    afterTaxProjectedRetirementCapital,
    stressedRetirementCapital,
    futureRetirementIncomeNeed,
    requiredRetirementCapital,
    retirementGap,
    retirementGapPercent,
    estimatedMarginalRateAtRetirement: marginalRate,
  };
}

// ─── Debt Amortization ────────────────────────────────────────────────────
//
// Models debt paydown with interest accrual — far more accurate than the
// naive linear model (totalDebt - payments × months) which ignores interest.

export function calcDebtRemainingAfterMonths(
  initialBalance: number,
  annualInterestRate: number,
  monthlyPayment: number,
  months: number
): number {
  if (initialBalance <= 0) return 0;
  if (months <= 0) return initialBalance;
  const mr = annualInterestRate / 100 / 12;
  if (mr === 0) {
    // Interest-free: simple linear paydown
    return Math.max(0, initialBalance - monthlyPayment * months);
  }
  if (monthlyPayment <= 0) {
    // No payment: balance compounds with interest
    return initialBalance * Math.pow(1 + mr, months);
  }
  // Standard amortization: B_n = B_0*(1+r)^n - PMT*((1+r)^n − 1)/r
  const factor = Math.pow(1 + mr, months);
  const balance = initialBalance * factor - monthlyPayment * ((factor - 1) / mr);
  return Math.max(0, balance);
}

export function calcTotalDebtAfterMonths(
  liabilities: Liability[],
  months: number
): number {
  return liabilities.reduce(
    (sum, l) =>
      sum +
      calcDebtRemainingAfterMonths(
        l.outstandingBalance,
        l.interestRate,
        l.minimumMonthlyPayment,
        months
      ),
    0
  );
}

// ─── Projection Series (for chart) ───────────────────────────────────────

export function calcProjectionSeries(plan: FinancialPlan): ProjectionPoint[] {
  const { profile, assets, liabilities, assumptions } = plan;

  const annualReturn = assumptions.expectedAnnualReturn / 100;
  const annualInflation = assumptions.expectedInflationRate / 100;
  const annualGrowth = (assumptions.annualIncomeGrowthRate ?? 2) / 100;

  const currentInvestable = calcInvestableAssets(assets);
  const currentContributions = calcMonthlyContributions(assets);

  // Recommended path uses the higher of current contributions or stated comfortable amount
  const recommendedMonthly = Math.max(
    currentContributions,
    assumptions.monthlyAmountUserCanComfortablySetAside
  );

  // Non-investable assets: home + other real estate + liquid (excl. emergency fund) + valuables
  // Vehicles handled separately — they DEPRECIATE, not appreciate
  const appreciatingNonInvestable =
    calcLiquidAssets(assets) - assets.emergencyFund +
    assets.homeMarketValue +
    assets.otherRealEstate +
    assets.valuablesOther;

  // Precompute when each liability is fully paid off (in years)
  // After payoff, that monthly payment becomes investable cash flow.
  const debtPayoffYears: { payment: number; paidOffAtYear: number }[] = liabilities.map((l) => {
    const m = monthsUntilPaidOff(l.outstandingBalance, l.interestRate, l.minimumMonthlyPayment);
    return {
      payment: l.minimumMonthlyPayment,
      paidOffAtYear: isFinite(m) ? m / 12 : Infinity,
    };
  });

  const yearsToShow = Math.min(
    Math.max(profile.retirementAge - profile.age + 5, 20),
    40
  );

  const series: ProjectionPoint[] = [];

  for (let year = 0; year <= yearsToShow; year++) {
    const months = year * 12;

    // Freed cash flow from debts paid off by this year (reinvested)
    const freedMonthly = debtPayoffYears.reduce((sum, d) => {
      return year > d.paidOffAtYear ? sum + d.payment : sum;
    }, 0);

    const effectiveCurrentMonthly = currentContributions + freedMonthly;
    const effectiveRecommendedMonthly = recommendedMonthly + freedMonthly;

    // Investable portfolio uses growing annuity (contributions rise with income growth)
    const currentInvestableGrown = fvLumpSum(currentInvestable, annualReturn, year);
    const currentContribGrown = fvGrowingAnnuityMonthly(effectiveCurrentMonthly, annualReturn, annualGrowth, months);

    const recommendedInvestableGrown = fvLumpSum(currentInvestable, annualReturn, year);
    const recommendedContribGrown = fvGrowingAnnuityMonthly(effectiveRecommendedMonthly, annualReturn, annualGrowth, months);

    // Appreciating non-investable assets grow with inflation
    const appreciatingGrown = fvLumpSum(appreciatingNonInvestable, annualInflation, year);

    // Vehicles DEPRECIATE at ~8%/year in nominal terms (not appreciate with inflation)
    const vehicleGrown = assets.vehicleValue * Math.pow(0.92, year);

    const nonInvestableGrown = appreciatingGrown + vehicleGrown;

    // Proper amortization for remaining debt
    const debtRemaining = calcTotalDebtAfterMonths(liabilities, months);

    const currentTotal = currentInvestableGrown + currentContribGrown + nonInvestableGrown - debtRemaining;
    const recommendedTotal = recommendedInvestableGrown + recommendedContribGrown + nonInvestableGrown - debtRemaining;

    // No artificial floor — show the real trajectory even if negative
    series.push({
      year,
      age: profile.age + year,
      label: year === 0 ? "Today" : `Yr ${year}`,
      currentPath: Math.round(currentTotal),
      recommendedPath: Math.round(recommendedTotal),
    });
  }

  return series;
}

// ─── Goal Readiness ───────────────────────────────────────────────────────
//
// Bug fix #3: Goals no longer each receive the full monthly budget.
//
// Allocation model:
//   • Retirement goals (retire-enough, retire-early) use actual monthly
//     investment contributions — they are funded by RRSP/TFSA/etc., not
//     by the shared goal budget pool.
//   • All other goals share the monthly goal budget using a priority-weighted
//     allocation:
//       weight = base(1.0)
//              + priorityBonus (rank 1 = +3, rank 2 = +1.5, rank 3 = +0.75)
//              + importanceBonus (high = +0.5, low = −0.25)
//              + urgencyBonus (< 12mo = +2, 12–24mo = +1, 24–60mo = +0.3)
//   This ensures a user with 4 goals doesn't see each evaluated as if all
//   savings go to that single goal.

const RETIREMENT_GOAL_TYPES = new Set(["retire-enough", "retire-early"]);

function goalAllocationWeight(goal: Goal, currentYear: number): number {
  let w = 1.0;
  // Priority rank bonus
  if (goal.topPriorityRank === 1) w += 3.0;
  else if (goal.topPriorityRank === 2) w += 1.5;
  else if (goal.topPriorityRank === 3) w += 0.75;
  // Importance bonus
  if (goal.importanceLevel === "high") w += 0.5;
  else if (goal.importanceLevel === "low") w -= 0.25;
  // Urgency bonus (shorter deadline = higher weight)
  if (goal.targetYear) {
    const monthsLeft = Math.max(0, (goal.targetYear - currentYear) * 12);
    if (monthsLeft <= 12) w += 2.0;
    else if (monthsLeft <= 24) w += 1.0;
    else if (monthsLeft <= 60) w += 0.3;
  }
  return Math.max(0.1, w);
}

export function calcGoalReadiness(plan: FinancialPlan): GoalReadiness[] {
  const { goals, assets, assumptions } = plan;
  const currentYear = new Date().getFullYear();

  const monthlySurplus = calcMonthlyIncome(plan.income) - calcMonthlyExpenses(plan.expenses);
  // Total shared budget for non-retirement goals
  const totalMonthlyGoalBudget = Math.max(
    0,
    Math.min(monthlySurplus, assumptions.monthlyAmountUserCanComfortablySetAside)
  );
  // Actual investment contributions (for retirement goals)
  const monthlyInvestmentContributions = calcMonthlyContributions(assets);

  // Non-retirement goals with targets compete for the shared budget
  const nonRetirementGoalsWithTarget = goals.filter(
    (g) =>
      g.selected &&
      !RETIREMENT_GOAL_TYPES.has(g.goalType) &&
      g.targetAmount != null &&
      g.targetYear != null
  );

  // Build priority-weighted allocation map for non-retirement goals
  const totalWeight = nonRetirementGoalsWithTarget.reduce(
    (sum, g) => sum + goalAllocationWeight(g, currentYear),
    0
  );
  const goalAllocations = new Map<string, number>();
  nonRetirementGoalsWithTarget.forEach((g) => {
    const share =
      totalWeight > 0
        ? Math.round(totalMonthlyGoalBudget * (goalAllocationWeight(g, currentYear) / totalWeight))
        : Math.round(totalMonthlyGoalBudget / Math.max(1, nonRetirementGoalsWithTarget.length));
    goalAllocations.set(g.id, share);
  });

  return goals
    .filter((g) => g.selected)
    .map((goal) => {
      const isRetirement = RETIREMENT_GOAL_TYPES.has(goal.goalType);

      // Map goal type to most relevant existing savings
      let currentSaved = 0;
      if (goal.goalType === "buy-home") {
        currentSaved = assets.fhsaBalance + assets.tfsaBalance + assets.savings;
      } else if (goal.goalType === "save-education") {
        currentSaved = assets.respBalance;
      } else if (isRetirement) {
        currentSaved = calcInvestableAssets(assets);
      } else {
        currentSaved = assets.savings + assets.emergencyFund + assets.tfsaBalance;
      }

      if (!goal.targetAmount || !goal.targetYear) {
        return {
          goalId: goal.id,
          goalType: goal.goalType,
          label: goal.label,
          status: "no-target" as const,
          currentSaved,
          targetAmount: null,
          targetYear: null,
          monthsRemaining: null,
          monthlyNeeded: null,
          monthlyShortfall: null,
          projectedAtTarget: null,
          allocatedMonthly: null,
        };
      }

      const monthsRemaining = Math.max(0, (goal.targetYear - currentYear) * 12);
      const gap = Math.max(0, goal.targetAmount - currentSaved);
      const monthlyNeeded = monthsRemaining > 0 ? gap / monthsRemaining : gap;

      // Pick the correct monthly contribution for this goal
      const allocatedMonthly = isRetirement
        ? monthlyInvestmentContributions
        : (goalAllocations.get(goal.id) ?? 0);

      const monthlyShortfall = Math.max(0, monthlyNeeded - allocatedMonthly);

      // Project savings with return using the goal's allocated monthly amount
      const annualReturn = assumptions.expectedAnnualReturn / 100;
      const projectedAtTarget =
        fvLumpSum(currentSaved, annualReturn, monthsRemaining / 12) +
        fvAnnuityMonthly(allocatedMonthly, annualReturn, monthsRemaining);

      let status: GoalReadiness["status"];
      if (projectedAtTarget >= goal.targetAmount) {
        status = "on-track";
      } else if (projectedAtTarget >= goal.targetAmount * 0.75) {
        status = "partially-on-track";
      } else {
        status = "off-track";
      }

      return {
        goalId: goal.id,
        goalType: goal.goalType,
        label: goal.label,
        status,
        currentSaved,
        targetAmount: goal.targetAmount,
        targetYear: goal.targetYear,
        monthsRemaining,
        monthlyNeeded: Math.round(monthlyNeeded),
        monthlyShortfall: Math.round(monthlyShortfall),
        projectedAtTarget: Math.round(projectedAtTarget),
        allocatedMonthly,
      };
    });
}

// ─── Emergency Fund ───────────────────────────────────────────────────────

export interface EmergencyFundStatus {
  current: number;
  target: number;
  gap: number;
  monthsCovered: number;
  isAdequate: boolean;
}

export function calcEmergencyFundStatus(
  assets: AssetsBreakdown,
  expenses: ExpensesBreakdown,
  targetMonths: number
): EmergencyFundStatus {
  const essential = calcEssentialMonthlyExpenses(expenses);
  const target = essential * targetMonths;
  const current = assets.emergencyFund + assets.savings * 0.5; // count 50% of savings as accessible
  const gap = Math.max(0, target - current);
  const monthsCovered = essential > 0 ? current / essential : 0;
  return {
    current: Math.round(current),
    target: Math.round(target),
    gap: Math.round(gap),
    monthsCovered: Math.round(monthsCovered * 10) / 10,
    isAdequate: current >= target,
  };
}

// ─── Full Results ─────────────────────────────────────────────────────────

export function calcFullResults(plan: FinancialPlan): CalculatedResults {
  const { profile, income, expenses, assets, liabilities, assumptions, goals } =
    plan;

  // Totals
  const totalMonthlyIncome = calcMonthlyIncome(income);
  const totalMonthlyExpenses = calcMonthlyExpenses(expenses);
  const monthlySurplus = totalMonthlyIncome - totalMonthlyExpenses;
  const totalAssets = calcTotalAssets(assets);
  const totalLiabilities = calcTotalLiabilities(liabilities);
  const netWorth = totalAssets - totalLiabilities;
  const totalInvestableAssets = calcInvestableAssets(assets);
  const totalMonthlyContributions = calcMonthlyContributions(assets);
  const totalMonthlyDebtPayments = calcTotalMonthlyDebtPayments(liabilities);

  // Rates
  // Bug fix #1: savingsRate = contributions / income × 100 (investment rate).
  // The old formula added monthlySurplus + contributions, but surplus already
  // includes the contribution money (contributions are not subtracted in
  // expenses), so the old formula double-counted contributions.
  // freeCashAfterContributions is the surplus remaining beyond active investing.
  const savingsRate =
    totalMonthlyIncome > 0
      ? Math.round((totalMonthlyContributions / totalMonthlyIncome) * 1000) / 10
      : 0;
  const freeCashAfterContributions = monthlySurplus - totalMonthlyContributions;
  const weightedAverageDebtInterest = calcWeightedAverageDebtRate(liabilities);
  const debtToIncomeRatio =
    profile.annualGrossIncome > 0
      ? Math.round((totalLiabilities / profile.annualGrossIncome) * 100) / 100
      : 0;
  const monthlyDebtToIncomeRatio =
    totalMonthlyIncome > 0
      ? Math.round((totalMonthlyDebtPayments / totalMonthlyIncome) * 1000) / 10
      : 0;

  // Retirement
  const retirement = calcRetirementProjection(profile, assets, assumptions);

  // Emergency Fund
  const efStatus = calcEmergencyFundStatus(
    assets,
    expenses,
    assumptions.emergencyFundTargetMonths
  );

  // Projection series
  const projectionSeries = calcProjectionSeries(plan);

  // Goal readiness
  const goalReadinessSummary = calcGoalReadiness(plan);

  // Health score (requires partial results — pass in)
  const partialResults = {
    monthlySurplus,
    savingsRate,
    freeCashAfterContributions,
    monthlyDebtToIncomeRatio,
    emergencyFundGap: efStatus.gap,
    targetEmergencyFund: efStatus.target,
    emergencyFundMonthsCovered: efStatus.monthsCovered,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    totalAssets,
    totalLiabilities,
    netWorth,
    totalInvestableAssets,
    totalMonthlyContributions,
    totalMonthlyDebtPayments,
    weightedAverageDebtInterest,
    debtToIncomeRatio,
    yearsToRetirement: retirement.yearsToRetirement,
    retirementYears: retirement.retirementYears,
    safeWithdrawalRate: retirement.safeWithdrawalRate,
    projectedRetirementCapital: retirement.projectedRetirementCapital,
    afterTaxProjectedRetirementCapital: retirement.afterTaxProjectedRetirementCapital,
    stressedRetirementCapital: retirement.stressedRetirementCapital,
    futureRetirementIncomeNeed: retirement.futureRetirementIncomeNeed,
    requiredRetirementCapital: retirement.requiredRetirementCapital,
    retirementGap: retirement.retirementGap,
    retirementGapPercent: retirement.retirementGapPercent,
    estimatedMarginalRateAtRetirement: retirement.estimatedMarginalRateAtRetirement,
    projectionSeries,
    goalReadinessSummary,
    recommendations: [],
    protectionFlags: [],
    financialHealthScore: 0,
    healthScoreBreakdown: {
      cashFlow: 0,
      emergencyFund: 0,
      savingsRate: 0,
      debtBurden: 0,
      retirementReadiness: 0,
    },
  };

  const { score, breakdown } = calcHealthScore(partialResults, efStatus);
  const recommendations = generateRecommendations(plan, {
    ...partialResults,
    financialHealthScore: score,
    healthScoreBreakdown: breakdown,
  });

  const protectionFlags: string[] = [];
  if (efStatus.gap > 0) protectionFlags.push("Emergency fund below target");
  if (retirement.retirementGapPercent > 50) protectionFlags.push("Large retirement gap");
  if (monthlyDebtToIncomeRatio > 40) protectionFlags.push("High debt-to-income ratio");
  if (
    goals.some(
      (g) =>
        g.selected &&
        (g.goalType === "protect-family" ||
          g.goalType === "leave-family-debt-free")
    )
  ) {
    protectionFlags.push("Life/disability insurance review recommended");
  }

  return {
    totalMonthlyIncome,
    totalMonthlyExpenses,
    monthlySurplus,
    totalAssets,
    totalLiabilities,
    netWorth,
    totalInvestableAssets,
    totalMonthlyContributions,
    totalMonthlyDebtPayments,
    savingsRate,
    freeCashAfterContributions,
    weightedAverageDebtInterest,
    debtToIncomeRatio,
    monthlyDebtToIncomeRatio,
    yearsToRetirement: retirement.yearsToRetirement,
    retirementYears: retirement.retirementYears,
    safeWithdrawalRate: retirement.safeWithdrawalRate,
    projectedRetirementCapital: retirement.projectedRetirementCapital,
    afterTaxProjectedRetirementCapital: retirement.afterTaxProjectedRetirementCapital,
    stressedRetirementCapital: retirement.stressedRetirementCapital,
    futureRetirementIncomeNeed: retirement.futureRetirementIncomeNeed,
    requiredRetirementCapital: retirement.requiredRetirementCapital,
    retirementGap: retirement.retirementGap,
    retirementGapPercent: retirement.retirementGapPercent,
    estimatedMarginalRateAtRetirement: retirement.estimatedMarginalRateAtRetirement,
    targetEmergencyFund: efStatus.target,
    emergencyFundGap: efStatus.gap,
    emergencyFundMonthsCovered: efStatus.monthsCovered,
    financialHealthScore: score,
    healthScoreBreakdown: breakdown,
    projectionSeries,
    goalReadinessSummary,
    recommendations,
    protectionFlags,
  };
}

// ─── Formatting Helpers ───────────────────────────────────────────────────

export function fmt(n: number): string {
  if (n >= 1_000_000)
    return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)
    return `$${Math.round(n / 1000)}k`;
  return `$${n.toLocaleString("en-CA", { maximumFractionDigits: 0 })}`;
}

export function fmtFull(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-CA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function fmtRate(n: number): string {
  return `${n.toFixed(1)}%`;
}
