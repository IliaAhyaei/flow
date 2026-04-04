// ─── Enums & Literals ──────────────────────────────────────────────────────

export type Province =
  | "AB" | "BC" | "MB" | "NB" | "NL" | "NS" | "NT"
  | "NU" | "ON" | "PE" | "QC" | "SK" | "YT";

export type MaritalStatus =
  | "single" | "married" | "common-law" | "divorced" | "widowed";

export type EmploymentStatus =
  | "employed-full-time" | "employed-part-time" | "self-employed"
  | "unemployed" | "student" | "retired";

export type GoalType =
  | "earn-additional-income"
  | "pay-less-tax"
  | "travel-recreation"
  | "start-grow-business"
  | "save-education"
  | "buy-home"
  | "pay-off-debts"
  | "keep-ahead-inflation"
  | "money-working-harder"
  | "retire-early"
  | "retire-enough"
  | "leave-family-debt-free"
  | "protect-family"
  | "plan-final-expenses"
  | "leave-estate";

export type ImportanceLevel = "high" | "medium" | "low";
export type LiabilityType =
  | "mortgage" | "credit-card" | "student-loan" | "auto-loan"
  | "personal-loan" | "line-of-credit" | "other";
export type StrategyMode = "conservative" | "balanced" | "growth";
export type GoalReadinessStatus = "on-track" | "partially-on-track" | "off-track" | "no-target";
export type RecommendationPriority = "high" | "medium" | "low";

// ─── Core Entities ─────────────────────────────────────────────────────────

export interface UserProfile {
  fullName: string;
  age: number;
  province: Province;
  maritalStatus: MaritalStatus;
  numberOfDependents: number;
  numberOfChildren: number;
  smokingStatus: boolean;
  employmentStatus: EmploymentStatus;
  annualGrossIncome: number;
  annualNetIncome: number | null;
  retirementAge: number;
  lifeExpectancyAge: number;
  spouseIncluded: boolean;
}

export interface SpouseProfile {
  spouseAge: number;
  spouseAnnualGrossIncome: number;
  spouseRetirementAge: number;
}

export interface Goal {
  id: string;
  goalType: GoalType;
  label: string;
  selected: boolean;
  targetAmount: number | null;
  targetYear: number | null;
  monthlyAllocation: number | null;
  importanceLevel: ImportanceLevel;
  topPriorityRank: 1 | 2 | 3 | null;
}

export interface IncomeBreakdown {
  employmentIncome: number;
  sideIncome: number;
  governmentBenefits: number;
  familyIncome: number;
  otherIncome: number;
}

export interface ExpensesBreakdown {
  // Housing
  rentOrMortgage: number;
  homeInsurance: number;
  propertyTax: number;
  utilities: number;
  // Transportation
  carPayment: number;
  fuelTransit: number;
  autoInsurance: number;
  // Living
  groceries: number;
  diningOut: number;
  clothing: number;
  childCare: number;
  personalCare: number;
  // Communication
  cellPhone: number;
  internet: number;
  streamingCable: number;
  // Lifestyle
  gymMemberships: number;
  entertainment: number;
  giftsCharity: number;
  // Debt Payments
  creditCardPayment: number;
  studentLoanPayment: number;
  personalLoanPayment: number;
  lineOfCreditPayment: number;
  // Other
  familySupport: number;
  miscellaneous: number;
}

export interface AssetsBreakdown {
  // Cash / Liquid
  chequing: number;
  savings: number;
  emergencyFund: number;
  // Registered
  tfsaBalance: number;
  rrspBalance: number;
  respBalance: number;
  fhsaBalance: number;
  // Investments
  nonRegisteredInvestments: number;
  // Pension — type determines how it is modelled in retirement projection
  // "dc": balance is market capital (LIRA, group RRSP, DC plan) → grown at market return
  // "db": pensionValue is the commuted value (for net worth only); pensionAnnualBenefit is the
  //        annual income the plan will pay at retirement → offsets income need instead of capital
  pensionType: "db" | "dc";
  pensionValue: number;
  pensionAnnualBenefit: number; // DB only — annual income at retirement in today's dollars
  otherInvestments: number;
  // Real Assets
  homeMarketValue: number;
  otherRealEstate: number;
  vehicleValue: number;
  valuablesOther: number;
  // Monthly Contributions
  tfsaMonthlyContribution: number;
  rrspMonthlyContribution: number;
  respMonthlyContribution: number;
  fhsaMonthlyContribution: number;
  nonRegisteredMonthlyContribution: number;
}

