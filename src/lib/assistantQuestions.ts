// ─── Structured In-App Assistant Q&A Library ─────────────────────────────────
//
// All answers are pre-built templates populated with the user's actual calculated
// values. No free-form generation occurs here — answers follow a fixed structure:
//   what   → plain-language explanation of the metric/concept
//   why    → why it matters for this specific user's situation
//   action → what to do (null if no action is needed or appropriate)
//
// Used by SectionAssistant.tsx — one assistant per major dashboard section.

import type { FinancialPlan, CalculatedResults } from "@/types/financial";
import { fmt, fmtFull } from "@/lib/calculations";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SectionId =
  | "cashflow"
  | "retirement"
  | "assets"
  | "emergency"
  | "health"
  | "advisor"
  | "resources"
  | "scenarios";

export interface StructuredAnswer {
  what: string;
  why: string;
  action: string | null;
}

export interface SectionQuestion {
  id: string;
  label: string;
  build: (plan: FinancialPlan, results: CalculatedResults) => StructuredAnswer;
}

// ─── Private helpers ─────────────────────────────────────────────────────────

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  if (score >= 20) return "Poor";
  return "Very Poor";
}

function getMarginalRate(annualIncome: number): number {
  if (annualIncome >= 150000) return 43;
  if (annualIncome >= 100000) return 43;
  if (annualIncome >= 70000) return 33;
  if (annualIncome >= 50000) return 29;
  return 22;
}

type ComponentKey = keyof CalculatedResults["healthScoreBreakdown"];

const COMPONENTS: { key: ComponentKey; label: string }[] = [
  { key: "cashFlow", label: "Cash Flow" },
  { key: "emergencyFund", label: "Emergency Fund" },
  { key: "savingsRate", label: "Savings Rate" },
  { key: "debtBurden", label: "Debt Burden" },
  { key: "retirementReadiness", label: "Retirement Readiness" },
];

function getWeakest(results: CalculatedResults): { key: string; label: string; score: number } {
  let min = {
    key: "cashFlow" as string,
    label: "Cash Flow",
    score: results.healthScoreBreakdown.cashFlow,
  };
  for (const c of COMPONENTS) {
    const val = results.healthScoreBreakdown[c.key];
    if (val < min.score) min = { key: c.key, label: c.label, score: val };
  }
  return min;
}

function componentAction(
  plan: FinancialPlan,
  results: CalculatedResults,
  key: string
): string {
  switch (key) {
    case "cashFlow":
      return results.monthlySurplus < 0
        ? `Your monthly expenses exceed income by ${fmtFull(Math.abs(results.monthlySurplus))}. Reducing variable costs (dining, entertainment, miscellaneous) is the most immediate lever.`
        : `You have a positive surplus. Increasing investment contributions is the key next step — redirect idle cash from your chequing account into TFSA or RRSP.`;
    case "emergencyFund":
      return `Build your emergency fund to ${fmt(results.targetEmergencyFund)} (${plan.assumptions.emergencyFundTargetMonths} months of essential expenses). Keep it in a HISA within your TFSA earning 4–5%.`;
    case "savingsRate":
      return `Increase monthly contributions by ${fmtFull(Math.max(100, Math.round(results.freeCashAfterContributions * 0.5)))} to improve your savings rate. The Advisor tab shows which account to prioritize.`;
    case "debtBurden":
      return results.totalLiabilities > 0
        ? `Reducing high-rate debt payments improves this score. Focus extra payments on any debt above ${plan.assumptions.expectedAnnualReturn}% interest.`
        : `Your debt burden is already low — maintain it by avoiding new high-interest debt.`;
    case "retirementReadiness":
      return results.retirementGap > 0
        ? `Increase monthly contributions to close the ${fmt(results.retirementGap)} retirement gap. Even small increases compound meaningfully over ${results.yearsToRetirement} years.`
        : `Your retirement trajectory is solid. Maintain consistent contributions and avoid early withdrawals from registered accounts.`;
    default:
      return "Review the Advisor section for specific improvement steps.";
  }
}

// ─── Section Q&A Definitions ─────────────────────────────────────────────────

