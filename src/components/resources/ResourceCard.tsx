import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ResourceItem {
  id: string;
  name: string;
  category: string;
  description: string;
  eligibility_summary: string;
  required_documents?: string[];
  next_steps?: string[];
  official_url: string;
  province?: string;
  benefit_value?: string;
  why_it_applies?: string;
}

const CATEGORY_STYLES: Record<string, { badge: string; label: string }> = {
  "tax-savings":    { badge: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20", label: "Tax Savings" },
  housing:          { badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",          label: "Housing" },
  education:        { badge: "bg-violet-500/15 text-violet-400 border border-violet-500/20",    label: "Education" },
  "family-children":{ badge: "bg-pink-500/15 text-pink-400 border border-pink-500/20",          label: "Family & Children" },
  retirement:       { badge: "bg-amber-500/15 text-amber-400 border border-amber-500/20",       label: "Retirement" },
  employment:       { badge: "bg-sky-500/15 text-sky-400 border border-sky-500/20",             label: "Employment" },
  transportation:   { badge: "bg-orange-500/15 text-orange-400 border border-orange-500/20",   label: "Transportation" },
  newcomer:         { badge: "bg-teal-500/15 text-teal-400 border border-teal-500/20",          label: "Newcomer" },
};

export default function ResourceCard({ resource }: { resource: ResourceItem }) {
  const [expanded, setExpanded] = useState(false);

  const style = CATEGORY_STYLES[resource.category] ?? {
    badge: "bg-muted text-muted-foreground",
    label: resource.category,
  };

  const provinceLabel =
    resource.province === "federal" ? "National"
    : resource.province === "ALL" || resource.province === "all" || !resource.province ? null
    : resource.province;

  const hasDocs = (resource.required_documents?.length ?? 0) > 0;
  const hasSteps = (resource.next_steps?.length ?? 0) > 0;

  return (
    <div className="glass rounded-2xl flex flex-col glass-hover">

      {/* ── Zone 1: Header ──────────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold", style.badge)}>
            {style.label}
          </span>
          {provinceLabel && (
            <span className="inline-flex items-center rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] font-medium text-white/50">
              {provinceLabel}
            </span>
          )}
        </div>
        <h3 className="text-[15px] font-semibold text-foreground leading-snug">
          {resource.name}
        </h3>
        {resource.benefit_value && (
          <p className="text-sm font-bold text-flow leading-snug break-words">
            {resource.benefit_value}
          </p>
        )}
      </div>

      {/* ── Zone 2: Personalization callout ─────────────────────── */}
      {resource.why_it_applies && (
        <div className="mx-5 mb-4 rounded-lg border-l-[3px] border-flow bg-flow/5 px-3.5 py-3 overflow-hidden">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-flow mb-2">
            Why this applies to you
          </p>
          <p className="text-[11px] font-semibold text-foreground mb-0.5">
            {style.label}
          </p>
          {provinceLabel && (
            <p className="text-[11px] text-muted-foreground mb-1.5">
              {provinceLabel}
            </p>
          )}
          <p className="text-xs text-foreground leading-relaxed break-words">
            {resource.why_it_applies}
          </p>
        </div>
      )}

      {/* ── Zone 3: Body ────────────────────────────────────────── */}
      <div className="border-t border-white/[0.07] mx-5" />
      <div className="px-5 py-4 space-y-3 flex-1">

        {/* Description — clamped to 3 lines */}
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {resource.description}
        </p>

        {/* Expand trigger — always present */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-medium text-flow hover:text-flow-dark transition-colors"
        >
          {expanded
            ? <><ChevronUp className="h-3.5 w-3.5" />Hide details</>
            : <><ChevronDown className="h-3.5 w-3.5" />Eligibility &amp; details</>
          }
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="space-y-4 pt-1">
            {/* Eligibility */}
            <div>
              <p className="text-xs font-semibold text-foreground mb-1.5">Eligibility</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {resource.eligibility_summary}
              </p>
            </div>

            {/* Documents */}
            {hasDocs && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">What to prepare</p>
                <ul className="space-y-1.5">
                  {resource.required_documents!.map((doc) => (
                    <li key={doc} className="text-sm text-muted-foreground flex gap-2 leading-relaxed">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/60" />
                      {doc}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Steps */}
            {hasSteps && (
              <div>
                <p className="text-xs font-semibold text-foreground mb-1.5">Next steps</p>
                <ol className="space-y-2">
                  {resource.next_steps!.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                      <span className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-flow/10 text-flow text-[11px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Zone 4: CTA ─────────────────────────────────────────── */}
      <div className="border-t border-white/[0.07] mx-5" />
      <div className="px-5 py-4">
        <Button
          className="w-full gap-2 bg-flow hover:bg-flow-dark text-white"
          onClick={() => window.open(resource.official_url, "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="h-4 w-4" />
          View Official Source
        </Button>
      </div>
    </div>
  );
}
