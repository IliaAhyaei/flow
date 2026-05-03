import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, TrendingUp, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Feature data ──────────────────────────────────────────────────────────
const features = [
  {
    number: "01",
    title: "Evaluate where you are now",
    description: "A simple planning flow that captures your financial position and goals — so you always know your starting point.",
    image: "/images/box1.png",
  },
  {
    number: "02",
    title: "See your full picture in one dashboard",
    description: "View cash flow, breakdowns, key risks, and what you may be missing — all in one place.",
    image: "/images/box2.png",
  },
  {
    number: "03",
    title: "Get matched with resources and next steps",
    description: "Flow matches relevant government and institutional resources to your profile and explains why they fit.",
    image: "/images/box3.png",
  },
  {
    number: "04",
    title: "Ask your 24/7 advisor",
    description: "Ask questions anytime and get answers grounded in your profile, plan, and analysis.",
    image: "/images/box4.png",
  },
];

// ─── Scenario cards ────────────────────────────────────────────────────────
const scenarios = [
  {
    stage: "Start Strong",
    tagline: "Build the right habits from day one.",
    topics: ["Cash flow awareness", "First savings strategy", "Avoiding costly early mistakes", "Understanding where money goes"],
    icon: TrendingUp,
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/25",
  },
  {
    stage: "Optimize Intelligently",
    tagline: "Structure your money to work harder.",
    topics: ["TFSA / RRSP / FHSA strategy", "Debt elimination approach", "Tax efficiency basics", "Medium-term goal planning"],
    icon: Shield,
    gradient: "from-indigo-500/20 to-blue-500/10",
    border: "border-indigo-500/30",
    elevated: true,
  },
  {
    stage: "Plan Further Ahead",
    tagline: "Evolve your plan as life evolves.",
    topics: ["Retirement planning", "Education planning for children", "Protection & life planning", "Changing needs over time"],
    icon: Clock,
    gradient: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/25",
  },
];

