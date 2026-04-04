import { Button } from "@/components/ui/button";
import { Compass, CheckCircle2, TrendingUp, Target, Lightbulb } from "lucide-react";

interface StepWelcomeProps {
  onStart: () => void;
  onContinue?: () => void;
  hasPlan?: boolean;
}

const features = [
  {
    icon: TrendingUp,
    title: "See your financial future",
    desc: "Understand where you are headed if you continue as-is, and what changes improve your outlook.",
  },
  {
    icon: Target,
    title: "Plan for your real goals",
    desc: "Buy a home, pay off debt, retire comfortably — get a personalized path for each goal.",
  },
  {
    icon: Lightbulb,
    title: "Get clear, actionable guidance",
    desc: "No jargon. Flow explains Canadian accounts like TFSA, RRSP, and FHSA in plain language.",
  },
];

export default function StepWelcome({ onStart, onContinue, hasPlan }: StepWelcomeProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-2xl mx-auto py-8 px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <Compass className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
        Your personalized financial plan,
        <br />
        <span className="text-primary">built for your life in Canada</span>
      </h1>

      <p className="text-base text-muted-foreground mb-10 max-w-lg">
        Whether you're new to Canada or simply new to financial planning, Flow
        helps you understand where you stand, where you're headed, and what to do
        next — in plain language.
      </p>

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10">
        {features.map((f) => (
          <div
            key={f.title}
            className="glass rounded-xl p-5 text-left"
          >
            <f.icon className="h-5 w-5 text-primary mb-3" />
            <h3 className="text-sm font-semibold text-card-foreground mb-1">
              {f.title}
            </h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-8">
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        Your data is saved locally on this device. No account required. You can
        update your plan anytime.
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <Button size="lg" className="sm:px-10 text-base" onClick={onStart}>
          Start My Financial Plan
        </Button>
        {hasPlan && onContinue && (
          <Button
            size="lg"
            variant="outline"
            className="sm:px-10 text-base"
            onClick={onContinue}
          >
            Continue My Plan
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Takes about 8 minutes to complete. You can save and return anytime.
      </p>
    </div>
  );
}
