import type { GoalType, Province, UserProfile } from "@/types/financial";

// ─── TFSA ───────────────────────────────────────────────────────────────────

// Annual contribution limit for 2025 is $7,000.
// We approximate cumulative room by age (users who have been eligible since 18).
const TFSA_ANNUAL_LIMIT = 7000;
const TFSA_ANNUAL_LIMIT_MONTHLY = TFSA_ANNUAL_LIMIT / 12;

export function getTFSAAnnualLimit(): number {
  return TFSA_ANNUAL_LIMIT;
}

export function getTFSAMonthlyLimit(): number {
  return TFSA_ANNUAL_LIMIT_MONTHLY;
}

// Cumulative TFSA room (approximate) for someone who turned 18 in a given year.
// TFSA started in 2009. Max historical room through 2025 is $102,000.
export function getCumulativeTFSARoom(age: number, currentYear = 2025): number {
  const yearTurned18 = currentYear - (age - 18);
  const firstEligibleYear = Math.max(2009, yearTurned18);
  // Rough cumulative limits by year (simplified)
  const yearlyLimits: Record<number, number> = {
    2009: 5000, 2010: 5000, 2011: 5000, 2012: 5000, 2013: 5500,
    2014: 5500, 2015: 10000, 2016: 5500, 2017: 5500, 2018: 5500,
    2019: 6000, 2020: 6000, 2021: 6000, 2022: 6000, 2023: 6500,
    2024: 7000, 2025: 7000,
  };
  let total = 0;
  for (let y = firstEligibleYear; y <= currentYear; y++) {
    total += yearlyLimits[y] ?? 6000;
  }
  return total;
}

// ─── RRSP ───────────────────────────────────────────────────────────────────

const RRSP_MAX = 32490; // 2025 RRSP dollar limit
const RRSP_CONTRIBUTION_PERCENT = 0.18;

export function getRRSPAnnualLimit(previousYearIncome: number): number {
  return Math.min(
    Math.round(previousYearIncome * RRSP_CONTRIBUTION_PERCENT),
    RRSP_MAX
  );
}

export function getRRSPMonthlyLimit(annualGrossIncome: number): number {
  return getRRSPAnnualLimit(annualGrossIncome) / 12;
}

// ─── FHSA ───────────────────────────────────────────────────────────────────

// First Home Savings Account: $8,000/year, $40,000 lifetime
const FHSA_ANNUAL_LIMIT = 8000;
const FHSA_LIFETIME_LIMIT = 40000;

export function isFHSAEligible(
  profile: UserProfile,
  selectedGoals: GoalType[],
  homeMarketValue = 0
): boolean {
  const wantsBuyHome = selectedGoals.includes("buy-home");
  // Disqualified if already owns a home (FHSA is first-time buyers only)
  const alreadyOwnsHome = homeMarketValue > 0;
  return wantsBuyHome && !alreadyOwnsHome && profile.age >= 18 && profile.age <= 71;
}

export function getFHSAAnnualLimit(): number {
  return FHSA_ANNUAL_LIMIT;
}

export function getFHSALifetimeLimit(): number {
  return FHSA_LIFETIME_LIMIT;
}

// ─── RESP ───────────────────────────────────────────────────────────────────

// RESP: $2,500/year per child qualifies for 20% CESG = $500/child/year
const RESP_CESG_RATE = 0.20;
const RESP_CESG_MAX_ELIGIBLE_CONTRIBUTION = 2500;

export function getRESPAnnualCESG(numberOfChildren: number): number {
  if (numberOfChildren <= 0) return 0;
  return numberOfChildren * RESP_CESG_MAX_ELIGIBLE_CONTRIBUTION * RESP_CESG_RATE;
}

export function getRESPMonthlyOptimal(numberOfChildren: number): number {
  if (numberOfChildren <= 0) return 0;
  return (RESP_CESG_MAX_ELIGIBLE_CONTRIBUTION * numberOfChildren) / 12;
}

// ─── Marginal tax rate at retirement (simplified federal+provincial blended) ──
// Used to discount RRSP/DC-pension withdrawals when computing after-tax capital.
// These are approximate combined federal+provincial rates for an Ontario resident.
// The function takes the expected annual retirement income (today's dollars).
export function estimateMarginalRateAtRetirement(annualRetirementIncome: number): number {
  if (annualRetirementIncome < 30000) return 0.20;
  if (annualRetirementIncome < 55000) return 0.30;
  if (annualRetirementIncome < 95000) return 0.38;
  if (annualRetirementIncome < 140000) return 0.43;
  return 0.48;
}

// ─── Dynamic safe withdrawal rate ────────────────────────────────────────────
// Research-backed rates for Canadian retirees (Pfau, Vettese, et al.)
// Longer retirement horizons require more conservative withdrawal rates.
// Returns { rate (as decimal), multiplier (= 1/rate, rounded) }
export function getSafeWithdrawalMultiplier(retirementYears: number): {
  rate: number;
  multiplier: number;
} {
  let rate: number;
  if (retirementYears <= 15) rate = 0.050; // 5.0% — short horizon
  else if (retirementYears <= 19) rate = 0.045; // 4.5%
  else if (retirementYears <= 24) rate = 0.040; // 4.0% — classic "25x" rule
  else if (retirementYears <= 29) rate = 0.035; // 3.5%
  else if (retirementYears <= 34) rate = 0.033; // 3.3%
  else rate = 0.030; // 3.0% — 35+ year horizon (early retirees)
  return { rate, multiplier: Math.round(1 / rate) };
}