export interface Liability {
  id: string;
  type: LiabilityType;
  lenderName: string;
  outstandingBalance: number;
  interestRate: number;
  minimumMonthlyPayment: number;
  fixedOrVariable: "fixed" | "variable" | null;
  termYearsRemaining: number | null;
}

export interface PlanningAssumptions {
  monthlyAmountUserCanComfortablySetAside: number;
  expectedAnnualReturn: number;
  expectedInflationRate: number;
  annualIncomeGrowthRate: number; // expected annual % growth in income (and thus contributions)
  desiredRetirementIncomeToday: number;
  expectedCppBenefit: number;
  expectedOasBenefit: number;
  emergencyFundTargetMonths: number;
  preferredStrategyMode: StrategyMode;
}

// ─── Computed / Results ─────────────────────────────────────────────────────

export interface ProjectionPoint {
  year: number;
  age: number;
  label: string;
  currentPath: number;
  recommendedPath: number;
}

export interface GoalReadiness {
  goalId: string;
  goalType: GoalType;
  label: string;
  status: GoalReadinessStatus;
  currentSaved: number;
  targetAmount: number | null;
  targetYear: number | null;
  monthsRemaining: number | null;
  monthlyNeeded: number | null;
  monthlyShortfall: number | null;
  projectedAtTarget: number | null;
  // allocatedMonthly: the share of the shared goal budget assigned to this goal
  // (null for retirement goals, which use actual investment contributions)
  allocatedMonthly: number | null;
}

export interface HealthScoreBreakdown {
  cashFlow: number;
  emergencyFund: number;
  savingsRate: number;
  debtBurden: number;
  retirementReadiness: number;
}

export interface Recommendation {
  id: string;
  title: string;
  explanation: string;
  whyItMatters: string;
  priority: RecommendationPriority;
  actionRoute: string;
  actionLabel: string;
  estimatedImpact: string | null;
}

export interface CalculatedResults {
  // Income / Expense
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  monthlySurplus: number;
  // Assets / Liabilities
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  totalInvestableAssets: number;
  totalMonthlyContributions: number;
  totalMonthlyDebtPayments: number;
  // Rates
  // savingsRate: contributions / income × 100 — what % of income is actively invested
  // freeCashAfterContributions: surplus remaining after investment contributions
  savingsRate: number;
  freeCashAfterContributions: number;
  weightedAverageDebtInterest: number;
  debtToIncomeRatio: number;
  monthlyDebtToIncomeRatio: number;
  // Retirement
  yearsToRetirement: number;
  retirementYears: number; // expected years in retirement (lifeExpectancy - retirementAge)
  safeWithdrawalRate: number; // dynamic rate based on retirement duration
  projectedRetirementCapital: number; // gross (pre-tax) projected capital
  afterTaxProjectedRetirementCapital: number; // after estimated taxes on RRSP/non-reg withdrawals
  stressedRetirementCapital: number; // pessimistic scenario (return - 2%)
  futureRetirementIncomeNeed: number;
  requiredRetirementCapital: number;
  retirementGap: number; // based on after-tax capital vs required
  retirementGapPercent: number;
  estimatedMarginalRateAtRetirement: number;
  // Emergency Fund
  targetEmergencyFund: number;
  emergencyFundGap: number;
  emergencyFundMonthsCovered: number;
  // Health Score
  financialHealthScore: number;
  healthScoreBreakdown: HealthScoreBreakdown;
  // Projections
  projectionSeries: ProjectionPoint[];
  // Readiness
  goalReadinessSummary: GoalReadiness[];
  // Recommendations
  recommendations: Recommendation[];
  // Flags
  protectionFlags: string[];
}

// ─── Full Plan ──────────────────────────────────────────────────────────────

export interface FinancialPlan {
  id: string;
  profile: UserProfile;
  spouse: SpouseProfile | null;
  goals: Goal[];
  income: IncomeBreakdown;
  expenses: ExpensesBreakdown;
  assets: AssetsBreakdown;
  liabilities: Liability[];
  assumptions: PlanningAssumptions;
  results: CalculatedResults | null;
  lastUpdated: string;
  plannerStep: number;
  planCompleted: boolean;
}

// ─── Default Values ─────────────────────────────────────────────────────────

