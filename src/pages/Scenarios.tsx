import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import ScenarioCard from "@/components/ScenarioCard";
import CategoryChip from "@/components/CategoryChip";

const categories = ["All", "Personal", "Career", "Housing", "Investing", "Small Business"];

const scenarios = [
  { title: "Pay debt vs invest", description: "Compare accelerating debt payments against investing the difference in a diversified portfolio.", category: "Personal", complexity: "Simple" as const },
  { title: "Rent vs buy", description: "Model the total cost of homeownership against renting and investing the difference over time.", category: "Housing", complexity: "Moderate" as const },
  { title: "Salary vs equity offer", description: "Evaluate a higher-salary role against a lower-salary position with meaningful equity upside.", category: "Career", complexity: "Advanced" as const },
  { title: "Move to a lower-cost city", description: "Calculate the financial impact of relocating to a city with lower cost of living.", category: "Personal", complexity: "Moderate" as const },
  { title: "Mortgage prepayment vs investing", description: "Determine whether extra payments toward your mortgage or investing yields more net wealth.", category: "Housing", complexity: "Simple" as const },
  { title: "Build reserves vs deploy capital", description: "Decide between strengthening your cash reserves and deploying capital into growth opportunities.", category: "Investing", complexity: "Moderate" as const },
  { title: "Reinvest business profits vs preserve cash", description: "Model the tradeoff between reinvesting profits for growth and maintaining a cash cushion.", category: "Small Business", complexity: "Advanced" as const },
  { title: "Start a business vs remain employed", description: "Compare the financial trajectory of entrepreneurship against staying in your current role.", category: "Career", complexity: "Advanced" as const },
];

export default function Scenarios() {
  const [active, setActive] = useState("All");

  const filtered = active === "All" ? scenarios : scenarios.filter((s) => s.category === active);

  return (
    <div>
      <PageHeader title="Scenarios" subtitle="Compare important financial choices before you commit" />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map((c) => (
          <CategoryChip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <ScenarioCard key={s.title} {...s} />
        ))}
      </div>
    </div>
  );
}
