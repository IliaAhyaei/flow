import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/store/planStore";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import {
  DollarSign,
  CreditCard,
  PiggyBank,
  Landmark,
  ArrowRight,
  AlertTriangle,
  Home,
  Shield,
  TrendingUp,
  Wallet,
  Utensils,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Minus,
  X,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  ClipboardList,
  Target,
  TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  fmt,
  fmtFull,
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcMonthlyContributions,
} from "@/lib/calculations";
import { getScoreLabel } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { FinancialPlan, CalculatedResults } from "@/types/financial";

// ─── Resource data ────────────────────────────────────────────────────────

interface DashboardResource {
  id: string;
  name: string;
  category: string;
  jurisdiction: "federal" | "provincial";
  province?: string;
  impact: string;
  what: string;
  eligibility: string;
  keyNumbers: string;
  link: string;
  tags: string[];
  whyRelevant?: string;
}

const CANADIAN_RESOURCES: DashboardResource[] = [
  {
    id: "fhsa",
    name: "First Home Savings Account (FHSA)",
    category: "Housing",
    jurisdiction: "federal",
    impact: "Up to $8,000/year tax-deductible + tax-free growth",
    what: "A registered account combining the best of TFSA (tax-free withdrawals) and RRSP (tax-deductible contributions) — designed exclusively for first-time home buyers.",
    eligibility: "Canadian resident, 18–71 years old, first-time home buyer (no home owned in current year or preceding 4 years).",
    keyNumbers: "$8,000/year contribution limit · $40,000 lifetime maximum · Contributions reduce taxable income · Qualifying withdrawals 100% tax-free · Unused room carries forward 1 year",
    link: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/first-home-savings-account.html",
    tags: ["buy-home", "housing", "tax-savings"],
  },
  {
    id: "rrsp-hbp",
    name: "RRSP Home Buyers' Plan (HBP)",
    category: "Housing",
    jurisdiction: "federal",
    impact: "Withdraw up to $35,000/person tax-free",
    what: "Allows first-time buyers to temporarily withdraw from their RRSP for a home purchase without immediate tax consequences, then repay over 15 years.",
    eligibility: "First-time buyer, RRSP funds held for at least 90 days, written purchase agreement required, repayments begin 2 years after withdrawal.",
    keyNumbers: "$35,000 per person · $70,000 per couple · Repay over 15 years starting year 2 · Unrepaid amounts added to income",
    link: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/what-home-buyers-plan.html",
    tags: ["buy-home", "housing"],
  },
  {
    id: "fthbtc",
    name: "First-Time Home Buyers' Tax Credit",
    category: "Housing",
    jurisdiction: "federal",
    impact: "$1,500 federal tax credit",
    what: "A non-refundable tax credit of $1,500 applied the year you buy your first qualifying home in Canada.",
    eligibility: "Neither you nor your spouse owned a qualifying home in the current year or preceding 4 years. Home must be your principal place of residence within 1 year.",
    keyNumbers: "$10,000 × 15% = $1,500 credit · Claimed on T1 return · Can be split with spouse · Applies to resale and new homes",
    link: "https://www.canada.ca/en/revenue-agency/programs/about-canada-revenue-agency-cra/federal-government-budgets/budget-2022-a-plan-to-grow-our-economy-and-make-life-more-affordable/first-home-buyers-tax-credit.html",
    tags: ["buy-home", "housing", "tax-savings"],
  },
  {
    id: "on-ltt",
    name: "Ontario Land Transfer Tax Rebate",
    category: "Housing",
    jurisdiction: "provincial",
    province: "ON",
    impact: "Up to $4,000 rebate",
    what: "Ontario refunds land transfer tax paid by eligible first-time buyers, reducing one of the largest closing costs when purchasing a home.",
    eligibility: "Ontario resident, first-time buyer (never owned a home anywhere in the world), Canadian citizen or permanent resident, must be 18+.",
    keyNumbers: "Full rebate on first $368,000 of purchase price · Max $4,000 · Rebate reduces to $0 on homes over ~$600,000 · Toronto buyers eligible for additional $4,475 city rebate",
    link: "https://www.ontario.ca/laws/statute/90l06",
    tags: ["buy-home", "housing"],
  },
  {
    id: "tfsa",
    name: "Tax-Free Savings Account (TFSA)",
    category: "Tax Savings",
    jurisdiction: "federal",
    impact: "Tax-free investment growth — any goal",
    what: "A flexible registered account where investment returns (interest, dividends, capital gains) are permanently sheltered from tax. Ideal for emergency fund, mid-term goals, and supplemental retirement saving.",
    eligibility: "Canadian resident, 18+ years old, valid SIN. No income requirement.",
    keyNumbers: "$7,000 annual limit (2025) · Unused room carries forward indefinitely · Withdrawals re-added to room next calendar year · Max cumulative room from 2009: $102,000",
    link: "https://www.canada.ca/en/revenue-agency/services/forms-publications/publications/rc4466/tax-free-savings-account-tfsa-guide-individuals.html",
    tags: ["tax-savings", "investing", "emergency-fund"],
  },
  {
    id: "rrsp",
    name: "Registered Retirement Savings Plan (RRSP)",
    category: "Retirement",
    jurisdiction: "federal",
    impact: "Tax deduction now + deferred growth",
    what: "Contributions reduce taxable income in the year made; investments grow tax-sheltered until withdrawn in retirement, when your income (and tax rate) is typically lower.",
    eligibility: "Canadian resident with earned income, must be under 71 years old. Spousal RRSP option available for income-splitting.",
    keyNumbers: "18% of prior year earned income · $32,490 max (2025) · Unused room carries forward · Spousal RRSP: contribute to partner's RRSP for retirement income-splitting",
    link: "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/contributing-a-rrsp-prpp.html",
    tags: ["retirement", "tax-savings"],
  },
  {
    id: "on-trillium",
    name: "Ontario Trillium Benefit",
    category: "Tax Savings",
    jurisdiction: "provincial",
    province: "ON",
    impact: "Up to $1,700+/year in combined credits",
    what: "Combines the Ontario Energy and Property Tax Credit (OEPTC) and Ontario Sales Tax Credit (OSTC) into a single monthly payment based on your prior year tax return.",
    eligibility: "Ontario resident filing taxes, income-tested. Renters and homeowners both eligible for OEPTC based on rent/property tax paid.",
    keyNumbers: "OEPTC up to $1,312/year · OSTC up to $346/year · Paid monthly if > $360 · Filed automatically when you file your taxes",
    link: "https://www.ontario.ca/page/ontario-trillium-benefit",
    tags: ["provincial", "tax-savings"],
  },
  {
    id: "cwb",
    name: "Canada Workers Benefit (CWB)",
    category: "Employment",
    jurisdiction: "federal",
    impact: "Up to $1,518 refundable tax credit",
    what: "A refundable tax credit for low- to moderate-income working Canadians, designed to supplement earnings and encourage participation in the workforce.",
    eligibility: "Must have employment or self-employment income, meet income thresholds (~$24,000–$36,000 for singles; higher for families), file a T1 return.",
    keyNumbers: "Up to $1,518 for singles · Up to $2,461 for families · Advance payments available quarterly · Disability supplement available",
    link: "https://www.canada.ca/en/revenue-agency/services/child-family-benefits/canada-workers-benefit.html",
    tags: ["employment", "tax-savings"],
  },
];

