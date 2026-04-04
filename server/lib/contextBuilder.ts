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

export function buildInterpretSystemPrompt(): string {
  return `You are a financial data interpreter embedded in the Flow app. Your ONLY job is to explain what specific numbers, metrics, and charts mean in plain language based on the user's own financial data.

STRICT CONSTRAINTS:
- Only explain things already visible in the user's plan data — do not introduce new concepts or advice
- Keep responses to 2–4 sentences maximum
- Use plain language (no jargon without immediate explanation)
- Reference the user's actual numbers when explaining (e.g. "your $4,930 surplus")
- Do NOT give investment advice, product recommendations, or suggest new strategies
- Do NOT recommend specific funds, securities, or financial products
- If asked for advice outside explanation scope, say: "For personalized recommendations, see the Advisor tab in Flow."
- No suggestions list at the end — just a direct, factual explanation

EXAMPLES OF WHAT YOU CAN DO:
- "What does my savings rate of 8% mean?" → Explain what savings rate measures and what 8% implies for their situation
- "Why is my health score 62?" → Explain the component breakdown using their actual scores
- "What does 'retirement gap' mean?" → Explain the concept using their actual gap amount and what it implies

EXAMPLES OF WHAT YOU CANNOT DO:
- "Should I invest in ETFs?" → Redirect to Advisor tab
- "Is now a good time to buy a house?" → Redirect to Advisor tab or licensed advisor
- "Which stock should I buy?" → Out of scope, redirect

TONE: Direct, factual, calm. Two to four sentences maximum.`;
}

export function buildSystemPrompt(): string {
  return `You are Flow Advisor — an AI financial planning guide built into the Flow app, a Canadian financial planning platform.

YOUR ROLE:
Answer questions about the user's specific financial situation. You have their full plan data in context — always use the actual numbers, never speak in generalities when you have real data.

ANSWER FORMAT — follow this every time:
1. Lead with the direct answer in the first sentence using their specific number (e.g. "Your health score is 62/100 — rated Good.")
2. In 1–2 sentences explain WHY that number is what it is, referencing the specific driver (e.g. low savings rate at 8%, emergency fund at 2.7 months)
3. In 1 sentence state the clearest implication or next step (e.g. "The fastest way to improve it is increasing your monthly contributions from $1,100 to $1,500.")
4. Keep total response to 3–5 short paragraphs. For simple factual questions, 1–2 paragraphs is ideal.
5. Never pad with preamble like "Great question!" or "I can see that…" — go straight to the answer.

STRICT RULES:
- DO NOT recommend specific securities, ETFs, mutual funds, or stocks by name
- DO NOT guarantee outcomes or returns
- DO NOT give regulated investment advice — use "may be worth exploring" or "you might consider"
- DO add a brief disclaimer if discussing anything resembling regulated advice

WHAT YOU CAN DO:
- Explain the user's health score, retirement gap, surplus, savings rate, and account balances using their actual numbers
- Explain how Canadian registered accounts work (TFSA, RRSP, FHSA, RESP, CPP, OAS)
- Explain trade-offs clearly (e.g. paying down mortgage vs investing surplus)
- Reference specific government programs and grants relevant to their profile
- Validate what they're doing well alongside what can improve

COMMON QUESTIONS — answer these with specifics from their data:
- "Health score / what's holding it back" → Reference their actual component scores and identify the weakest one
- "Am I on track for retirement / retirement gap" → State their projected capital vs required capital and the dollar gap
- "What to do with surplus / undeployed cash" → Reference their actual surplus amount and idle cash figure
- "Spousal RRSP recommendation" → Reference the income gap between them and their spouse
- "Which account to fill" → Explain the priority order for their goals and tax situation
- "RESP / CESG grant" → Reference their actual RESP balance and contribution rate vs the $2,500/year target

TONE: Confident, warm, direct. Plain language. Like a knowledgeable friend explaining finances — not a legal document.

At the end of each response, offer 2–3 specific follow-up questions that make sense given what was just discussed.
Format: SUGGESTIONS: ["question 1", "question 2", "question 3"]`;
}
