import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Breadcrumbs({ state, district, claimId, onBack }) {
  const navigate = useNavigate();

  return (
    <nav className="flex flex-wrap items-center justify-between gap-3 px-4 lg:px-8 py-2.5 bg-[#180b15]/80 border-b border-[#49243E]/60 text-xs font-mono">
      <div className="flex items-center gap-2 text-[#c2a3b0]">
        <Link
          to="/"
          className="flex items-center gap-1.5 hover:text-[#DBAFA0] transition-colors text-slate-200 font-medium"
        >
          <Home className="w-3.5 h-3.5 text-[#DBAFA0]" />
          <span>INDIA (NATIONAL)</span>
        </Link>

        {state && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#704264]" />
            <Link
              to={`/state/${state.id}`}
              className={`hover:text-[#DBAFA0] transition-colors ${
                !district && !claimId ? "text-[#DBAFA0] font-semibold" : "text-slate-200"
              }`}
            >
              {state.name.toUpperCase()}
            </Link>
          </>
        )}

        {district && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#704264]" />
            <span className={`${!claimId ? "text-[#DBAFA0] font-semibold" : "text-slate-200"}`}>
              {district.toUpperCase()}
            </span>
          </>
        )}

        {claimId && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#704264]" />
            <span className="text-[#DBAFA0] font-bold bg-[#49243E]/80 px-2 py-0.5 rounded border border-[#BB8493]/50">
              {claimId}
            </span>
          </>
        )}
      </div>

      {state && (
        <button
          onClick={() => (onBack ? onBack() : navigate("/"))}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#241120] hover:bg-[#35182e] text-[#c2a3b0] hover:text-[#DBAFA0] border border-[#704264]/60 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#DBAFA0]" />
          <span>Back to National View</span>
        </button>
      )}
    </nav>
  );
}
