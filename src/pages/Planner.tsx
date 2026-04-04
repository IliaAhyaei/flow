import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlanStore } from "@/store/planStore";
import StepProfile from "@/components/planner/StepProfile";
import StepGoals from "@/components/planner/StepGoals";
import StepIncome from "@/components/planner/StepIncome";
import StepAssets from "@/components/planner/StepAssets";
import StepLiabilities from "@/components/planner/StepLiabilities";
import StepAssumptions from "@/components/planner/StepAssumptions";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  LayoutDashboard,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcTotalAssets,
  calcTotalLiabilities,
} from "@/lib/calculations";
import {
  SAMPLE_PROFILE,
  SAMPLE_SPOUSE,
  SAMPLE_INCOME,
  SAMPLE_EXPENSES,
  SAMPLE_ASSETS,
  SAMPLE_LIABILITIES,
  SAMPLE_ASSUMPTIONS,
  SAMPLE_GOALS,
  SAMPLE_GOAL_DETAILS,
} from "@/lib/sampleData";

// ─── Accordion section ───────────────────────────────────────────────────────

function AccordionSection({
  number,
  title,
  subtitle,
  summary,
  isOpen,
  onToggle,
  isComplete,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  summary?: string | null;
  isOpen: boolean;
  onToggle: () => void;
  isComplete?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.035)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: isOpen
          ? "1px solid rgba(255,255,255,0.11)"
          : "1px solid rgba(255,255,255,0.065)",
        boxShadow: isOpen
          ? "0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 2px 8px rgba(0,0,0,0.18)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    >
      {/* Clickable header */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-3.5 text-left group transition-colors hover:bg-white/[0.015]"
        style={{
          borderBottom: isOpen ? "1px solid rgba(255,255,255,0.07)" : "none",
        }}
      >
        {/* Number / completion badge */}
        <div
          className={cn(
            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border transition-colors duration-200",
            isComplete
              ? "bg-emerald-500/15 border-emerald-500/25"
              : isOpen
              ? "bg-blue-500/15 border-blue-500/25"
              : "bg-white/[0.04] border-white/[0.08]"
          )}
        >
          {isComplete ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <span
              className={cn(
                "text-[11px] font-bold",
                isOpen ? "text-blue-400" : "text-white/25"
              )}
            >
              {number}
            </span>
          )}
        </div>

        {/* Title + summary */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold leading-tight transition-colors duration-200",
              isOpen ? "text-white" : isComplete ? "text-white/75" : "text-white/50"
            )}
          >
            {title}
          </p>
          {!isOpen && (
            <p className="text-xs mt-0.5 truncate">
              {summary ? (
                <span className="text-white/38">{summary}</span>
              ) : (
                <span className="text-white/20">{subtitle}</span>
              )}
            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen ? "rotate-180 text-white/35" : "text-white/18 group-hover:text-white/30"
          )}
        />
      </button>

      {/* Expanded content */}
      {isOpen && <div className="px-5 py-5">{children}</div>}
    </div>
  );
}

// ─── Planner page ────────────────────────────────────────────────────────────

