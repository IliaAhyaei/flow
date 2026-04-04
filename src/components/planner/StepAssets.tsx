import { useState } from "react";
import { usePlanStore } from "@/store/planStore";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import {
  calcTotalAssets,
  calcInvestableAssets,
  calcMonthlyContributions,
} from "@/lib/calculations";
import type { AssetsBreakdown } from "@/types/financial";
import { cn } from "@/lib/utils";

function MoneyField({
  label,
  hint,
  value,
  onChange,
  highlight,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-medium text-white/45">{label}</label>
      {hint && (
        <p className="text-[10px] text-white/25 leading-tight">{hint}</p>
      )}
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
          className={cn(
            "pl-6 h-9 text-sm text-white placeholder:text-white/15 focus:border-blue-500/40",
            highlight
              ? "bg-blue-500/[0.06] border-blue-500/20"
              : "bg-white/[0.04] border-white/[0.07]"
          )}
        />
      </div>
    </div>
  );
}

function AssetGroup({
  title,
  description,
  defaultOpen,
  children,
}: {
  title: string;
  description?: string;
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
        <div>
          <span
            className={cn(
              "text-xs font-semibold transition-colors",
              open ? "text-white/70" : "text-white/40 group-hover:text-white/55"
            )}
          >
            {title}
          </span>
          {description && !open && (
            <span className="text-[11px] text-white/22 ml-2">{description}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-white/20 transition-transform group-hover:text-white/35",
            open ? "rotate-180" : ""
          )}
        />
      </button>
      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {children}
        </div>
      )}
    </div>
  );
}

