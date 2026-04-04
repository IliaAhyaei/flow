// Builds a structured financial context string for the LLM advisor.
// All numbers come from the user's actual plan — no hallucination possible.

interface PlanData {
  profile?: any;
  spouse?: any;
  goals?: any[];
  income?: any;
  expenses?: any;
  assets?: any;
  liabilities?: any[];
  assumptions?: any;
  results?: any;
}

export function buildFinancialContext(plan: PlanData, currentPage?: string): string {
  const { profile, goals, income, expenses, assets, liabilities, assumptions, results } = plan;

  if (!profile) return "No financial plan data available.";

  const selectedGoals = (goals ?? [])
    .filter((g: any) => g.selected)
    .map((g: any) => g.label)
    .join(", ");

  const topPriorities = (goals ?? [])
    .filter((g: any) => g.topPriorityRank)
    .sort((a: any, b: any) => a.topPriorityRank - b.topPriorityRank)
    .map((g: any) => `${g.topPriorityRank}. ${g.label}`)
    .join("; ");

  const liabilityDetails = (liabilities ?? [])
    .map((l: any) => `${l.type} ($${l.outstandingBalance?.toLocaleString()} @ ${l.interestRate}%)`)
    .join(", ");

  const lines: string[] = [
    "=== USER FINANCIAL PROFILE ===",
    `Name: ${profile.fullName || "User"}`,
    `Age: ${profile.age} | Province: ${profile.province} | Status: ${profile.maritalStatus} | Employment: ${profile.employmentStatus}`,
    `Annual gross income: $${profile.annualGrossIncome?.toLocaleString()}`,
    `Retirement target age: ${profile.retirementAge} | Life expectancy used: ${profile.lifeExpectancyAge}`,
    profile.numberOfChildren > 0 ? `Children: ${profile.numberOfChildren}` : "",
    "",
    "=== MONTHLY CASH FLOW ===",
    results
      ? [
          `Total monthly income: $${results.totalMonthlyIncome?.toLocaleString()}`,
          `Total monthly expenses: $${results.totalMonthlyExpenses?.toLocaleString()}`,
          `Monthly surplus: $${results.monthlySurplus?.toLocaleString()} ${results.monthlySurplus < 0 ? "(DEFICIT)" : ""}`,
          `Savings rate: ${results.savingsRate}%`,
          `Monthly investment contributions: $${results.totalMonthlyContributions?.toLocaleString()}`,
        ].join("\n")
      : "Cash flow not yet calculated.",
    "",
    "=== NET WORTH & ASSETS ===",
    results
      ? [
          `Total assets: $${results.totalAssets?.toLocaleString()}`,
          `Total liabilities: $${results.totalLiabilities?.toLocaleString()}`,
          `Net worth: $${results.netWorth?.toLocaleString()}`,
          `Investable assets: $${results.totalInvestableAssets?.toLocaleString()}`,
          assets
            ? [
                assets.tfsaBalance > 0 ? `  TFSA: $${assets.tfsaBalance?.toLocaleString()}` : "",
                assets.rrspBalance > 0 ? `  RRSP: $${assets.rrspBalance?.toLocaleString()}` : "",
                assets.fhsaBalance > 0 ? `  FHSA: $${assets.fhsaBalance?.toLocaleString()}` : "",
                assets.emergencyFund > 0 ? `  Emergency fund: $${assets.emergencyFund?.toLocaleString()}` : "",
              ]
                .filter(Boolean)
                .join("\n")
            : "",
        ]
        .filter(Boolean)
        .join("\n")
      : "Assets not yet calculated.",
    "",
    liabilities && liabilities.length > 0
      ? [
          "=== DEBTS ===",
          liabilityDetails,
          results
            ? `Weighted average debt rate: ${results.weightedAverageDebtInterest?.toFixed(1)}% | Monthly debt payments: $${results.totalMonthlyDebtPayments?.toLocaleString()}`
            : "",
        ].join("\n")
      : "",
    "",
    "=== RETIREMENT OUTLOOK ===",
    results
      ? [
          `Years to retirement: ${results.yearsToRetirement}`,
          `Projected retirement capital: $${results.projectedRetirementCapital?.toLocaleString()}`,
          `Required retirement capital: $${results.requiredRetirementCapital?.toLocaleString()}`,
          `Retirement gap: $${results.retirementGap?.toLocaleString()} (${results.retirementGapPercent}% shortfall)`,
          `Desired retirement income today: $${assumptions?.desiredRetirementIncomeToday?.toLocaleString()}/year`,
          `Expected return: ${assumptions?.expectedAnnualReturn}% | Strategy: ${assumptions?.preferredStrategyMode}`,
        ].join("\n")
      : "Retirement not yet projected.",
    "",
    "=== FINANCIAL HEALTH SCORE ===",
    results
      ? [
          `Overall: ${results.financialHealthScore}/100`,
          `  Cash flow: ${results.healthScoreBreakdown?.cashFlow}/20`,
          `  Emergency fund: ${results.healthScoreBreakdown?.emergencyFund}/20`,
          `  Savings rate: ${results.healthScoreBreakdown?.savingsRate}/20`,
          `  Debt burden: ${results.healthScoreBreakdown?.debtBurden}/20`,
          `  Retirement readiness: ${results.healthScoreBreakdown?.retirementReadiness}/20`,
        ].join("\n")
      : "Score not yet calculated.",
    "",
    selectedGoals
      ? `=== GOALS ===\n${selectedGoals}\n${topPriorities ? `Top priorities: ${topPriorities}` : ""}`
      : "",
    "",
    results?.recommendations?.length
      ? [
          "=== FLOW RECOMMENDATIONS ALREADY GIVEN ===",
          results.recommendations
            .map(
              (r: any, i: number) =>
                `${i + 1}. [${r.priority.toUpperCase()}] ${r.title}`
            )
            .join("\n"),
        ].join("\n")
      : "",
    "",
    currentPage ? `=== USER IS CURRENTLY ON PAGE: ${currentPage} ===` : "",
  ];

  return lines.filter((l) => l.trim() !== "").join("\n");
}

