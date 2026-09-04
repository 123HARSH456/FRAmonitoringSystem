import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Layers, Eye } from "lucide-react";
import { formatArea } from "../../utils/formatters";

// Controller component to smoothly pan/zoom when state changes
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true, duration: 1 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet DivIcon generator for Anomaly Markers (per DESIGN.md lines 118-145)
function createAnomalyMarkerIcon(severity) {
  let color = "#10b981"; // normal: green
  let glowColor = "rgba(16, 185, 129, 0.4)";
  let iconHtml = "✓";

  if (severity === "critical") {
    color = "#f43f5e"; // critical: red
    glowColor = "rgba(244, 63, 94, 0.7)";
    iconHtml = "⚠";
  } else if (severity === "review") {
    color = "#f59e0b"; // review: yellow
    glowColor = "rgba(245, 158, 11, 0.6)";
    iconHtml = "!";
  }

  return L.divIcon({
    className: "custom-anomaly-div-icon",
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -50%);
        cursor: pointer;
      ">
        <div style="
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: #0f172a;
          border: 2px solid ${color};
          box-shadow: 0 0 12px ${glowColor};
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${color};
          font-weight: 800;
          font-size: 13px;
          font-family: monospace;
        ">
          ${iconHtml}
        </div>
        ${
          severity === "critical"
            ? `<span style="
                position: absolute;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                border: 1px solid ${color};
                animation: pulse-critical 2s infinite ease-in-out;
                pointer-events: none;
              "></span>`
            : ""
        }
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function StateGISMap({ state, claims, selectedClaim, onSelectClaim }) {
  const [activeLayer, setActiveLayer] = useState("satellite"); // 'satellite' | 'dark'

  return (
    <div className="relative w-full h-[620px] rounded-xl overflow-hidden border border-slate-800 glass-panel shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
      {/* Top Map HUD overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-700/80 text-xs font-mono flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
          <span className="font-bold text-slate-200">
            {state.name.toUpperCase()} WEBGIS
          </span>
        </div>
        <span className="text-slate-500">|</span>
        <span className="text-cyan-400">{claims.length} Demarcated Claims</span>
      </div>

      {/* Layer Toggle Button Group HUD */}
      <div className="absolute top-3 right-3 z-[1000] bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-slate-700/80 text-xs font-mono flex items-center gap-1">
        <button
          onClick={() => setActiveLayer("satellite")}
          className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
            activeLayer === "satellite"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Esri Satellite</span>
        </button>
        <button
          onClick={() => setActiveLayer("dark")}
          className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 cursor-pointer ${
            activeLayer === "dark"
              ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Carto Dark</span>
        </button>
      </div>

      {/* Map Legend (DESIGN.md requirement) */}
      <div className="absolute bottom-6 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md p-3 rounded-lg border border-slate-800 text-xs font-mono space-y-2">
        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          GIS MAP LEGEND
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3.5 h-3.5 rounded bg-rose-500/30 border border-rose-500 flex items-center justify-center text-[10px] text-rose-400 font-bold">
            ⚠
          </span>
          <span>Critical Anomaly (Score ≥ 60)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3.5 h-3.5 rounded bg-amber-500/30 border border-amber-500 flex items-center justify-center text-[10px] text-amber-400 font-bold">
            !
          </span>
          <span>Needs Review (Score 30–59)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-3.5 h-3.5 rounded bg-emerald-500/30 border border-emerald-500 flex items-center justify-center text-[10px] text-emerald-400 font-bold">
            ✓
          </span>
          <span>Normal Claim (Score &lt; 30)</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-[11px] pt-1 border-t border-slate-800">
          <span className="w-4 h-2 rounded border border-cyan-400 bg-cyan-500/20"></span>
          <span>Claim Cadastral Polygon</span>
        </div>
      </div>

      {/* Leaflet MapContainer */}
      <MapContainer
        center={state.center}
        zoom={state.zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <MapController center={state.center} zoom={state.zoom} />

        {/* Primary Esri World Imagery (High-Resolution Satellite) */}
        {activeLayer === "satellite" && (
          <>
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
            />
            {/* Esri Reference Boundaries & Places overlay for context */}
            <TileLayer
              attribution='&copy; Esri'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              maxZoom={18}
              opacity={0.7}
            />
          </>
        )}

        {/* Alternate CartoDB Dark Matter Layer for Cyber Command Center look */}
        {activeLayer === "dark" && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />
        )}

        {/* Render Synthetic Claim Polygons & Overlaid Anomaly Markers */}
        {claims.map((claim) => {
          const isSelected = selectedClaim?.id === claim.id;
          let polyColor = "#10b981";
          if (claim.severity === "critical") polyColor = "#f43f5e";
          else if (claim.severity === "review") polyColor = "#f59e0b";

          return (
            <div key={claim.id}>
              {/* Claim Boundary Polygon (DESIGN.md line 120-136) */}
              <Polygon
                positions={claim.polygon}
                pathOptions={{
                  color: isSelected ? "#38bdf8" : polyColor,
                  weight: isSelected ? 3 : 2,
                  fillColor: polyColor,
                  fillOpacity: isSelected ? 0.45 : 0.25,
                  dashArray: isSelected ? "4 4" : undefined,
                }}
                eventHandlers={{
                  click: () => onSelectClaim(claim),
                }}
              >
                <Popup>
                  <div className="font-mono text-xs p-1 space-y-1">
                    <div className="font-bold text-white flex items-center justify-between gap-2">
                      <span>{claim.id}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          claim.severity === "critical"
                            ? "bg-rose-950 text-rose-300 border border-rose-700"
                            : claim.severity === "review"
                            ? "bg-amber-950 text-amber-300 border border-amber-700"
                            : "bg-emerald-950 text-emerald-300 border border-emerald-700"
                        }`}
                      >
                        {claim.severity}
                      </span>
                    </div>
                    <div className="text-slate-300">
                      <p><strong>District:</strong> {claim.district}</p>
                      <p><strong>Claimant:</strong> {claim.claimant}</p>
                      <p><strong>Claimed Area:</strong> {formatArea(claim.claimedAreaHa)}</p>
                      <p><strong>Status:</strong> {claim.status}</p>
                    </div>
                    <button
                      onClick={() => onSelectClaim(claim)}
                      className="mt-2 w-full py-1 text-center bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded text-[11px] cursor-pointer"
                    >
                      Investigate Claim Details
                    </button>
                  </div>
                </Popup>
              </Polygon>

              {/* Anomaly Marker Over Centroid (DESIGN.md line 130-139) */}
              <Marker
                position={claim.centroid}
                icon={createAnomalyMarkerIcon(claim.severity)}
                eventHandlers={{
                  click: () => onSelectClaim(claim),
                }}
              />
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}
