import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Scenarios from "@/pages/Scenarios";
import ScenarioCompare from "@/pages/ScenarioCompare";
import Advisor from "@/pages/Advisor";
import Goals from "@/pages/Goals";
import Business from "@/pages/Business";
import Insights from "@/pages/Insights";
import SettingsPage from "@/pages/Settings";
import Planner from "@/pages/Planner";
import Resources from "@/pages/Resources";
import NotFound from "@/pages/NotFound";
import FloatingAdvisor from "@/components/FloatingAdvisor";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  // Don't show floating advisor on planner or landing page
  const showFloating = !location.pathname.startsWith("/app/plan") && location.pathname !== "/";

  return (
    <>
      <Routes>
        {/* MODE 1: Landing/marketing page */}
        <Route path="/" element={<Landing />} />

        {/* Planner — standalone layout (no sidebar) */}
        <Route path="/app/plan" element={<Planner />} />

        {/* MODE 2: Main app with glass sidebar */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="resources" element={<Resources />} />
          <Route path="advisor" element={<Advisor />} />
          {/* Hidden from MVP nav — code intact */}
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="scenarios/compare" element={<ScenarioCompare />} />
          <Route path="goals" element={<Goals />} />
          <Route path="business" element={<Business />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      {showFloating && <FloatingAdvisor />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