export default function StepAssets() {
  const { plan, updateAssets } = usePlanStore();
  const { assets, goals, profile } = plan;

  const wantsBuyHome = goals.some(
    (g) => g.goalType === "buy-home" && g.selected
  );
  const showFHSA =
    wantsBuyHome ||
    assets.fhsaBalance > 0 ||
    assets.fhsaMonthlyContribution > 0;
  const showPension =
    profile.employmentStatus !== "student" &&
    profile.employmentStatus !== "unemployed";

  const totalAssets = calcTotalAssets(assets);
  const investable = calcInvestableAssets(assets);
  const monthlyContribs = calcMonthlyContributions(assets);

  return (
    <div className="space-y-5">
      {/* Totals bar */}
      {totalAssets > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total assets",
              value: `$${totalAssets.toLocaleString("en-CA")}`,
            },
            {
              label: "Investable",
              value: `$${investable.toLocaleString("en-CA")}`,
            },
            {
              label: "Monthly contributions",
              value: `$${monthlyContribs.toLocaleString("en-CA")}/mo`,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg bg-white/[0.03] border border-white/[0.07] px-3 py-2.5 text-center"
            >
              <p className="text-[10px] text-white/30 mb-0.5">{s.label}</p>
              <p className="text-xs font-semibold tabular-nums text-white/70">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Asset groups */}
      <div className="space-y-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35 pb-1">
          Your Assets
        </p>

        <AssetGroup
          title="💵 Cash & Liquid Savings"
          description="Money you can access quickly"
          defaultOpen={true}
        >
          <MoneyField
            label="Chequing account"
            value={assets.chequing}
            onChange={(v) => updateAssets({ chequing: v })}
          />
          <MoneyField
            label="Savings account (HISA)"
            value={assets.savings}
            onChange={(v) => updateAssets({ savings: v })}
          />
          <MoneyField
            label="Emergency fund (dedicated)"
            hint="If kept separate from savings"
            value={assets.emergencyFund}
            onChange={(v) => updateAssets({ emergencyFund: v })}
          />
        </AssetGroup>

        <AssetGroup
          title="🍁 Canadian Registered Accounts"
          description="Tax-advantaged accounts"
        >
          <MoneyField
            label="TFSA balance"
            hint="Tax-free growth"
            value={assets.tfsaBalance}
            onChange={(v) => updateAssets({ tfsaBalance: v })}
            highlight
          />
          <MoneyField
            label="TFSA monthly contribution"
            value={assets.tfsaMonthlyContribution}
            onChange={(v) => updateAssets({ tfsaMonthlyContribution: v })}
          />
          <MoneyField
            label="RRSP balance"
            hint="Reduces taxable income"
            value={assets.rrspBalance}
            onChange={(v) => updateAssets({ rrspBalance: v })}
            highlight
          />
          <MoneyField
            label="RRSP monthly contribution"
            value={assets.rrspMonthlyContribution}
            onChange={(v) => updateAssets({ rrspMonthlyContribution: v })}
          />
          {showFHSA && (
            <>
              <MoneyField
                label="FHSA balance"
                hint="First Home Savings Account"
                value={assets.fhsaBalance}
                onChange={(v) => updateAssets({ fhsaBalance: v })}
                highlight
              />
              <MoneyField
                label="FHSA monthly contribution"
                value={assets.fhsaMonthlyContribution}
                onChange={(v) => updateAssets({ fhsaMonthlyContribution: v })}
              />
            </>
          )}
          {plan.profile.numberOfChildren > 0 && (
            <>
              <MoneyField
                label="RESP balance"
                hint="20% gov't grant on first $2,500/yr/child"
                value={assets.respBalance}
                onChange={(v) => updateAssets({ respBalance: v })}
                highlight
              />
              <MoneyField
                label="RESP monthly contribution"
                value={assets.respMonthlyContribution}
                onChange={(v) => updateAssets({ respMonthlyContribution: v })}
              />
            </>
          )}
        </AssetGroup>

        <AssetGroup
          title="📈 Other Investments"
          description="Non-registered, pension, other"
        >
          <MoneyField
            label="Non-registered investments"
            hint="Stocks, ETFs, mutual funds"
            value={assets.nonRegisteredInvestments}
            onChange={(v) => updateAssets({ nonRegisteredInvestments: v })}
          />
          <MoneyField
            label="Non-registered monthly contribution"
            value={assets.nonRegisteredMonthlyContribution}
            onChange={(v) =>
              updateAssets({ nonRegisteredMonthlyContribution: v })
            }
          />
          {showPension && (
            <>
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-[11px] font-medium text-white/45">
                  Employer pension type
                </label>
                <p className="text-[10px] text-white/25 leading-tight">
                  DC — your balance grows with markets. DB — employer pays fixed
                  income at retirement.
                </p>
                <div className="flex gap-2 mt-1.5">
                  {(["dc", "db"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        updateAssets({
                          pensionType: t,
                        } as Partial<AssetsBreakdown>)
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                        assets.pensionType === t
                          ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                          : "bg-white/[0.04] border-white/[0.08] text-white/35 hover:text-white/55"
                      )}
                    >
                      {t === "dc"
                        ? "DC — Defined Contribution"
                        : "DB — Defined Benefit"}
                    </button>
                  ))}
                </div>
              </div>
              <MoneyField
                label={
                  assets.pensionType === "db"
                    ? "DB pension commuted value"
                    : "DC pension / LIRA balance"
                }
                hint={
                  assets.pensionType === "db"
                    ? "From your pension statement. Used for net worth."
                    : "Total in employer DC plan, group RRSP, or LIRA."
                }
                value={assets.pensionValue}
                onChange={(v) => updateAssets({ pensionValue: v })}
              />
              {assets.pensionType === "db" && (
                <MoneyField
                  label="DB annual pension income at retirement"
                  hint="Annual income your DB plan pays at retirement (today's $). Reduces how much you need to self-fund."
                  value={assets.pensionAnnualBenefit}
                  onChange={(v) => updateAssets({ pensionAnnualBenefit: v })}
                  highlight
                />
              )}
            </>
          )}
          <MoneyField
            label="Other investments"
            value={assets.otherInvestments}
            onChange={(v) => updateAssets({ otherInvestments: v })}
          />
        </AssetGroup>

        <AssetGroup
          title="🏠 Real Assets"
          description="Property, vehicles, valuables"
        >
          <MoneyField
            label="Home market value"
            hint="Current estimated value if you own"
            value={assets.homeMarketValue}
            onChange={(v) => updateAssets({ homeMarketValue: v })}
          />
          <MoneyField
            label="Other real estate"
            value={assets.otherRealEstate}
            onChange={(v) => updateAssets({ otherRealEstate: v })}
          />
          <MoneyField
            label="Vehicle(s) value"
            value={assets.vehicleValue}
            onChange={(v) => updateAssets({ vehicleValue: v })}
          />
          <MoneyField
            label="Valuables / other assets"
            hint="Jewelry, art, collectibles"
            value={assets.valuablesOther}
            onChange={(v) => updateAssets({ valuablesOther: v })}
          />
        </AssetGroup>
      </div>
    </div>
  );
}