// ─── Gap detection ─────────────────────────────────────────────────────────

interface GapItem {
  id: string;
  severity: "high" | "medium" | "low";
  icon: React.ElementType;
  title: string;
  impact: string;
  description: string;
  opportunity: string;
  actionLabel: string;
  actionRoute: string;
}

function computeGaps(plan: FinancialPlan, results: CalculatedResults): GapItem[] {
  const gaps: GapItem[] = [];
  const expectedReturn = plan.assumptions.expectedAnnualReturn;

  // 1. Missing FHSA — home is a goal but account not opened
  const hasHomeGoal = plan.goals.some((g) => g.goalType === "buy-home" && g.selected);
  if (hasHomeGoal && plan.assets.fhsaBalance === 0 && plan.assets.fhsaMonthlyContribution === 0) {
    gaps.push({
      id: "missing-fhsa",
      severity: "high",
      icon: Home,
      title: "FHSA not opened — missing tax savings",
      impact: "Up to $8,000/year tax deduction + tax-free growth being left on the table",
      description:
        "Your home purchase is your #1 goal, but your FHSA has $0 and no contributions are set up. First-time buyers can deposit up to $8,000/year into an FHSA — contributions are fully tax-deductible and qualifying withdrawals are 100% tax-free.",
      opportunity:
        `Opening and contributing $8,000 this year saves approximately $2,000–$2,400 in income taxes (at your marginal rate) and grows your down payment fund with no tax drag — better than any other account you have.`,
      actionLabel: "See FHSA guide",
      actionRoute: "/app/resources",
    });
  }

  // 2. Idle cash in chequing
  const idleAmount = plan.assets.chequing - 2000;
  if (idleAmount > 1500) {
    const annualOpportunityCost = Math.round(idleAmount * 0.04);
    gaps.push({
      id: "idle-cash",
      severity: "high",
      icon: Wallet,
      title: "Idle cash in chequing",
      impact: `$${idleAmount.toLocaleString()} earning near 0% — costing ~$${annualOpportunityCost}/year in lost returns`,
      description: `Your chequing holds ${fmt(plan.assets.chequing)}. A typical working buffer is $1,500–$2,000. The extra ${fmt(idleAmount)} sits at ~0.05% interest while inflation erodes its value and your FHSA sits empty.`,
      opportunity: `Moving ${fmt(Math.min(idleAmount, 8000))} directly to your FHSA counts as this year's contribution — an immediate tax deduction plus tax-free growth. Any remainder earns 4–5% in a HISA.`,
      actionLabel: "Review allocation",
      actionRoute: "/app/plan",
    });
  }

  // 3. High-interest debt beats expected investment return
  const highRateDebts = plan.liabilities.filter(
    (l) => l.interestRate > expectedReturn + 1.5
  );
  if (highRateDebts.length > 0) {
    const totalHighRate = highRateDebts.reduce((s, l) => s + l.outstandingBalance, 0);
    const avgRate =
      highRateDebts.reduce((s, l) => s + l.interestRate * l.outstandingBalance, 0) /
      totalHighRate;
    const annualDrag = Math.round(totalHighRate * (avgRate - expectedReturn) / 100);
    gaps.push({
      id: "high-rate-debt",
      severity: "high",
      icon: TrendingDown,
      title: "High-interest debt outpacing investment returns",
      impact: `Paying ${avgRate.toFixed(1)}% on debt vs earning ${expectedReturn}% — net drag of ~$${annualDrag}/year`,
      description: `Your ${highRateDebts.map((l) => l.lenderName || l.type).join(", ")} at ${avgRate.toFixed(1)}% costs ${fmt(Math.round(totalHighRate * avgRate / 100))} per year in interest. Your expected investment return is only ${expectedReturn}%. Every dollar invested instead of applied to this debt has a negative net yield.`,
      opportunity: `Paying off ${fmt(totalHighRate)} saves $${annualDrag}/year net — a guaranteed ${avgRate.toFixed(1)}% return, better than any market investment. Prioritize this over new investing.`,
      actionLabel: "Review debt strategy",
      actionRoute: "/app/plan",
    });
  }

  // 4. Emergency fund too low
  if (results.emergencyFundMonthsCovered < 3) {
    const gap = Math.max(0, results.targetEmergencyFund - plan.assets.emergencyFund);
    gaps.push({
      id: "emergency-fund",
      severity: "medium",
      icon: Shield,
      title: "Emergency fund below safe threshold",
      impact: `Only ${results.emergencyFundMonthsCovered.toFixed(1)} months covered — target is ${plan.assumptions.emergencyFundTargetMonths} months`,
      description: `Your emergency fund of ${fmt(plan.assets.emergencyFund)} covers less than ${Math.ceil(results.emergencyFundMonthsCovered)} month of expenses. A job loss, health issue, or unexpected expense could force you to use your high-interest line of credit or liquidate investments.`,
      opportunity: `Building to ${fmt(results.targetEmergencyFund)} closes a ${fmt(gap)} gap. At $500/month, you reach the target in ${Math.ceil(gap / 500)} months — all in a TFSA or HISA earning 4–5%.`,
      actionLabel: "Build emergency fund",
      actionRoute: "/app/plan",
    });
  }

  // 5. High dining / lifestyle drag
  const diningRatio =
    results.totalMonthlyIncome > 0
      ? plan.expenses.diningOut / results.totalMonthlyIncome
      : 0;
  if (diningRatio > 0.08) {
    const benchmark = Math.round(results.totalMonthlyIncome * 0.05);
    const excess = plan.expenses.diningOut - benchmark;
    const annualExcess = excess * 12;
    gaps.push({
      id: "dining-drag",
      severity: "low",
      icon: Utensils,
      title: "Dining above household benchmark",
      impact: `$${plan.expenses.diningOut}/month — ${Math.round(diningRatio * 100)}% of net income (benchmark: 4–5%)`,
      description: `Your dining budget of $${plan.expenses.diningOut}/month is $${excess}/month above the 4–5% net income benchmark (~$${benchmark}/month). Over a year that's $${annualExcess.toLocaleString()} in excess lifestyle spending.`,
      opportunity: `Redirecting $${excess}/month to your FHSA adds $${(excess * 12).toLocaleString()}/year toward your home goal, plus ~$${Math.round(excess * 12 * 0.28).toLocaleString()} in tax savings annually.`,
      actionLabel: "Adjust budget",
      actionRoute: "/app/plan",
    });
  }

  return gaps;
}

