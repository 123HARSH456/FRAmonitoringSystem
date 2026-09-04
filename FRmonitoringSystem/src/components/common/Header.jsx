import { Shield, AlertTriangle, ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-[#080c14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Branding & Hierarchy */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                  FRA INTELLIGENCE
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono">
                  v1.0-DEMO
                </span>
              </div>
              <h1 className="text-base lg:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                COMMAND CENTER
                <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                  — Forest Rights Act Spatial Decision Support
                </span>
              </h1>
            </div>
          </Link>
        </div>

        {/* Center: MANDATORY HACKATHON DISCLAIMER (per DESIGN.md lines 110-113) */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-mono tracking-wide">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold uppercase text-[11px] sm:text-xs">
            DEMONSTRATION DATA / SYNTHETIC FRA CLAIMS
          </span>
        </div>

        {/* Right: Telemetry & Live Status */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>BHUVAN GIS: ONLINE</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium ${
                location.pathname === "/"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              National Map
            </Link>
            <Link
              to="/state/mp"
              className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium flex items-center gap-1 ${
                location.pathname.startsWith("/state")
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <span>State GIS</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
