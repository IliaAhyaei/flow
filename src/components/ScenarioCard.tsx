import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ScenarioCardProps {
  title: string;
  description: string;
  category: string;
  complexity: "Simple" | "Moderate" | "Advanced";
  id?: string;
}

const complexityColor = {
  Simple: "bg-emerald-500/15 text-emerald-400",
  Moderate: "bg-amber-500/15 text-amber-400",
  Advanced: "bg-red-500/15 text-red-400",
};

export default function ScenarioCard({ title, description, category, complexity }: ScenarioCardProps) {
  const navigate = useNavigate();

  return (
    <div className="glass rounded-xl p-5 flex flex-col flow-hover">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-medium uppercase tracking-wider text-flow-interactive">{category}</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${complexityColor[complexity]}`}>
          {complexity}
        </span>
      </div>
      <h3 className="text-base font-semibold text-card-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">{description}</p>
      <Button size="sm" onClick={() => navigate("/app/scenarios/compare")} className="w-full">
        Run Scenario
      </Button>
    </div>
  );
}
