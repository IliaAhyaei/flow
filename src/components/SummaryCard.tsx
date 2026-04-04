import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

interface SummaryCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: LucideIcon;
}

export default function SummaryCard({ label, value, change, changeType = "neutral", icon: Icon }: SummaryCardProps) {
  return (
    <div className="glass rounded-xl p-5 flow-hover">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="h-4 w-4 text-flow-interactive" />}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-card-foreground">{value}</p>
      {change && (
        <p className={cn(
          "mt-1 text-xs font-medium tabular-nums",
          changeType === "positive" && "text-emerald-400",
          changeType === "negative" && "text-red-500",
          changeType === "neutral" && "text-muted-foreground"
        )}>
          {change}
        </p>
      )}
    </div>
  );
}
