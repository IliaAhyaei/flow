import { useState } from "react";
import { usePlanStore } from "@/store/planStore";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import {
  calcMonthlyIncome,
  calcMonthlyExpenses,
  calcMonthlyContributions,
} from "@/lib/calculations";
import { cn } from "@/lib/utils";

function MoneyField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-white/45">{label}</label>
      {hint && <p className="text-[10px] text-white/25 leading-tight">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/25">
          $
        </span>
        <Input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          placeholder="0"
          min={0}
          className="pl-6 h-9 bg-white/[0.04] border-white/[0.07] text-white placeholder:text-white/15 focus:border-blue-500/40 text-sm"
        />
      </div>
    </div>
  );
}

function ExpenseGroup({
  title,
  total,
  defaultOpen,
  children,
}: {
  title: string;
  total: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="border-t border-white/[0.055] pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-0 group"
      >
        <span
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider transition-colors",
            open ? "text-white/55" : "text-white/35 group-hover:text-white/50"
          )}
        >
          {title}
        </span>
        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-[11px] tabular-nums text-white/30">
              ${total.toLocaleString("en-CA")}
            </span>
          )}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-white/20 transition-transform group-hover:text-white/35",
              open ? "rotate-180" : ""
            )}
          />
        </div>
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function StepIncome() {
  const { plan, updateIncome, updateExpenses } = usePlanStore();
  const { income, expenses, assets } = plan;

  const totalIncome = calcMonthlyIncome(income);
  const totalExpenses = calcMonthlyExpenses(expenses);
  const monthlyContribs = calcMonthlyContributions(assets);
  const surplus = totalIncome - totalExpenses;

  const fixedTotal =
    expenses.rentOrMortgage +
    expenses.utilities +
    expenses.homeInsurance +
    expenses.cellPhone +
    expenses.propertyTax;

  const lifestyleTotal =
    expenses.groceries +
    expenses.diningOut +
    expenses.fuelTransit +
    expenses.entertainment +
    expenses.gymMemberships +
    expenses.clothing +
    expenses.personalCare +
    expenses.childCare;

  const financialDebtTotal =
    expenses.studentLoanPayment +
    expenses.lineOfCreditPayment +
    expenses.creditCardPayment +
    expenses.personalLoanPayment;

  const otherTotal =
    expenses.carPayment +
    expenses.autoInsurance +
    expenses.internet +
    expenses.streamingCable +
    expenses.giftsCharity +
    expenses.familySupport +
    expenses.miscellaneous;

  return (
    <div className="space-y-5">
      {/* Income — always visible, compact */}
      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
          Monthly Income
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MoneyField
            label="Employment income"
            hint="Combined household take-home after tax. Self-employed: net business income."
            value={income.employmentIncome}
            onChange={(v) => updateIncome({ employmentIncome: v })}
          />
          <MoneyField
            label="Side / freelance income"
            value={income.sideIncome}
            onChange={(v) => updateIncome({ sideIncome: v })}
          />
          <MoneyField
            label="Government benefits"
            hint="EI, CCB, OAS, CPP, etc."
            value={income.governmentBenefits}
            onChange={(v) => updateIncome({ governmentBenefits: v })}
          />
          <MoneyField
            label="Other income"
            value={income.otherIncome}
            onChange={(v) => updateIncome({ otherIncome: v })}
          />
        </div>
      </div>

      {/* Surplus bar */}
      <div
        className={cn(
          "flex items-center justify-between rounded-xl px-4 py-3 border",
          surplus >= 0
            ? "bg-emerald-500/[0.07] border-emerald-500/20"
            : "bg-red-500/[0.07] border-red-500/20"
        )}
      >
        <div>
          <p className="text-[11px] text-white/40">Monthly surplus</p>
          {monthlyContribs > 0 && (
            <p className="text-[10px] text-white/25 mt-0.5">
              Includes ${monthlyContribs.toLocaleString("en-CA")}/mo from Asset contributions
            </p>
          )}
        </div>
        <p
          className={cn(
            "text-lg font-bold tabular-nums",
            surplus >= 0 ? "text-emerald-400" : "text-red-400"
          )}
        >
          {surplus >= 0 ? "+" : "-"}$
          {Math.abs(surplus).toLocaleString("en-CA", { maximumFractionDigits: 0 })}
        </p>
      </div>

      {/* Expenses — collapsible groups */}
      <div className="space-y-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35 pb-3">
          Monthly Expenses
        </p>

        <ExpenseGroup title="Fixed" total={fixedTotal} defaultOpen={true}>
          <MoneyField
            label="Rent or mortgage"
            value={expenses.rentOrMortgage}
            onChange={(v) => updateExpenses({ rentOrMortgage: v })}
          />
          <MoneyField
            label="Utilities (hydro, gas, water)"
            value={expenses.utilities}
            onChange={(v) => updateExpenses({ utilities: v })}
          />
          <MoneyField
            label="Insurance (home/renters)"
            value={expenses.homeInsurance}
            onChange={(v) => updateExpenses({ homeInsurance: v })}
          />
          <MoneyField
            label="Phone plan"
            value={expenses.cellPhone}
            onChange={(v) => updateExpenses({ cellPhone: v })}
          />
          <MoneyField
            label="Property tax (monthly est.)"
            hint="Leave at 0 if renting"
            value={expenses.propertyTax}
            onChange={(v) => updateExpenses({ propertyTax: v })}
          />
        </ExpenseGroup>

        <ExpenseGroup title="Lifestyle" total={lifestyleTotal}>
          <MoneyField
            label="Groceries"
            value={expenses.groceries}
            onChange={(v) => updateExpenses({ groceries: v })}
          />
          <MoneyField
            label="Dining & restaurants"
            value={expenses.diningOut}
            onChange={(v) => updateExpenses({ diningOut: v })}
          />
          <MoneyField
            label="Transportation (fuel/transit)"
            value={expenses.fuelTransit}
            onChange={(v) => updateExpenses({ fuelTransit: v })}
          />
          <MoneyField
            label="Entertainment & gym"
            value={expenses.entertainment + expenses.gymMemberships}
            onChange={(v) =>
              updateExpenses({
                entertainment: Math.round(v * 0.7),
                gymMemberships: Math.round(v * 0.3),
              })
            }
          />
          <MoneyField
            label="Personal care & clothing"
            value={expenses.clothing + expenses.personalCare}
            onChange={(v) =>
              updateExpenses({
                clothing: Math.round(v * 0.5),
                personalCare: Math.round(v * 0.5),
              })
            }
          />
          <MoneyField
            label="Child care"
            value={expenses.childCare}
            onChange={(v) => updateExpenses({ childCare: v })}
          />
        </ExpenseGroup>

        <ExpenseGroup
          title="Debt payments"
          total={financialDebtTotal + monthlyContribs}
        >
          {monthlyContribs > 0 && (
            <div className="sm:col-span-2 flex items-center justify-between rounded-lg bg-blue-500/[0.06] border border-blue-500/15 px-3 py-2">
              <p className="text-[11px] text-white/40">
                Savings &amp; investing — from your Assets section
              </p>
              <p className="text-xs font-semibold tabular-nums text-blue-400">
                ${monthlyContribs.toLocaleString("en-CA")}/mo
              </p>
            </div>
          )}
          <MoneyField
            label="Student loan payment"
            value={expenses.studentLoanPayment}
            onChange={(v) => updateExpenses({ studentLoanPayment: v })}
          />
          <MoneyField
            label="Line of credit payment"
            value={expenses.lineOfCreditPayment}
            onChange={(v) => updateExpenses({ lineOfCreditPayment: v })}
          />
          <MoneyField
            label="Credit card (minimum)"
            value={expenses.creditCardPayment}
            onChange={(v) => updateExpenses({ creditCardPayment: v })}
          />
          <MoneyField
            label="Personal loan"
            value={expenses.personalLoanPayment}
            onChange={(v) => updateExpenses({ personalLoanPayment: v })}
          />
        </ExpenseGroup>

        <ExpenseGroup title="Other" total={otherTotal}>
          <MoneyField
            label="Car payment & insurance"
            value={expenses.carPayment + expenses.autoInsurance}
            onChange={(v) =>
              updateExpenses({
                carPayment: Math.round(v * 0.6),
                autoInsurance: Math.round(v * 0.4),
              })
            }
          />
          <MoneyField
            label="Internet & streaming"
            value={expenses.internet + expenses.streamingCable}
            onChange={(v) =>
              updateExpenses({
                internet: Math.round(v * 0.75),
                streamingCable: Math.round(v * 0.25),
              })
            }
          />
          <MoneyField
            label="Gifts & charity"
            value={expenses.giftsCharity}
            onChange={(v) => updateExpenses({ giftsCharity: v })}
          />
          <MoneyField
            label="Family support / remittances"
            value={expenses.familySupport}
            onChange={(v) => updateExpenses({ familySupport: v })}
          />
          <MoneyField
            label="Miscellaneous"
            value={expenses.miscellaneous}
            onChange={(v) => updateExpenses({ miscellaneous: v })}
          />
        </ExpenseGroup>
      </div>
    </div>
  );
}