export function buildSystemPrompt(): string {
  return `You are Flow Advisor — an AI financial planning assistant built into the Flow app, a Canadian financial planning platform for newcomers and underserved users.

YOUR ROLE:
- Help users understand their financial situation, options, and trade-offs
- Reference their actual numbers (provided in context) — always be specific
- Explain WHY results happen, not just what they are
- Be encouraging, calm, and non-judgmental
- Keep language simple — many users are newcomers with limited financial literacy

STRICT RULES:
- DO NOT give specific investment advice or recommend securities, funds, or stocks
- DO NOT tell users to buy or sell specific investments
- DO NOT guarantee future returns or outcomes
- ALWAYS say "may be worth considering" or "you might explore" rather than "you should invest in X"
- DO NOT suggest financial products by brand name without suggesting the user research options or consult a licensed advisor
- ALWAYS add a disclaimer if discussing anything that could be construed as regulated advice

WHAT YOU CAN DO:
- Explain how accounts work (TFSA, RRSP, FHSA, RESP, QPP, OAS, etc.)
- Explain what the user's numbers mean in plain language
- Help users understand trade-offs (e.g. pay debt vs invest)
- Reference relevant government programs and benefits
- Suggest questions to ask a financial advisor
- Celebrate positive financial milestones

TONE:
- Friendly and warm
- Clear and direct — no jargon without explanation
- Confident but not prescriptive
- Empathetic to newcomer financial challenges

FORMAT:
- Respond in 3–5 concise paragraphs unless the question is simple (then be brief)
- Use plain numbers from the user's profile — e.g. "your $14,000 student loan" not "your student loan"
- At the end, offer 2–3 suggested follow-up questions the user might want to ask next
- Format suggestions as: SUGGESTIONS: ["question 1", "question 2", "question 3"]

If you don't have relevant data to answer with specifics, say so and provide general guidance.`;
}
