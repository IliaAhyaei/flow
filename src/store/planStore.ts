import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FinancialPlan,
  UserProfile,
  SpouseProfile,
  Goal,
  IncomeBreakdown,
  ExpensesBreakdown,
  AssetsBreakdown,
  Liability,
  PlanningAssumptions,
  GoalType,
} from "@/types/financial";
import {
  DEFAULT_PROFILE,
  DEFAULT_SPOUSE,
  DEFAULT_INCOME,
  DEFAULT_EXPENSES,
  DEFAULT_ASSETS,
  DEFAULT_ASSUMPTIONS,
  GOAL_DEFINITIONS,
} from "@/types/financial";

function uid(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
import { calcFullResults } from "@/lib/calculations";

// ─── Helper ────────────────────────────────────────────────────────────────

function createDefaultPlan(): FinancialPlan {
  return {
    id: uid(),
    profile: { ...DEFAULT_PROFILE },
    spouse: null,
    goals: GOAL_DEFINITIONS.map((g) => ({
      id: uid(),
      goalType: g.type,
      label: g.label,
      selected: false,
      targetAmount: null,
      targetYear: null,
      monthlyAllocation: null,
      importanceLevel: "medium" as const,
      topPriorityRank: null,
    })),
    income: { ...DEFAULT_INCOME },
    expenses: { ...DEFAULT_EXPENSES },
    assets: { ...DEFAULT_ASSETS },
    liabilities: [],
    assumptions: { ...DEFAULT_ASSUMPTIONS },
    results: null,
    lastUpdated: new Date().toISOString(),
    plannerStep: 0,
    planCompleted: false,
  };
}

// ─── Store Types ───────────────────────────────────────────────────────────

interface PlanStore {
  plan: FinancialPlan;
  currentStep: number;

  // Section updaters
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSpouse: (updates: Partial<SpouseProfile> | null) => void;
  updateGoal: (goalId: string, updates: Partial<Goal>) => void;
  setGoalSelected: (goalType: GoalType, selected: boolean) => void;
  setGoalPriority: (goalId: string, rank: 1 | 2 | 3 | null) => void;
  updateIncome: (updates: Partial<IncomeBreakdown>) => void;
  updateExpenses: (updates: Partial<ExpensesBreakdown>) => void;
  updateAssets: (updates: Partial<AssetsBreakdown>) => void;
  addLiability: (liability: Liability) => void;
  updateLiability: (id: string, updates: Partial<Liability>) => void;
  removeLiability: (id: string) => void;
  setLiabilities: (liabilities: Liability[]) => void;
  updateAssumptions: (updates: Partial<PlanningAssumptions>) => void;

  // Step navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Calculations
  recalculate: () => void;
  completePlan: () => void;
  resetPlan: () => void;
}

// ─── Store ─────────────────────────────────────────────────────────────────

export const usePlanStore = create<PlanStore>()(
  persist(
    (set, get) => ({
      plan: createDefaultPlan(),
      currentStep: 0,

      updateProfile: (updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            profile: { ...state.plan.profile, ...updates },
            lastUpdated: new Date().toISOString(),
          },
        }));
        // Recalculate if plan is completed
        if (get().plan.planCompleted) get().recalculate();
      },

      updateSpouse: (updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            spouse:
              updates === null
                ? null
                : { ...(state.plan.spouse ?? DEFAULT_SPOUSE), ...updates },
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      updateGoal: (goalId, updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            goals: state.plan.goals.map((g) =>
              g.id === goalId ? { ...g, ...updates } : g
            ),
            lastUpdated: new Date().toISOString(),
          },
        }));
        // Bug fix #2: trigger recalculation when goal data changes
        if (get().plan.planCompleted) get().recalculate();
      },

      setGoalSelected: (goalType, selected) => {
        set((state) => ({
          plan: {
            ...state.plan,
            goals: state.plan.goals.map((g) =>
              g.goalType === goalType ? { ...g, selected } : g
            ),
            lastUpdated: new Date().toISOString(),
          },
        }));
        // Bug fix #2: trigger recalculation when goal selection changes
        if (get().plan.planCompleted) get().recalculate();
      },

      setGoalPriority: (goalId, rank) => {
        set((state) => {
          // Clear the old holder of this rank first
          const goals = state.plan.goals.map((g) => {
            if (g.topPriorityRank === rank && g.id !== goalId)
              return { ...g, topPriorityRank: null as null };
            if (g.id === goalId) return { ...g, topPriorityRank: rank };
            return g;
          });
          return {
            plan: {
              ...state.plan,
              goals,
              lastUpdated: new Date().toISOString(),
            },
          };
        });
        // Bug fix #2: trigger recalculation when priorities change (affects goal allocation weights)
        if (get().plan.planCompleted) get().recalculate();
      },

      updateIncome: (updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            income: { ...state.plan.income, ...updates },
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      updateExpenses: (updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            expenses: { ...state.plan.expenses, ...updates },
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      updateAssets: (updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            assets: { ...state.plan.assets, ...updates },
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      addLiability: (liability) => {
        set((state) => ({
          plan: {
            ...state.plan,
            liabilities: [...state.plan.liabilities, liability],
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      updateLiability: (id, updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            liabilities: state.plan.liabilities.map((l) =>
              l.id === id ? { ...l, ...updates } : l
            ),
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      removeLiability: (id) => {
        set((state) => ({
          plan: {
            ...state.plan,
            liabilities: state.plan.liabilities.filter((l) => l.id !== id),
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      setLiabilities: (liabilities) => {
        set((state) => ({
          plan: {
            ...state.plan,
            liabilities,
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      updateAssumptions: (updates) => {
        set((state) => ({
          plan: {
            ...state.plan,
            assumptions: { ...state.plan.assumptions, ...updates },
            lastUpdated: new Date().toISOString(),
          },
        }));
        if (get().plan.planCompleted) get().recalculate();
      },

      setStep: (step) => {
        set((state) => ({
          currentStep: step,
          plan: {
            ...state.plan,
            plannerStep: step,
          },
        }));
      },

      nextStep: () => {
        set((state) => ({
          currentStep: state.currentStep + 1,
          plan: {
            ...state.plan,
            plannerStep: state.currentStep + 1,
          },
        }));
      },

      prevStep: () => {
        set((state) => ({
          currentStep: Math.max(0, state.currentStep - 1),
          plan: {
            ...state.plan,
            plannerStep: Math.max(0, state.currentStep - 1),
          },
        }));
      },

      recalculate: () => {
        const plan = get().plan;
        const results = calcFullResults(plan);
        set((state) => ({
          plan: {
            ...state.plan,
            results,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      completePlan: () => {
        const plan = get().plan;
        const results = calcFullResults(plan);
        set((state) => ({
          plan: {
            ...state.plan,
            results,
            planCompleted: true,
            lastUpdated: new Date().toISOString(),
          },
        }));
      },

      resetPlan: () => {
        set({ plan: createDefaultPlan(), currentStep: 0 });
      },
    }),
    {
      name: "flow-financial-plan",
      version: 1,
    }
  )
);

// ─── Selectors ─────────────────────────────────────────────────────────────

export const selectResults = (state: { plan: FinancialPlan }) =>
  state.plan.results;
export const selectProfile = (state: { plan: FinancialPlan }) =>
  state.plan.profile;
export const selectGoals = (state: { plan: FinancialPlan }) =>
  state.plan.goals;
export const selectPlanCompleted = (state: { plan: FinancialPlan }) =>
  state.plan.planCompleted;