export default function Planner() {
  const navigate = useNavigate();
  const {
    plan,
    completePlan,
    resetPlan,
    updateProfile,
    updateSpouse,
    updateIncome,
    updateExpenses,
    updateAssets,
    setLiabilities,
    updateAssumptions,
    setGoalSelected,
    updateGoal,
    setGoalPriority,
  } = usePlanStore();

  const [openSections, setOpenSections] = useState<Set<number>>(new Set([1]));
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (n: number) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  const openSection = (n: number) =>
    setOpenSections((prev) => new Set([...prev, n]));

  // ─── Section summaries ─────────────────────────────────────────────────────

  const profileSummary = (() => {
    const { fullName, age, province } = plan.profile;
    if (!fullName && !age) return null;
    return [fullName, age ? `age ${age}` : null, province]
      .filter(Boolean)
      .join(" · ");
  })();

  const goalsSummary = (() => {
    const n = plan.goals.filter((g) => g.selected).length;
    return n > 0 ? `${n} goal${n !== 1 ? "s" : ""} selected` : null;
  })();

  const incomeSummary = (() => {
    const inc = calcMonthlyIncome(plan.income);
    const exp = calcMonthlyExpenses(plan.expenses);
    if (inc === 0) return null;
    const surplus = inc - exp;
    const sign = surplus >= 0 ? "+" : "-";
    return `$${inc.toLocaleString("en-CA")}/mo · ${sign}$${Math.abs(surplus).toLocaleString("en-CA")} surplus`;
  })();

  const assetsSummary = (() => {
    const total = calcTotalAssets(plan.assets);
    return total > 0
      ? `$${total.toLocaleString("en-CA")} total assets`
      : null;
  })();

  const liabilitiesSummary = (() => {
    const count = plan.liabilities.length;
    if (count === 0) return "No debts added";
    const total = calcTotalLiabilities(plan.liabilities);
    return `${count} debt${count !== 1 ? "s" : ""} · $${total.toLocaleString("en-CA")} total`;
  })();

  const strategySummary = (() => {
    const { preferredStrategyMode, monthlyAmountUserCanComfortablySetAside } =
      plan.assumptions;
    if (!preferredStrategyMode) return null;
    const mode =
      preferredStrategyMode.charAt(0).toUpperCase() +
      preferredStrategyMode.slice(1);
    return monthlyAmountUserCanComfortablySetAside
      ? `${mode} · $${monthlyAmountUserCanComfortablySetAside.toLocaleString("en-CA")}/mo savings`
      : mode;
  })();

  // ─── Completion checks ─────────────────────────────────────────────────────

  const isProfileComplete = !!(
    plan.profile.fullName?.trim() &&
    plan.profile.age >= 18 &&
    plan.profile.annualGrossIncome > 0
  );
  const isGoalsComplete = plan.goals.some((g) => g.selected);
  const isIncomeComplete = calcMonthlyIncome(plan.income) > 0;
  const isAssetsComplete =
    plan.assets.chequing > 0 ||
    plan.assets.savings > 0 ||
    plan.assets.tfsaBalance > 0 ||
    plan.assets.rrspBalance > 0;
  const isLiabilitiesComplete = true; // no debt is valid
  const isStrategyComplete = !!plan.assumptions.preferredStrategyMode;

  // ─── Sample data ───────────────────────────────────────────────────────────

  const handleApplyAllSampleData = () => {
    updateProfile(SAMPLE_PROFILE);
    updateSpouse(SAMPLE_SPOUSE);
    updateIncome(SAMPLE_INCOME);
    updateExpenses(SAMPLE_EXPENSES);
    updateAssets(SAMPLE_ASSETS);
    setLiabilities([...SAMPLE_LIABILITIES]);
    updateAssumptions(SAMPLE_ASSUMPTIONS);

    plan.goals.forEach((g) => {
      const shouldSelect = (SAMPLE_GOALS as readonly string[]).includes(
        g.goalType
      );
      setGoalSelected(g.goalType, shouldSelect);
      const details = SAMPLE_GOAL_DETAILS[g.goalType];
      if (details && shouldSelect) updateGoal(g.id, details);
    });

    const sampleGoalObjs = plan.goals.filter((g) =>
      (SAMPLE_GOALS as readonly string[]).includes(g.goalType)
    );
    sampleGoalObjs
      .slice(0, 3)
      .forEach((g, i) => setGoalPriority(g.id, (i + 1) as 1 | 2 | 3));

    toast.success("Sample profile loaded — Ethan & Sofia", {
      description:
        "All sections have been populated with a consistent demo scenario.",
      duration: 3500,
    });
  };

  // ─── Generate ──────────────────────────────────────────────────────────────

  const handleGenerate = () => {
    if (!plan.profile.fullName?.trim()) {
      setSubmitError("Please enter your name in the About You section.");
      openSection(1);
      document
        .getElementById("section-1")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!plan.profile.age || plan.profile.age < 18) {
      setSubmitError("Please enter a valid age in the About You section.");
      openSection(1);
      document
        .getElementById("section-1")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (!plan.profile.annualGrossIncome || plan.profile.annualGrossIncome <= 0) {
      setSubmitError("Please enter your annual income in the About You section.");
      openSection(1);
      document
        .getElementById("section-1")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setSubmitError(null);
    setSubmitted(true);
    completePlan();
    setTimeout(() => navigate("/app"), 600);
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-transparent">
      {/* Sticky top bar */}
      <div
        className="sticky top-0 z-20 h-14 flex items-center justify-between px-5 sm:px-8"
        style={{
          background: "rgba(5,9,28,0.9)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2">
          <img src="/Flow Favicon.png" alt="Flow" className="h-6 w-6 object-contain" />
          <span className="text-sm font-semibold text-white">Flow</span>
          <span className="text-white/15 mx-1.5">·</span>
          <span className="text-sm text-white/40">My Plan</span>
        </div>
        <div className="flex items-center gap-1.5">
          {plan.planCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/app")}
              className="text-xs gap-1.5 text-white/55 hover:text-white"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (
                window.confirm(
                  "Reset all data? This will clear everything you've entered."
                )
              ) {
                resetPlan();
                window.scrollTo({ top: 0 });
              }
            }}
            className="text-xs gap-1.5 text-white/30 hover:text-white/60"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>
      </div>

      {/* Page content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Intro */}
        <div className="mb-7">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-2">
            Your financial snapshot
          </p>
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1.5">
            Build your financial plan
          </h1>
          <p className="text-sm text-white/40 leading-relaxed mb-5 max-w-md">
            Fill in what you know — estimates are fine. Tap any section to expand it.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyAllSampleData}
            className="gap-1.5 text-xs border-white/10 text-white/45 hover:bg-white/[0.06] hover:text-white/70 hover:border-white/20"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Fill with sample data — Ethan &amp; Sofia
          </Button>
        </div>

        {/* Sections */}
        <div className="space-y-2">
          <div id="section-1">
            <AccordionSection
              number="01"
              title="About You"
              subtitle="Personal profile and financial baseline"
              summary={profileSummary}
              isOpen={openSections.has(1)}
              onToggle={() => toggle(1)}
              isComplete={isProfileComplete}
            >
              <StepProfile />
            </AccordionSection>
          </div>

          <AccordionSection
            number="02"
            title="Goals & Priorities"
            subtitle="What matters most to you financially"
            summary={goalsSummary}
            isOpen={openSections.has(2)}
            onToggle={() => toggle(2)}
            isComplete={isGoalsComplete}
          >
            <StepGoals />
          </AccordionSection>

          <AccordionSection
            number="03"
            title="Income & Expenses"
            subtitle="Your monthly cash flow picture"
            summary={incomeSummary}
            isOpen={openSections.has(3)}
            onToggle={() => toggle(3)}
            isComplete={isIncomeComplete}
          >
            <StepIncome />
          </AccordionSection>

          <AccordionSection
            number="04"
            title="Assets"
            subtitle="What you own and what you're building"
            summary={assetsSummary}
            isOpen={openSections.has(4)}
            onToggle={() => toggle(4)}
            isComplete={isAssetsComplete}
          >
            <StepAssets />
          </AccordionSection>

          <AccordionSection
            number="05"
            title="Debts & Liabilities"
            subtitle="Your current obligations"
            summary={liabilitiesSummary}
            isOpen={openSections.has(5)}
            onToggle={() => toggle(5)}
            isComplete={isLiabilitiesComplete}
          >
            <StepLiabilities />
          </AccordionSection>

          <AccordionSection
            number="06"
            title="Planning Strategy"
            subtitle="How you want to approach your financial future"
            summary={strategySummary}
            isOpen={openSections.has(6)}
            onToggle={() => toggle(6)}
            isComplete={isStrategyComplete}
          >
            <StepAssumptions />
          </AccordionSection>
        </div>

        {/* Generate CTA */}
        <div
          className="rounded-2xl px-6 py-7 text-center mt-4"
          style={{
            background: "rgba(59,130,246,0.06)",
            border: "1px solid rgba(59,130,246,0.15)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {submitted ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-9 w-9 text-emerald-400" />
              <p className="text-sm font-semibold text-white">
                Plan generated — loading your dashboard…
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-white mb-1">
                Ready to see your financial picture?
              </p>
              <p className="text-xs text-white/40 mb-5 leading-relaxed">
                Flow will analyze everything you've entered and generate your
                personalized health score, recommendations, and resources.
              </p>
              {submitError && (
                <p className="text-xs text-red-400 mb-4">{submitError}</p>
              )}
              <Button
                size="lg"
                onClick={handleGenerate}
                className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 px-9 font-semibold rounded-xl"
                style={{ boxShadow: "0 0 20px rgba(59,130,246,0.35)" }}
              >
                Generate My Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <p className="text-center text-[11px] text-white/18 mt-4 pb-10">
          Stored locally in your browser — nothing is shared.
        </p>
      </div>
    </div>
  );
}
