import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS = [
  { label: "Profile" },
  { label: "Goals" },
  { label: "Income" },
  { label: "Assets" },
  { label: "Debts" },
  { label: "Strategy" },
  { label: "Results" },
];

interface PlannerProgressProps {
  currentStep: number; // 1–7
}

export default function PlannerProgress({ currentStep }: PlannerProgressProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress bar background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-white/10" />
        {/* Filled progress bar */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500"
          style={{
            width: `${Math.max(0, ((currentStep - 1) / (STEPS.length - 1)) * 100)}%`,
          }}
        />
        {STEPS.map((step, idx) => {
          const stepNum = idx + 1;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;
          return (
            <div
              key={step.label}
              className="relative flex flex-col items-center gap-1 z-10"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-white/5 border-white/15 text-white/40"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium hidden sm:block",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
