import { usePlanStore } from "@/store/planStore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PROVINCES } from "@/types/financial";
import type { Province, MaritalStatus, EmploymentStatus } from "@/types/financial";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-white/60">{label}</Label>
      {hint && <p className="text-[11px] text-white/30 leading-tight">{hint}</p>}
      {children}
    </div>
  );
}

export default function StepProfile() {
  const { plan, updateProfile, updateSpouse } = usePlanStore();
  const { profile, spouse } = plan;

  const handleProfile = (key: string, value: string | number | boolean) => {
    updateProfile({ [key]: value } as any);
  };

  const showSpouse =
    profile.maritalStatus === "married" ||
    profile.maritalStatus === "common-law";

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Your name">
          <Input
            value={profile.fullName}
            onChange={(e) => handleProfile("fullName", e.target.value)}
            placeholder="e.g. Priya Sharma"
            className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-blue-500/50"
          />
        </Field>

        <Field label="Your age">
          <Input
            type="number"
            value={profile.age || ""}
            onChange={(e) =>
              handleProfile("age", parseInt(e.target.value) || 0)
            }
            placeholder="e.g. 32"
            min={18}
            max={80}
            className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-blue-500/50"
          />
        </Field>

        <Field label="Province / Territory" hint="Affects tax and account guidance">
          <Select
            value={profile.province}
            onValueChange={(v) => handleProfile("province", v as Province)}
          >
            <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROVINCES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Marital status">
          <Select
            value={profile.maritalStatus}
            onValueChange={(v) =>
              handleProfile("maritalStatus", v as MaritalStatus)
            }
          >
            <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
              <SelectItem value="common-law">Common-law</SelectItem>
              <SelectItem value="divorced">Divorced</SelectItem>
              <SelectItem value="widowed">Widowed</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Work & income */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Employment status">
          <Select
            value={profile.employmentStatus}
            onValueChange={(v) =>
              handleProfile("employmentStatus", v as EmploymentStatus)
            }
          >
            <SelectTrigger className="bg-white/[0.05] border-white/[0.08] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed-full-time">Employed (full-time)</SelectItem>
              <SelectItem value="employed-part-time">Employed (part-time)</SelectItem>
              <SelectItem value="self-employed">Self-employed</SelectItem>
              <SelectItem value="unemployed">Not currently employed</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Annual gross income"
          hint="Before taxes. If one household income, use yours. Used for RRSP limit."
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
              $
            </span>
            <Input
              type="number"
              value={profile.annualGrossIncome || ""}
              onChange={(e) =>
                handleProfile("annualGrossIncome", parseFloat(e.target.value) || 0)
              }
              placeholder="60,000"
              className="pl-6 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-blue-500/50"
              min={0}
            />
          </div>
        </Field>

        <Field
          label="Annual take-home income"
          hint="Optional — after taxes. Leave blank to estimate."
        >
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
              $
            </span>
            <Input
              type="number"
              value={profile.annualNetIncome ?? ""}
              onChange={(e) =>
                handleProfile(
                  "annualNetIncome",
                  e.target.value ? parseFloat(e.target.value) : null
                )
              }
              placeholder="Leave blank to estimate"
              className="pl-6 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20 focus:border-blue-500/50"
              min={0}
            />
          </div>
        </Field>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Family */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Number of dependents"
          hint="Anyone financially dependent on you"
        >
          <Input
            type="number"
            value={profile.numberOfDependents || ""}
            onChange={(e) =>
              handleProfile("numberOfDependents", parseInt(e.target.value) || 0)
            }
            placeholder="0"
            min={0}
            className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20"
          />
        </Field>

        <Field
          label="Children under 18"
          hint="Used for RESP eligibility and education planning"
        >
          <Input
            type="number"
            value={profile.numberOfChildren || ""}
            onChange={(e) =>
              handleProfile("numberOfChildren", parseInt(e.target.value) || 0)
            }
            placeholder="0"
            min={0}
            className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20"
          />
        </Field>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.06]" />

      {/* Retirement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Target retirement age">
          <Input
            type="number"
            value={profile.retirementAge || ""}
            onChange={(e) =>
              handleProfile("retirementAge", parseInt(e.target.value) || 65)
            }
            placeholder="65"
            min={profile.age + 1}
            max={80}
            className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20"
          />
        </Field>

        <Field
          label="Life expectancy assumption"
          hint="How long your savings need to last"
        >
          <Input
            type="number"
            value={profile.lifeExpectancyAge || ""}
            onChange={(e) =>
              handleProfile(
                "lifeExpectancyAge",
                parseInt(e.target.value) || 90
              )
            }
            placeholder="90"
            min={65}
            max={110}
            className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20"
          />
        </Field>
      </div>

      {/* Smoker toggle */}
      <div className="flex items-center justify-between py-3 border-t border-white/[0.06]">
        <div>
          <p className="text-xs font-medium text-white/60">Smoker / tobacco user</p>
          <p className="text-[11px] text-white/25 mt-0.5">
            Relevant for insurance and life planning
          </p>
        </div>
        <Switch
          checked={profile.smokingStatus}
          onCheckedChange={(v) => handleProfile("smokingStatus", v)}
        />
      </div>

      {/* Spouse section — conditional */}
      {showSpouse && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-white/70">Spouse / Partner</p>
            <p className="text-[11px] text-white/30 mt-0.5">
              Include their details for a joint household view.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Partner's age">
              <Input
                type="number"
                value={spouse?.spouseAge ?? ""}
                onChange={(e) =>
                  updateSpouse({ spouseAge: parseInt(e.target.value) || 30 })
                }
                placeholder="30"
                min={18}
                className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20"
              />
            </Field>
            <Field label="Partner's annual gross income">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
                  $
                </span>
                <Input
                  type="number"
                  value={spouse?.spouseAnnualGrossIncome ?? ""}
                  onChange={(e) =>
                    updateSpouse({
                      spouseAnnualGrossIncome: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="55,000"
                  className="pl-6 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20"
                />
              </div>
            </Field>
            <Field label="Partner's retirement age">
              <Input
                type="number"
                value={spouse?.spouseRetirementAge ?? ""}
                onChange={(e) =>
                  updateSpouse({
                    spouseRetirementAge: parseInt(e.target.value) || 65,
                  })
                }
                placeholder="65"
                min={50}
                className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/20"
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}