// ─── GIS (Guaranteed Income Supplement) ──────────────────────────────────────
// Available to low-income OAS recipients. Max benefit for single, 2025.
export const GIS_MAX_ANNUAL = 12780; // ~$1,065/month
export const GIS_INCOME_THRESHOLD = 20952; // OAS + other income below this → eligible

// ─── CPP / OAS ──────────────────────────────────────────────────────────────

// Very rough CPP estimate (not official, for planning context only)
// Maximum CPP at 65 in 2025: ~$1,433/month
// Average CPP: ~$831/month
// OAS at 65: ~$727/month (indexed)

export function getRoughCPPMonthlyAtRetirement(
  annualGrossIncome: number,
  yearsOfContributions: number
): number {
  // Very simplified: assume someone contributing at ~average earnings
  const avgCPP = 831;
  const maxCPP = 1433;
  const incomeRatio = Math.min(
    annualGrossIncome / 71300, // approximate YMPE 2025
    1
  );
  const yearsRatio = Math.min(yearsOfContributions / 39, 1);
  return Math.round(avgCPP + (maxCPP - avgCPP) * incomeRatio * yearsRatio);
}

export function getOASMonthlyAt65(): number {
  return 727; // Approximate OAS in 2025, indexed to inflation
}

// ─── Strategy Mode Defaults ─────────────────────────────────────────────────

export const STRATEGY_RETURNS = {
  conservative: 4.0,
  balanced: 6.0,
  growth: 8.0,
};

export const STRATEGY_DESCRIPTIONS = {
  conservative: "Lower risk. GICs, bonds, dividend stocks. Suitable if risk-averse or near retirement.",
  balanced: "Moderate risk. Mix of equities and fixed income. Suitable for most long-term savers.",
  growth: "Higher risk/reward. Primarily equities. Suitable if 10+ years to retirement and high risk tolerance.",
};

// ─── Province-specific context ──────────────────────────────────────────────

export function getProvincialNote(province: Province): string | null {
  switch (province) {
    case "QC":
      return "Quebec residents contribute to QPP instead of CPP. QPIP also applies. Consider province-specific tax credits.";
    case "AB":
      return "Alberta has no provincial income tax on the first bracket and no provincial sales tax, which can improve your effective savings rate.";
    case "BC":
      return "BC has a relatively high cost of living, especially in Metro Vancouver. Factor housing costs carefully into your planning.";
    case "ON":
      return "Ontario offers OHIP coverage. High housing costs in the GTA may impact your down payment timeline.";
    default:
      return null;
  }
}

// ─── Tax context (simplified, for guidance only) ────────────────────────────

export function getEffectiveMarginNote(annualGrossIncome: number): string {
  if (annualGrossIncome < 55867)
    return "You are likely in the 20.5% federal marginal tax bracket. RRSP contributions provide a meaningful refund.";
  if (annualGrossIncome < 111733)
    return "You are likely in the 26% federal marginal tax bracket. RRSP contributions provide a solid refund.";
  if (annualGrossIncome < 154906)
    return "You are in the 29% federal marginal tax bracket. RRSP is highly efficient for tax reduction at your income level.";
  return "You are in the 33% federal marginal tax bracket. RRSP contributions provide the highest tax benefit.";
}

// ─── Prioritization ladder ──────────────────────────────────────────────────

export interface AccountPriority {
  account: string;
  reason: string;
  monthlyTarget: number | null;
}

export function getCanadianInvestmentPriorityLadder(
  profile: UserProfile,
  selectedGoals: GoalType[],
  monthlySurplus: number,
  homeMarketValue = 0
): AccountPriority[] {
  const ladder: AccountPriority[] = [];
  const monthly = Math.max(0, monthlySurplus);

  // Step 1: Emergency fund (always first if gap exists)
  ladder.push({
    account: "Emergency Fund (HISA/savings)",
    reason: "Your first safety net — 3–6 months of essential expenses before investing.",
    monthlyTarget: null,
  });

  // Step 2: FHSA if buying home and does not already own a home
  if (isFHSAEligible(profile, selectedGoals, homeMarketValue)) {
    ladder.push({
      account: "FHSA",
      reason: "Tax-deductible AND tax-free growth AND tax-free withdrawal for first home. Best account for first-time buyers.",
      monthlyTarget: Math.min(getFHSAAnnualLimit() / 12, monthly),
    });
  }

  // Step 3: TFSA (accessible, flexible, no tax on growth or withdrawal)
  ladder.push({
    account: "TFSA",
    reason: "Tax-free growth and withdrawals with no restrictions. Ideal for medium-term savings and as a flexible emergency backup.",
    monthlyTarget: Math.min(getTFSAMonthlyLimit(), monthly),
  });

  // Step 4: RRSP if income is meaningful
  if (profile.annualGrossIncome > 50000) {
    ladder.push({
      account: "RRSP",
      reason: "Reduces taxable income now (tax refund) and grows tax-sheltered. Best for high-income earners planning for lower-income retirement.",
      monthlyTarget: Math.min(getRRSPMonthlyLimit(profile.annualGrossIncome), monthly),
    });
  }

  // Step 5: RESP if has children
  if (profile.numberOfChildren > 0) {
    ladder.push({
      account: "RESP",
      reason: `The government matches 20% of the first $2,500/year per child (up to $500/child/year). Free money.`,
      monthlyTarget: getRESPMonthlyOptimal(profile.numberOfChildren),
    });
  }

  // Step 6: Non-registered
  ladder.push({
    account: "Non-Registered Investments",
    reason: "For savings beyond registered account limits. Less tax-efficient but no contribution caps.",
    monthlyTarget: null,
  });

  return ladder;
}
