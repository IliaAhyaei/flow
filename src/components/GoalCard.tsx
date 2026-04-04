import { cn } from "@/lib/utils";

interface GoalCardProps {
  name: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: string;
  monthlyNeeded: string;
  probability: number;
  status: string;
}

export default function GoalCard({ name, targetAmount, currentAmount, targetDate, monthlyNeeded, probability, status }: GoalCardProps) {
  const progressPercent = Math.min(
    (parseFloat(currentAmount.replace(/[$,]/g, "")) / parseFloat(targetAmount.replace(/[$,]/g, ""))) * 100,
    100
  );

  const probColor = probability >= 80 ? "bg-emerald-500" : probability >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="glass rounded-xl p-5 flow-hover">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{status}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn("w-2 h-2 rounded-full", probColor)} />
          <span className="text-xs font-medium tabular-nums text-muted-foreground">{probability}%</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{currentAmount}</span>
            <span className="font-medium text-card-foreground">{targetAmount}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-flow-interactive rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-muted-foreground">Target date</p>
            <p className="font-medium text-card-foreground">{targetDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Monthly needed</p>
            <p className="font-medium tabular-nums text-card-foreground">{monthlyNeeded}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