export const DEFAULT_PROFILE: UserProfile = {
  fullName: "",
  age: 30,
  province: "ON",
  maritalStatus: "single",
  numberOfDependents: 0,
  numberOfChildren: 0,
  smokingStatus: false,
  employmentStatus: "employed-full-time",
  annualGrossIncome: 60000,
  annualNetIncome: null,
  retirementAge: 65,
  lifeExpectancyAge: 90,
  spouseIncluded: false,
};

export const DEFAULT_SPOUSE: SpouseProfile = {
  spouseAge: 30,
  spouseAnnualGrossIncome: 55000,
  spouseRetirementAge: 65,
};

export const DEFAULT_INCOME: IncomeBreakdown = {
  employmentIncome: 0,
  sideIncome: 0,
  governmentBenefits: 0,
  familyIncome: 0,
  otherIncome: 0,
};

export const DEFAULT_EXPENSES: ExpensesBreakdown = {
  rentOrMortgage: 0,
  homeInsurance: 0,
  propertyTax: 0,
  utilities: 0,
  carPayment: 0,
  fuelTransit: 0,
  autoInsurance: 0,
  groceries: 0,
  diningOut: 0,
  clothing: 0,
  childCare: 0,
  personalCare: 0,
  cellPhone: 0,
  internet: 0,
  streamingCable: 0,
  gymMemberships: 0,
  entertainment: 0,
  giftsCharity: 0,
  creditCardPayment: 0,
  studentLoanPayment: 0,
  personalLoanPayment: 0,
  lineOfCreditPayment: 0,
  familySupport: 0,
  miscellaneous: 0,
};

export const DEFAULT_ASSETS: AssetsBreakdown = {
  chequing: 0,
  savings: 0,
  emergencyFund: 0,
  tfsaBalance: 0,
  rrspBalance: 0,
  respBalance: 0,
  fhsaBalance: 0,
  nonRegisteredInvestments: 0,
  pensionType: "dc",
  pensionValue: 0,
  pensionAnnualBenefit: 0,
  otherInvestments: 0,
  homeMarketValue: 0,
  otherRealEstate: 0,
  vehicleValue: 0,
  valuablesOther: 0,
  tfsaMonthlyContribution: 0,
  rrspMonthlyContribution: 0,
  respMonthlyContribution: 0,
  fhsaMonthlyContribution: 0,
  nonRegisteredMonthlyContribution: 0,
};

export const DEFAULT_ASSUMPTIONS: PlanningAssumptions = {
  monthlyAmountUserCanComfortablySetAside: 300,
  expectedAnnualReturn: 6,
  expectedInflationRate: 2.5,
  annualIncomeGrowthRate: 2,
  desiredRetirementIncomeToday: 50000,
  expectedCppBenefit: 8500,
  expectedOasBenefit: 8500,
  emergencyFundTargetMonths: 6,
  preferredStrategyMode: "balanced",
};

export const GOAL_DEFINITIONS: { type: GoalType; label: string; icon: string }[] = [
  { type: "earn-additional-income", label: "Earn additional income", icon: "💰" },
  { type: "pay-less-tax", label: "Pay less income tax", icon: "🧾" },
  { type: "travel-recreation", label: "Enjoy travel and recreation", icon: "✈️" },
  { type: "start-grow-business", label: "Start or grow my own business", icon: "🚀" },
  { type: "save-education", label: "Save for children's education", icon: "🎓" },
  { type: "buy-home", label: "Buy a home", icon: "🏠" },
  { type: "pay-off-debts", label: "Pay off debts", icon: "📉" },
  { type: "keep-ahead-inflation", label: "Keep ahead of inflation", icon: "📊" },
  { type: "money-working-harder", label: "Get my money working harder", icon: "📈" },
  { type: "retire-early", label: "Retire earlier than 65", icon: "🌅" },
  { type: "retire-enough", label: "Retire with enough money", icon: "🏖️" },
  { type: "leave-family-debt-free", label: "Leave my family debt-free if I pass away", icon: "🛡️" },
  { type: "protect-family", label: "Protect myself / family from unforeseen circumstances", icon: "❤️" },
  { type: "plan-final-expenses", label: "Plan for final expenses", icon: "📋" },
  { type: "leave-estate", label: "Leave an estate for my family", icon: "🏛️" },
];

export const PROVINCES: { value: Province; label: string }[] = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Quebec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
];
