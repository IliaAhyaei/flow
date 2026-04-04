import { usePlanStore } from "@/store/planStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Liability, LiabilityType } from "@/types/financial";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

const LIABILITY_TYPES: { value: LiabilityType; label: string }[] = [
  { value: "mortgage", label: "Mortgage" },
  { value: "credit-card", label: "Credit Card" },
  { value: "student-loan", label: "Student Loan" },
  { value: "auto-loan", label: "Auto Loan" },
  { value: "personal-loan", label: "Personal Loan" },
  { value: "line-of-credit", label: "Line of Credit" },
  { value: "other", label: "Other" },
];

function uid(): string {
  return Math.random().toString(36).slice(2);
}

function LiabilityRow({
  liability,
  onUpdate,
  onRemove,
  expectedReturn,
}: {
  liability: Liability;
  onUpdate: (updates: Partial<Liability>) => void;
  onRemove: () => void;
  expectedReturn: number;
}) {
  const isHighRate = liability.interestRate > expectedReturn;

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={liability.type}
            onValueChange={(v) => onUpdate({ type: v as LiabilityType })}
          >
            <SelectTrigger className="h-8 w-40 bg-white/[0.04] border-white/[0.08] text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIABILITY_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isHighRate && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
              <AlertTriangle className="h-3 w-3" />
              High rate
            </span>
          )}
        </div>
        <button
          onClick={onRemove}
          className="text-white/20 hover:text-red-400 transition-colors p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="space-y-1">
          <label className="text-[10px] text-white/30">Lender</label>
          <Input
            value={liability.lenderName}
            onChange={(e) => onUpdate({ lenderName: e.target.value })}
            placeholder="e.g. TD Bank"
            className="h-8 text-xs bg-white/[0.04] border-white/[0.07] text-white placeholder:text-white/15"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/30">Balance owing</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
              $
            </span>
            <Input
              type="number"
              value={liability.outstandingBalance || ""}
              onChange={(e) =>
                onUpdate({
                  outstandingBalance: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0"
              min={0}
              className="pl-5 h-8 text-xs bg-white/[0.04] border-white/[0.07] text-white placeholder:text-white/15"
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/30">Interest rate</label>
          <div className="relative">
            <Input
              type="number"
              value={liability.interestRate || ""}
              onChange={(e) =>
                onUpdate({ interestRate: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.0"
              min={0}
              max={50}
              step={0.1}
              className="pr-6 h-8 text-xs bg-white/[0.04] border-white/[0.07] text-white placeholder:text-white/15"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
              %
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-white/30">Min. payment</label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-white/25">
              $
            </span>
            <Input
              type="number"
              value={liability.minimumMonthlyPayment || ""}
              onChange={(e) =>
                onUpdate({
                  minimumMonthlyPayment: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="0"
              min={0}
              className="pl-5 h-8 text-xs bg-white/[0.04] border-white/[0.07] text-white placeholder:text-white/15"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StepLiabilities() {
  const { plan, addLiability, updateLiability, removeLiability, setLiabilities } =
    usePlanStore();
  const { liabilities, assumptions } = plan;

  const handleAdd = () => {
    addLiability({
      id: uid(),
      type: "credit-card",
      lenderName: "",
      outstandingBalance: 0,
      interestRate: 0,
      minimumMonthlyPayment: 0,
      fixedOrVariable: null,
      termYearsRemaining: null,
    });
  };

  const totalDebt = liabilities.reduce((s, l) => s + l.outstandingBalance, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-white/35 leading-relaxed">
        Add all debts — mortgages, student loans, credit cards, lines of credit.
        Flow uses this to calculate your net worth and debt strategy.
      </p>

      {liabilities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center">
          <p className="text-xs text-white/30 mb-4">
            No debts added. If you have any loans or credit balances, add them
            here. Leaving this empty is fine if you're debt-free.
          </p>
          <Button
            onClick={handleAdd}
            variant="outline"
            size="sm"
            className="border-white/[0.12] text-white/45 hover:text-white/70 hover:border-white/20 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add a debt
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {liabilities.map((l) => (
            <LiabilityRow
              key={l.id}
              liability={l}
              onUpdate={(updates) => updateLiability(l.id, updates)}
              onRemove={() => removeLiability(l.id)}
              expectedReturn={assumptions.expectedAnnualReturn}
            />
          ))}

          <div className="flex items-center justify-between pt-1">
            <Button
              onClick={handleAdd}
              variant="outline"
              size="sm"
              className="border-white/[0.10] text-white/40 hover:text-white/65 hover:border-white/18 text-xs gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add another
            </Button>

            {totalDebt > 0 && (
              <div className="text-right">
                <p className="text-[10px] text-white/25">Total debt</p>
                <p className="text-sm font-semibold tabular-nums text-amber-400">
                  ${totalDebt.toLocaleString("en-CA")}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-amber-500/[0.07] border border-amber-500/20 px-4 py-3">
            <p className="text-[11px] text-amber-400/80 leading-relaxed">
              <strong className="text-amber-400">Flow will analyze your debt rate vs. your expected
              investment return</strong> and tell you whether paying down debt or
              investing is the better use of your extra cash.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
