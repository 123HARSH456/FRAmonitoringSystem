import IndiaOverviewMap from "../../components/NationalMap/IndiaOverviewMap";

export default function NationalOverviewPage() {
  return (
    <div className="flex-1 flex flex-col lg:h-full min-h-0 space-y-2 lg:overflow-hidden pb-4 lg:pb-0">
      {/* Concise Inline Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
          <span>India FRA Monitoring</span>
          <span className="text-xs text-[#c2a3b0] font-normal hidden sm:inline">
            — Select a state on the map to inspect claims
          </span>
        </h2>
      </div>

      {/* Main Map & Info Panel (Responsive on mobile, 60/40 on desktop) */}
      <IndiaOverviewMap />
    </div>
  );
}
