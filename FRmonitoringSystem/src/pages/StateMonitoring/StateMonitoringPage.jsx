import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getStateById } from "../../data/statesData";
import {
  fetchEnrichedClaims,
  filterClaimsByState,
  filterClaimsByDistrict,
  getDistrictsSummary,
} from "../../services/claimsService";
import { formatNumber, formatArea } from "../../utils/formatters";
import StateGISMap from "../../components/StateMap/StateGISMap";
import GeminiClaimExplanation from "../../components/ClaimPanel/GeminiClaimExplanation";
import { ArrowLeft } from "lucide-react";

export default function StateMonitoringPage() {
  const { stateId } = useParams();
  const state = getStateById(stateId || "mp") || getStateById("mp");

  const [allClaims, setAllClaims] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [loadingClaims, setLoadingClaims] = useState(true);

  // Load enriched claims merged with ML anomaly detection results
  useEffect(() => {
    let isMounted = true;
    fetchEnrichedClaims()
      .then((claimsList) => {
        if (isMounted) {
          setAllClaims(claimsList);
          setLoadingClaims(false);
        }
      })
      .catch((err) => {
        console.error("Error loading enriched claims:", err);
        if (isMounted) setLoadingClaims(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter claims for this active state
  const stateClaims = useMemo(() => {
    return filterClaimsByState(allClaims, state.name || state.id);
  }, [allClaims, state]);

  // List of districts in this state that have synthetic claims
  const districtsWithClaims = useMemo(() => {
    return getDistrictsSummary(allClaims, state.name || state.id);
  }, [allClaims, state]);

  // Match user-selected district with districts list (case-insensitive & trimmed)
  const activeDistrict = useMemo(() => {
    if (!selectedDistrict) {
      return districtsWithClaims[0]?.district || null;
    }
    const cleanSel = selectedDistrict.toLowerCase().trim();
    const matched = districtsWithClaims.find(
      (d) => d.district.toLowerCase().trim() === cleanSel
    );
    if (matched) return matched.district;

    // Substring or parenthesis fallback (e.g. "Khargone (West Nimar)" vs "Khargone")
    const cleanNoParen = cleanSel.replace(/\s*\([^)]*\)/g, "").trim();
    const fallback = districtsWithClaims.find((d) => {
      const cDist = d.district.toLowerCase().trim();
      const cDistNoParen = cDist.replace(/\s*\([^)]*\)/g, "").trim();
      return (
        cDist === cleanSel ||
        cDistNoParen === cleanNoParen ||
        (cleanNoParen.length > 3 && cDist.includes(cleanNoParen)) ||
        (cDistNoParen.length > 3 && cleanSel.includes(cDistNoParen))
      );
    });
    return fallback ? fallback.district : selectedDistrict;
  }, [selectedDistrict, districtsWithClaims]);

  // Claims belonging specifically to the active district
  const districtClaims = useMemo(() => {
    if (!activeDistrict) return [];
    return filterClaimsByDistrict(stateClaims, activeDistrict);
  }, [stateClaims, activeDistrict]);

  // Ensure activeDistrict is always present in dropdown list
  const allDistrictsForMenu = useMemo(() => {
    const list = [...districtsWithClaims];
    if (
      activeDistrict &&
      !list.some((d) => d.district.toLowerCase().trim() === activeDistrict.toLowerCase().trim())
    ) {
      list.unshift({
        district: activeDistrict,
        total: districtClaims.length,
        high: 0,
        medium: 0,
        low: 0,
      });
    }
    return list;
  }, [districtsWithClaims, activeDistrict, districtClaims.length]);

  // Computed active claim: user-selected if in this state, else first claim in district
  const activeClaim = useMemo(() => {
    if (selectedClaim) {
      if (districtClaims.some((c) => c.id === selectedClaim.id)) {
        return selectedClaim;
      }
      if (stateClaims.some((c) => c.id === selectedClaim.id)) {
        return selectedClaim;
      }
    }
    return districtClaims[0] || stateClaims[0] || null;
  }, [selectedClaim, districtClaims, stateClaims]);

  return (
    <div className="flex-1 flex flex-col lg:h-full min-h-0 space-y-2 lg:overflow-hidden pb-4 lg:pb-0">
      {/* Simple Page Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Back to India Map"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>{state.name} FRA Monitoring</span>
              {activeDistrict && (
                <span className="text-xs text-cyan-400 font-mono font-normal">
                  / {activeDistrict} ({districtClaims.length} claims)
                </span>
              )}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Area: 60% Map + 40% Information Panel (Responsive on mobile) */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch flex-1 w-full h-full min-h-0">
        {/* Large Leaflet Map (Responsive on mobile, 60% on desktop) */}
        <div className="w-full lg:w-[60%] h-[360px] sm:h-[440px] lg:h-full min-h-[320px] sm:min-h-[420px] lg:min-h-0 flex-shrink-0">
          <StateGISMap
            state={state}
            selectedDistrict={activeDistrict}
            onSelectDistrict={(dist) => {
              setSelectedDistrict(dist);
              setSelectedClaim(null);
            }}
            claims={stateClaims}
            selectedClaim={activeClaim}
            onSelectClaim={(claim) => {
              setSelectedClaim(claim);
              if (claim?.district) {
                setSelectedDistrict(claim.district);
              }
            }}
          />
        </div>

        {/* Contextual Information Panel (40% width on desktop) */}
        <div className="w-full lg:w-[40%] flex flex-col gap-3 lg:overflow-y-auto pr-0 lg:pr-1 pb-4 lg:pb-0">
          {/* State & Selected Claim Summary Card */}
          <div className="glass-panel rounded-xl p-4 border border-slate-800 space-y-3.5 font-mono text-xs">
            <div>
              <div className="text-[10px] uppercase text-cyan-400 font-semibold tracking-wider">
                State Overview
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                {state.name}
              </h3>
            </div>

            {/* Key State Metrics */}
            <div className="space-y-2 border-t border-slate-800 pt-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Total claims:</span>
                <span className="font-bold text-white">
                  {formatNumber(state.stats.totalClaims)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pending:</span>
                <span className="font-bold text-blue-400">
                  {formatNumber(state.stats.pendingClaims)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Anomalies:</span>
                <span className="font-bold text-amber-400">
                  {formatNumber(state.stats.anomalies)}
                </span>
              </div>
            </div>

            {/* Compact Claim Details Panel (Contains all 10 required fields) */}
            {activeClaim ? (
              <div className="border-t border-slate-800 pt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] uppercase text-cyan-400 font-semibold tracking-wider">
                    Claim Details
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                      activeClaim.riskLevel === "HIGH"
                        ? "bg-rose-950/80 text-rose-300 border border-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
                        : activeClaim.riskLevel === "MEDIUM"
                        ? "bg-amber-950/80 text-amber-300 border border-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                        : "bg-emerald-950/80 text-emerald-300 border border-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                    }`}
                  >
                    {activeClaim.riskLevel} Risk
                  </span>
                </div>

                {/* 10 Required Items Table */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Claim ID:</span>
                    <span className="font-bold text-white">{activeClaim.claimId}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">State:</span>
                    <span className="font-semibold text-slate-200">{activeClaim.state}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">District:</span>
                    <span className="font-semibold text-cyan-300">{activeClaim.district}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Claimed Area:</span>
                    <span className="font-semibold text-white">{formatArea(activeClaim.claimedArea)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Recorded Area:</span>
                    <span className="font-semibold text-white">{formatArea(activeClaim.recordedArea)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Area Mismatch:</span>
                    <span
                      className={`font-semibold ${
                        activeClaim.areaMismatch > 20 ? "text-rose-400 font-bold" : "text-slate-200"
                      }`}
                    >
                      {activeClaim.areaMismatch.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Processing Days:</span>
                    <span
                      className={`font-semibold ${
                        activeClaim.processingDays > 200 ? "text-amber-400" : "text-slate-200"
                      }`}
                    >
                      {activeClaim.processingDays} days
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Land-Cover Change:</span>
                    <span
                      className={`font-semibold ${
                        activeClaim.landCoverChange < -15 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {activeClaim.landCoverChange > 0 ? "+" : ""}
                      {activeClaim.landCoverChange.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">ML Anomaly Score:</span>
                    <span className="font-bold text-cyan-400">
                      {activeClaim.mlScore.toFixed(1)} / 100
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Risk Level:</span>
                    <span
                      className={`font-bold ${
                        activeClaim.riskLevel === "HIGH"
                          ? "text-rose-400"
                          : activeClaim.riskLevel === "MEDIUM"
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {activeClaim.riskLevel}
                    </span>
                  </div>
                </div>

                {/* Gemini AI Evidence Explanation Layer */}
                <GeminiClaimExplanation key={activeClaim.claimId} claim={activeClaim} />
              </div>
            ) : (
              <div className="border-t border-slate-800 pt-3 text-slate-400 text-xs">
                {loadingClaims
                  ? "Loading claims & ML scores..."
                  : "Click any claim marker or district polygon on the map to inspect."}
              </div>
            )}
          </div>

          {/* District Selector & Parcel List */}
          <div className="glass-panel rounded-xl p-3.5 border border-slate-800 font-mono text-xs space-y-2.5 flex-1 min-h-[220px]">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
              <div>
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                  District Selection
                </span>
                <div className="text-[10px] text-slate-400">
                  {districtsWithClaims.length} districts with synthetic claims
                </div>
              </div>

              {allDistrictsForMenu.length > 0 && (
                <div className="relative">
                  <select
                    value={activeDistrict || ""}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedClaim(null);
                    }}
                    className="bg-slate-900 border border-slate-700 text-cyan-400 font-semibold text-xs rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {allDistrictsForMenu.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district} ({d.total} claims)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Claims in currently selected district */}
            {districtClaims.length > 0 ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Claims in {activeDistrict} ({districtClaims.length})</span>
                  <span>Click to select</span>
                </div>
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                  {districtClaims.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClaim(c)}
                      className={`w-full text-left p-2 rounded border transition-all flex items-center justify-between cursor-pointer ${
                        activeClaim?.id === c.id
                          ? "bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.25)]"
                          : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-800/50"
                      }`}
                    >
                      <div>
                        <span className="font-semibold">{c.claimId}</span>
                        <div className="text-[10px] text-slate-400">
                          {formatArea(c.claimedArea)} • Mismatch: {c.areaMismatch}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-cyan-400">
                          Score: {c.mlScore.toFixed(0)}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold ${
                            c.riskLevel === "HIGH"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : c.riskLevel === "MEDIUM"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          }`}
                        >
                          {c.riskLevel}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">
                {loadingClaims
                  ? "Loading claims..."
                  : "No synthetic claims in this district. Pick a district from the dropdown or click one on the map."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
