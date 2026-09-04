import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/common/Header";
import NationalOverviewPage from "./pages/NationalOverview/NationalOverviewPage";
import StateMonitoringPage from "./pages/StateMonitoring/StateMonitoringPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
        {/* Command Center Top Navigation */}
        <Header />

        {/* Primary Viewport Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 pt-5">
          <Routes>
            <Route path="/" element={<NationalOverviewPage />} />
            <Route path="/state/:stateId" element={<StateMonitoringPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Command Center Footer Telemetry */}
        <footer className="border-t border-slate-900 bg-[#05080e] py-4 px-4 lg:px-8 text-center text-xs font-mono text-slate-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              FRA INTELLIGENCE COMMAND CENTER • MINISTRY OF TRIBAL AFFAIRS (DEMO PROTOTYPE)
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span>ESRI WORLD IMAGERY</span>
              <span>•</span>
              <span>BHUVAN LULC AOI</span>
              <span>•</span>
              <span className="text-amber-400/80">SYNTHETIC CLAIMS DATA</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
