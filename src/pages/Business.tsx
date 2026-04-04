import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import SectionHeader from "@/components/SectionHeader";
import ScenarioCard from "@/components/ScenarioCard";
import InsightCard from "@/components/InsightCard";
import { DollarSign, CreditCard, Vault, Clock, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

const businessScenarios = [
  { title: "Hire vs outsource", description: "Compare the cost and output of hiring a full-time employee versus outsourcing to a contractor.", category: "Operations", complexity: "Moderate" as const },
  { title: "Reinvest profits vs hold cash", description: "Model reinvesting profits for growth against maintaining a larger cash reserve.", category: "Finance", complexity: "Simple" as const },
  { title: "Increase prices vs increase volume", description: "Evaluate revenue impact of raising prices by 10% versus growing customer volume by 15%.", category: "Revenue", complexity: "Moderate" as const },
  { title: "Expand now vs wait", description: "Compare the financial trajectory of expanding operations now versus waiting 12 months.", category: "Strategy", complexity: "Advanced" as const },
];

export default function Business() {
  return (
    <div>
      <PageHeader title="Business" subtitle="Model decisions that affect business stability and growth" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Revenue" value="$28,400.00" change="+8.1% vs last month" changeType="positive" icon={DollarSign} />
        <SummaryCard label="Expenses" value="$19,200.00" change="+3.4% vs last month" changeType="negative" icon={CreditCard} />
        <SummaryCard label="Cash Reserve" value="$42,600.00" change="+$2,400 this month" changeType="positive" icon={Vault} />
        <SummaryCard label="Runway" value="8.4 months" change="If revenue drops 20%: 4.2 mo" changeType="neutral" icon={Clock} />
      </div>

      <div className="mb-8">
        <SectionHeader title="Business scenarios" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businessScenarios.map((s) => (
            <ScenarioCard key={s.title} {...s} />
          ))}
        </div>
      </div>

      <div>
        <SectionHeader title="Business health insights" />
        <div className="space-y-3">
          <InsightCard icon={Clock} title="Reserve covers 3.2 months of expenses" description="Below the recommended 6-month target. Consider allocating more to reserves." category="Liquidity" impact="Medium" action="Run 'Build reserves vs deploy capital' scenario" />
          <InsightCard icon={TrendingUp} title="Current reinvestment rate increases growth" description="Reinvesting 40% of profits is driving 8% month-over-month growth, but reduces financial flexibility." category="Growth" />
          <InsightCard icon={AlertTriangle} title="Revenue concentration risk elevated" description="Top 2 clients represent 62% of total revenue. Consider diversification strategies." category="Risk" impact="High" />
        </div>
      </div>
    </div>
  );
}
