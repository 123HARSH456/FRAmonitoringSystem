import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { getStateById } from "../../data/statesData";
import { getClaimsByState } from "../../data/mockClaims";
import { formatNumber, formatArea } from "../../utils/formatters";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import StateGISMap from "../../components/StateMap/StateGISMap";
import ClaimInvestigationPanel from "../../components/ClaimPanel/ClaimInvestigationPanel";
import { Filter } from "lucide-react";

export default function StateMonitoringPage() {
  const { stateId } = useParams();

  const state = getStateById(stateId || "mp") || getStateById("mp");
  const allClaims = useMemo(() => getClaimsByState(state.id), [state.id]);

  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState(allClaims[0] || null);

  const filteredClaims = useMemo(() => {
    return allClaims.filter((claim) => {
      const matchDistrict = selectedDistrict === "all" || claim.district === selectedDistrict;
      const matchSeverity = selectedSeverity === "all" || claim.severity === selectedSeverity;
      return matchDistrict && matchSeverity;
    });
  }, [allClaims, selectedDistrict, selectedSeverity]);

  return (
    <div className="space-y-4 pb-12">
      {/* Dynamic Breadcrumbs */}
      <Breadcrumbs
        state={state}
        district={selectedDistrict !== "all" ? selectedDistrict : null}
        claimId={selectedClaim?.id}
      />

      {/* State Monitoring Header & Telemetry Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-panel rounded-xl p-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>2D LEAFLET WEBGIS SPATIAL SURVEILLANCE</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight mt-0.5">
            {state.name.toUpperCase()} FRA CLAIM MONITORING
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cadastral parcel surveillance integrated with Esri High-Resolution World Imagery & Bhuvan LULC.
          </p>
        </div>

        {/* 4 State KPI Counters */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
          <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px]">TOTAL CLAIMS</div>
            <div className="text-base font-bold text-white">
              {formatNumber(state.stats.totalClaims)}
            </div>
          </div>

          <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px]">PENDING</div>
            <div className="text-base font-bold text-blue-400">
              {formatNumber(state.stats.pendingClaims)}
            </div>
          </div>

          <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[10px]">ANOMALIES</div>
            <div className="text-base font-bold text-amber-400">
              {formatNumber(state.stats.anomalies)}
            </div>
          </div>

          <div className="bg-slate-900/90 px-3 py-2 rounded-lg border border-rose-900/50">
            <div className="text-rose-400 text-[10px]">CRITICAL</div>
            <div className="text-base font-bold text-rose-400 flex items-center gap-1.5">
              <span>{state.stats.criticalAnomalies}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left WebGIS Map + Right Investigation Panel & Claim List */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left GIS Section (Col 1-7 or 1-8) */}
        <div className="xl:col-span-7 space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Districts ({state.districts.length})</option>
                {state.districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Severity:</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Only</option>
                <option value="review">Needs Review</option>
                <option value="normal">Normal</option>
              </select>
            </div>

            <span className="text-slate-500 text-[11px]">
              Showing {filteredClaims.length} parcels
            </span>
          </div>

          {/* Leaflet WebGIS Map */}
          <StateGISMap
            state={state}
            claims={filteredClaims}
            selectedClaim={selectedClaim}
            onSelectClaim={(claim) => setSelectedClaim(claim)}
          />

          {/* Map instructions reminder */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
            <span>Click any claim polygon or anomaly marker on the map to inspect AI assessment</span>
            <span className="text-cyan-400">Esri World Imagery 0.3m Resolution</span>
          </div>
        </div>

        {/* Right Section: Investigation Panel & Claims Queue (Col 8-12) */}
        <div className="xl:col-span-5 space-y-4">
          {/* Active Claim Investigation Panel */}
          {selectedClaim ? (
            <ClaimInvestigationPanel
              claim={selectedClaim}
              onClose={() => setSelectedClaim(null)}
            />
          ) : (
            <div className="glass-panel rounded-xl p-6 border border-slate-800 text-center font-mono text-xs text-slate-400">
              <p>Select a claim from the map or directory below to inspect anomaly telemetry.</p>
            </div>
          )}

          {/* Synthetic Claims Queue / Roster */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono">
                  DEMARCATED CLAIMS QUEUE
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                  {filteredClaims.length}
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-400/90">
                SYNTHETIC TEST SAMPLES
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredClaims.map((c) => {
                const isSelected = selectedClaim?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedClaim(c)}
                    className={`p-3 rounded-lg border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-cyan-950/50 border-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.id}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded uppercase font-semibold ${
                            c.severity === "critical"
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : c.severity === "review"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          }`}
                        >
                          {c.severity}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.district} • {c.claimType.split(" ")[0]} • {formatArea(c.claimedAreaHa)}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-cyan-400">
                        Score {c.aiScore}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.processingDays} days
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