// ─── Landing Page ──────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const [activeBox, setActiveBox] = useState(0);

  const handleEnterApp = () => navigate("/app");

  return (
    <div className="min-h-screen text-white">

      {/* ── Nav bar ──────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 lg:px-12"
        style={{
          background: "rgba(5,9,24,0.35)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2">
          <img src="/Flow Favicon.png" alt="Flow" className="h-7 w-7 object-contain shrink-0" />
          <span className="text-base font-semibold tracking-tight">Flow</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className="text-sm text-white/55 hover:text-white/90 transition-colors hidden sm:block"
          >
            Dashboard
          </button>
          <Button
            size="sm"
            onClick={handleEnterApp}
            className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border-0"
          >
            Enter Flow <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </header>

      {/* ── SECTION 1: Hero ────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-6 lg:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Copy */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1.5 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-medium text-blue-300">Your financial clarity platform</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
              Meet{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Flow
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-white/70 leading-relaxed mb-4 max-w-lg">
              Understand where your money actually goes. See what you're missing. Know exactly what to do next.
            </p>
            <p className="text-base text-white/45 leading-relaxed mb-8 max-w-md">
              Flow analyzes your complete financial picture and surfaces personalized opportunities — government programs, registered accounts, smart debt strategy — matched to your life.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleEnterApp}
                className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 px-8 text-base font-semibold"
                style={{ boxShadow: "0 0 24px rgba(59,130,246,0.4)" }}
              >
                Enter Flow <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleEnterApp}
                className="gap-2 border-white/15 text-white/70 hover:text-white hover:border-white/30 text-base"
              >
                See the dashboard
              </Button>
            </div>
          </div>

          {/* Right: 2 phone images — bare, no card */}
          <div className="flex justify-center lg:justify-end">
            <div className="flex items-end justify-center gap-2 py-10">
              {/* Left phone — rotate -8deg, nudged right */}
              <img
                src="/images/box1.png"
                alt="Flow app screen"
                className="w-[310px] lg:w-[380px] rounded-3xl block shrink-0"
                style={{
                  transform: "rotate(-8deg) translateY(14px) translateX(32px)",
                  filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.65))",
                }}
              />

              {/* Right phone — rotate +8deg, nudged left */}
              <img
                src="/images/box2.png"
                alt="Flow app screen"
                className="w-[310px] lg:w-[380px] rounded-3xl block shrink-0"
                style={{
                  transform: "rotate(8deg) translateY(14px) translateX(-32px)",
                  filter: "drop-shadow(0 32px 48px rgba(0,0,0,0.65))",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: What does Flow include? ─────────────────────── */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto overflow-visible">

        {/* Large centered title */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">
            What does Flow include?
          </h2>
          <p className="text-sm text-white/45 mt-3 max-w-md mx-auto leading-relaxed">
            Everything you need to understand your finances and take control.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: active box image — bare, no card */}
          <div className="flex justify-center overflow-visible">
            <div className="relative w-[620px] lg:w-[760px]" style={{ transform: "translateY(-60px)" }}>
              {features.map((f, i) => (
                <img
                  key={f.number}
                  src={f.image}
                  alt={f.title}
                  className="w-full h-auto block rounded-3xl transition-opacity duration-300"
                  style={{
                    position: i === activeBox ? "relative" : "absolute",
                    top: 0,
                    left: 0,
                    opacity: i === activeBox ? 1 : 0,
                    pointerEvents: "none",
                    filter: "drop-shadow(0 24px 40px rgba(0,0,0,0.5))",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Right: 4 clickable boxes — no glass/background */}
          <div className="space-y-3">
            {features.map((f, i) => (
              <div
                key={f.number}
                onClick={() => setActiveBox(i)}
                className="rounded-2xl p-5 border cursor-pointer select-none transition-all duration-200"
                style={
                  activeBox === i
                    ? {
                        borderColor: "rgba(96,165,250,0.5)",
                        transform: "scale(1.025)",
                      }
                    : {
                        borderColor: "rgba(255,255,255,0.08)",
                      }
                }
              >
                <div className="flex items-start gap-4">
                  <span
                    className="text-xs font-bold tabular-nums mt-0.5 shrink-0 transition-colors duration-200"
                    style={{ color: activeBox === i ? "rgba(147,197,253,0.9)" : "rgba(96,165,250,0.5)" }}
                  >
                    {f.number}
                  </span>
                  <div>
                    <p className="text-base font-semibold text-white mb-1 leading-snug">{f.title}</p>
                    <p className="text-sm text-white/55 leading-relaxed">{f.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: Flow evolves with you + Gallery + Stage cards ── */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400 mb-3">
            Built for every stage
          </p>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">
            Flow evolves with you.
          </h2>
          <p className="text-sm text-white/50 max-w-lg mx-auto leading-relaxed">
            From your first paycheque to retirement, Flow adapts its analysis and recommendations to where you are — and where you're going.
          </p>
        </div>

        {/* Gallery — vertical column layering */}
        <div className="flex gap-4 items-start mb-16">

          {/* Left column — starts 36px lower than center */}
          <div className="flex-1 flex flex-col gap-4" style={{ paddingTop: "36px" }}>
            <img src="/images/alex11.png" alt="" className="w-full h-auto block rounded-2xl" />
            <img src="/images/alex21.png" alt="" className="w-full h-auto block rounded-2xl" />
          </div>

          {/* Center column — highest anchor, ConfusedAlex first then Alex22 bridge */}
          <div className="flex-1 flex flex-col gap-4">
            <img src="/images/confusedAlex.png" alt="" className="w-full h-auto block rounded-2xl" />
            <img src="/images/alex22.png" alt="" className="w-full h-auto block rounded-2xl" />
          </div>

          {/* Right column — slightly different offset for asymmetric stagger */}
          <div className="flex-1 flex flex-col gap-4" style={{ paddingTop: "52px" }}>
            <img src="/images/alex13.png" alt="" className="w-full h-auto block rounded-2xl" />
            <img src="/images/alex23.png" alt="" className="w-full h-auto block rounded-2xl" />
          </div>

        </div>

        {/* Stage cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-center">
          {scenarios.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.stage}
                className={`glass rounded-2xl p-6 border bg-gradient-to-br ${s.gradient} ${s.border} ${
                  s.elevated ? "md:-mt-8 md:shadow-2xl" : ""
                }`}
                style={
                  s.elevated
                    ? {
                        boxShadow:
                          "0 0 0 1px rgba(99,102,241,0.2), 0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09)",
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.08] border border-white/10 flex items-center justify-center">
                    <Icon style={{ height: 18, width: 18 }} className="text-white/70" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
                      Stage {i + 1}
                    </p>
                    <p className="text-sm font-bold text-white">{s.stage}</p>
                  </div>
                </div>

                <p className="text-xs text-white/60 leading-relaxed mb-4 italic">{s.tagline}</p>

                <div className="space-y-2">
                  {s.topics.map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-blue-400/60 shrink-0" />
                      <p className="text-[11px] text-white/65 leading-snug">{t}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-lg mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to see your financial picture?
          </h2>
          <p className="text-sm text-white/50 mb-8 leading-relaxed">
            It takes about 8 minutes to build your plan. No jargon. No judgment. Just clarity.
          </p>
          <Button
            size="lg"
            onClick={handleEnterApp}
            className="gap-2 bg-blue-600 hover:bg-blue-500 text-white border-0 px-10 py-6 text-base font-semibold rounded-2xl"
            style={{ boxShadow: "0 0 32px rgba(59,130,246,0.5), 0 8px 24px rgba(0,0,0,0.4)" }}
          >
            Enter Flow <ArrowRight className="h-4 w-4" />
          </Button>
          <p className="text-[11px] text-white/30 mt-4">Free to use. Your data stays private.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.06] text-center">
        <p className="text-[11px] text-white/30">© 2026 Flow. Your financial clarity platform.</p>
      </footer>
    </div>
  );
}
