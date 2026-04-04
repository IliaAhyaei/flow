// ─── Sample profile: Ethan & Sofia Park — DEPLOYMENT GAP scenario ─────────
// Used by the global "Fill with Sample Data" button in Step 01.
// Deliberately shows realistic inefficiencies so the system has something
// meaningful to surface.
//
// Central insight (hero): $4,930/mo surplus, only $1,100/mo deployed (22.4%).
// The gap is behavioral, not structural — the household earns enough to be
// fully on-track; they simply haven't directed the cash.
//
// Inefficiencies designed in:
//   • $3,830/mo in surplus sitting idle after contributions    ← hero gap
//   • Emergency fund $22,000 — covers 2.7 of 6 target months  ← high priority
//   • RESP $9,200 saved but contributions stopped → $500/yr CESG missed  ← unexpected win
//   • No spousal RRSP — $46K income gap, all RRSP in Ethan's name         ← tax optimization
//   • $275K home equity contributing $0 to retirement projection           ← philosophical reframe
//
// Household: Ethan (38, ON, $142K gross) + Sofia (36, $96K gross) = $238K combined
// Combined net monthly: $13,000
// Monthly expenses: $8,070
// Monthly surplus: $4,930  →  contributions: $1,100  →  idle: $3,830

import type {
  UserProfile,
  SpouseProfile,
  IncomeBreakdown,
  ExpensesBreakdown,
  AssetsBreakdown,
  Liability,
  PlanningAssumptions,
  ImportanceLevel,
} from "@/types/financial";

// ─── Profile ──────────────────────────────────────────────────────────────

export const SAMPLE_PROFILE: UserProfile = {
  fullName: "Ethan Park",
  age: 38,
  province: "ON",
  maritalStatus: "married",
  numberOfDependents: 1,
  numberOfChildren: 1,
  smokingStatus: false,
  employmentStatus: "employed-full-time",
  annualGrossIncome: 142000,
  annualNetIncome: null,
  retirementAge: 65,
  lifeExpectancyAge: 88,
  spouseIncluded: true,
};

export const SAMPLE_SPOUSE: SpouseProfile = {
  spouseAge: 36,
  spouseAnnualGrossIncome: 96000,
  spouseRetirementAge: 65,
};

// ─── Income ───────────────────────────────────────────────────────────────
// Ethan net ~$8,500/mo + Sofia net ~$4,500/mo = $13,000/mo combined

export const SAMPLE_INCOME: IncomeBreakdown = {
  employmentIncome: 13000,
  sideIncome: 0,
  governmentBenefits: 0,
  familyIncome: 0,
  otherIncome: 0,
};

// ─── Expenses ─────────────────────────────────────────────────────────────
// Total: $8,070/month → surplus $4,930/mo
//
// Housing      (2850+420+380+160 = 3810)
// Transport    (450 = 450)
// Living       (1150+250+900+150 = 2450)
// Communication (220+70+50 = 340)
// Lifestyle    (320 = 320)
// Other        (700 = 700)

export const SAMPLE_EXPENSES: ExpensesBreakdown = {
  // ── Housing ──
  rentOrMortgage: 2850,       // mortgage, 22 years remaining
  homeInsurance: 420,         // home + auto + life insurance bundle
  propertyTax: 380,
  utilities: 160,
  // ── Transportation ──
  carPayment: 0,
  fuelTransit: 450,
  autoInsurance: 0,           // included in insurance bundle above
  // ── Living ──
  groceries: 1150,
  diningOut: 250,
  clothing: 0,
  childCare: 900,             // school-age program
  personalCare: 150,
  // ── Communication ──
  cellPhone: 220,             // family plan, two phones
  internet: 70,
  streamingCable: 50,
  // ── Lifestyle ──
  gymMemberships: 0,
  entertainment: 320,
  giftsCharity: 0,
  // ── Debt payments (mortgage is in rentOrMortgage above) ──
  creditCardPayment: 0,
  studentLoanPayment: 0,
  personalLoanPayment: 0,
  lineOfCreditPayment: 0,
  // ── Other ──
  familySupport: 0,
  miscellaneous: 700,
};