// ─── Picked resources ──────────────────────────────────────────────────────

function getPickedResources(plan: FinancialPlan): DashboardResource[] {
  const picked: DashboardResource[] = [];
  const goals = plan.goals.filter((g) => g.selected).map((g) => g.goalType);
  const hasHomeGoal = goals.includes("buy-home");
  const isOntario = plan.profile.province === "ON";

  if (hasHomeGoal && plan.assets.fhsaBalance === 0) {
    const r = CANADIAN_RESOURCES.find((r) => r.id === "fhsa");
    if (r) picked.push({
      ...r,
      whyRelevant: `Your FHSA is empty and home purchase is your #1 goal. Contributing up to $8,000 this year is the single highest-impact move — you get a tax deduction AND your down payment grows tax-free.`,
    });
  }

  if (hasHomeGoal && isOntario) {
    const r = CANADIAN_RESOURCES.find((r) => r.id === "on-ltt");
    if (r) picked.push({
      ...r,
      whyRelevant: `As an Ontario first-time buyer, you qualify for up to $4,000 back on land transfer tax. This applies automatically at closing — no separate application needed beyond your tax return.`,
    });
  }

  if (hasHomeGoal) {
    const r = CANADIAN_RESOURCES.find((r) => r.id === "fthbtc");
    if (r) picked.push({
      ...r,
      whyRelevant: `First-time buyers receive $1,500 in federal tax credits the year of purchase. If you're in Ontario, this stacks with the provincial LTT rebate for $5,500+ combined.`,
    });
  }

  if (hasHomeGoal && plan.assets.rrspBalance > 2000) {
    const r = CANADIAN_RESOURCES.find((r) => r.id === "rrsp-hbp");
    if (r) picked.push({
      ...r,
      whyRelevant: `You have ${fmt(plan.assets.rrspBalance)} in your RRSP. Under the Home Buyers' Plan, you can withdraw up to $35,000 each (${plan.spouse ? "$70,000 combined" : ""}) tax-free — then repay over 15 years.`,
    });
  }

  // Fallback: TFSA for anyone
  if (picked.length < 2) {
    const r = CANADIAN_RESOURCES.find((r) => r.id === "tfsa");
    if (r) picked.push({
      ...r,
      whyRelevant: `Your TFSA is ideal for your emergency fund and medium-term goals — returns are permanently sheltered from tax regardless of when you withdraw.`,
    });
  }

  return picked.slice(0, 4);
}

// ─── GapCard ──────────────────────────────────────────────────────────────

