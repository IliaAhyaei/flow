import { Router, Request, Response } from "express";
import { RESOURCES, matchResourcesForUser } from "../data/resources.js";

const router = Router();

// ─── POST /api/resources/search ───────────────────────────────────────────

router.post("/search", (req: Request, res: Response) => {
  // Frontend sends: { query, category, province, goals (string[]), hasChildren, ageGroup, lowIncome }
  const {
    query,
    category,
    province,
    goals,
    hasChildren,
    ageGroup: rawAgeGroup,
    lowIncome,
  } = req.body;

  // goals is a plain string[] of goalType keys
  const selectedGoalTypes: string[] = Array.isArray(goals) ? goals : [];

  const userProvince: string = province ?? "ON";

  // Map frontend age-group keys to internal keys
  const ageGroupMap: Record<string, "young" | "mid" | "senior"> = {
    under30: "young",
    "30to44": "young",
    "45to59": "mid",
    "60plus": "senior",
  };
  const ageGroup: "young" | "mid" | "senior" =
    ageGroupMap[rawAgeGroup] ?? "young";

  const matched = matchResourcesForUser(
    userProvince,
    selectedGoalTypes,
    hasChildren,
    ageGroup,
    lowIncome,
    query,
    category
  );

  // Build "why it applies" explanation for each result
  const goalsSet = new Set(selectedGoalTypes);
  const enriched = matched.map((r) => {
    const whyLines: string[] = [];

    if (r.relevant_goals) {
      const overlap = r.relevant_goals.filter((g) => goalsSet.has(g));
      if (overlap.length > 0) {
        whyLines.push(`Matches your goals: ${overlap.join(", ").replace(/-/g, " ")}`);
      }
    }

    if (r.province === userProvince) {
      whyLines.push(`Available in your province (${userProvince})`);
    }

    if (hasChildren && (r.category === "family-children" || r.category === "education")) {
      whyLines.push("Relevant because you have children");
    }

    if (
      ageGroup === "young" &&
      (r.id === "tfsa" || r.id === "fhsa" || r.category === "newcomer")
    ) {
      whyLines.push("Particularly valuable early in your financial journey");
    }

    if (
      goalsSet.has("retire-enough") &&
      (r.id === "rrsp" || r.id === "tfsa" || r.category === "retirement")
    ) {
      whyLines.push("May help address your retirement goal");
    }

    if (
      goalsSet.has("pay-off-debts") &&
      r.relevant_goals?.includes("pay-off-debts")
    ) {
      whyLines.push("Relevant to your debt reduction goal");
    }

    return {
      ...r,
      why_it_applies:
        whyLines.length > 0
          ? whyLines.join(". ")
          : "Relevant based on your profile and goals.",
    };
  });

  res.json({
    resources: enriched,
    total: enriched.length,
    query: query ?? null,
    province: userProvince,
  });
});

// ─── GET /api/resources/categories ───────────────────────────────────────

router.get("/categories", (_req: Request, res: Response) => {
  const categories = [
    { value: "all", label: "All Resources" },
    { value: "tax-savings", label: "Tax & Savings" },
    { value: "housing", label: "Housing" },
    { value: "education", label: "Education" },
    { value: "family-children", label: "Family & Children" },
    { value: "retirement", label: "Retirement" },
    { value: "employment", label: "Employment" },
    { value: "transportation", label: "Transportation" },
    { value: "newcomer", label: "Newcomer" },
  ];
  res.json(categories);
});

export default router;
