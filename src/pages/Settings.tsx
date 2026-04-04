import PageHeader from "@/components/PageHeader";
import SectionHeader from "@/components/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { ExternalLink, Check, Wifi } from "lucide-react";

const connections = [
  { name: "Bank Account", status: "Connected", lastSync: "2 minutes ago" },
  { name: "Investment Account", status: "Not connected", lastSync: null },
  { name: "Business Account", status: "Not connected", lastSync: null },
];

export default function SettingsPage() {
  const [riskProfile, setRiskProfile] = useState([5]);

  const riskLabel = riskProfile[0] <= 3 ? "Conservative" : riskProfile[0] <= 6 ? "Moderate" : "Aggressive";

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="max-w-2xl space-y-8">
        {/* Profile */}
        <section>
          <SectionHeader title="Profile" />
          <div className="glass rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">First name</label>
                <Input defaultValue="Alex" className="bg-white/5" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Last name</label>
                <Input defaultValue="Morgan" className="bg-white/5" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <Input defaultValue="alex@example.com" className="bg-white/5" />
            </div>
            <Button size="sm">Save Changes</Button>
          </div>
        </section>

        {/* Risk Profile */}
        <section>
          <SectionHeader title="Risk Profile" />
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">Adjust your risk tolerance for scenario modeling</p>
              <span className="text-sm font-medium text-foreground">{riskProfile[0]}/10 — {riskLabel}</span>
            </div>
            <Slider value={riskProfile} onValueChange={setRiskProfile} min={1} max={10} step={1} className="mb-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Conservative</span>
              <span>Aggressive</span>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <SectionHeader title="Notification Preferences" />
          <div className="glass rounded-xl p-5 space-y-4">
            {[
              { label: "Weekly financial summary", desc: "Receive a summary of your financial position every Monday" },
              { label: "Insight alerts", desc: "Get notified when new insights are generated" },
              { label: "Goal milestones", desc: "Receive alerts when you reach goal milestones" },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{n.label}</p>
                  <p className="text-xs text-muted-foreground">{n.desc}</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </section>

        {/* Data Connections */}
        <section>
          <SectionHeader title="Data Connections" />
          <div className="space-y-3">
            {connections.map((c) => (
              <div key={c.name} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wifi className="h-4 w-4 text-flow-interactive" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{c.name}</p>
                    {c.lastSync && <p className="text-xs text-muted-foreground">Last synced: {c.lastSync}</p>}
                  </div>
                </div>
                {c.status === "Connected" ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <Check className="h-3 w-3" /> Connected
                  </span>
                ) : (
                  <Button variant="outline" size="sm">Connect</Button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section>
          <SectionHeader title="Privacy & Security" />
          <div className="glass rounded-xl p-5 space-y-3">
            <Button variant="outline" size="sm">Change Password</Button>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <a href="#" className="hover:text-foreground flex items-center gap-1">Terms of Service <ExternalLink className="h-3 w-3" /></a>
              <a href="#" className="hover:text-foreground flex items-center gap-1">Privacy Policy <ExternalLink className="h-3 w-3" /></a>
              <a href="#" className="hover:text-foreground flex items-center gap-1">Support <ExternalLink className="h-3 w-3" /></a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
