import { useState, useMemo, useEffect, useRef } from "react";
import { X, Search, Compass, ChevronRight } from "lucide-react";
import { formatNumber } from "../../utils/formatters";

export default function StateBottomSheet({
  isOpen,
  onClose,
  states = [],
  selectedState,
  onSelectState,
  onNavigateState,
  getStateMetrics,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const inputRef = useRef(null);

  // Focus search input when sheet opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 150);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
      };
    } else {
      document.body.style.overflow = "";
      setSearchTerm("");
    }
  }, [isOpen]);

  // Filter states by name or code
  const filteredStates = useMemo(() => {
    if (!searchTerm.trim()) return states;
    const term = searchTerm.toLowerCase().trim();
    return states.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.code.toLowerCase().includes(term)
    );
  }, [states, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] lg:hidden flex flex-col justify-end">
      {/* Dimmed & Blurred Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet Drawer */}
      <div
        className="relative w-full max-h-[84vh] bg-[#180b15] border-t border-[#49243E] rounded-t-2xl shadow-2xl flex flex-col z-[10001] animate-in slide-in-from-bottom duration-250 ease-out"
        role="dialog"
        aria-modal="true"
        aria-label="Select State"
      >
        {/* Drag Handle Indicator */}
        <div className="w-full flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-white/25" />
        </div>

        {/* Sheet Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#49243E]/70">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#DBAFA0]" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Select State
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#241120] text-[#DBAFA0] border border-[#49243E]">
              {states.length} States &amp; UTs
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#241120] hover:bg-[#35182e] border border-[#49243E] text-[#c2a3b0] hover:text-white transition-colors"
            aria-label="Close state selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#49243E]/50">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-[#c2a3b0]/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by state name or code (e.g. MH, MP)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#241120] border border-[#49243E] rounded-xl text-slate-100 placeholder-[#c2a3b0]/60 focus:outline-none focus:border-[#BB8493] font-mono"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#c2a3b0] hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable State List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
          {filteredStates.map((s) => {
            const isSelected = selectedState?.id === s.id;
            const sStats = getStateMetrics ? getStateMetrics(s) : null;
            const claimsCount = sStats ? formatNumber(sStats.totalClaims) : "0";
            const alertsCount = sStats?.criticalAnomalies || 0;

            return (
              <div
                key={s.id}
                onClick={() => {
                  if (isSelected && onNavigateState) {
                    onNavigateState(s);
                  } else {
                    onSelectState(s);
                    onClose();
                  }
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between text-xs font-mono active:scale-[0.99] cursor-pointer ${
                  isSelected
                    ? "bg-[#49243E]/90 border-[#BB8493] text-white shadow-[0_0_15px_rgba(187,132,147,0.3)]"
                    : "bg-[#241120]/80 border-[#49243E]/60 text-[#c2a3b0] hover:bg-[#35182e] hover:border-[#704264]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isSelected ? "bg-[#DBAFA0] ring-2 ring-white/40" : "bg-[#704264]"
                    }`}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-xs text-white truncate">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-[#c2a3b0]/70">
                      {s.code} • {s.districts?.length || s.stats?.districtsCount || 0} Districts
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alertsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800/80 font-semibold text-[9px]">
                      {alertsCount} alert{alertsCount > 1 ? "s" : ""}
                    </span>
                  )}
                  {isSelected && onNavigateState ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigateState(s);
                      }}
                      className="px-2 py-1 rounded bg-[#704264] hover:bg-[#864e77] text-white font-bold text-[10px] flex items-center gap-1 border border-[#BB8493]/40"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  ) : (
                    <>
                      <span className="text-[11px] font-semibold text-slate-200">
                        {claimsCount} claims
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-[#c2a3b0]/60" />
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filteredStates.length === 0 && (
            <div className="text-center py-8 text-[#c2a3b0] text-xs font-mono">
              No states match &ldquo;{searchTerm}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
