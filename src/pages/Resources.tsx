import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Loader2, BookOpen, MapPin, Sparkles, CheckCircle2, Building2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";
import ResourceCard, { type ResourceItem } from "@/components/resources/ResourceCard";
import { buildResourcesNarrative } from "@/lib/interpretation";
import SectionAssistant from "@/components/SectionAssistant";

const INSTITUTIONAL_PLACEHOLDERS = [
  {
    id: "inst-1",
    institution: "Manulife",
    category: "Life Insurance",
    description: "Individual life and disability insurance coverage tailored to your income and family needs.",
    whyMatch: "Based on your profile, you may have a protection gap. Life coverage may be worth exploring.",
    stage: "Family protection",
    nextStep: "Learn more",
    link: "#",
  },
  {
    id: "inst-2",
    institution: "Empire Life",
    category: "RRSP / Investment Solutions",
    description: "Registered savings and investment solutions designed to maximize long-term growth.",
    whyMatch: "Your RRSP contribution room may be underused. Structured investment solutions could close your retirement gap.",
    stage: "Retirement planning",
    nextStep: "Explore fit",
    link: "#",
  },
  {
    id: "inst-3",
    institution: "Equitable",
    category: "Disability Insurance",
    description: "Income protection if you're unable to work due to illness or injury.",
    whyMatch: "Your current plan doesn't include disability coverage. This may be relevant given your employment status.",
    stage: "Income protection",
    nextStep: "Learn more",
    link: "#",
  },
];

const CATEGORIES = [
  { id: "all",             label: "All Programs" },
  { id: "tax-savings",     label: "Tax Savings" },
  { id: "housing",         label: "Housing" },
  { id: "education",       label: "Education" },
  { id: "family-children", label: "Family & Children" },
  { id: "retirement",      label: "Retirement" },
  { id: "employment",      label: "Employment" },
  { id: "transportation",  label: "Transportation" },
  { id: "newcomer",        label: "Newcomer" },
];

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-4 w-16 rounded" />
      </div>
      <Skeleton className="h-5 w-4/5" />
      <div className="border-t border-border" />
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      <Skeleton className="h-3.5 w-32" />
      <div className="border-t border-border" />
      <Skeleton className="h-9 w-full rounded-xl" />
    </div>
  );
}