export const SECTION_QUESTIONS: Record<SectionId, SectionQuestion[]> = {

  // ── Cash Flow ───────────────────────────────────────────────────────────────

  cashflow: [
    {
      id: "surplus-meaning",
      label: "What does my monthly surplus mean?",
      build: (plan, results) => ({
        what: `Your monthly surplus of ${fmtFull(results.monthlySurplus)} is the amount remaining after all living expenses — the gap between what you earn (${fmtFull(results.totalMonthlyIncome)}) and what you spend (${fmtFull(results.totalMonthlyExpenses)}). It represents your financial breathing room each month.`,
        why: results.monthlySurplus >= 0
          ? `A surplus of ${fmtFull(results.monthlySurplus)} means you're living within your means. Of this, only ${fmtFull(results.totalMonthlyContributions)} goes into investments — leaving ${fmtFull(results.freeCashAfterContributions)}/month not working toward any goal. Over ${results.yearsToRetirement} years, that idle cash has substantial compounding potential.`
          : `A deficit means expenses exceed income, which will deplete savings over time. Reducing variable costs — dining, entertainment, miscellaneous — is the immediate priority.`,
        action:
          results.freeCashAfterContributions > 500
            ? `You have ${fmtFull(results.freeCashAfterContributions)}/month not currently invested. Directing even half of it into your TFSA or RRSP would meaningfully accelerate your retirement and goal timelines.`
            : null,
      }),
    },
    {
      id: "savings-rate",
      label: "Am I saving enough each month?",
      build: (plan, results) => ({
        what: `Your savings rate is ${results.savingsRate}% — meaning ${results.savingsRate} cents of every dollar earned goes into investment accounts. You contribute ${fmtFull(results.totalMonthlyContributions)}/month to registered accounts. Financial planners generally target 15–20% for someone ${results.yearsToRetirement} years from retirement.`,
        why:
          results.savingsRate >= 15
            ? `At ${results.savingsRate}%, your savings rate is in a healthy range for your timeline. Maintaining this pace while growing income will steadily build retirement capital.`
            : `At ${results.savingsRate}%, you're below the recommended 15–20% range. Your monthly surplus of ${fmtFull(results.monthlySurplus)} provides room to increase contributions — the idle ${fmtFull(results.freeCashAfterContributions)}/month is the untapped opportunity.`,
        action:
          results.savingsRate < 15
            ? `Increasing contributions by ${fmtFull(Math.round(Math.max(0, results.totalMonthlyIncome * 0.15 - results.totalMonthlyContributions)))}/month would bring your savings rate to 15% — well within reach from your existing surplus.`
            : `Your contribution rate is strong. Focus on maintaining it as income grows and review the account priority order in the Advisor tab.`,
      }),
    },
    {
      id: "deployed-vs-idle",
      label: "How much of my surplus is being invested?",
      build: (plan, results) => {
        const deployPct = results.monthlySurplus > 0
          ? Math.round((results.totalMonthlyContributions / results.monthlySurplus) * 100)
          : 0;
        const rate = plan.assumptions.expectedAnnualReturn / 100;
        const years = results.yearsToRetirement;
        const fv = results.freeCashAfterContributions > 0
          ? Math.round(results.freeCashAfterContributions * 12 * ((Math.pow(1 + rate, years) - 1) / rate))
          : 0;
        return {
          what: `Of your ${fmtFull(results.monthlySurplus)} monthly surplus, ${fmtFull(results.totalMonthlyContributions)} (${deployPct}%) is invested in registered accounts. The remaining ${fmtFull(results.freeCashAfterContributions)} sits idle — not directed to any goal.`,
          why: `Undeployed surplus loses purchasing power to inflation (~${plan.assumptions.expectedInflationRate}%/year) and misses compounding. At ${fmtFull(results.freeCashAfterContributions)}/month over ${years} years at ${plan.assumptions.expectedAnnualReturn}%, this idle cash would compound to approximately ${fmt(fv)} if invested.`,
          action: `The Advisor tab shows your personalized Canadian Account Priority Ladder — which account to fill first based on your goals and tax situation. Automating contributions removes the friction of monthly decisions.`,
        };
      },
    },
    {
      id: "expense-breakdown",
      label: "Where is most of my money going?",
      build: (plan, results) => {
        const housing =
          plan.expenses.rentOrMortgage +
          plan.expenses.homeInsurance +
          plan.expenses.propertyTax +
          plan.expenses.utilities;
        const housingPct =
          results.totalMonthlyIncome > 0
            ? Math.round((housing / results.totalMonthlyIncome) * 100)
            : 0;
        return {
          what: `Housing is your largest cost category at ${fmtFull(housing)}/month (${housingPct}% of income) — covering mortgage, property tax, insurance, and utilities. The remaining ${fmtFull(results.totalMonthlyExpenses - housing)}/month covers living costs, childcare, transportation, and communications.`,
          why: `Guidelines suggest keeping housing under 30–35% of gross income. At ${housingPct}%, your housing costs are ${housingPct > 35 ? "above the recommended range, which compresses your saving capacity" : "within a manageable range"}. For most households at your income level, the issue isn't overspending — it's not deploying enough of the existing surplus into investments.`,
          action:
            housingPct > 35
              ? `With housing at ${housingPct}% of income, focus first on variable cost savings (dining, entertainment) to free up more for contributions.`
              : `Your expense structure is reasonable. The highest-leverage action is redirecting the ${fmtFull(results.freeCashAfterContributions)}/month idle surplus into registered accounts.`,
        };
      },
    },
    {
      id: "contributions-explained",
      label: "What counts as 'monthly contributions'?",
      build: (plan, results) => ({
        what: `Monthly contributions (${fmtFull(results.totalMonthlyContributions)}) are regular deposits into registered investment accounts — TFSA, RRSP, RESP, and FHSA. They're shown separately from expenses because they build long-term wealth rather than fund current consumption.`,
        why: `These contributions are what drives your retirement projection. Every dollar contributed and compounded at ${plan.assumptions.expectedAnnualReturn}% for ${results.yearsToRetirement} years creates meaningful future wealth. Your current ${fmtFull(results.totalMonthlyContributions)}/month is the foundation — the projection improves directly as this number grows.`,
        action: `To see the impact of increasing contributions, visit the Advisor tab and review your retirement gap analysis. Even a ${fmtFull(200)}/month increase compounds significantly over ${results.yearsToRetirement} years.`,
      }),
    },
  ],

  // ── Retirement ──────────────────────────────────────────────────────────────

  retirement: [
    {
      id: "on-track",
      label: "Am I on track to retire at my target age?",
      build: (plan, results) => {
        const onTrack = results.retirementGap <= 0;
        return {
          what: `Based on your current ${fmtFull(results.totalMonthlyContributions)}/month in contributions and a ${plan.assumptions.expectedAnnualReturn}% expected return, you'll accumulate approximately ${fmt(results.afterTaxProjectedRetirementCapital)} (after estimated taxes) by age ${plan.profile.retirementAge}. You need ${fmt(results.requiredRetirementCapital)} to fund ${results.retirementYears} years of retirement at ${fmtFull(plan.assumptions.desiredRetirementIncomeToday)}/year in today's dollars.`,
          why: onTrack
            ? `You are on track — your projected capital meets your requirement. Maintain this trajectory and revisit annually as income grows.`
            : `There is a ${fmt(results.retirementGap)} gap (${results.retirementGapPercent}% shortfall). Without changes, you'd exhaust retirement savings approximately ${Math.round(results.retirementYears * (1 - results.retirementGapPercent / 100))} years into retirement — short of your life expectancy.`,
          action: onTrack
            ? `Review annually. If income increases, capture extra contribution room rather than increasing lifestyle spending.`
            : `Adding more per month now reduces the gap through compounding. The Advisor tab shows the exact additional amount needed and its projected impact.`,
        };
      },
    },
    {
      id: "retirement-gap",
      label: "What is my retirement gap?",
      build: (_plan, results) => ({
        what: `Your retirement gap is ${results.retirementGap > 0 ? fmt(results.retirementGap) : "$0"} — the difference between your projected after-tax capital (${fmt(results.afterTaxProjectedRetirementCapital)}) and what's needed (${fmt(results.requiredRetirementCapital)}) to sustain your desired retirement income for ${results.retirementYears} years.`,
        why:
          results.retirementGap > 0
            ? `A ${fmt(results.retirementGap)} shortfall means your current path doesn't fully fund your desired retirement. At ${results.retirementGapPercent}%, you'd need to either cut retirement spending, retire later, or save more now. The earlier you act, the smaller the monthly increase required.`
            : `No gap means your current trajectory is sufficient. Note that CPP and OAS (not included in this projection) provide additional income on top of your savings.`,
        action:
          results.retirementGap > 0
            ? `Three levers exist: (1) save more monthly, (2) reduce desired retirement income slightly, or (3) retire 1–2 years later. Each extra working year both adds capital and reduces the drawdown period.`
            : null,
      }),
    },
    {
      id: "projected-capital",
      label: "What does 'projected capital' mean?",
      build: (plan, results) => ({
        what: `Projected retirement capital (${fmt(results.projectedRetirementCapital)} gross, ${fmt(results.afterTaxProjectedRetirementCapital)} after-tax estimate) is the forecast total of your investment accounts at age ${plan.profile.retirementAge}. It compounds your current ${fmt(results.totalInvestableAssets)} in investable assets plus ${fmtFull(results.totalMonthlyContributions)}/month in contributions at ${plan.assumptions.expectedAnnualReturn}%/year for ${results.yearsToRetirement} years.`,
        why: `The after-tax figure discounts for estimated taxes on RRSP and pension withdrawals in retirement (approximately ${Math.round((results.estimatedMarginalRateAtRetirement ?? 0.3) * 100)}% marginal rate). The difference between gross and after-tax (${fmt(results.projectedRetirementCapital - results.afterTaxProjectedRetirementCapital)}) represents estimated future taxes — a key reason to maximize TFSA (tax-free withdrawals) alongside RRSP.`,
        action: `Holding more in TFSA vs RRSP reduces this tax discount because TFSA withdrawals are 100% tax-free. Review your account priority in the Advisor tab.`,
      }),
    },
    {
      id: "cpp-oas",
      label: "How do CPP and OAS fit into my retirement?",
      build: (plan, results) => {
        const govtIncome =
          plan.assumptions.expectedCppBenefit + plan.assumptions.expectedOasBenefit;
        const coveragePct =
          plan.assumptions.desiredRetirementIncomeToday > 0
            ? Math.round((govtIncome / plan.assumptions.desiredRetirementIncomeToday) * 100)
            : 0;
        return {
          what: `CPP and OAS are government retirement benefits separate from your savings. Based on your entered estimates, they could provide approximately ${fmt(govtIncome)}/year (${fmtFull(Math.round(govtIncome / 12))}/month) in retirement income — covering ${coveragePct}% of your desired annual retirement income.`,
          why: `These benefits are excluded from Flow's retirement gap calculation — they are additional income on top of your private savings. If the estimates hold, your private savings only need to fund the remaining ${100 - coveragePct}% of your desired retirement income, meaningfully reducing the required capital.`,
          action: `Verify your CPP entitlement at My Service Canada (canada.ca). Your actual amount depends on your contribution history. OAS requires 40 years of Canadian residency for the full benefit; partial benefits are available after 10 years.`,
        };
      },
    },
    {
      id: "stressed-scenario",
      label: "What if markets underperform?",
      build: (plan, results) => ({
        what: `The stressed scenario (${fmt(results.stressedRetirementCapital)}) shows your projected capital if annual returns average ${plan.assumptions.expectedAnnualReturn - 2}% instead of ${plan.assumptions.expectedAnnualReturn}% — a 2% reduction that could reflect a more conservative portfolio or a prolonged low-return environment.`,
        why:
          results.stressedRetirementCapital < results.requiredRetirementCapital
            ? `Under this scenario, your retirement gap widens. This means your current plan has limited cushion against underperformance — a reason to either save more now or review your risk tolerance and portfolio mix.`
            : `Even with returns 2% lower than expected, you remain on track. Your plan has meaningful resilience against moderate underperformance.`,
        action: `The most effective hedge against return risk is saving more today. Each extra ${fmtFull(200)}/month reduces your dependence on achieving maximum assumed returns.`,
      }),
    },
  ],

  // ── Assets ──────────────────────────────────────────────────────────────────

  assets: [
    {
      id: "net-worth",
      label: "How is my net worth calculated?",
      build: (plan, results) => {
        const mortgage = plan.liabilities.find((l) => l.type === "mortgage");
        const homeEquity = plan.assets.homeMarketValue - (mortgage?.outstandingBalance ?? 0);
        return {
          what: `Net worth = total assets (${fmt(results.totalAssets)}) minus total liabilities (${fmt(results.totalLiabilities)}) = ${fmt(results.netWorth)}. Assets include all accounts, your home (${fmt(plan.assets.homeMarketValue)}), and vehicles. Liabilities include your mortgage and any other debts.`,
          why: `Net worth is the most comprehensive snapshot of financial position. Yours is ${results.netWorth > 0 ? "positive" : "negative"} at ${fmt(results.netWorth)}, with home equity (${fmt(homeEquity)}) making up the largest component. Home equity is real wealth but isn't accessible without selling or refinancing — your investable assets (${fmt(results.totalInvestableAssets)}) are the more liquid, goal-directed measure.`,
          action: `Growing net worth requires either reducing debt (especially the mortgage) or increasing investable assets through consistent contributions. For retirement goals, focus on investable assets — they compound directly toward your target.`,
        };
      },
    },
    {
      id: "investable-assets",
      label: "What are my 'investable assets'?",
      build: (plan, results) => ({
        what: `Investable assets (${fmt(results.totalInvestableAssets)}) are accounts that generate investment returns: TFSA (${fmt(plan.assets.tfsaBalance)}), RRSP (${fmt(plan.assets.rrspBalance)}), non-registered investments (${fmt(plan.assets.nonRegisteredInvestments)}), RESP (${fmt(plan.assets.respBalance)}), and pension (${fmt(plan.assets.pensionValue)}). This excludes cash accounts, home value, and vehicle.`,
        why: `These are the accounts funding your retirement and financial goals. Your ${fmt(results.totalInvestableAssets)} in investable assets will compound at your expected ${plan.assumptions.expectedAnnualReturn}% return over ${results.yearsToRetirement} years. Unlike your home, these assets are directly deployable toward any financial goal.`,
        action: `Maximize growth by filling tax-advantaged accounts first: TFSA for tax-free compounding, RRSP for the upfront tax deduction, RESP for CESG grants. Non-registered accounts should be used after registered room is maxed.`,
      }),
    },
    {
      id: "resp-status",
      label: "What's happening with my RESP?",
      build: (plan, results) => {
        const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
        const monthlyResp = plan.assets.respMonthlyContribution ?? 0;
        const annualResp = monthlyResp * 12;
        const maxCesg = (plan.profile.numberOfChildren ?? 0) * 500;
        const captured = Math.min(annualResp * 0.2, maxCesg);
        const missing = Math.max(0, maxCesg - captured);
        return {
          what: `Your RESP balance is ${fmt(plan.assets.respBalance)} with ${monthlyResp > 0 ? fmtFull(monthlyResp) + "/month" : "no current monthly contributions set up"}. The RESP earns a 20% Canada Education Savings Grant (CESG) on up to $2,500/year per child — up to $500/year per child in free government money.`,
          why: hasChildren
            ? missing > 0
              ? `With ${plan.profile.numberOfChildren} child${plan.profile.numberOfChildren > 1 ? "ren" : ""} and current RESP contributions of ${fmtFull(monthlyResp)}/month, you're leaving up to ${fmtFull(Math.round(missing))}/year in CESG grants unclaimed. The CESG is a guaranteed 20% return on contributions — not capturing it means leaving free money on the table.`
              : `You're contributing enough to capture the full ${fmtFull(maxCesg)}/year CESG grant — the maximum government match for your family.`
            : `No children are in your profile, so RESP impact is minimal for now. If you have or plan to have children, updating your profile enables CESG calculations.`,
          action: hasChildren && missing > 0
            ? `Contributing $208/month ($2,500/year) per child captures the full $500/year CESG grant — a guaranteed 20% return before any market growth is added.`
            : null,
        };
      },
    },
    {
      id: "rrsp-vs-tfsa",
      label: "What's the difference between RRSP and TFSA?",
      build: (plan, results) => ({
        what: `RRSP (${fmt(plan.assets.rrspBalance)}): Contributions reduce your taxable income now; withdrawals in retirement are taxed at your then-current rate. TFSA (${fmt(plan.assets.tfsaBalance)}): Contributions come from after-tax income; all growth and withdrawals are permanently tax-free.`,
        why: `Both grow tax-sheltered while invested — the difference is when you pay tax. RRSP is best when your income (and tax rate) is higher now than in retirement. TFSA is best when you want flexibility to withdraw without tax consequences or expect high retirement income. At your income level, RRSP contributions generate a meaningful tax refund today.`,
        action: `The Advisor tab shows your personalized Canadian Account Priority Ladder — which account to fill first given your specific goals, income, and tax situation. The order matters.`,
      }),
    },
  ],

  // ── Emergency Fund ──────────────────────────────────────────────────────────

  emergency: [
    {
      id: "is-enough",
      label: "Is my emergency fund sufficient?",
      build: (plan, results) => ({
        what: `Your emergency fund of ${fmt(plan.assets.emergencyFund)} covers ${results.emergencyFundMonthsCovered.toFixed(1)} months of essential expenses. The target is ${plan.assumptions.emergencyFundTargetMonths} months (${fmt(results.targetEmergencyFund)}). ${results.emergencyFundGap > 0 ? `You have a gap of ${fmt(results.emergencyFundGap)}.` : "You're at or above the target."}`,
        why:
          results.emergencyFundMonthsCovered < 3
            ? `Under 3 months is high-risk. A job loss or health event could force you to take on high-interest debt or liquidate investments at the wrong time — derailing the rest of your financial plan.`
            : results.emergencyFundMonthsCovered < 6
            ? `3–6 months provides basic protection but may not cover extended disruptions. Building to the full ${plan.assumptions.emergencyFundTargetMonths}-month target significantly improves your resilience.`
            : `${plan.assumptions.emergencyFundTargetMonths}+ months is strong coverage — this level handles most common financial disruptions without touching your investments.`,
        action:
          results.emergencyFundGap > 0
            ? `To close the ${fmt(results.emergencyFundGap)} gap, set up an automatic transfer to a dedicated HISA within your TFSA. Even ${fmtFull(300)}/month closes the gap in ${Math.ceil(results.emergencyFundGap / 300)} months.`
            : `Your emergency fund is solid. Keep it in a HISA within your TFSA — separate from your investments — for instant access without tax consequences.`,
      }),
    },
    {
      id: "target-explained",
      label: "How is the emergency fund target calculated?",
      build: (plan, results) => ({
        what: `The target (${fmt(results.targetEmergencyFund)}) = ${plan.assumptions.emergencyFundTargetMonths} months × monthly essential expenses. Essential expenses are non-discretionary costs: mortgage/rent, utilities, groceries, childcare, and minimum debt payments — what you must pay even if income stops.`,
        why: `The target uses essential expenses rather than total spending because in a genuine emergency, you would immediately cut discretionary costs (dining, entertainment, subscriptions). The essential floor is what truly needs to be funded by the buffer — everything else can be paused.`,
        action: `If the full target feels large, reach 3 months first, then build toward ${plan.assumptions.emergencyFundTargetMonths}. Each milestone meaningfully reduces your financial vulnerability.`,
      }),
    },
    {
      id: "where-to-keep",
      label: "Where should an emergency fund be kept?",
      build: (_plan, results) => ({
        what: `An emergency fund belongs in a High-Interest Savings Account (HISA) — currently paying 4–5% — held within your TFSA for tax-free interest income. It must be instantly accessible with no penalties, no market risk, and no lock-in periods.`,
        why: `Keeping the emergency fund separate from your investments prevents two problems: accidentally spending it on non-emergencies, and being forced to sell investments during a market downturn just to access cash. Separation is a key discipline mechanism.`,
        action: `Open a dedicated HISA labeled "Emergency Fund" within your TFSA (if you have contribution room). Automate monthly deposits until you hit the ${fmt(results.targetEmergencyFund)} target, then redirect those deposits to investment contributions.`,
      }),
    },
  ],

  // ── Financial Health Score ──────────────────────────────────────────────────

  health: [
    {
      id: "score-meaning",
      label: "What does my health score mean?",
      build: (_plan, results) => {
        const b = results.healthScoreBreakdown;
        return {
          what: `Your score of ${results.financialHealthScore}/100 is rated "${scoreLabel(results.financialHealthScore)}" — a composite across 5 dimensions: Cash Flow (${b.cashFlow}/20), Emergency Fund (${b.emergencyFund}/20), Savings Rate (${b.savingsRate}/20), Debt Burden (${b.debtBurden}/20), and Retirement Readiness (${b.retirementReadiness}/20).`,
          why: `Each dimension measures a real financial vulnerability. A high score in one area doesn't offset weakness in another — each pillar represents independent resilience. The score helps identify which area most needs attention rather than treating finances as a single undifferentiated number.`,
          action: `Your weakest component is ${getWeakest(results).label} (${getWeakest(results).score}/20). Improving this has the biggest impact on your overall score and reduces a specific real-world financial risk.`,
        };
      },
    },
    {
      id: "weakest-component",
      label: "Which component should I improve first?",
      build: (plan, results) => {
        const weakest = getWeakest(results);
        return {
          what: `Your lowest-scoring area is ${weakest.label} at ${weakest.score}/20. This is the primary bottleneck in your financial health score and the dimension with the most room for improvement.`,
          why: `Financial health is most constrained by the weakest link, not elevated by the strongest. Addressing ${weakest.label} gives you the highest return per effort — both in improving your score and in reducing actual financial risk.`,
          action: componentAction(plan, results, weakest.key),
        };
      },
    },
    {
      id: "excellent-threshold",
      label: "What would put me in the 'Excellent' range?",
      build: (_plan, results) => {
        const gap = Math.max(0, 80 - results.financialHealthScore);
        return {
          what: `Scores of 80–100 are rated "Excellent." Your current score is ${results.financialHealthScore}/100. You need ${gap} more points to reach the Excellent threshold.`,
          why: `An Excellent score doesn't require perfection in any one dimension — it requires strong performance across all five. The key is having no critically weak component. At ${results.financialHealthScore}, ${gap === 0 ? "you're already in the Excellent range" : `you're ${gap} points away`}.`,
          action:
            gap > 0
              ? `Focus on improving your two lowest components — each one that's below 14/20 is pulling down your score significantly. Review the breakdown and use the Advisor tab for specific steps.`
              : `Maintain current habits. Score can climb further toward 90–100 by maximizing contributions and reaching the full emergency fund target.`,
        };
      },
    },
  ],

  // ── Advisor Page ────────────────────────────────────────────────────────────

  advisor: [
    {
      id: "most-urgent",
      label: "What is my most urgent priority?",
      build: (_plan, results) => {
        const topRec = results.recommendations[0];
        return {
          what: `Your highest-priority item is: "${topRec?.title ?? "No critical issues found"}." ${topRec?.explanation ?? "Your financial plan is reasonably structured."}`,
          why:
            topRec?.whyItMatters ??
            `Your finances are in reasonable shape. The focus now is optimization — directing idle surplus into the right accounts to compound over your ${results.yearsToRetirement}-year horizon.`,
          action: topRec
            ? `This is rated ${topRec.priority} priority. Review the full recommendation below for specific next steps and estimated financial impact.`
            : null,
        };
      },
    },
    {
      id: "undeployed-surplus",
      label: "What is 'undeployed surplus'?",
      build: (plan, results) => {
        const rate = plan.assumptions.expectedAnnualReturn / 100;
        const years = results.yearsToRetirement;
        const fv =
          results.freeCashAfterContributions > 0 && years > 0
            ? Math.round(
                results.freeCashAfterContributions *
                  12 *
                  ((Math.pow(1 + rate, years) - 1) / rate)
              )
            : 0;
        return {
          what: `Undeployed surplus is ${fmtFull(results.freeCashAfterContributions)}/month — the amount left after all expenses and investment contributions. It's income you're earning but not directing toward any financial goal.`,
          why: `At ${fmtFull(results.freeCashAfterContributions)}/month, this represents ${Math.round((results.freeCashAfterContributions / Math.max(1, results.totalMonthlyIncome)) * 100)}% of your income going unused. Invested at ${plan.assumptions.expectedAnnualReturn}% over ${years} years, it would compound to approximately ${fmt(fv)}.`,
          action: `Automating contributions from this surplus into TFSA, RRSP, or RESP (in priority order) captures its compounding potential without requiring any lifestyle changes. The Canadian Account Priority Ladder below shows where to direct it.`,
        };
      },
    },
    {
      id: "spousal-rrsp",
      label: "Why is a spousal RRSP recommended?",
      build: (plan, _results) => {
        const spouseIncome = plan.spouse?.spouseAnnualGrossIncome ?? 0;
        const incomeGap = plan.profile.annualGrossIncome - spouseIncome;
        return {
          what: `A spousal RRSP lets the higher-income earner contribute using their own RRSP room into an RRSP held in the lower-income spouse's name. In retirement, withdrawals come from the lower-income spouse's account — taxed at their lower rate instead of the higher earner's rate.`,
          why:
            incomeGap > 20000
              ? `With a ${fmtFull(incomeGap)}/year income gap between you and your spouse, your marginal tax rates differ significantly. Splitting retirement income across two accounts reduces the household's total tax burden — more net income from the same savings.`
              : `The income gap between you and your spouse is moderate. The benefit exists but is more nuanced — a financial advisor can calculate the specific annual tax savings for your situation.`,
          action: `Contribute to a spousal RRSP using your own contribution room. Your spouse makes withdrawals in retirement at their lower rate. You get the deduction now; they pay tax at a lower rate later. Net result: lower lifetime household taxes.`,
        };
      },
    },
    {
      id: "account-priority",
      label: "What is the account priority ladder?",
      build: (_plan, results) => ({
        what: `The Canadian Account Priority Ladder shows the recommended order to fill your investment accounts for maximum tax efficiency. It's personalized to your goals, income, and province. General order: employer match → TFSA → RRSP → RESP (with children) → FHSA (first-time buyers) → non-registered.`,
        why: `Filling accounts in the wrong order leaves tax savings on the table. For example, investing in non-registered before maxing your TFSA means paying tax on returns that could be permanently sheltered. Over ${results.yearsToRetirement} years, the difference compounds to a meaningful reduction in retirement wealth.`,
        action: `Review the specific ladder generated for your situation below — it's personalized based on your selected goals and province, not a generic template.`,
      }),
    },
  ],

  // ── Resources Page ──────────────────────────────────────────────────────────

  resources: [
    {
      id: "cesg-grant",
      label: "What is the CESG and am I missing it?",
      build: (plan, _results) => {
        const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
        const monthlyResp = plan.assets.respMonthlyContribution ?? 0;
        const annualResp = monthlyResp * 12;
        const maxCesg = (plan.profile.numberOfChildren ?? 0) * 500;
        const captured = Math.min(annualResp * 0.2, maxCesg);
        const missing = Math.max(0, maxCesg - captured);
        return {
          what: `The CESG (Canada Education Savings Grant) matches 20% of your annual RESP contributions, up to $2,500/year per child. This equals up to $500/year per child in free government money, deposited directly into the RESP — a guaranteed 20% return on those dollars before any market growth.`,
          why: hasChildren
            ? missing > 0
              ? `With ${plan.profile.numberOfChildren} child${plan.profile.numberOfChildren > 1 ? "ren" : ""} and current RESP contributions of ${fmtFull(monthlyResp)}/month, you're leaving up to ${fmtFull(Math.round(missing))}/year in CESG unclaimed. Over the grant period, this adds up to a significant education fund shortfall.`
              : `You're contributing enough to capture the full ${fmtFull(maxCesg)}/year CESG grant — the maximum government match for your family.`
            : `The CESG applies to families with children. If you plan to have children, opening an RESP early maximizes available lifetime grant room.`,
          action:
            hasChildren && missing > 0
              ? `Contribute $208/month ($2,500/year) per child to capture the full $500/year CESG grant — a guaranteed 20% return on those contributions before any investment growth.`
              : null,
        };
      },
    },
    {
      id: "programs-applicable",
      label: "Which programs apply to my profile?",
      build: (plan, _results) => {
        const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
        const programList = [
          "TFSA — tax-free growth, any goal",
          "RRSP — tax deduction now, deferred growth",
          hasChildren
            ? `RESP + CESG — education savings with 20% government match`
            : null,
          plan.profile.province === "ON"
            ? "Ontario Trillium Benefit — combined credits up to $1,700+/year"
            : null,
        ]
          .filter(Boolean)
          .join("; ");
        return {
          what: `Based on your profile (${plan.profile.province} resident, age ${plan.profile.age}, ${hasChildren ? plan.profile.numberOfChildren + " child" + (plan.profile.numberOfChildren > 1 ? "ren" : "") : "no children recorded"}), the most relevant programs include: ${programList}.`,
          why: `Each program offers different benefits — tax deductions, tax-free growth, government grants, or direct credits. Not using programs you qualify for means paying more tax or missing free government contributions toward your goals.`,
          action: `Use the search and category filters to explore all available programs. Results are filtered to your province and goals. The "Matched to you" section highlights what's most relevant.`,
        };
      },
    },
    {
      id: "rrsp-deduction",
      label: "How much tax does my RRSP save me?",
      build: (plan, _results) => {
        const annualRrsp = (plan.assets.rrspMonthlyContribution ?? 0) * 12;
        const marginalRate = getMarginalRate(plan.profile.annualGrossIncome);
        const annualSavings = Math.round(annualRrsp * (marginalRate / 100));
        return {
          what: `Your current RRSP contributions of ${fmtFull(plan.assets.rrspMonthlyContribution ?? 0)}/month (${fmt(annualRrsp)}/year) generate an estimated ${fmt(annualSavings)}/year tax reduction. This is based on an approximate ${marginalRate}% marginal tax rate for your income bracket.`,
          why: `Every dollar contributed to RRSP reduces your taxable income by one dollar — saving taxes at your current marginal rate. The money then grows tax-sheltered until retirement, when withdrawals are taxed at your (typically lower) retirement rate. The net effect is a tax rate arbitrage over time.`,
          action: `If you have unused RRSP contribution room from prior years, a larger lump-sum contribution before March 1 generates a one-time tax refund. Check your available room on your CRA My Account.`,
        };
      },
    },
  ],

  // ── Scenario Comparison ─────────────────────────────────────────────────────

  scenarios: [
    {
      id: "two-paths",
      label: "What is the difference between the two paths?",
      build: (plan, results) => {
        const last = results.projectionSeries[results.projectionSeries.length - 1];
        const diff = last ? Math.abs(last.recommendedPath - last.currentPath) : 0;
        return {
          what: `The "Current Path" projects retirement wealth if your existing contribution rate continues unchanged. The "Recommended Path" models what happens if you redirect your undeployed surplus (${fmtFull(results.freeCashAfterContributions)}/month) into the optimal accounts. The projected difference at retirement is approximately ${fmt(diff)}.`,
          why: `The gap between paths grows because of compounding — small differences in monthly contributions create increasingly large differences in final wealth over ${results.yearsToRetirement} years. The recommended path doesn't require earning more income, just deploying your existing surplus more effectively.`,
          action: `To close the gap, implement the top recommendations in the Advisor tab. The biggest lever is automating contributions from your idle monthly surplus into TFSA and RRSP in priority order.`,
        };
      },
    },
    {
      id: "projection-assumptions",
      label: "What assumptions drive the projection?",
      build: (plan, _results) => ({
        what: `The projection assumes: ${plan.assumptions.expectedAnnualReturn}% annual investment return, ${plan.assumptions.expectedInflationRate}% inflation, ${plan.assumptions.annualIncomeGrowthRate}% annual income growth, and that contributions grow with income over time. CPP, OAS, and home equity are excluded from the retirement capital calculation.`,
        why: `These are conservative estimates designed to show a realistic (not optimistic) scenario. Real returns may be higher or lower. The projection's value is in showing direction and the relative impact of changes — not as a precise forecast of future wealth.`,
        action: `To test different assumptions, update them in the Settings step of your plan via "Edit Plan." The projection regenerates automatically. Lowering the expected return assumption is a useful stress test.`,
      }),
    },
  ],
};
