import { useState, useCallback } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Menu,
  X,
  ClipboardList,
  BookOpen,
  User,
  Settings,
  CreditCard,
  LogOut,
  ChevronUp,
  ArrowLeft,
  // Hidden from MVP nav — code references kept
  GitCompareArrows,
  Target,
  Briefcase,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlanStore } from "@/store/planStore";

// MVP visible nav — exact order per spec
const navItems = [
  { label: "My Plan", path: "/app/plan", icon: ClipboardList },
  { label: "Dashboard", path: "/app", icon: LayoutDashboard, exact: true },
  { label: "Resources", path: "/app/resources", icon: BookOpen },
  { label: "Advisor", path: "/app/advisor", icon: MessageSquare },
  // Hidden from MVP nav (code intact):
  // { label: "Compare Paths", path: "/app/scenarios/compare", icon: GitCompareArrows },
  // { label: "Goals", path: "/app/goals", icon: Target },
  // { label: "Insights", path: "/app/insights", icon: Lightbulb },
  // { label: "Business", path: "/app/business", icon: Briefcase },
  // Settings → accessible only via profile menu at bottom-left
];

function ProfileMenu({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const items = [
    { label: "Settings", icon: Settings, path: "/app/settings" },
    { label: "Plans & Pricing", icon: CreditCard, path: "#" },
    { label: "Account", icon: User, path: "#" },
    { label: "Log out", icon: LogOut, path: "#", danger: true },
  ];

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      {/* popover */}
      <div
        className="absolute bottom-full left-0 mb-2 w-52 z-50 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(8,12,36,0.96)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => { navigate(item.path); onClose(); }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
              item.danger
                ? "text-red-400 hover:bg-red-500/10"
                : "text-white/70 hover:text-white hover:bg-white/[0.06]"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </div>
    </>
  );
}

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { plan } = usePlanStore();
  const userName = plan.profile.fullName?.split(" ")[0] || null;
  const healthScore = plan.results?.financialHealthScore ?? null;

  const isActive = useCallback(
    (path: string, exact?: boolean) => {
      if (exact || path === "/app") return location.pathname === path || location.pathname === "/app/";
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <img src="/Flow Favicon.png" alt="Flow" className="h-7 w-7 object-contain shrink-0" />
        <span className="text-base font-semibold tracking-tight text-white">Flow</span>
        <button
          onClick={() => navigate("/")}
          className="ml-auto flex items-center gap-1.5 text-white/40 hover:text-white/80 transition-colors text-xs font-medium px-2 py-1 rounded-lg hover:bg-white/[0.06]"
          title="Back to homepage"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Home
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
              isActive(item.path, item.exact)
                ? "bg-blue-500/15 text-white border border-blue-500/25"
                : "text-white/55 hover:bg-white/[0.06] hover:text-white/85 border border-transparent"
            )}
          >
            <item.icon className="h-[17px] w-[17px] shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Profile area — bottom left, click opens popover */}
      <div className="p-3 shrink-0 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {profileMenuOpen && <ProfileMenu onClose={() => setProfileMenuOpen(false)} />}
        <button
          onClick={() => setProfileMenuOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors text-left group"
        >
          <div className="h-7 w-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <User className="h-3.5 w-3.5 text-blue-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {userName ?? "My Account"}
            </p>
            {healthScore !== null && (
              <p className="text-[10px] text-white/40">Score: {healthScore}/100</p>
            )}
          </div>
          <ChevronUp className={cn("h-3.5 w-3.5 text-white/30 transition-transform", profileMenuOpen ? "rotate-180" : "")} />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Desktop sidebar — fixed glass panel */}
      <aside
        className="hidden lg:flex flex-col w-[240px] fixed inset-y-0 left-0 z-30"
        style={{
          background: "rgba(5,9,28,0.82)",
          backdropFilter: "blur(48px)",
          WebkitBackdropFilter: "blur(48px)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "4px 0 40px rgba(0,0,0,0.35), inset -1px 0 0 rgba(255,255,255,0.04)",
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 flex items-center justify-between px-4"
        style={{
          background: "rgba(5,9,28,0.9)",
          backdropFilter: "blur(32px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-white/40 hover:text-white/80 transition-colors text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <img src="/Flow Favicon.png" alt="Flow" className="h-6 w-6 object-contain" />
            <span className="text-sm font-semibold text-white">Flow</span>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white/60 hover:text-white p-1 transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div
            className="absolute top-14 left-0 w-[240px] bottom-0 flex flex-col"
            style={{
              background: "rgba(5,9,28,0.96)",
              backdropFilter: "blur(48px)",
              borderRight: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-[240px] mt-14 lg:mt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-8 pb-24">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