function InstitutionalMatchCard({ item }: {
  item: {
    id: string;
    institution: string;
    category: string;
    description: string;
    whyMatch: string;
    stage: string;
    nextStep: string;
    link: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="glass rounded-xl overflow-hidden border border-white/[0.08]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{item.institution}</p>
            <p className="text-xs text-white/45">{item.category} · {item.stage}</p>
          </div>
        </div>
        <ChevronDown className={cn("h-4 w-4 text-white/30 transition-transform duration-200", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-xs text-white/65 leading-relaxed pt-3">{item.description}</p>
          <div className="bg-blue-500/8 border border-blue-500/15 rounded-xl p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-1">Why this may fit</p>
            <p className="text-xs text-white/55 leading-relaxed italic">{item.whyMatch}</p>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-medium text-white/30 bg-white/[0.05] border border-white/[0.08] rounded-full px-2.5 py-1">
              {item.stage}
            </span>
            <a
              href={item.link}
              className="ml-auto text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              {item.nextStep} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="text-[10px] text-white/25 italic">
            May be relevant based on your profile. Not financial advice. Confirm suitability independently.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Resources() {
  const { plan } = usePlanStore();
  const hasPlan = plan.planCompleted;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const resourcesNarrative = useMemo(
    () =>
      hasPlan
        ? buildResourcesNarrative(plan, resources.length, resources.length)
        : null,
    [hasPlan, plan, resources.length]
  );

  const fetchResources = useCallback(
    async (searchQuery: string, cat: string) => {
      setLoading(true);
      setError(null);
      setSearched(true);

      try {
        const body: Record<string, unknown> = {
          query: searchQuery,
          category: cat === "all" ? undefined : cat,
        };

        if (hasPlan) {
          body.province = plan.profile.province;
          body.goals = plan.goals.filter((g) => g.selected).map((g) => g.goalType);
          body.hasChildren = (plan.profile.numberOfChildren ?? 0) > 0;
          body.ageGroup =
            plan.profile.age < 30 ? "under30"
            : plan.profile.age < 45 ? "30to44"
            : plan.profile.age < 60 ? "45to59"
            : "60plus";
          body.lowIncome = plan.profile.annualGrossIncome < 50000;
        }

        const res = await fetch("/api/resources/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setResources(data.resources ?? []);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load resources.";
        setError(msg);
        setResources([]);
      } finally {
        setLoading(false);
      }
    },
    [hasPlan, plan]
  );

  useEffect(() => {
    fetchResources("", "all");
  }, [fetchResources]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchResources(query, category);
  };

  const handleCategoryClick = (cat: string) => {
    setCategory(cat);
    fetchResources(query, cat);
  };

  return (
    <div className="pb-24 space-y-6">

      {/* ── Page header ──────────────────────────────────────────── */}
      <div className="pb-6 border-b border-white/[0.08]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-flow mb-1.5">
              What do I do?
            </p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">
              Available Resources
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Discover support, benefits, and programs for your goals and needs.{" "}
              {hasPlan
                ? "Results are matched to your profile and goals."
                : "Complete your plan to get personalized matches."}
            </p>
          </div>

          {/* Province pill — only when plan exists */}
          {hasPlan && (
            <div className="shrink-0 flex items-center gap-1.5 rounded-full bg-flow/10 border border-flow/20 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-flow" />
              <span className="text-xs font-semibold text-flow">
                {plan.profile.province}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search programs, benefits, credits…"
            className="pl-10 h-11 text-sm"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 px-5 bg-flow hover:bg-flow-dark text-white gap-2 shrink-0"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><Search className="h-4 w-4" />Search</>
          }
        </Button>
      </form>

      {/* ── Category chips — horizontal scroll on mobile ─────────── */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2 flex-nowrap min-w-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap shrink-0",
                category === cat.id
                  ? "bg-primary/20 text-white border-primary/40 shadow-sm"
                  : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Plan-aware value summary ──────────────────────────────── */}
      {hasPlan && resourcesNarrative && (
        <div className="glass rounded-xl p-4 border border-primary/20 space-y-3">
          <div className="flex items-start gap-3">
            <Sparkles className="h-4 w-4 text-flow-interactive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">
                Potential opportunities matched to your profile
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {resourcesNarrative.summaryStatement}
              </p>
              {resourcesNarrative.estimatedValueStatement && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {resourcesNarrative.estimatedValueStatement}
                </p>
              )}
            </div>
          </div>
          {resourcesNarrative.topOpportunities.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-white/10">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Top opportunities to explore
              </p>
              {resourcesNarrative.topOpportunities.map((opp, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">{opp}</p>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/50 italic pt-1">
                Amounts are estimates. Confirm eligibility through official government sources.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Resources assistant ─────────────────────────────────── */}
      {hasPlan && plan.results && (
        <SectionAssistant
          section="resources"
          plan={plan}
          results={plan.results}
          label="Available Resources"
          standalone
        />
      )}

      {/* ── No-plan nudge ────────────────────────────────────────── */}
      {!hasPlan && (
        <div className="glass rounded-xl p-4 flex items-start gap-3 border-primary/20">
          <BookOpen className="h-5 w-5 text-flow shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              Get personalized program matches
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Complete your financial plan to see programs filtered to your province,
              income level, goals, and family situation.
            </p>
          </div>
        </div>
      )}

      {/* ── Error state ──────────────────────────────────────────── */}
      {error && !loading && (
        <div className="glass rounded-xl p-4 border-destructive/30">
          <p className="text-sm font-semibold text-destructive mb-1">
            Could not load resources
          </p>
          <p className="text-xs text-muted-foreground">
            {error} — Make sure the API server is running:{" "}
            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              npm run dev
            </code>
          </p>
        </div>
      )}

      {/* ── Results ──────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : searched && resources.length === 0 && !error ? (
        <div className="text-center py-20 space-y-3">
          <div className="h-12 w-12 rounded-xl bg-white/8 flex items-center justify-center mx-auto">
            <BookOpen className="h-6 w-6 text-white/40" />
          </div>
          <p className="text-sm font-semibold text-foreground">No programs found</p>
          <p className="text-xs text-muted-foreground">
            Try different keywords or select a different category.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setQuery(""); handleCategoryClick("all"); }}
          >
            Clear filters
          </Button>
        </div>
      ) : resources.length > 0 ? (
        <div className="space-y-4">
          {/* Result count — narrative-aware when plan is present */}
          <p className="text-xs text-muted-foreground">
            {hasPlan && resourcesNarrative
              ? resourcesNarrative.summaryStatement
              : `${resources.length} program${resources.length !== 1 ? "s" : ""} found`}
          </p>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>

          {/* Footer disclaimer */}
          <p className="text-xs text-muted-foreground text-center pt-2 pb-2">
            Program details are for informational purposes only. Visit official
            government sites to confirm eligibility and apply.
          </p>
        </div>
      ) : null}

      {/* ── Institutional Matches ─────────────────────────────────── */}
      {hasPlan && (
        <div className="space-y-4 mt-8">
          <div className="flex items-center gap-3 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <Building2 className="h-4 w-4 text-indigo-400" />
            <div>
              <p className="text-sm font-semibold text-white">Institutional Matches</p>
              <p className="text-xs text-white/40">Products and solutions matched to your profile</p>
            </div>
          </div>
          <div className="space-y-2">
            {INSTITUTIONAL_PLACEHOLDERS.map((item) => (
              <InstitutionalMatchCard key={item.id} item={item} />
            ))}
          </div>
          <p className="text-[10px] text-white/25 text-center italic pt-2">
            Institutional matches are shown based on your profile and plan. Not financial advice.
            Additional providers including Transamerica, Beneva, B2B Bank, Ivari, IA Clarington,
            Foresters, Everest, People Corporation, THIA/RIMI, and Travelance will be supported.
          </p>
        </div>
      )}
    </div>
  );
}
