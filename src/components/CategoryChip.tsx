import { cn } from "@/lib/utils";

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export default function CategoryChip({ label, active, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap border",
        active
          ? "bg-flow-interactive text-white border-flow-interactive shadow-[0_0_12px_-3px_hsl(var(--flow-interactive)/0.4)]"
          : "bg-transparent text-muted-foreground border-border hover:border-flow-interactive/40 hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
