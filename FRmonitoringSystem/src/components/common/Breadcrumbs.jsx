import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Breadcrumbs({ state, district, claimId, onBack }) {
  const navigate = useNavigate();

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-8 py-2.5 bg-slate-950/60 border-b border-slate-800/60 text-xs font-mono">
      <div className="flex items-center gap-2 text-slate-400">
        <Link
          to="/"
          className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors text-slate-300 font-medium"
        >
          <Home className="w-3.5 h-3.5 text-cyan-400" />
          <span>INDIA (NATIONAL)</span>
        </Link>

        {state && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <Link
              to={`/state/${state.id}`}
              className={`hover:text-cyan-400 transition-colors ${
                !district && !claimId ? "text-cyan-400 font-semibold" : "text-slate-300"
              }`}
            >
              {state.name.toUpperCase()}
            </Link>
          </>
        )}

        {district && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className={`${!claimId ? "text-cyan-400 font-semibold" : "text-slate-300"}`}>
              {district.toUpperCase()}
            </span>
          </>
        )}

        {claimId && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">
              {claimId}
            </span>
          </>
        )}
      </div>

      {state && (
        <button
          onClick={() => (onBack ? onBack() : navigate("/"))}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Back to National View</span>
        </button>
      )}
    </nav>
  );
}
