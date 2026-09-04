import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import { STATES_DATA, resolveState } from "../../data/statesData";
import { formatNumber } from "../../utils/formatters";
import {
  AlertOctagon,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ChevronRight,
  Search,
  Eye,
  Layers,
  Sparkles
} from "lucide-react";

// Helper component to lock and fit India bounds neatly
function FitIndiaBounds() {
  const map = useMap();
  useEffect(() => {
    // Exact geographic bounding box for India mainland and islands
    const indiaBounds = [
      [7.5, 68.0],
      [36.8, 97.5],
    ];
    map.fitBounds(indiaBounds, { padding: [15, 15] });
  }, [map]);
  return null;
}

export default function IndiaOverviewMap() {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState(resolveState("mp"));
  const [searchQuery, setSearchQuery] = useState("");
  const [mapStyle, setMapStyle] = useState("dark"); // 'dark' | 'satellite'
  const geoJsonRef = useRef(null);
  const navigate = useNavigate();

  // Load optimized India states GeoJSON
  useEffect(() => {
    fetch("/data/india-states.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load geojson");
        return res.json();
      })
      .then((data) => {
        setGeoData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading India GeoJSON:", err);
        setLoading(false);
      });
  }, []);

  const handleStateSelect = (stateId) => {
    navigate(`/state/${stateId}`);
  };

  const filteredStates = STATES_DATA.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic polygon styling based on critical anomalies and telemetry
  const getStateStyle = (feature) => {
    const stateName = feature.properties.name;
    const state = resolveState(stateName);
    const isCritical = state.stats.criticalAnomalies > 25;

    return {
      fillColor: isCritical ? "#f43f5e" : "#0ea5e9",
      fillOpacity: isCritical ? 0.22 : 0.14,
      color: isCritical ? "rgba(244, 63, 94, 0.75)" : "rgba(56, 189, 248, 0.55)",
      weight: 1.2,
      dashArray: "",
    };
  };

  const onEachFeature = (feature, layer) => {
    const stateName = feature.properties.name;
    const state = resolveState(stateName);

    // High-tech telemetry tooltip attached directly to polygon
    layer.bindTooltip(
      `
      <div style="font-family: monospace; font-size: 11px; color: #f8fafc; line-height: 1.3;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; border-bottom: 1px solid rgba(56,189,248,0.3); padding-bottom: 3px; margin-bottom: 4px;">
          <strong style="color: #38bdf8; font-size: 12px;">${state.name}</strong>
          <span style="color: #94a3b8; font-size: 10px;">${state.code}</span>
        </div>
        <div>Total Claims: <strong>${formatNumber(state.stats.totalClaims)}</strong></div>
        <div style="color: #60a5fa;">Pending: ${formatNumber(state.stats.pendingClaims)}</div>
        <div style="color: ${state.stats.criticalAnomalies > 20 ? '#f43f5e' : '#f59e0b'}; font-weight: bold;">
          Critical: ${state.stats.criticalAnomalies}
        </div>
        <div style="margin-top: 4px; color: #06b6d4; font-size: 10px;">Click to enter State GIS →</div>
      </div>
    `,
      {
        sticky: true,
        className: "custom-leaflet-tooltip",
      }
    );

    // Interactive Hover & Click listeners
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({
          weight: 2.8,
          color: "#38bdf8",
          fillColor: "#06b6d4",
          fillOpacity: 0.5,
        });
        l.bringToFront();
        setHoveredState(state);
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getStateStyle(feature));
      },
      click: () => {
        handleStateSelect(state.id);
      },
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Interactive Real India Map with State Boundaries (Col 1-7) */}
      <div className="lg:col-span-7 glass-panel rounded-xl p-5 border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.06),transparent_70%)]" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase font-mono">
                ACTUAL INDIA STATES BOUNDARIES (GEOJSON)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hover over each individual state to inspect real-time metrics; click to open state WebGIS.
            </p>
          </div>

          {/* Map Style Controls */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setMapStyle("dark")}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${
                mapStyle === "dark"
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Carto Dark</span>
            </button>
            <button
              onClick={() => setMapStyle("satellite")}
              className={`px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer ${
                mapStyle === "satellite"
                  ? "bg-cyan-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Esri Satellite</span>
            </button>
          </div>
        </div>

        {/* The Leaflet Map Container */}
        <div className="relative w-full h-[520px] rounded-lg overflow-hidden border border-slate-800/80 bg-[#060a12]">
          {loading && (
            <div className="absolute inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2 text-cyan-400 font-mono text-xs">
              <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></span>
              <span>Loading official India State Boundaries...</span>
            </div>
          )}

          <MapContainer
            center={[22.5, 82.0]}
            zoom={5}
            minZoom={4}
            maxZoom={9}
            scrollWheelZoom={true}
            className="w-full h-full"
          >
            <FitIndiaBounds />

            {/* Base Tile Layers */}
            {mapStyle === "dark" ? (
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={19}
              />
            ) : (
              <>
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
                <TileLayer
                  attribution="&copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                  opacity={0.6}
                />
              </>
            )}

            {/* Individual State Boundary Polygons with Hover Glow */}
            {geoData && (
              <GeoJSON
                key={`india-states-${mapStyle}`}
                ref={geoJsonRef}
                data={geoData}
                style={getStateStyle}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>

          {/* Bottom HUD bar */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>EACH STATE HOVERABLE &amp; DRILLABLE (35 STATES / UTs)</span>
          </div>

          <div className="absolute bottom-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-md px-2.5 py-1.5 rounded border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-cyan-500/40 border border-cyan-400"></span> Standard
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-400"></span> High Critical
            </span>
          </div>
        </div>
      </div>

      {/* Right: State Telemetry Inspector (Col 8-12) */}
      <div className="lg:col-span-5 space-y-4">
        {hoveredState ? (
          <div className="glass-panel-glow rounded-xl p-5 border border-cyan-500/40 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                    INSPECTED STATE
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    CODE: {hoveredState.code}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  {hoveredState.name}
                </h3>
              </div>
              <button
                onClick={() => handleStateSelect(hoveredState.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
              >
                <span>ENTER GIS</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {hoveredState.description}
            </p>

            {/* 4 Mock Telemetry Metric Tiles */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Total Claims</span>
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-lg font-bold text-white font-mono">
                  {formatNumber(hoveredState.stats.totalClaims)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">CFR &amp; IFR Titles</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Pending</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="text-lg font-bold text-blue-300 font-mono">
                  {formatNumber(hoveredState.stats.pendingClaims)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Under DLC/SDLC</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Anomalies</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div className="text-lg font-bold text-amber-400 font-mono">
                  {formatNumber(hoveredState.stats.anomalies)}
                </div>
                <span className="text-[10px] text-amber-500/80 font-mono">Verification flagged</span>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-rose-900/40">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Critical</span>
                  <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <div className="text-lg font-bold text-rose-400 font-mono flex items-center gap-1.5">
                  <span>{hoveredState.stats.criticalAnomalies}</span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                </div>
                <span className="text-[10px] text-rose-400/80 font-mono">Immediate field action</span>
              </div>
            </div>

            {/* Geographical Context */}
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Recorded Forest Area:</span>
                <span className="text-emerald-400 font-medium">
                  {formatNumber(hoveredState.stats.forestCoverKm2)} km²
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Scheduled Tribes Population:</span>
                <span className="text-cyan-400 font-medium">
                  {hoveredState.stats.tribalPopulationPercent}%
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target High-Activity Districts:</span>
                <span className="text-slate-300 truncate max-w-[200px]">
                  {hoveredState.districts.slice(0, 3).join(", ")}...
                </span>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Directory / State Search */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>PRIMARY PILOT STATES ({filteredStates.length})</span>
            </h4>
            <div className="relative w-40">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search state..."
                className="w-full pl-8 pr-2 py-1 text-xs bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {filteredStates.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStateSelect(s.id)}
                onMouseEnter={() => setHoveredState(s)}
                className={`p-2.5 rounded-lg border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  hoveredState?.id === s.id
                    ? "bg-cyan-950/40 border-cyan-500/60 text-white"
                    : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{s.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{s.code}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
                  <span>{formatNumber(s.stats.totalClaims)} claims</span>
                  <span className="text-rose-400 font-semibold">
                    {s.stats.criticalAnomalies} crit
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