function GapCard({ gap }: { gap: GapItem }) {
  const navigate = useNavigate();
  const severityStyles = {
    high: {
      border: "border-red-500/25",
      bg: "bg-red-500/5",
      badge: "bg-red-500/20 text-red-400",
      badgeText: "High priority",
      iconBg: "bg-red-500/15 border-red-500/25",
      iconColor: "text-red-400",
    },
    medium: {
      border: "border-amber-500/25",
      bg: "bg-amber-500/5",
      badge: "bg-amber-500/20 text-amber-400",
      badgeText: "Medium priority",
      iconBg: "bg-amber-500/15 border-amber-500/25",
      iconColor: "text-amber-400",
    },
    low: {
      border: "border-blue-500/20",
      bg: "bg-blue-500/5",
      badge: "bg-blue-500/15 text-blue-400",
      badgeText: "Optimize",
      iconBg: "bg-blue-500/15 border-blue-500/20",
      iconColor: "text-blue-400",
    },
  };
  const s = severityStyles[gap.severity];
  const Icon = gap.icon;

  return (
    <div className={cn("rounded-xl border p-5 flex flex-col gap-3", s.bg, s.border)}>
      <div className="flex items-start gap-3">
        <div className={cn("h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5", s.iconBg)}>
          <Icon className={cn("h-4 w-4", s.iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-card-foreground leading-snug">{gap.title}</p>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", s.badge)}>
              {s.badgeText}
            </span>
          </div>
          <p className={cn("text-xs font-medium mt-1", s.iconColor)}>{gap.impact}</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">{gap.description}</p>

      <div className="rounded-lg bg-white/[0.04] border border-white/[0.08] px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Opportunity
        </p>
        <p className="text-xs text-card-foreground leading-relaxed">{gap.opportunity}</p>
      </div>

      <button
        onClick={() => navigate(gap.actionRoute)}
        className={cn("text-xs font-semibold flex items-center gap-1 w-fit mt-1", s.iconColor)}
      >
        {gap.actionLabel} <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── ExpandableResourceCard ─────────────────────────────────────────────────

function ExpandableResourceCard({ resource, picked }: { resource: DashboardResource; picked?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border transition-all",
        picked
          ? "border-blue-500/25 bg-blue-500/5"
          : "border-white/[0.08] bg-white/[0.03]"
      )}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white leading-snug">{resource.name}</p>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.07] text-white/50 border border-white/[0.08]">
              {resource.jurisdiction === "federal" ? "Federal" : resource.province || "Provincial"}
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.07] text-white/50 border border-white/[0.08]">
              {resource.category}
            </span>
          </div>
          <p className={cn("text-xs mt-0.5", picked ? "text-blue-400 font-medium" : "text-muted-foreground")}>
            {resource.impact}
          </p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 text-white/30 shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className="px-4 pb-4 space-y-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="pt-3 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                What it is
              </p>
              <p className="text-xs text-white/65 leading-relaxed">{resource.what}</p>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Eligibility
              </p>
              <p className="text-xs text-white/65 leading-relaxed">{resource.eligibility}</p>
            </div>

            <div className="bg-white/[0.04] border border-white/[0.07] rounded-lg p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Key numbers
              </p>
              <p className="text-xs text-white/65 leading-relaxed">{resource.keyNumbers}</p>
            </div>

            {resource.whyRelevant && (
              <div className="bg-blue-500/8 border border-blue-500/15 rounded-lg p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-1">
                  Why this fits your situation
                </p>
                <p className="text-xs text-white/65 leading-relaxed italic">{resource.whyRelevant}</p>
              </div>
            )}

            <a
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
            >
              View official source <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Your Situation ────────────────────────────────────────────────────

const CHART_COLORS = ["#3B82F6", "#60A5FA", "#93C5FD", "#1D4ED8", "#6366F1", "#8B5CF6"];

const SCORE_BREAKDOWN_LABELS: Record<string, string> = {
  cashFlow: "Cash Flow",
  emergencyFund: "Emergency Fund",
  savingsRate: "Contribution Rate",
  debtBurden: "Debt Burden",
  retirementReadiness: "Retirement",
};

function SituationTab({
  plan,
  results,
  setActiveModal,
}: {
  plan: ReturnType<typeof usePlanStore>["plan"];
  results: CalculatedResults;
  setActiveModal: (v: string | null) => void;
}) {
  const navigate = useNavigate();
  const scoreInfo = getScoreLabel(results.financialHealthScore);
  const monthlyContribs = calcMonthlyContributions(plan.assets);

  const expenseBreakdown = [
    { label: "Fixed", value: plan.expenses.rentOrMortgage + plan.expenses.utilities + plan.expenses.homeInsurance + plan.expenses.cellPhone, color: "#3B82F6" },
    { label: "Lifestyle", value: plan.expenses.groceries + plan.expenses.diningOut + plan.expenses.fuelTransit + plan.expenses.entertainment + plan.expenses.gymMemberships + plan.expenses.clothing + plan.expenses.personalCare + plan.expenses.childCare, color: "#8B5CF6" },
    { label: "Debt payments", value: plan.expenses.studentLoanPayment + plan.expenses.lineOfCreditPayment + plan.expenses.creditCardPayment + plan.expenses.personalLoanPayment, color: "#EF4444" },
    { label: "Other", value: plan.expenses.internet + plan.expenses.streamingCable + plan.expenses.miscellaneous + plan.expenses.giftsCharity + plan.expenses.familySupport + plan.expenses.propertyTax + plan.expenses.carPayment + plan.expenses.autoInsurance, color: "#6B7280" },
  ].filter((e) => e.value > 0);

  return (
    <div className="space-y-6">
      {/* ── Summary metric row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button onClick={() => setActiveModal("income")} className="text-left w-full">
          <SummaryCard
            label="Monthly Income"
            value={fmtFull(results.totalMonthlyIncome)}
            change={`${results.savingsRate > 0 ? results.savingsRate : 0}% invested monthly`}
            changeType={results.savingsRate >= 10 ? "positive" : "neutral"}
            icon={DollarSign}
          />
        </button>
        <button onClick={() => setActiveModal("expenses")} className="text-left w-full">
          <SummaryCard
            label="Monthly Expenses"
            value={fmtFull(results.totalMonthlyExpenses)}
            change={
              results.monthlySurplus >= 0
                ? `${fmtFull(results.monthlySurplus)} surplus`
                : `${fmtFull(Math.abs(results.monthlySurplus))} over budget`
            }
            changeType={results.monthlySurplus >= 0 ? "positive" : "negative"}
            icon={CreditCard}
          />
        </button>
        <button onClick={() => setActiveModal("networth")} className="text-left w-full">
          <SummaryCard
            label="Net Worth"
            value={fmt(results.netWorth)}
            change={`${fmtFull(results.totalAssets)} in assets`}
            changeType={results.netWorth >= 0 ? "positive" : "negative"}
            icon={PiggyBank}
          />
        </button>
        <button onClick={() => setActiveModal("debt")} className="text-left w-full">
          <SummaryCard
            label="Total Debt"
            value={fmt(results.totalLiabilities)}
            change={
              results.totalLiabilities > 0
                ? `${results.weightedAverageDebtInterest.toFixed(1)}% avg rate`
                : "Debt-free"
            }
            changeType={results.totalLiabilities === 0 ? "positive" : "neutral"}
            icon={Landmark}
          />
        </button>
      </div>

      {/* ── Two-column detail layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Health score */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Financial Health</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke="#4A87FF" strokeWidth="3"
                  strokeDasharray={`${results.financialHealthScore * 0.974} ${100 * 0.974}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums text-card-foreground">
                {results.financialHealthScore}
              </span>
            </div>
            <div>
              <p className={cn("text-sm font-semibold", scoreInfo.color)}>{scoreInfo.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{scoreInfo.description}</p>
            </div>
          </div>
          <div className="space-y-2">
            {Object.entries(results.healthScoreBreakdown).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-28 shrink-0">
                  {SCORE_BREAKDOWN_LABELS[key]}
                </span>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-flow-interactive rounded-full"
                    style={{ width: `${(val / 20) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">
                  {val}/20
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses breakdown */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">Monthly Expenses</h3>
          <div className="flex justify-center mb-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={42} outerRadius={66}
                  paddingAngle={2} dataKey="value">
                  {expenseBreakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [fmt(val), ""]}
                  contentStyle={{ borderRadius: 8, background: "rgba(5,9,30,0.95)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.85)" }}
                  itemStyle={{ color: "rgba(255,255,255,0.85)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {expenseBreakdown.map((e) => (
              <div key={e.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: e.color }} />
                  <span className="text-xs text-muted-foreground">{e.label}</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-card-foreground">{fmt(e.value)}</span>
              </div>
            ))}
            {monthlyContribs > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0 bg-emerald-400" />
                  <span className="text-xs text-muted-foreground">Contributions</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-emerald-400">{fmt(monthlyContribs)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assets + debts summary */}
        <div className="space-y-3">
          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Assets</h4>
            <div className="space-y-1.5">
              {[
                { label: "Cash & liquid", value: plan.assets.chequing + plan.assets.savings + plan.assets.emergencyFund },
                { label: "TFSA", value: plan.assets.tfsaBalance },
                { label: "RRSP", value: plan.assets.rrspBalance },
                { label: "FHSA", value: plan.assets.fhsaBalance, warn: plan.assets.fhsaBalance === 0 },
                { label: "Non-registered", value: plan.assets.nonRegisteredInvestments },
              ].filter((a) => a.value > 0 || a.warn).map((a) => (
                <div key={a.label} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{a.label}</span>
                  <span className={cn("text-xs font-medium tabular-nums", a.warn && a.value === 0 ? "text-red-400" : "text-card-foreground")}>
                    {a.warn && a.value === 0 ? "Not opened" : fmt(a.value)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-border/50 pt-1.5">
                <span className="text-xs font-semibold text-foreground">Total</span>
                <span className="text-xs font-bold tabular-nums text-foreground">{fmt(results.totalAssets)}</span>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Debts</h4>
            <div className="space-y-1.5">
              {plan.liabilities.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground">{l.lenderName || l.type}</span>
                    <span className={cn("ml-1.5 text-[10px] font-medium", l.interestRate > 7 ? "text-amber-400" : "text-muted-foreground/60")}>
                      {l.interestRate}%
                    </span>
                  </div>
                  <span className="text-xs font-medium tabular-nums text-card-foreground">{fmt(l.outstandingBalance)}</span>
                </div>
              ))}
              {plan.liabilities.length === 0 && (
                <p className="text-xs text-muted-foreground">No debts recorded</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit plan CTA */}
      <div className="flex items-center justify-between glass rounded-xl px-5 py-4">
        <div>
          <p className="text-sm font-medium text-foreground">Update your financial plan</p>
          <p className="text-xs text-muted-foreground">
            Last updated:{" "}
            {new Date(plan.lastUpdated).toLocaleDateString("en-CA", { dateStyle: "medium" })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/app/plan")}>
          Edit Plan <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ─── Tab: Your Gaps ─────────────────────────────────────────────────────────

function GapsTab({
  plan,
  results,
}: {
  plan: ReturnType<typeof usePlanStore>["plan"];
  results: CalculatedResults;
}) {
  const gaps = useMemo(() => computeGaps(plan, results), [plan, results]);

  if (gaps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="h-12 w-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <p className="text-base font-semibold text-card-foreground">No major gaps detected</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Your plan looks well-structured. Continue building your emergency fund and making regular contributions.
        </p>
      </div>
    );
  }

  const highCount = gaps.filter((g) => g.severity === "high").length;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-card-foreground">
          {highCount > 0 ? `${highCount} high-priority gap${highCount > 1 ? "s" : ""} found` : "Opportunities to optimize"}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Auto-detected based on your current profile. Each issue has a specific cost and a recommended fix.
        </p>
      </div>

      {/* High severity first */}
      {gaps
        .sort((a, b) => {
          const order = { high: 0, medium: 1, low: 2 };
          return order[a.severity] - order[b.severity];
        })
        .map((gap) => (
          <GapCard key={gap.id} gap={gap} />
        ))}

      <p className="text-[11px] text-muted-foreground/60 text-center pb-2">
        Gaps are calculated from your entered data. Update your plan to refresh this analysis.
      </p>
    </div>
  );
}

// ─── Tab: Your Plan ─────────────────────────────────────────────────────────

function ReadinessIcon({ status }: { status: string }) {
  if (status === "on-track") return <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (status === "partially-on-track") return <Minus className="h-4 w-4 text-amber-500 shrink-0" />;
  if (status === "off-track") return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
  return <Minus className="h-4 w-4 text-muted-foreground shrink-0" />;
}

function PlanTab({
  plan,
  results,
}: {
  plan: ReturnType<typeof usePlanStore>["plan"];
  results: CalculatedResults;
}) {
  const navigate = useNavigate();

  const totalIncome = calcMonthlyIncome(plan.income);
  const totalExpenses = calcMonthlyExpenses(plan.expenses);
  const monthlyContribs = calcMonthlyContributions(plan.assets);
  const surplus = totalIncome - totalExpenses;
  const remainingCash = Math.max(0, surplus - monthlyContribs);

  const allocationBuckets = [
    { label: "Home / FHSA priority", pct: 0.4, color: "#3B82F6", barColor: "bg-blue-500" },
    { label: "Emergency fund", pct: 0.25, color: "#10B981", barColor: "bg-emerald-500" },
    { label: "Investing (RRSP / non-reg)", pct: 0.2, color: "#8B5CF6", barColor: "bg-violet-500" },
    { label: "Lifestyle buffer", pct: 0.15, color: "#F59E0B", barColor: "bg-amber-500" },
  ];

  const [realDollars, setRealDollars] = useState(false);
  const inflationRate = plan.assumptions.expectedInflationRate / 100;

  const chartData = useMemo(() => {
    return results.projectionSeries.map((p) => {
      const nominal = p.currentPath;
      const real = Math.round(nominal / Math.pow(1 + inflationRate, p.year));
      return {
        year: p.year,
        age: p.age,
        value: realDollars ? real : nominal,
      };
    });
  }, [results, realDollars, inflationRate]);

  // Pick 3–5 evenly spaced tick years for the X-axis based on total horizon
  const xAxisTicks = useMemo(() => {
    if (!chartData.length) return [0];
    const totalYears = chartData[chartData.length - 1].year;
    const count = totalYears <= 10 ? 3 : totalYears <= 20 ? 4 : 5;
    const ticks: number[] = [0];
    for (let i = 1; i < count - 1; i++) {
      ticks.push(Math.round((totalYears * i) / (count - 1)));
    }
    ticks.push(totalYears);
    return [...new Set(ticks)];
  }, [chartData]);

  const selectedGoals = plan.goals.filter((g) => g.selected);

  return (
    <div className="space-y-6">
      {/* ── Remaining cash allocation ── */}
      {remainingCash > 200 && (
        <div className="glass rounded-xl p-5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-card-foreground mb-0.5">Monthly allocation plan</h3>
              <p className="text-xs text-muted-foreground">After expenses &amp; current contributions</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold tabular-nums text-foreground">
                ~${remainingCash.toLocaleString("en-CA", { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[11px] text-muted-foreground">available / month</p>
            </div>
          </div>

          <div className="space-y-3">
            {allocationBuckets.map(({ label, pct, color, barColor }) => {
              const amt = Math.round(remainingCash * pct);
              return (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{Math.round(pct * 100)}%</span>
                      <span className="text-xs font-semibold tabular-nums text-card-foreground w-16 text-right">
                        ${amt.toLocaleString("en-CA", { maximumFractionDigits: 0 })}/mo
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Goals readiness ── */}
      {results.goalReadinessSummary.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-card-foreground">Goal Readiness</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.goalReadinessSummary.map((g) => {
              const goalData = selectedGoals.find((sg) => sg.id === g.goalId);
              return (
                <div key={g.goalId} className="glass rounded-xl p-4 flex items-start gap-3">
                  <ReadinessIcon status={g.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-card-foreground leading-snug">{g.label}</p>
                      {goalData?.monthlyAllocation && goalData.monthlyAllocation > 0 && (
                        <span className="text-[10px] text-blue-400 font-medium shrink-0">
                          ${goalData.monthlyAllocation}/mo
                        </span>
                      )}
                    </div>
                    {g.targetAmount && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Target: {fmt(g.targetAmount)}{g.targetYear ? ` by ${g.targetYear}` : ""}
                      </p>
                    )}
                    {g.status === "on-track" && g.projectedAtTarget && g.targetAmount && (
                      <p className="text-xs text-emerald-500 mt-0.5">
                        Projected: {fmt(g.projectedAtTarget)} — on track ✓
                      </p>
                    )}
                    {g.status === "partially-on-track" && g.projectedAtTarget && g.targetAmount && (
                      <p className="text-xs text-amber-500 mt-0.5">
                        Projected: {fmt(g.projectedAtTarget)} ({Math.round((g.projectedAtTarget / g.targetAmount) * 100)}% of target)
                      </p>
                    )}
                    {g.status === "off-track" && g.monthlyShortfall != null && g.monthlyShortfall > 0 && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Need ${g.monthlyShortfall.toLocaleString()}/mo more to stay on track
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Wealth trajectory ── */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Wealth Trajectory</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {results.retirementGap > 0
                ? `After-tax capital ${fmt(results.afterTaxProjectedRetirementCapital ?? results.projectedRetirementCapital)} vs ${fmt(results.requiredRetirementCapital)} needed — ${fmt(results.retirementGap)} gap`
                : "On track to meet retirement target"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Nominal / Real toggle */}
            <div className="flex items-center rounded-lg overflow-hidden border border-white/10 text-[11px] font-medium">
              <button
                onClick={() => setRealDollars(false)}
                className={`px-2.5 py-1 transition-colors ${!realDollars ? "bg-blue-500/20 text-blue-300" : "text-white/40 hover:text-white/60"}`}
              >
                Nominal $
              </button>
              <button
                onClick={() => setRealDollars(true)}
                className={`px-2.5 py-1 transition-colors ${realDollars ? "bg-blue-500/20 text-blue-300" : "text-white/40 hover:text-white/60"}`}
              >
                Today's $
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/scenarios/compare")}>
              Compare <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="year"
              type="number"
              domain={["dataMin", "dataMax"]}
              ticks={xAxisTicks}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "rgba(255,255,255,0.4)" }}
              tickFormatter={(yr: number) =>
                yr === 0 ? "Today" : `Age ${plan.profile.age + yr}`
              }
            />
            <YAxis hide />
            <Tooltip
              formatter={(val: number) => [fmt(val), realDollars ? "Net worth (today's $)" : "Net worth (nominal $)"]}
              labelFormatter={(yr: number) =>
                yr === 0
                  ? "Today (Age " + plan.profile.age + ")"
                  : `Year ${yr} · Age ${plan.profile.age + yr}`
              }
              contentStyle={{ borderRadius: 8, background: "rgba(5,9,30,0.95)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 12 }}
              labelStyle={{ color: "rgba(255,255,255,0.85)", marginBottom: 2 }}
              itemStyle={{ color: "rgba(255,255,255,0.85)" }}
            />
            <Line type="monotone" dataKey="value" stroke="#4A87FF" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#4A87FF" }} />
          </LineChart>
        </ResponsiveContainer>

        {/* Assumption disclosure */}
        <p className="text-[10px] text-white/30 mt-3 leading-relaxed">
          {realDollars
            ? `Showing today's dollar purchasing power, deflated at ${plan.assumptions.expectedInflationRate}%/yr inflation. `
            : "Showing nominal (future) dollars — not adjusted for inflation. "}
          Assumes contributions grow with income ({plan.assumptions.annualIncomeGrowthRate ?? 2}%/yr) and cash freed from paid-off debts is reinvested.
        </p>
      </div>

      {/* ── Retirement outlook ── */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Retirement Outlook</h3>
            <p className="text-[10px] text-white/30 mt-0.5">All figures in nominal (future) dollars</p>
          </div>
          <span className="text-[10px] text-white/40 font-medium bg-white/[0.05] px-2 py-0.5 rounded-full">
            {((results.safeWithdrawalRate ?? 0.04) * 100).toFixed(1)}% withdrawal rate · {results.retirementYears ?? 25}yr horizon
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "After-tax projected capital", value: fmt(results.afterTaxProjectedRetirementCapital ?? results.projectedRetirementCapital), color: results.retirementGap === 0 ? "text-emerald-400" : "text-foreground", hint: "After estimated RRSP/pension withdrawal taxes" },
            { label: "Required capital", value: fmt(results.requiredRetirementCapital), color: "text-foreground", hint: null },
            { label: "Gap", value: results.retirementGap > 0 ? `-${fmt(results.retirementGap)}` : "None", color: results.retirementGap > 0 ? "text-red-400" : "text-emerald-400", hint: null },
            { label: "Stressed scenario (–2% return)", value: fmt(results.stressedRetirementCapital ?? 0), color: "text-amber-400", hint: "Capital if markets underperform by 2%/yr" },
            { label: "Years to retirement", value: `${results.yearsToRetirement} years`, color: "text-foreground", hint: null },
            { label: "Est. marginal rate in retirement", value: `${Math.round((results.estimatedMarginalRateAtRetirement ?? 0) * 100)}%`, color: "text-foreground", hint: "Used to discount RRSP/pension withdrawals" },
          ].map(({ label, value, color, hint }) => (
            <div key={label}>
              <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
              <p className={cn("text-sm font-semibold tabular-nums", color)}>{value}</p>
              {hint && <p className="text-[10px] text-white/30 mt-0.5">{hint}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Protection flags ── */}
      {results.protectionFlags.length > 0 && (
        <div className="space-y-2">
          {results.protectionFlags.map((flag, i) => (
            <div key={i} className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3">
              <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
              <p className="text-sm text-amber-300">{flag}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Resources ─────────────────────────────────────────────────────────

function DashboardResourcesTab({ plan }: { plan: ReturnType<typeof usePlanStore>["plan"] }) {
  const pickedResources = useMemo(() => getPickedResources(plan), [plan]);
  const federalResources = CANADIAN_RESOURCES.filter((r) => r.jurisdiction === "federal");
  const provincialResources = CANADIAN_RESOURCES.filter(
    (r) => r.jurisdiction === "provincial" && (!r.province || r.province === plan.profile.province)
  );

  return (
    <div className="space-y-8">
      {/* ── Picked for You ── */}
      {pickedResources.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-card-foreground">Picked for You</h3>
              <p className="text-xs text-muted-foreground">
                Personalized based on your goals, province, and current portfolio gaps
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {pickedResources.map((r) => (
              <ExpandableResourceCard key={r.id} resource={r} picked />
            ))}
          </div>
        </div>
      )}

      {/* ── Federal Programs ── */}
      <div className="space-y-3">
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0.75rem" }}>
          <h3 className="text-sm font-semibold text-card-foreground">Federal Programs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Available to all Canadians regardless of province</p>
        </div>
        <div className="space-y-2">
          {federalResources.map((r) => (
            <ExpandableResourceCard key={r.id} resource={r} />
          ))}
        </div>
      </div>

      {/* ── Provincial Programs ── */}
      {provincialResources.length > 0 && (
        <div className="space-y-3">
          <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0.75rem" }}>
            <h3 className="text-sm font-semibold text-card-foreground">
              {plan.profile.province === "ON" ? "Ontario" : plan.profile.province} Programs
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Province-specific benefits and rebates</p>
          </div>
          <div className="space-y-2">
            {provincialResources.map((r) => (
              <ExpandableResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-white/25 text-center pb-2">
        Program details are for informational purposes only. Confirm eligibility and apply through official government sources.
      </p>
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────

function NoPlanBanner() {
  const navigate = useNavigate();
  return (
    <div className="glass rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Start your financial plan</h2>
        <p className="text-sm text-muted-foreground max-w-lg">
          Flow needs a few details to generate your personalized financial health score, retirement outlook, and recommendations. About 8 minutes.
        </p>
      </div>
      <Button onClick={() => navigate("/app/plan")} className="shrink-0">
        <ClipboardList className="h-4 w-4 mr-1.5" />
        Build My Plan
      </Button>
    </div>
  );
}

// ─── MetricModal ────────────────────────────────────────────────────────────

function MetricModal({
  title,
  onClose,
  toggle,
  onToggleChange,
  items,
  chart,
  explanation,
}: {
  title: string;
  onClose: () => void;
  toggle?: boolean;
  onToggleChange?: (v: "monthly" | "yearly") => void;
  items: { label: string; value: string }[];
  chart?: { name: string; value: number }[];
  explanation: string;
}) {
  const [activeToggle, setActiveToggle] = useState<"monthly" | "yearly">("monthly");
  const handleToggle = (v: "monthly" | "yearly") => {
    setActiveToggle(v);
    onToggleChange?.(v);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "rgba(8,12,40,0.96)", backdropFilter: "blur(48px)", border: "1px solid rgba(255,255,255,0.12)", boxShadow: "0 32px 80px rgba(0,0,0,0.7)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <div className="flex items-center gap-3">
            {toggle && (
              <div className="flex items-center rounded-full border border-white/10 overflow-hidden text-xs">
                {(["monthly", "yearly"] as const).map((v) => (
                  <button key={v} onClick={() => handleToggle(v)}
                    className={cn("px-3 py-1.5 font-medium transition-all capitalize",
                      activeToggle === v ? "bg-blue-600 text-white" : "text-white/50 hover:text-white")}>
                    {v}
                  </button>
                ))}
              </div>
            )}
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {chart && chart.length > 0 && chart.some((c) => c.value > 0) && (
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chart.filter((c) => c.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                    {chart.filter((c) => c.value > 0).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [fmt(val), ""]}
                    contentStyle={{ borderRadius: 8, background: "rgba(5,9,30,0.95)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", fontSize: 12 }}
                    labelStyle={{ color: "rgba(255,255,255,0.85)" }}
                    itemStyle={{ color: "rgba(255,255,255,0.85)" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-xs text-white/65">{item.label}</span>
                </div>
                <span className="text-xs font-semibold text-white tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 leading-relaxed">{explanation}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────

type TabId = "situation" | "gaps" | "plan" | "resources";

const TABS: { id: TabId; label: string }[] = [
  { id: "situation", label: "Your Situation" },
  { id: "gaps", label: "Your Gaps" },
  { id: "plan", label: "Your Plan" },
  { id: "resources", label: "Resources" },
];

export default function Dashboard() {
  const { plan } = usePlanStore();
  const { results, profile } = plan;

  const [activeTab, setActiveTab] = useState<TabId>("situation");
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalToggle, setModalToggle] = useState<"monthly" | "yearly">("monthly");

  const gapCount = useMemo(
    () => (results ? computeGaps(plan, results).filter((g) => g.severity === "high").length : 0),
    [plan, results]
  );

  if (!plan.planCompleted || !results) {
    return (
      <div>
        <PageHeader
          title={profile.fullName ? `Welcome back, ${profile.fullName.split(" ")[0]}` : "Dashboard"}
          subtitle="Your financial position at a glance"
        />
        <NoPlanBanner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={profile.fullName ? `Hi, ${profile.fullName.split(" ")[0]}` : "Dashboard"}
        subtitle="Your financial overview"
      />

      {/* ── Tab bar ── */}
      <div
        className="flex items-center gap-0.5 p-1 rounded-xl mb-6"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-white/[0.09] text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            )}
          >
            {tab.label}
            {tab.id === "gaps" && gapCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold shrink-0">
                {gapCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "situation" && (
        <SituationTab plan={plan} results={results} setActiveModal={setActiveModal} />
      )}
      {activeTab === "gaps" && (
        <GapsTab plan={plan} results={results} />
      )}
      {activeTab === "plan" && (
        <PlanTab plan={plan} results={results} />
      )}
      {activeTab === "resources" && (
        <DashboardResourcesTab plan={plan} />
      )}

      {/* ── Metric modals ── */}
      {activeModal === "income" && (
        <MetricModal
          title="Monthly Income"
          onClose={() => setActiveModal(null)}
          toggle
          onToggleChange={setModalToggle}
          items={[
            { label: "Employment", value: fmt(plan.income.employmentIncome * (modalToggle === "yearly" ? 12 : 1)) },
            { label: "Side / freelance", value: fmt(plan.income.sideIncome * (modalToggle === "yearly" ? 12 : 1)) },
            { label: "Government benefits", value: fmt(plan.income.governmentBenefits * (modalToggle === "yearly" ? 12 : 1)) },
            { label: "Other", value: fmt(plan.income.otherIncome * (modalToggle === "yearly" ? 12 : 1)) },
          ].filter((i) => { const n = parseFloat(i.value.replace(/[^0-9.-]/g, "")); return !isNaN(n) && n > 0; })}
          chart={[
            { name: "Employment", value: plan.income.employmentIncome },
            { name: "Side", value: plan.income.sideIncome },
            { name: "Benefits", value: plan.income.governmentBenefits },
            { name: "Other", value: plan.income.otherIncome },
          ]}
          explanation="Combined household net take-home from all sources. Toggle to see annualized values."
        />
      )}
      {activeModal === "expenses" && (
        <MetricModal
          title="Monthly Expenses"
          onClose={() => setActiveModal(null)}
          toggle
          onToggleChange={setModalToggle}
          items={[
            { label: "Fixed (rent, utilities, phone)", value: fmt((plan.expenses.rentOrMortgage + plan.expenses.homeInsurance + plan.expenses.utilities + plan.expenses.cellPhone) * (modalToggle === "yearly" ? 12 : 1)) },
            { label: "Lifestyle (groceries, dining, transport)", value: fmt((plan.expenses.groceries + plan.expenses.diningOut + plan.expenses.fuelTransit + plan.expenses.entertainment) * (modalToggle === "yearly" ? 12 : 1)) },
            { label: "Debt payments", value: fmt((plan.expenses.studentLoanPayment + plan.expenses.lineOfCreditPayment + plan.expenses.creditCardPayment) * (modalToggle === "yearly" ? 12 : 1)) },
            { label: "Other", value: fmt((plan.expenses.internet + plan.expenses.streamingCable + plan.expenses.miscellaneous + plan.expenses.gymMemberships) * (modalToggle === "yearly" ? 12 : 1)) },
          ]}
          chart={[
            { name: "Fixed", value: plan.expenses.rentOrMortgage + plan.expenses.utilities + plan.expenses.homeInsurance },
            { name: "Lifestyle", value: plan.expenses.groceries + plan.expenses.diningOut + plan.expenses.entertainment },
            { name: "Debt", value: plan.expenses.studentLoanPayment + plan.expenses.lineOfCreditPayment },
            { name: "Other", value: plan.expenses.miscellaneous + plan.expenses.internet },
          ]}
          explanation="Total monthly spending across all categories. Toggle to see annualized totals."
        />
      )}
      {activeModal === "networth" && (
        <MetricModal
          title="Net Worth"
          onClose={() => setActiveModal(null)}
          items={[
            { label: "Total assets", value: fmt(results.totalAssets) },
            { label: "Total liabilities", value: fmt(results.totalLiabilities) },
            { label: "Net worth", value: fmt(results.netWorth) },
          ]}
          chart={[
            { name: "Assets", value: results.totalAssets },
            { name: "Liabilities", value: results.totalLiabilities },
          ]}
          explanation="Net worth = what you own minus what you owe."
        />
      )}
      {activeModal === "debt" && (
        <MetricModal
          title="Total Debt"
          onClose={() => setActiveModal(null)}
          items={[
            ...plan.liabilities.map((l) => ({
              label: `${l.lenderName || l.type} (${l.interestRate}%)`,
              value: fmt(l.outstandingBalance),
            })),
            ...(plan.liabilities.length === 0 ? [{ label: "No debts recorded", value: "—" }] : []),
          ]}
          chart={plan.liabilities.map((l) => ({ name: l.lenderName || l.type, value: l.outstandingBalance }))}
          explanation="Your current outstanding obligations. Weighted average interest rate reflects your true borrowing cost."
        />
      )}
    </div>
  );
}
