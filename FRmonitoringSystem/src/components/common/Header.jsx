import { Shield, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const isStateView = location.pathname.startsWith("/state");

  return (
    <header className="bg-[#080c14] border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Simple Branding */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-all">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">
              CANOPY
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {isStateView && (
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span>India Map</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
