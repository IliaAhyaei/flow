// ─── Pre-built answers for FloatingAdvisor suggested prompts ─────────────────
//
// These answers are populated dynamically with the user's actual plan data.
// They replace API calls for known suggested questions so the chatbot works
// even without the Express backend running.
//
// Format: each builder returns { answer: string, suggestions: string[] }
// The answer text reads like a natural, conversational response — not a template.

import type { FinancialPlan, CalculatedResults } from "@/types/financial";
import { fmt, fmtFull } from "@/lib/calculations";

export interface PrebuiltResponse {
  answer: string;
  suggestions: string[];
}

type Builder = (plan: FinancialPlan, results: CalculatedResults) => PrebuiltResponse;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreLabel(s: number) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  if (s >= 20) return "Poor";
  return "Very Poor";
}

function getMarginalRate(income: number) {
  if (income >= 100000) return 43;
  if (income >= 70000) return 33;
  if (income >= 50000) return 29;
  return 22;
}

function weakestComponent(r: CalculatedResults): { label: string; score: number } {
  const map: [string, number][] = [
    ["Cash Flow", r.healthScoreBreakdown.cashFlow],
    ["Emergency Fund", r.healthScoreBreakdown.emergencyFund],
    ["Savings Rate", r.healthScoreBreakdown.savingsRate],
    ["Debt Burden", r.healthScoreBreakdown.debtBurden],
    ["Retirement Readiness", r.healthScoreBreakdown.retirementReadiness],
  ];
  return map.reduce(
    (min, [label, score]) => (score < min.score ? { label, score } : min),
    { label: map[0][0], score: map[0][1] }
  );
}

// ─── Static answers (no plan data needed) ────────────────────────────────────

const STATIC: Record<string, PrebuiltResponse> = {
  "I'm new to Canada — where should I start financially?": {
    answer: `Welcome to Canada! The first thing to do is get a Social Insurance Number (SIN) if you haven't already — you need it to open registered accounts. Then open a bank account and, as soon as you're 18+, open a TFSA (Tax-Free Savings Account). It's the most flexible account in Canada: your money grows tax-free and you can withdraw any time without penalty.

Next, once you have some income, consider an RRSP (Registered Retirement Savings Plan). Contributions reduce your taxable income today — essentially giving you a tax refund each year you contribute. If you have children, a RESP lets the government add a 20% grant on top of what you save for their education.

Most newcomers should prioritize in this order: build a small emergency fund (1–3 months expenses), max out TFSA room, then RRSP. Complete your financial plan in Flow to get a personalized roadmap based on your specific situation.`,
    suggestions: [
      "What is a TFSA and how is it different from a regular savings account?",
      "How much of my income should I be saving?",
      "What government benefits am I eligible for as a newcomer?",
    ],
  },

  "What is a TFSA and how is it different from a regular savings account?": {
    answer: `A TFSA (Tax-Free Savings Account) is a registered account where all investment growth — interest, dividends, capital gains — is permanently sheltered from tax. Unlike a regular savings account where interest income is taxed each year, a TFSA lets your money compound completely tax-free, forever.

The key advantages: you can hold any investments inside it (savings, ETFs, GICs, etc.), you can withdraw at any time without penalties or tax consequences, and unused contribution room carries forward indefinitely. The annual contribution limit is $7,000 in 2025, and if you've been eligible since 2009, your cumulative room could be up to $102,000.

A regular savings account has no contribution limits but no tax protection either. The TFSA is strictly better for most Canadians — think of it as a regular savings account that the government can't tax.`,
    suggestions: [
      "What's the difference between RRSP and TFSA, and which should I open first?",
      "How much can I contribute to my TFSA right now?",
      "Can I invest in ETFs inside a TFSA?",
    ],
  },

  "What's the difference between RRSP and TFSA, and which should I open first?": {
    answer: `Both are tax-sheltered accounts, but the key difference is when the tax benefit arrives. RRSP: you get a tax deduction when you contribute (reducing your tax bill this year), and pay tax when you withdraw in retirement. TFSA: contributions are from after-tax money, but all growth and withdrawals are permanently tax-free.

As a general rule: if your income today is higher than what you expect in retirement, RRSP gives you a bigger long-term benefit (you deduct at a higher rate, withdraw at a lower rate). If your income is lower today, TFSA wins (no tax now, no tax later). For most working Canadians, using both is ideal.

If you're just starting out or have modest income, open the TFSA first for its flexibility — you can withdraw anytime without losing contribution room. Once you're earning enough to benefit from the RRSP deduction (generally above $50,000/year), start contributing to both. Complete your plan in Flow for a personalized recommendation.`,
    suggestions: [
      "How does the RRSP tax deduction actually work?",
      "What is a spousal RRSP and why would I need one?",
      "How much TFSA room do I have available?",
    ],
  },

  "How much of my income should I realistically be saving each month?": {
    answer: `A common guideline is the 50/30/20 rule: 50% on needs (housing, food, utilities), 30% on wants (dining, entertainment), and 20% on savings and investments. But the right number depends heavily on your timeline to retirement and your goals.

If you're more than 20 years from retirement, saving 10–15% of gross income is a reasonable target. 15–20 years away: aim for 15–20%. Within 10 years of retirement: 20–30% or more. These percentages include employer pension contributions if you have them.

The most important thing isn't the exact percentage — it's consistency and automation. Setting up automatic transfers the day your paycheck arrives removes the decision entirely. Complete your plan in Flow and it will calculate your personalized savings rate target based on your actual income, goals, and retirement timeline.`,
    suggestions: [
      "What accounts should I open first to start saving?",
      "What's the difference between RRSP and TFSA?",
      "How do I build an emergency fund?",
    ],
  },
};

