import { useState } from "react";
import { usePlanStore } from "@/store/planStore";
import { GOAL_DEFINITIONS } from "@/types/financial";
import type { GoalType, ImportanceLevel } from "@/types/financial";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";

function GoalCard({ goal, onSelect, onUpdate }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-150",
        goal.selected
          ? "border-blue-500/30 bg-blue-500/[0.06]"
          : "border-white/[0.07] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.04]"
      )}
    >
      {/* Main row */}
      <button
        className="w-full px-4 py-3 text-left flex items-center gap-3"
        onClick={() => {
          onSelect(!goal.selected);
          if (!goal.selected) setExpanded(true);
        }}
      >
        {/* Checkbox */}
        <div
          className={cn(
            "w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors",
            goal.selected
              ? "bg-blue-500 border-blue-500"
              : "border-white/20"
          )}
        >
          {goal.selected && <Check className="h-2.5 w-2.5 text-white" />}
        </div>

        {/* Label */}
        <span className="text-sm">{goal.emoji}</span>
        <span
          className={cn(
            "text-sm flex-1 leading-snug transition-colors",
            goal.selected ? "text-white/90" : "text-white/50"
          )}
        >
          {goal.label}
        </span>

        {/* Expand chevron when selected */}
        {goal.selected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 text-white/25 hover:text-white/50 transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 transition-transform",
                expanded ? "rotate-180" : ""
              )}
            />
          </button>
        )}
      </button>

      {/* Expanded detail */}
      {goal.selected && expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/[0.06] space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            {/* Target amount */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/35 block">
                Target amount
              </label>
              <p className="text-[10px] text-white/22 leading-tight">
                {goal.goalType === "buy-home"
                  ? "Down payment (e.g. $80,000)"
                  : goal.goalType === "save-education"
                  ? "Total per child (e.g. $50,000)"
                  : goal.goalType === "pay-off-debts"
                  ? "Total debt to eliminate"
                  : "Total amount to accumulate"}
              </p>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
                  $
                </span>
                <Input
                  type="number"
                  value={goal.targetAmount ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      targetAmount: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="e.g. 100,000"
                  className="pl-5 h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
                  min={0}
                />
              </div>
            </div>

            {/* Target year */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/35 block">
                Timeline (target year)
              </label>
              <Input
                type="number"
                value={goal.targetYear ?? ""}
                onChange={(e) =>
                  onUpdate({
                    targetYear: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder={String(new Date().getFullYear() + 5)}
                className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 mt-[18px]"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 50}
              />
            </div>

            {/* Monthly savings target */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/35 block">
                Monthly savings target
              </label>
              <p className="text-[10px] text-white/22 leading-tight">
                Portion of your surplus toward this goal
              </p>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
                  $
                </span>
                <Input
                  type="number"
                  value={goal.monthlyAllocation ?? ""}
                  onChange={(e) =>
                    onUpdate({
                      monthlyAllocation: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  placeholder="e.g. 500"
                  className="pl-5 h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20"
                  min={0}
                />
              </div>
            </div>

            {/* Importance */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-white/35 block">
                Importance
              </label>
              <Select
                value={goal.importanceLevel}
                onValueChange={(v) =>
                  onUpdate({ importanceLevel: v as ImportanceLevel })
                }
              >
                <SelectTrigger className="h-8 text-sm bg-white/[0.04] border-white/[0.08] text-white mt-[18px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Nice to have</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StepGoals() {
  const { plan, setGoalSelected, updateGoal, setGoalPriority } = usePlanStore();
  const { goals } = plan;

  const selectedGoals = goals.filter((g) => g.selected);

  const goalMap = goals.reduce(
    (acc, g) => {
      const def = GOAL_DEFINITIONS.find((d) => d.type === g.goalType);
      return { ...acc, [g.id]: { ...g, emoji: def?.icon ?? "📌" } };
    },
    {} as Record<string, any>
  );

  const prioritySlots: (1 | 2 | 3)[] = [1, 2, 3];
  const priorityLabels = ["Top priority", "2nd", "3rd"];

  return (
    <div className="space-y-5">
      <p className="text-xs text-white/35 leading-relaxed">
        Select all goals that apply, then expand each to add details. Rank your
        top 3 to shape recommendations.
      </p>

      {/* Goal cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goalMap[goal.id]}
            onSelect={(selected: boolean) =>
              setGoalSelected(goal.goalType, selected)
            }
            onUpdate={(updates: any) => updateGoal(goal.id, updates)}
          />
        ))}
      </div>

      {selectedGoals.length === 0 && (
        <p className="text-xs text-white/25 text-center py-2">
          Select at least one goal to continue.
        </p>
      )}

      {/* Priority ranking — appears when 3+ selected */}
      {selectedGoals.length >= 3 && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-3">
          <div>
            <p className="text-xs font-semibold text-white/70">
              Rank your top priorities
            </p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Flow weights these highest in your plan and recommendations.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {prioritySlots.map((rank) => {
              const currentHolder = goals.find(
                (g) => g.topPriorityRank === rank
              );
              return (
                <div key={rank} className="space-y-1">
                  <label className="text-[11px] font-medium text-white/30 block">
                    {priorityLabels[rank - 1]}
                  </label>
                  <Select
                    value={currentHolder?.id ?? "none"}
                    onValueChange={(id) => {
                      if (id === "none") {
                        if (currentHolder)
                          setGoalPriority(currentHolder.id, null);
                      } else {
                        setGoalPriority(id, rank);
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.08] text-white text-xs h-8">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">—</SelectItem>
                      {selectedGoals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          {goalMap[g.id]?.emoji} {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