// ─── Assets ───────────────────────────────────────────────────────────────
// Key inefficiencies:
//   • RESP $9,200 balance but $0/mo contributions → full CESG ($500/yr) missed
//   • Monthly contributions only $1,100 (TFSA $500 + RRSP $600)
//   • No spousal RRSP contributions despite $46K income gap
//   • Emergency fund covers only 2.7 months vs 6-month target

export const SAMPLE_ASSETS: AssetsBreakdown = {
  // ── Cash / Liquid ──
  chequing: 8500,
  savings: 14000,             // HISA
  emergencyFund: 22000,       // ← covers ~2.7 months (target: 6 months = ~$24,210)
  // ── Registered ──
  tfsaBalance: 41500,
  tfsaMonthlyContribution: 500,
  rrspBalance: 48000,         // Ethan's RRSP only — no spousal RRSP contributions
  rrspMonthlyContribution: 600,
  respBalance: 9200,
  respMonthlyContribution: 0, // ← STOPPED: $500/yr CESG grant being missed every year
  fhsaBalance: 0,             // not applicable — already own a home
  fhsaMonthlyContribution: 0,
  // ── Investments ──
  nonRegisteredInvestments: 12500,
  nonRegisteredMonthlyContribution: 0,
  // ── Pension ──
  pensionType: "dc",
  pensionValue: 38000,        // DC pension, employer contributions ongoing
  pensionAnnualBenefit: 0,    // DC plan — no fixed benefit; balance is the capital
  otherInvestments: 0,
  // ── Real Assets ──
  homeMarketValue: 895000,    // ← $275K equity = real but illiquid; $0 in retirement projection
  otherRealEstate: 0,
  vehicleValue: 38000,
  valuablesOther: 0,
};

// ─── Liabilities ──────────────────────────────────────────────────────────
// One mortgage at 4.9% — below expected return (6.5%), so no paydown urgency.
// Debt burden is manageable; no high-interest debt.

export const SAMPLE_LIABILITIES: Liability[] = [
  {
    id: "sample-mortgage",
    type: "mortgage",
    lenderName: "TD Bank",
    outstandingBalance: 620000,
    interestRate: 4.9,
    minimumMonthlyPayment: 2850,
    fixedOrVariable: "fixed",
    termYearsRemaining: 22,
  },
];

// ─── Planning Assumptions ─────────────────────────────────────────────────
// Savings capacity $1,500/mo stated — conservative relative to $3,830/mo truly idle.
// System will surface the gap between stated capacity and actual available cash.

export const SAMPLE_ASSUMPTIONS: PlanningAssumptions = {
  monthlyAmountUserCanComfortablySetAside: 1500,
  expectedAnnualReturn: 6.5,
  expectedInflationRate: 2.5,
  annualIncomeGrowthRate: 3.0,
  desiredRetirementIncomeToday: 68000,
  expectedCppBenefit: 12500,
  expectedOasBenefit: 8700,
  emergencyFundTargetMonths: 6,
  preferredStrategyMode: "balanced",
};

// ─── Goals ────────────────────────────────────────────────────────────────
// Order determines topPriorityRank assignment (first 3 get ranks 1–3).

export const SAMPLE_GOALS = [
  "retire-enough",
  "pay-less-tax",
  "save-education",
  "money-working-harder",
] as const;

export const SAMPLE_GOAL_DETAILS: Record<string, {
  targetAmount: number | null;
  targetYear: number | null;
  monthlyAllocation: number | null;
  importanceLevel: ImportanceLevel;
}> = {
  "retire-enough": {
    targetAmount: null,
    targetYear: null,
    monthlyAllocation: null,
    importanceLevel: "high",
  },
  "pay-less-tax": {
    targetAmount: null,
    targetYear: null,
    monthlyAllocation: null,
    importanceLevel: "high",
  },
  "save-education": {
    targetAmount: 90000,       // target education fund for child entering university ~2039
    targetYear: 2039,
    monthlyAllocation: null,
    importanceLevel: "high",
  },
  "money-working-harder": {
    targetAmount: 250000,
    targetYear: 2034,
    monthlyAllocation: null,
    importanceLevel: "medium",
  },
};
