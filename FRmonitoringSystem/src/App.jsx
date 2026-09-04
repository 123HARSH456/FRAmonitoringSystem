import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/common/Header";
import NationalOverviewPage from "./pages/NationalOverview/NationalOverviewPage";
import StateMonitoringPage from "./pages/StateMonitoring/StateMonitoringPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen lg:h-screen bg-[#080c14] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 overflow-y-auto lg:overflow-hidden">
        {/* Simple Header */}
        <Header />

        {/* Primary Viewport Area (Responsive scroll on mobile, contained on desktop) */}
        <main className="flex-1 w-full px-3 lg:px-5 py-2 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden">
          <Routes>
            <Route path="/" element={<NationalOverviewPage />} />
            <Route path="/state/:stateId" element={<StateMonitoringPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
