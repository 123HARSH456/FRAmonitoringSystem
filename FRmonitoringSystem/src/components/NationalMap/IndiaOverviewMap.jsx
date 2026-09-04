import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON, Marker, useMap, Pane } from "react-leaflet";
import L from "leaflet";
import { STATES_DATA, resolveState } from "../../data/statesData";
import { formatNumber } from "../../utils/formatters";
import { fetchIndiaGeoJSON, findStateFeature } from "../../utils/geoCache";
import { ChevronRight, Search } from "lucide-react";

// Crisp territory label badge for island UTs
function createTerritoryLabelIcon(name, isSelected) {
  return L.divIcon({
    className: "island-territory-label-icon",
    html: `
      <div style="
        font-family: monospace;
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: ${isSelected ? "#38bdf8" : "#94a3b8"};
        background: ${isSelected ? "rgba(8, 145, 178, 0.4)" : "rgba(14, 28, 46, 0.85)"};
        border: 1px solid ${isSelected ? "#38bdf8" : "rgba(56, 189, 248, 0.45)"};
        border-radius: 4px;
        padding: 2px 7px;
        white-space: nowrap;
        cursor: pointer;
        box-shadow: ${isSelected ? "0 0 10px rgba(56, 189, 248, 0.5)" : "0 2px 6px rgba(0,0,0,0.5)"};
        display: flex;
        align-items: center;
        gap: 5px;
        transition: all 0.2s ease;
      ">
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${
          isSelected ? "#38bdf8" : "#06b6d4"
        }; display: inline-block;"></span>
        <span>${name}</span>
      </div>
    `,
    iconSize: [96, 22],
    iconAnchor: [48, 11],
  });
}

// Auto-fit bounds strictly to India on initial load
function FitIndiaBounds() {
  const map = useMap();

  useEffect(() => {
    // Bounds encompassing mainland, Lakshadweep (west) and Andaman (south/east)
    const indiaBounds = [
      [6.0, 67.5],
      [37.4, 97.8],
    ];
    map.fitBounds(indiaBounds, { padding: [8, 8] });
    map.setMaxBounds([
      [4.0, 60.0],
      [40.0, 103.0],
    ]);
  }, [map]);

  return null;
}

// Controls smooth zoom/fly into target state bounds and layer cross-fade timing
function MapTransitionController({
  targetBounds,
  isTransitioning,
  targetStateId,
  onComplete,
}) {
  const map = useMap();

  useEffect(() => {
    if (isTransitioning && targetBounds && map) {
      map.setMaxBounds(null);
      map.setMinZoom(3);
      map.setMaxZoom(18);

      map.flyToBounds(targetBounds, {
        padding: [28, 28],
        duration: 1.0,
        easeLinearity: 0.25,
      });

      const timer = setTimeout(() => {
        onComplete(targetStateId);
      }, 950);

      return () => clearTimeout(timer);
    }
  }, [isTransitioning, targetBounds, targetStateId, map, onComplete]);

  return null;
}

// Injects high-tech SVG pattern defs into the map SVG for the mask background
function MapPatternDefs() {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const injectDefs = () => {
      const container = map.getContainer();
      if (!container) return;

      const svgs = container.querySelectorAll("svg");
      svgs.forEach((svg) => {
        if (!svg.querySelector("#tactical-mask-grid")) {
          let defs = svg.querySelector("defs");
          if (!defs) {
            defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            svg.insertBefore(defs, svg.firstChild);
          }
          defs.innerHTML = `
            <pattern id="tactical-mask-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <rect width="32" height="32" fill="transparent" />
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(56, 189, 248, 0.12)" stroke-width="0.8" />
              <circle cx="16" cy="16" r="1.2" fill="#38bdf8" opacity="0.35" />
              <path d="M 0 16 L 3 16 M 29 16 L 32 16 M 16 0 L 16 3 M 16 29 L 16 32" stroke="#38bdf8" stroke-width="0.6" opacity="0.25" />
            </pattern>
          `;
        }
      });
    };

    injectDefs();
    map.on("layeradd", injectDefs);
    map.on("viewreset", injectDefs);

    const timer = setTimeout(injectDefs, 120);

    return () => {
      map.off("layeradd", injectDefs);
      map.off("viewreset", injectDefs);
      clearTimeout(timer);
    };
  }, [map]);

  return null;
}