// ─── Dynamic answers (use plan + results) ────────────────────────────────────

const DYNAMIC: Record<string, Builder> = {

  // ── Dashboard ──

  "What is my financial health score and what's holding it back the most?": (plan, results) => {
    const weak = weakestComponent(results);
    const label = scoreLabel(results.financialHealthScore);
    const b = results.healthScoreBreakdown;
    return {
      answer: `Your financial health score is ${results.financialHealthScore}/100, rated "${label}." The score measures five dimensions: Cash Flow (${b.cashFlow}/20), Emergency Fund (${b.emergencyFund}/20), Savings Rate (${b.savingsRate}/20), Debt Burden (${b.debtBurden}/20), and Retirement Readiness (${b.retirementReadiness}/20).

Your weakest area is ${weak.label} at ${weak.score}/20 — that's the single biggest drag on your overall score right now. ${
      weak.label === "Savings Rate"
        ? `You're currently contributing ${fmtFull(results.totalMonthlyContributions)}/month (${results.savingsRate}% of income), while ${fmtFull(results.freeCashAfterContributions)}/month in surplus sits undeployed. Increasing contributions is the fastest path to a better score.`
        : weak.label === "Emergency Fund"
        ? `Your emergency fund covers ${results.emergencyFundMonthsCovered.toFixed(1)} months of expenses — the target is ${plan.assumptions.emergencyFundTargetMonths} months (${fmt(results.targetEmergencyFund)}). A gap of ${fmt(results.emergencyFundGap)} remains.`
        : weak.label === "Retirement Readiness"
        ? `Your current trajectory projects ${fmt(results.afterTaxProjectedRetirementCapital)} at retirement but you need ${fmt(results.requiredRetirementCapital)} — a ${fmt(results.retirementGap)} gap that's reducing this component score.`
        : `Addressing ${weak.label} through the Advisor tab will have the biggest effect on your overall score.`
    }

To reach the 80+ "Excellent" range, you need ${Math.max(0, 80 - results.financialHealthScore)} more points. The Advisor tab shows exactly which actions close the gap fastest.`,
      suggestions: [
        "Am I on track for retirement, and how big is my current gap?",
        "I have surplus cash — what should I do with it?",
        "Which account should I be contributing to more?",
      ],
    };
  },

  "Am I on track for retirement, and how big is my current gap?": (plan, results) => {
    const onTrack = results.retirementGap <= 0;
    const govtIncome = plan.assumptions.expectedCppBenefit + plan.assumptions.expectedOasBenefit;
    return {
      answer: `Based on your current ${fmtFull(results.totalMonthlyContributions)}/month in contributions and a ${plan.assumptions.expectedAnnualReturn}% expected return, you're projected to accumulate ${fmt(results.afterTaxProjectedRetirementCapital)} (after estimated taxes) by age ${plan.profile.retirementAge}. You need ${fmt(results.requiredRetirementCapital)} to fund ${results.retirementYears} years of retirement at ${fmtFull(plan.assumptions.desiredRetirementIncomeToday)}/year.

${onTrack
  ? `You are on track — your projected capital meets your retirement requirement. Keep contributing consistently and review annually as your income grows.`
  : `There is a ${fmt(results.retirementGap)} shortfall (${results.retirementGapPercent}% gap). At your current pace, you'd exhaust retirement savings about ${Math.round(results.retirementYears * (1 - results.retirementGapPercent / 100))} years into retirement — before your life expectancy.`}

Note: CPP and OAS are not included in this projection — they provide additional income on top. Your entered estimates suggest they'd add ${fmt(govtIncome)}/year, which would further reduce the gap. The Advisor tab shows how much extra per month would put you fully on track.`,
      suggestions: [
        "What does my retirement gap actually mean?",
        "How much more should I save monthly to close the gap?",
        "How do CPP and OAS affect my retirement income?",
      ],
    };
  },

  "I have surplus cash each month that isn't invested — what should I do with it?": (plan, results) => {
    const rate = plan.assumptions.expectedAnnualReturn / 100;
    const years = results.yearsToRetirement;
    const fv = results.freeCashAfterContributions > 0 && years > 0
      ? Math.round(results.freeCashAfterContributions * 12 * ((Math.pow(1 + rate, years) - 1) / rate))
      : 0;
    const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
    const monthlyResp = plan.assets.respMonthlyContribution ?? 0;
    return {
      answer: `After all expenses and current contributions, you have ${fmtFull(results.freeCashAfterContributions)}/month sitting idle. That's ${Math.round((results.freeCashAfterContributions / Math.max(1, results.totalMonthlyIncome)) * 100)}% of your income not working toward any goal. Invested at ${plan.assumptions.expectedAnnualReturn}% over ${years} years, it would compound to approximately ${fmt(fv)}.

The priority order for deploying this surplus depends on your goals and tax situation, but generally: first make sure your emergency fund is at the ${plan.assumptions.emergencyFundTargetMonths}-month target (currently ${results.emergencyFundMonthsCovered.toFixed(1)} months${results.emergencyFundGap > 0 ? `, ${fmt(results.emergencyFundGap)} short` : ", fully funded"}). Then direct additional funds into your TFSA for tax-free growth, followed by RRSP for the upfront tax deduction.${hasChildren && monthlyResp < 208 ? ` Don't forget your RESP — contributing $208/month per child captures the full $500/year CESG government grant.` : ""}

The Advisor tab has a personalized Canadian Account Priority Ladder that shows the exact order for your situation, based on your goals and income.`,
      suggestions: [
        "What is the account priority ladder and how does it work?",
        "How does investing in TFSA vs RRSP affect my taxes?",
        results.emergencyFundGap > 0
          ? "How do I build my emergency fund efficiently?"
          : "How much can I contribute to my RRSP this year?",
      ],
    };
  },

  "Which of my accounts should I be contributing to more right now?": (plan, results) => {
    const hasEmergencyGap = results.emergencyFundGap > 0;
    const hasRetirementGap = results.retirementGap > 0;
    const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
    const respShort = hasChildren && (plan.assets.respMonthlyContribution ?? 0) < 208;
    return {
      answer: `Given your current situation — ${fmtFull(results.totalMonthlyContributions)}/month in contributions and ${fmtFull(results.freeCashAfterContributions)}/month idle — here's the priority order:

${hasEmergencyGap ? `1. Emergency Fund first — you're ${fmt(results.emergencyFundGap)} short of your ${plan.assumptions.emergencyFundTargetMonths}-month target. Keep this in a HISA within your TFSA at 4–5%. Once funded, redirect those deposits to investments.\n` : ""}${plan.assets.tfsaBalance < 50000 ? `${hasEmergencyGap ? "2" : "1"}. TFSA — ${fmt(plan.assets.tfsaBalance)} current balance. All growth is permanently tax-free. Prioritize this for medium-term goals and as your investment base.\n` : ""}${plan.assets.rrspBalance > 0 || plan.profile.annualGrossIncome > 60000 ? `${hasEmergencyGap ? "3" : "2"}. RRSP — ${fmt(plan.assets.rrspBalance)} current balance, ${fmtFull(plan.assets.rrspMonthlyContribution ?? 0)}/month currently. At your income level, each dollar contributed reduces your tax bill by approximately ${getMarginalRate(plan.profile.annualGrossIncome)}¢.\n` : ""}${respShort ? `• RESP — Increase to $208/month per child to capture the full $500/year government CESG grant — a guaranteed 20% return on those contributions.\n` : ""}
${hasRetirementGap ? `Your retirement gap of ${fmt(results.retirementGap)} means the RRSP deserves consistent prioritization. The Advisor tab shows the exact monthly increase needed to close it.` : `Your retirement trajectory looks solid. Continue your current contributions and increase them proportionally as your income grows.`}`,
      suggestions: [
        "What is a spousal RRSP and should I use one?",
        hasRetirementGap ? "How much more should I save monthly to close my retirement gap?" : "Am I on track for retirement?",
        respShort ? "Tell me more about the CESG grant for my RESP." : "What is the account priority ladder?",
      ],
    };
  },

  // ── Advisor page ──

  "Walk me through my top recommendation and the impact it would have.": (plan, results) => {
    const top = results.recommendations[0];
    if (!top) {
      return {
        answer: `No high-priority recommendations were generated for your current plan — your financial position is reasonably well-structured. The Advisor tab shows lower-priority optimization opportunities you can act on over time.

That said, your ${fmtFull(results.freeCashAfterContributions)}/month in undeployed surplus is still the biggest lever you have. Directing it into the right accounts would improve your retirement projection and financial health score.`,
        suggestions: [
          "What should I do with my undeployed monthly surplus?",
          "Which account should I contribute to more?",
          "Am I on track for retirement?",
        ],
      };
    }
    return {
      answer: `Your top recommendation is: "${top.title}" — rated ${top.priority} priority.

${top.explanation}

${top.whyItMatters}${top.estimatedImpact ? `\n\nEstimated impact: ${top.estimatedImpact}` : ""}`,
      suggestions: [
        "What is my second highest priority recommendation?",
        "How much more should I be saving monthly?",
        "Which account should I fill first?",
      ],
    };
  },

  "Why is a spousal RRSP recommended for my situation specifically?": (plan, results) => {
    const spouseIncome = plan.spouse?.spouseAnnualGrossIncome ?? 0;
    const incomeGap = plan.profile.annualGrossIncome - spouseIncome;
    const yourRate = getMarginalRate(plan.profile.annualGrossIncome);
    const spouseRate = getMarginalRate(spouseIncome);
    return {
      answer: `A spousal RRSP lets you contribute to an RRSP held in your spouse's name using your own contribution room. You get the tax deduction now (at your marginal rate), and in retirement, your spouse makes the withdrawals at their lower rate.

${incomeGap > 20000
  ? `In your case, there's a ${fmtFull(incomeGap)}/year income gap between you and your spouse. That means your marginal rates differ significantly — roughly ${yourRate}% for you vs. ${spouseRate}% for your spouse. By splitting retirement income across two accounts, you reduce the household's total tax bill in retirement, giving you more net income from the same savings.`
  : `Your incomes are relatively similar, so the benefit is more modest — but any income splitting in retirement still reduces total household taxes.`}

The key rule: contributions must stay in the spousal RRSP for at least 3 years to be taxed in the spouse's hands (not yours). Plan accordingly. The Advisor tab explains this recommendation in full context.`,
      suggestions: [
        "How do I actually set up a spousal RRSP?",
        "How much can I contribute to my RRSP this year?",
        "How much more should I be saving monthly?",
      ],
    };
  },

  "How much more should I be saving each month to close my retirement gap?": (plan, results) => {
    if (results.retirementGap <= 0) {
      return {
        answer: `Good news — you don't currently have a retirement gap. Your projected after-tax capital of ${fmt(results.afterTaxProjectedRetirementCapital)} meets or exceeds the ${fmt(results.requiredRetirementCapital)} required to fund your ${results.retirementYears}-year retirement at ${fmtFull(plan.assumptions.desiredRetirementIncomeToday)}/year.

The focus now is maintaining your current trajectory and capturing your ${fmtFull(results.freeCashAfterContributions)}/month in idle surplus to build further cushion. You're in a strong position — keep it.`,
        suggestions: [
          "Which account should I contribute to more right now?",
          "What should I do with my undeployed surplus?",
          "Am I on track across all my goals?",
        ],
      };
    }
    // Rough estimate: PV of gap / years / 12, adjusted for compounding
    const rate = plan.assumptions.expectedAnnualReturn / 100;
    const n = results.yearsToRetirement * 12;
    const monthlyNeeded = rate > 0
      ? Math.round(results.retirementGap * (rate / 12) / (Math.pow(1 + rate / 12, n) - 1))
      : Math.round(results.retirementGap / n);
    return {
      answer: `Your current retirement gap is ${fmt(results.retirementGap)} — the difference between your projected after-tax capital (${fmt(results.afterTaxProjectedRetirementCapital)}) and what you need (${fmt(results.requiredRetirementCapital)}).

To close that gap, you'd need to increase your monthly contributions by approximately ${fmtFull(monthlyNeeded)}/month, invested at ${plan.assumptions.expectedAnnualReturn}% for ${results.yearsToRetirement} years. You currently have ${fmtFull(results.freeCashAfterContributions)}/month in undeployed surplus — so this is achievable without changing your lifestyle.

You don't have to close the entire gap at once. Adding ${fmtFull(Math.round(monthlyNeeded * 0.5))}/month now and increasing gradually as income grows covers the gap comfortably. The Advisor tab shows the full scenario.`,
      suggestions: [
        "Which account should I put the extra savings into?",
        "What is the account priority ladder for my situation?",
        "Will CPP and OAS help close any of my gap?",
      ],
    };
  },

  "What does my contribution rate tell me about my retirement readiness?": (plan, results) => {
    return {
      answer: `Your contribution rate is ${results.savingsRate}% — meaning ${results.savingsRate} cents of every dollar you earn goes into registered investment accounts. You contribute ${fmtFull(results.totalMonthlyContributions)}/month out of ${fmtFull(results.totalMonthlyIncome)} in monthly income.

For someone ${results.yearsToRetirement} years from retirement, financial planners generally target 15–20%. At ${results.savingsRate}%, you're ${results.savingsRate >= 15 ? "within the recommended range — a solid foundation." : `${results.savingsRate >= 10 ? "slightly below the 15% threshold" : "notably below the recommended range"}. Your monthly surplus of ${fmtFull(results.monthlySurplus)} provides room to increase contributions — the ${fmtFull(results.freeCashAfterContributions)}/month sitting idle is the main opportunity.`}

${results.retirementGap > 0
  ? `Combined with your ${fmt(results.retirementGap)} retirement gap, increasing your contribution rate is the single most impactful action available to you. Even a 2–3% increase compounds significantly over ${results.yearsToRetirement} years.`
  : `Your contribution rate is keeping you on track for retirement. Maintain it as income grows.`}`,
      suggestions: [
        "How much more should I save monthly to close my retirement gap?",
        "I have undeployed surplus — what should I do with it?",
        "Which account should I be contributing to more?",
      ],
    };
  },

  // ── Resources page ──

  "Which registered accounts am I not using to their full potential?": (plan, results) => {
    const issues: string[] = [];
    const monthlyResp = plan.assets.respMonthlyContribution ?? 0;
    const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
    if (results.freeCashAfterContributions > 300) {
      issues.push(`TFSA (${fmt(plan.assets.tfsaBalance)}) — you have ${fmtFull(results.freeCashAfterContributions)}/month in idle surplus that could be building tax-free wealth here.`);
    }
    if (hasChildren && monthlyResp < 208) {
      issues.push(`RESP (${fmt(plan.assets.respBalance)}) — contributing less than $208/month means you're leaving the $500/year CESG government grant unclaimed.`);
    }
    if ((plan.assets.rrspMonthlyContribution ?? 0) < 300 && plan.profile.annualGrossIncome > 70000) {
      issues.push(`RRSP (${fmt(plan.assets.rrspBalance)}) — at your income level, you likely have unused contribution room that could reduce your tax bill this year.`);
    }
    const body = issues.length > 0
      ? issues.map((s, i) => `${i + 1}. ${s}`).join("\n")
      : `Your registered accounts appear reasonably utilized for your current contribution level.`;
    return {
      answer: `Here are the accounts that have meaningful untapped potential in your situation:\n\n${body}\n\nThe general priority order for most Canadians is: emergency fund (HISA in TFSA) → TFSA → RRSP → RESP (if children) → non-registered. The Resources tab explains each account in detail, and the Advisor tab shows your personalized priority ladder.`,
      suggestions: [
        "How much TFSA contribution room do I have?",
        "Tell me more about the CESG grant for my RESP.",
        "How much tax does my RRSP contribution save me?",
      ],
    };
  },

  "Am I missing out on the CESG grant for my child's RESP?": (plan, _results) => {
    const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
    const monthlyResp = plan.assets.respMonthlyContribution ?? 0;
    const annualResp = monthlyResp * 12;
    const maxCesg = (plan.profile.numberOfChildren ?? 0) * 500;
    const captured = Math.min(annualResp * 0.2, maxCesg);
    const missing = Math.max(0, maxCesg - captured);
    if (!hasChildren) {
      return {
        answer: `No children are recorded in your profile, so the RESP and CESG grant don't apply to your current plan. If you have or plan to have children, update your profile — the CESG provides a 20% government match on up to $2,500/year per child, worth up to $500/year per child in free money.`,
        suggestions: [
          "How does the TFSA work?",
          "Which accounts should I prioritize for savings?",
          "What Canadian programs am I eligible for?",
        ],
      };
    }
    return {
      answer: `The CESG (Canada Education Savings Grant) matches 20% of your RESP contributions up to $2,500/year per child — that's up to $500/year per child in free government money, deposited directly to the RESP.

${missing > 0
  ? `With ${plan.profile.numberOfChildren} child${plan.profile.numberOfChildren > 1 ? "ren" : ""} and current contributions of ${fmtFull(monthlyResp)}/month, you're capturing approximately ${fmtFull(Math.round(captured))}/year in CESG but leaving ${fmtFull(Math.round(missing))}/year unclaimed. To capture the full grant, you need to contribute $208/month ($2,500/year) per child.`
  : `You're contributing enough to capture the full ${fmtFull(maxCesg)}/year CESG grant for your ${plan.profile.numberOfChildren === 1 ? "child" : `${plan.profile.numberOfChildren} children`} — the maximum government match available.`}

The CESG grant is a guaranteed 20% return on those contributions before any investment growth — one of the best available return guarantees in the Canadian financial system. Unused grant room can also be carried forward to future years (up to $1,000/year in grants).`,
      suggestions: [
        "How much should I contribute to my RESP each month?",
        "Can RESP money be used for anything other than education?",
        "Which accounts should I prioritize — RESP or TFSA?",
      ],
    };
  },

  "How much tax does my RRSP contribution actually save me this year?": (plan, _results) => {
    const annualRrsp = (plan.assets.rrspMonthlyContribution ?? 0) * 12;
    const rate = getMarginalRate(plan.profile.annualGrossIncome);
    const savings = Math.round(annualRrsp * (rate / 100));
    return {
      answer: `Your current RRSP contributions of ${fmtFull(plan.assets.rrspMonthlyContribution ?? 0)}/month total ${fmt(annualRrsp)}/year. At an approximate ${rate}% marginal tax rate for your income bracket, that generates roughly ${fmt(savings)}/year in tax savings — money you'd otherwise send to the CRA.

The mechanism: every RRSP dollar reduces your taxable income by one dollar. When you file your return, you receive a refund equal to your contribution multiplied by your marginal rate. The money then grows tax-sheltered until retirement, when you withdraw at your (typically lower) retirement tax rate — often 20–30% instead of ${rate}%.

If you have unused RRSP contribution room from prior years, a larger lump-sum contribution before March 1 generates a one-time tax refund. Check your available room on CRA My Account (canada.ca/cra).`,
      suggestions: [
        "What is RRSP contribution room and how do I check mine?",
        "What is a spousal RRSP and should I use one?",
        "Is it better to contribute to TFSA or RRSP with my surplus?",
      ],
    };
  },

  "What Ontario government programs apply to my household right now?": (plan, _results) => {
    const isOntario = plan.profile.province === "ON";
    const hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
    if (!isOntario) {
      return {
        answer: `Your plan shows ${plan.profile.province} as your province — Ontario-specific programs like the Trillium Benefit and Ontario LTT Rebate don't apply, but federal programs (TFSA, RRSP, CESG, CPP, OAS) are the same across Canada. Check the Resources tab for programs filtered to your province.`,
        suggestions: [
          "Which programs apply to my province?",
          "What federal programs am I eligible for?",
          "How does CPP work for me?",
        ],
      };
    }
    return {
      answer: `As an Ontario resident, here are the most relevant programs for your household:

Ontario Trillium Benefit — combines three credits (energy/property tax and sales tax) into a monthly payment based on your prior year tax return. Total value up to $1,700+/year depending on income and rent/property tax paid. Filed automatically when you submit your taxes.${hasChildren ? "\n\nOntario Child Benefit — up to $1,700/year per child under 18, delivered monthly. Income-tested and integrated with the federal CCB." : ""}

Federal RRSP and TFSA — available to all Canadians, but worth mentioning: at your Ontario income level, the combined federal + provincial RRSP deduction is substantial. Every $1,000 in RRSP contributions saves you approximately $${getMarginalRate(plan.profile.annualGrossIncome) * 10} in combined federal and provincial taxes.

Explore all applicable programs in the Resources tab — results are filtered to your province and goals.`,
      suggestions: [
        "How much is the Ontario Trillium Benefit for my situation?",
        "How much tax does my RRSP contribution save me?",
        "Which federal programs am I eligible for?",
      ],
    };
  },

  // ── Scenarios ──

  "What is the projected dollar difference between my current path and the recommended path?": (plan, results) => {
    const last = results.projectionSeries[results.projectionSeries.length - 1];
    const diff = last ? Math.abs(last.recommendedPath - last.currentPath) : 0;
    return {
      answer: `The projected difference at retirement age ${plan.profile.retirementAge} between your current path and the recommended path is approximately ${fmt(diff)}.

The current path assumes you maintain your existing ${fmtFull(results.totalMonthlyContributions)}/month in contributions unchanged. The recommended path redirects your ${fmtFull(results.freeCashAfterContributions)}/month in idle surplus into optimal accounts — no lifestyle change required, just better deployment of money you already have.

That ${fmt(diff)} gap comes entirely from the compounding effect over ${results.yearsToRetirement} years. Small differences in monthly contributions create exponentially larger differences in final wealth. This is why starting to deploy the surplus now matters more than starting later.`,
      suggestions: [
        "What single action would have the biggest impact on my retirement?",
        "How much more should I be saving monthly?",
        "Which account should I put the extra savings into?",
      ],
    };
  },

  "What single change would have the biggest impact on my retirement outcome?": (plan, results) => {
    return {
      answer: `The single highest-impact change for your situation is deploying your ${fmtFull(results.freeCashAfterContributions)}/month in undeployed surplus into registered accounts. This doesn't require earning more or cutting your lifestyle — just redirecting money that's currently sitting idle.

At ${plan.assumptions.expectedAnnualReturn}% over ${results.yearsToRetirement} years, your current idle surplus would compound to approximately ${fmt(Math.round(results.freeCashAfterContributions * 12 * ((Math.pow(1 + plan.assumptions.expectedAnnualReturn / 100, results.yearsToRetirement) - 1) / (plan.assumptions.expectedAnnualReturn / 100))))} if invested starting now.

${results.retirementGap > 0
  ? `Combined with your ${fmt(results.retirementGap)} retirement gap, directing even half of this idle surplus into your RRSP or TFSA would meaningfully close the gap. The Advisor tab shows the exact impact.`
  : `Since you're already on track for retirement, this additional investing builds a meaningful financial cushion above your target.`}`,
      suggestions: [
        "Which account should I put the extra savings into?",
        "Am I on track for retirement?",
        "What would my retirement look like if I follow the plan?",
      ],
    };
  },

  "How much better off will I be in 10 years if I follow the recommendations?": (plan, results) => {
    const tenYearPoint = results.projectionSeries.find(p => p.year === 10) ?? results.projectionSeries[Math.min(9, results.projectionSeries.length - 1)];
    const diff10 = tenYearPoint ? Math.abs(tenYearPoint.recommendedPath - tenYearPoint.currentPath) : 0;
    return {
      answer: `In 10 years, following the recommended path would put you approximately ${fmt(diff10)} ahead of your current path. That's the compounding value of deploying your ${fmtFull(results.freeCashAfterContributions)}/month idle surplus into the right accounts over a decade.

By year 10 you'd be ${plan.profile.age + 10} years old — ${results.yearsToRetirement - 10} years from retirement. The wealth built in the next 10 years has the longest time to compound before you need it, making this the highest-value decade to act.

The full difference grows significantly in years 11–${results.yearsToRetirement} as compounding accelerates. See the "Your Plan" tab on the Dashboard for the complete projection chart showing both paths year by year.`,
      suggestions: [
        "What is the total difference at retirement between the two paths?",
        "Which accounts should I put my surplus into?",
        "Am I on track for retirement right now?",
      ],
    };
  },

  // ── Goals ──

  "How long will it realistically take me to save for my top goal?": (plan, results) => {
    const topGoal = plan.goals
      .filter(g => g.selected && g.topPriorityRank === 1)[0]
      ?? plan.goals.filter(g => g.selected)[0];
    if (!topGoal || !topGoal.targetAmount) {
      return {
        answer: `Your top-ranked goal doesn't have a target amount set, so an exact timeline can't be calculated. To get a specific timeline, update your goal in the Plan section with a target amount and target year — Flow will calculate the monthly savings needed and track your progress.

Generally: to save ${fmt(50000)}, saving ${fmtFull(1000)}/month at ${plan.assumptions.expectedAnnualReturn}% takes about ${Math.round(50000 / (1000 * 12) * 12)} months. The same formula applies to your specific goal once you set the target.`,
        suggestions: [
          "How do I set a target for my goals?",
          "Am I saving enough to reach my goals?",
          "What should I do with my monthly surplus?",
        ],
      };
    }
    const readiness = results.goalReadinessSummary.find(g => g.goalId === topGoal.id);
    return {
      answer: `Your top goal — "${topGoal.label}" — has a target of ${fmt(topGoal.targetAmount)}${topGoal.targetYear ? ` by ${topGoal.targetYear}` : ""}.

${readiness
  ? `Currently you have ${fmt(readiness.currentSaved)} saved toward this goal. ${readiness.monthlyNeeded ? `You'd need approximately ${fmtFull(readiness.monthlyNeeded)}/month to reach it on time.` : ""} The goal is currently rated "${readiness.status.replace(/-/g, " ")}."${readiness.monthlyShortfall && readiness.monthlyShortfall > 0 ? ` There's a ${fmtFull(readiness.monthlyShortfall)}/month shortfall to get back on track.` : ""}`
  : `Review the Goals tab for detailed progress tracking and recommended monthly savings.`}

You have ${fmtFull(results.freeCashAfterContributions)}/month in undeployed surplus that could be directed toward this goal. The Goals tab shows progress bars and timeline adjustments for each of your selected goals.`,
      suggestions: [
        "Am I on track across all my goals?",
        "What should I do with my monthly surplus?",
        "Which account is best for saving toward this goal?",
      ],
    };
  },

  "Am I on track for each of my financial goals given my current savings rate?": (plan, results) => {
    const selected = plan.goals.filter(g => g.selected);
    if (selected.length === 0) {
      return {
        answer: `No goals are selected in your plan yet. Add goals in the Plan section to see progress tracking, recommended monthly savings, and readiness status for each one.`,
        suggestions: [
          "How do I add goals to my plan?",
          "Am I on track for retirement?",
          "What should I do with my monthly surplus?",
        ],
      };
    }
    const summary = results.goalReadinessSummary;
    const onTrack = summary.filter(g => g.status === "on-track").length;
    const partial = summary.filter(g => g.status === "partially-on-track").length;
    const offTrack = summary.filter(g => g.status === "off-track").length;
    return {
      answer: `Across your ${selected.length} selected goals: ${onTrack} on track, ${partial} partially on track, and ${offTrack} off track.

${offTrack > 0 ? `The off-track goals need additional monthly allocation to hit their targets. Your ${fmtFull(results.freeCashAfterContributions)}/month in idle surplus could be directed here.` : ""}${partial > 0 ? ` The partially on-track goals are progressing but may need a timeline adjustment or contribution increase to land on target.` : ""}

The Goals tab shows a detailed breakdown for each goal — progress, monthly savings needed, and readiness status. Your retirement goal is the most critical to protect; others can flex on timeline if needed.`,
      suggestions: [
        "What should I do with my monthly surplus to hit more goals?",
        "Am I on track for retirement?",
        "Which goal should I prioritize after retirement savings?",
      ],
    };
  },

  "How do I build my emergency fund without affecting other goals?": (plan, results) => {
    const gap = results.emergencyFundGap;
    const monthlyBuild = Math.min(Math.round(results.freeCashAfterContributions * 0.4), 500);
    const months = monthlyBuild > 0 ? Math.ceil(gap / monthlyBuild) : 0;
    return {
      answer: `Your emergency fund currently covers ${results.emergencyFundMonthsCovered.toFixed(1)} months of essential expenses. The target is ${plan.assumptions.emergencyFundTargetMonths} months (${fmt(results.targetEmergencyFund)}), leaving a ${fmt(gap)} gap.

The key is treating the emergency fund as its own dedicated account — a HISA (High-Interest Savings Account) inside your TFSA, separate from your investment accounts. This keeps it accessible without affecting your investment contributions.

With your ${fmtFull(results.freeCashAfterContributions)}/month in idle surplus, you can direct a portion (say ${fmtFull(monthlyBuild)}/month) to the emergency fund and still redirect the remainder to investments. At that rate, you'd reach the full target in approximately ${months} months — then redirect the full amount to investments.`,
      suggestions: [
        "What is the best account for an emergency fund?",
        "Am I on track for retirement while building the emergency fund?",
        "What should I do with the surplus after the emergency fund is built?",
      ],
    };
  },
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a pre-built response for a known suggested prompt, or null if the
 * question should be sent to the live API instead.
 */
export function getPrebuiltResponse(
  question: string,
  plan: FinancialPlan | null,
  results: CalculatedResults | null
): PrebuiltResponse | null {
  // Static answers — no plan needed
  if (STATIC[question]) return STATIC[question];

  // Dynamic answers — require plan data
  if (!plan || !results) return null;
  const builder = DYNAMIC[question];
  if (!builder) return null;
  return builder(plan, results);
}
