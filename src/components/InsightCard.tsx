import { type LucideIcon } from "lucide-react";

interface InsightCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  impact?: string;
  action?: string;
  category?: string;
}

export default function InsightCard({ icon: Icon, title, description, impact, action, category }: InsightCardProps) {
  return (
    <div className="glass rounded-xl p-5 flow-hover">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-flow-lighter/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-flow-interactive" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {category && (
              <span className="text-[11px] font-medium uppercase tracking-wider text-flow-interactive">{category}</span>
            )}
            {impact && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{impact}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          {action && (
            <p className="text-xs font-medium text-flow-interactive mt-2 cursor-pointer hover:underline">{action}</p>
          )}
        </div>
      </div>
    </div>
  );
}