export default function IndiaOverviewMap() {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState(resolveState("madhya_pradesh"));
  const [searchFilter, setSearchFilter] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTargetId, setTransitionTargetId] = useState(null);
  const [transitionTargetBounds, setTransitionTargetBounds] = useState(null);
  const geoJsonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    fetchIndiaGeoJSON()
      .then((stateData) => {
        if (isMounted) {
          setGeoData(stateData);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading India states GeoJSON:", err);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Static geographic mask: single outer world polygon with all India states as holes
  const indiaMaskGeoJSON = useMemo(() => {
    if (!geoData || !geoData.features || geoData.features.length === 0) return null;

    const worldOuterRing = [
      [-180, 85.051129],
      [180, 85.051129],
      [180, -85.051129],
      [-180, -85.051129],
      [-180, 85.051129],
    ];

    const holes = [];
    geoData.features.forEach((feature) => {
      if (!feature.geometry) return;
      const { type, coordinates } = feature.geometry;
      if (type === "Polygon") {
        if (coordinates && coordinates[0]) {
          holes.push(coordinates[0]);
        }
      } else if (type === "MultiPolygon") {
        coordinates.forEach((poly) => {
          if (poly && poly[0]) {
            holes.push(poly[0]);
          }
        });
      }
    });

    if (holes.length === 0) return null;

    return {
      type: "Feature",
      properties: { name: "india-exterior-static-mask" },
      geometry: {
        type: "Polygon",
        coordinates: [worldOuterRing, ...holes],
      },
    };
  }, [geoData]);

  const handleStateClick = (stateId, explicitBounds = null) => {
    if (isTransitioning) return;

    const stateObj = resolveState(stateId);
    let bounds = explicitBounds;

    if (!bounds || !bounds.isValid || !bounds.isValid()) {
      if (geoData) {
        const feat = findStateFeature(geoData, stateObj || { id: stateId });
        if (feat) {
          const tempLayer = L.geoJSON(feat);
          bounds = tempLayer.getBounds();
        }
      }
    }

    if ((!bounds || !bounds.isValid()) && stateObj?.bounds) {
      bounds = L.latLngBounds(stateObj.bounds);
    }

    if (stateObj) setSelectedState(stateObj);
    setTransitionTargetId(stateId);

    if (bounds && bounds.isValid()) {
      setIsTransitioning(true);
      setTransitionTargetBounds(bounds);
    } else {
      navigate(`/state/${stateId}`);
    }
  };

  const filteredStates = STATES_DATA.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getStateStyle = (feature) => {
    const rawState = feature.properties.st_nm || feature.properties.name || "";
    const stateObj = resolveState(rawState);
    const isTarget = transitionTargetId
      ? stateObj?.id === transitionTargetId
      : selectedState && stateObj && selectedState.id === stateObj.id;

    if (isTransitioning) {
      return {
        fillColor: isTarget ? "#0891b2" : "#081528",
        fillOpacity: isTarget ? 0.25 : 0.0,
        color: isTarget ? "#38bdf8" : "rgba(56, 189, 248, 0.0)",
        weight: isTarget ? 2.5 : 0.5,
        opacity: isTarget ? 0.95 : 0.0,
        className: "leaflet-fade-transition",
      };
    }

    return {
      fillColor: isTarget ? "#0891b2" : "#0e1c2e",
      fillOpacity: isTarget ? 0.3 : 0.02,
      color: isTarget ? "#38bdf8" : "rgba(56, 189, 248, 0.65)",
      weight: isTarget ? 2.4 : 1.2,
      opacity: 0.95,
      className: "leaflet-fade-transition",
    };
  };

  const onEachFeature = (feature, layer) => {
    const rawState = feature.properties.st_nm || feature.properties.name || "Unknown State";
    const stateObj = resolveState(rawState);
    const stateDisplayName = stateObj?.name || rawState;
    const totalClaimsFormatted = stateObj ? formatNumber(stateObj.stats.totalClaims) : "N/A";
    const anomaliesFormatted = stateObj ? formatNumber(stateObj.stats.anomalies) : "0";

    // Show state name and overview metrics on hover
    layer.bindTooltip(
      `
      <div style="font-family: monospace; font-size: 12px; color: #f8fafc; line-height: 1.35;">
        <strong style="color: #38bdf8; font-size: 13px;">${stateDisplayName}</strong>
        <div style="color: #94a3b8; font-size: 11px; margin-top: 2px;">
          Total Claims: <span style="color: #f8fafc; font-weight: 600;">${totalClaimsFormatted}</span>
        </div>
        <div style="color: #94a3b8; font-size: 11px;">
          Anomalies: <span style="color: #f59e0b; font-weight: 600;">${anomaliesFormatted}</span>
        </div>
        <div style="color: #06b6d4; font-size: 10px; margin-top: 4px; font-weight: 600;">Click to view state monitoring &rarr;</div>
      </div>
    `,
      { sticky: true, className: "custom-leaflet-tooltip" }
    );

    layer.on({
      mouseover: (e) => {
        if (isTransitioning) return;
        const l = e.target;
        l.setStyle({
          weight: 2.5,
          color: "#38bdf8",
          fillColor: "#06b6d4",
          fillOpacity: 0.35,
        });
        l.bringToFront();
        if (stateObj) {
          setSelectedState(stateObj);
        }
      },
      mouseout: (e) => {
        if (isTransitioning) return;
        const l = e.target;
        l.setStyle(getStateStyle(feature));
      },
      click: (e) => {
        if (isTransitioning) return;
        const l = e.target;
        const bounds = l?.getBounds ? l.getBounds() : null;
        if (stateObj) {
          handleStateClick(stateObj.id, bounds);
        }
      },
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-stretch flex-1 w-full h-full min-h-0">
      {/* Primary Map Canvas - Responsive size on mobile (360-440px), 60% and full-height on desktop */}
      <div className="w-full lg:w-[60%] h-[360px] sm:h-[440px] lg:h-full min-h-[320px] sm:min-h-[420px] lg:min-h-0 relative rounded-xl overflow-hidden border border-slate-800 bg-[#050912] shadow-2xl flex-shrink-0">
        {/* Subtle grid background only for aesthetics */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none z-[400]"
          style={{
            backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {loading && (
          <div className="absolute inset-0 z-[2000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center text-cyan-400 font-mono text-xs">
            <span>Loading India state boundaries...</span>
          </div>
        )}

        <MapContainer
          center={[22.5, 82.0]}
          zoom={5}
          minZoom={4.5}
          maxZoom={18}
          maxBoundsViscosity={1.0}
          attributionControl={false}
          scrollWheelZoom={!isTransitioning}
          className="w-full h-full !bg-[#060a12]"
        >
          <FitIndiaBounds />
          <MapTransitionController
            targetBounds={transitionTargetBounds}
            isTransitioning={isTransitioning}
            targetStateId={transitionTargetId}
            onComplete={(targetId) => navigate(`/state/${targetId}`)}
          />

          {/* 1. Esri World Imagery (High-Resolution Satellite) */}
          <TileLayer
            attribution="Tiles &copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />

          {/* 2. Esri Place labels overlay */}
          <TileLayer
            attribution="&copy; Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
            opacity={0.65}
          />

          {/* Injects SVG tactical pattern into map SVG defs */}
          <MapPatternDefs />

          {/* 3. Static Geographic Mask: Native Leaflet vector layer above satellite tiles, below state boundaries */}
          <Pane name="indiaMaskPane" style={{ zIndex: 350 }}>
            {/* 100% Solid Black Base: completely covers satellite tiles outside India */}
            {indiaMaskGeoJSON && (
              <GeoJSON
                key="india-exterior-mask-black"
                data={indiaMaskGeoJSON}
                style={{
                  fillColor: "#020617",
                  fillOpacity: isTransitioning ? 0 : 1.0,
                  stroke: false,
                  weight: 0,
                  color: "#020617",
                  fillRule: "evenodd",
                  className: "leaflet-fade-transition",
                }}
                interactive={false}
              />
            )}

            {/* Tactical cyber grid pattern applied on top of the black mask */}
            {indiaMaskGeoJSON && (
              <GeoJSON
                key="india-exterior-mask-pattern"
                data={indiaMaskGeoJSON}
                style={{
                  fillColor: "url(#tactical-mask-grid)",
                  fillOpacity: isTransitioning ? 0 : 1.0,
                  stroke: false,
                  weight: 0,
                  color: "transparent",
                  fillRule: "evenodd",
                  className: "leaflet-fade-transition",
                }}
                interactive={false}
              />
            )}
          </Pane>

          {/* 4. Render ONLY India State / UT Boundaries on initial view (in overlayPane at zIndex 400) */}
          {geoData && (
            <GeoJSON
              ref={geoJsonRef}
              key={geoData.name || "india-states-layer"}
              data={geoData}
              style={getStateStyle}
              onEachFeature={onEachFeature}
            />
          )}

          {/* Interactive Territory Label for Lakshadweep in the Arabian Sea */}
          {!isTransitioning && (
            <Marker
              position={[10.2, 70.8]}
              icon={createTerritoryLabelIcon(
                "Lakshadweep",
                selectedState?.id === "lakshadweep"
              )}
              eventHandlers={{
                mouseover: () => {
                  const state = resolveState("lakshadweep");
                  if (state) setSelectedState(state);
                },
                click: () => {
                  handleStateClick("lakshadweep");
                },
              }}
            />
          )}

          {/* Interactive Territory Label for Andaman & Nicobar in Bay of Bengal */}
          {!isTransitioning && (
            <Marker
              position={[11.5, 95.2]}
              icon={createTerritoryLabelIcon(
                "Andaman & Nicobar",
                selectedState?.id === "andaman_and_nicobar_islands"
              )}
              eventHandlers={{
                mouseover: () => {
                  const state = resolveState("andaman_and_nicobar_islands");
                  if (state) setSelectedState(state);
                },
                click: () => {
                  handleStateClick("andaman_and_nicobar_islands");
                },
              }}
            />
          )}
        </MapContainer>

        {/* Minimal helper prompt */}
        {!isTransitioning && (
          <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-sm px-3 py-1.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400">
            Hover a state to view details • Click to enter state view
          </div>
        )}
      </div>

      {/* Contextual Information Panel - 40% width with scrollable All-India State Jump */}
      <div className="w-full lg:w-[40%] flex flex-col gap-3 lg:overflow-y-auto pr-0 lg:pr-1">
        {/* State Metrics Card */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800 space-y-3.5 shrink-0">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-semibold tracking-wider">
                Selected State
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {selectedState.name}
            </h3>
          </div>

          {/* 4 Simple Key Fields */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Total Claims:</span>
              <span className="font-bold text-white text-sm">
                {formatNumber(selectedState.stats.totalClaims)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Pending:</span>
              <span className="font-bold text-blue-400 text-sm">
                {formatNumber(selectedState.stats.pendingClaims)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Anomalies:</span>
              <span className="font-bold text-amber-400 text-sm">
                {formatNumber(selectedState.stats.anomalies)}
              </span>
            </div>

            {selectedState.stats.criticalAnomalies > 0 && (
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-rose-400">Critical Alerts:</span>
                <span className="font-bold text-rose-400 text-sm">
                  {selectedState.stats.criticalAnomalies}
                </span>
              </div>
            )}
          </div>

          {/* Short status / alert */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {selectedState.stats.criticalAnomalies > 20
              ? `High anomaly density. ${selectedState.stats.criticalAnomalies} claims flagged for field verification.`
              : "Active spatial monitoring. Baseline records synchronized with state revenue records."}
          </div>

          {/* Action button */}
          <button
            onClick={() => handleStateClick(selectedState.id)}
            disabled={isTransitioning}
            className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] ${
              isTransitioning
                ? "bg-cyan-600/70 text-white cursor-wait"
                : "bg-cyan-500 hover:bg-cyan-400 text-slate-950"
            }`}
          >
            <span>
              {isTransitioning
                ? `Transitioning to ${selectedState.name}...`
                : `View ${selectedState.name} Monitoring`}
            </span>
            <ChevronRight className={`w-4 h-4 ${isTransitioning ? "animate-pulse" : ""}`} />
          </button>
        </div>

        {/* Quick State Jump: All 36 States of India in a Scrollable Way */}
        <div className="glass-panel rounded-xl p-3.5 border border-slate-800 font-mono text-xs flex flex-col flex-1 min-h-[220px]">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Quick State Jump
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-semibold">
                {STATES_DATA.length} States &amp; UTs
              </span>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-36">
              <Search className="w-3 h-3 text-slate-500 absolute left-2 top-2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search..."
                className="w-full pl-6 pr-2 py-1 text-[11px] bg-slate-900 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Scrollable list of ALL Indian states */}
          <div className="flex-1 overflow-y-auto max-h-60 space-y-1 pr-1 custom-scrollbar">
            {filteredStates.map((s) => {
              const isSelected = selectedState?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedState(s)}
                  onDoubleClick={() => handleStateClick(s.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between text-xs cursor-pointer ${
                    isSelected
                      ? "bg-cyan-950/60 border-cyan-500 text-white shadow-[0_0_10px_rgba(6,182,212,0.25)]"
                      : "bg-slate-900/40 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700"
                  }`}
                  title="Click to select on map • Double-click to view state"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-cyan-400" : "bg-slate-600"
                      }`}
                    />
                    <span className="font-medium text-[11px] truncate max-w-[180px]">
                      {s.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-slate-500">{s.code}</span>
                    <span
                      className={
                        s.stats.criticalAnomalies > 20
                          ? "text-rose-400 font-semibold"
                          : "text-slate-400"
                      }
                    >
                      {formatNumber(s.stats.totalClaims)}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredStates.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-xs">
                No matching states found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
