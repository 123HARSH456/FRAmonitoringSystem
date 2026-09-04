import { useState, useEffect, useMemo, Fragment } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { formatArea } from "../../utils/formatters";
import {
  fetchIndiaGeoJSON,
  fetchDistrictsGeoJSON,
  findStateFeature,
  createInvertedMask,
  getDistrictsForState,
  formatDistrictName,
} from "../../utils/geoCache";

// MapController: smooth dynamic fit to state boundary & bounds locking
function MapController({ stateFeature, state }) {
  const map = useMap();

  useEffect(() => {
    // Reset any previous bounding restrictions first to prevent view locking across state switches
    map.setMaxBounds(null);
    map.setMinZoom(3);

    if (stateFeature) {
      const geoLayer = L.geoJSON(stateFeature);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12, animate: true });
        map.setMaxBounds(bounds.pad(0.35));
        const currentZoom = map.getZoom();
        map.setMinZoom(Math.max(4, currentZoom - 1));
        return;
      }
    }

    // Fallback if state feature not yet parsed
    if (state?.bounds) {
      map.fitBounds(state.bounds, { padding: [28, 28], maxZoom: 12, animate: true });
      map.setMaxBounds(L.latLngBounds(state.bounds).pad(0.35));
    } else if (state?.center) {
      map.setView(state.center, state.zoom || 7, { animate: true });
    }
  }, [stateFeature, state, map]);

  return null;
}

// Clean, compact div icon for claim markers with ML risk levels
function createClaimMarkerIcon(riskLevel, isSelected) {
  let color = "#10b981"; // LOW: emerald
  let pulseColor = "rgba(16, 185, 129, 0.4)";
  if (riskLevel === "HIGH") {
    color = "#f43f5e"; // HIGH: rose/red
    pulseColor = "rgba(244, 63, 94, 0.6)";
  } else if (riskLevel === "MEDIUM") {
    color = "#f59e0b"; // MEDIUM: amber
    pulseColor = "rgba(245, 158, 11, 0.5)";
  }

  const size = isSelected ? 18 : 14;
  const borderSize = isSelected ? 3 : 2;

  return L.divIcon({
    className: "ml-claim-marker-icon",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: ${borderSize}px solid ${isSelected ? "#38bdf8" : "#0f172a"};
        box-shadow: 0 0 ${isSelected ? "14px" : "8px"} ${color}, 0 0 0 ${isSelected ? "4px" : "0px"} ${pulseColor};
        transform: translate(-50%, -50%);
        cursor: pointer;
        transition: all 0.2s ease;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function StateGISMap({
  state,
  selectedDistrict,
  onSelectDistrict,
  claims = [],
  selectedClaim,
  onSelectClaim,
}) {
  const [geoData, setGeoData] = useState(null);
  const [districtsData, setDistrictsData] = useState(null);
  const [loadingBoundary, setLoadingBoundary] = useState(true);

  // Load cached India States GeoJSON
  useEffect(() => {
    let isMounted = true;
    fetchIndiaGeoJSON()
      .then((data) => {
        if (isMounted) {
          setGeoData(data);
          setLoadingBoundary(false);
        }
      })
      .catch((err) => {
        console.error("Error loading boundary for state GIS mask:", err);
        if (isMounted) setLoadingBoundary(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load cached India Districts GeoJSON
  useEffect(() => {
    let isMounted = true;
    fetchDistrictsGeoJSON()
      .then((data) => {
        if (isMounted) {
          setDistrictsData(data);
        }
      })
      .catch((err) => {
        console.error("Error loading districts in StateGISMap:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Find exact GeoJSON feature for this state
  const stateFeature = useMemo(() => {
    return findStateFeature(geoData, state);
  }, [geoData, state]);

  // Filter districts strictly for this state
  const stateDistricts = useMemo(() => {
    return getDistrictsForState(districtsData, state);
  }, [districtsData, state]);

  // Generate Inverted Mask (world box minus state hole)
  const maskGeoJSON = useMemo(() => {
    return createInvertedMask(stateFeature);
  }, [stateFeature]);

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] lg:h-full min-h-[320px] sm:min-h-[420px] lg:min-h-0 rounded-xl overflow-hidden border border-slate-800 bg-[#060a12] shadow-2xl">
      {/* Background radial pattern */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none z-[400]"
        style={{
          backgroundImage: "radial-gradient(#38bdf8 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {loadingBoundary && (
        <div className="absolute inset-0 z-[1500] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center text-cyan-400 font-mono text-xs">
          <span>Isolating {state.name} satellite boundary...</span>
        </div>
      )}

      <MapContainer
        center={state.center}
        zoom={state.zoom}
        scrollWheelZoom={true}
        className="w-full h-full !bg-[#060a12]"
      >
        <MapController stateFeature={stateFeature} state={state} />

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

        {/* 3. Inverted Mask: Solid #060a12 polygon covering everything OUTSIDE state borders */}
        {maskGeoJSON && (
          <GeoJSON
            key={`state-mask-${state.id}`}
            data={maskGeoJSON}
            style={{
              fillColor: "#060a12",
              fillOpacity: 1.0,
              stroke: false,
              weight: 0,
              color: "#060a12",
              fillRule: "evenodd",
            }}
            interactive={false}
          />
        )}

        {/* 4. State Perimeter Border */}
        {stateFeature && (
          <GeoJSON
            key={`state-border-${state.id}`}
            data={stateFeature}
            style={{
              fill: false,
              color: "#38bdf8",
              weight: 2.5,
              opacity: 0.95,
            }}
            interactive={false}
          />
        )}

        {/* 5. District Boundaries Layer: Click a district to select it */}
        {stateDistricts && (
          <GeoJSON
            key={`districts-${state.id}-${selectedDistrict || "none"}`}
            data={stateDistricts}
            style={(feature) => {
              const rawDist =
                feature.properties.district ||
                feature.properties.dt_nm ||
                feature.properties.name ||
                "";
              const isDistSelected =
                selectedDistrict &&
                selectedDistrict.toLowerCase() === rawDist.toLowerCase();

              return {
                fillColor: isDistSelected ? "#0891b2" : "#0891b2",
                fillOpacity: isDistSelected ? 0.22 : 0.04,
                color: isDistSelected ? "#38bdf8" : "rgba(56, 189, 248, 0.35)",
                weight: isDistSelected ? 2.5 : 1.0,
              };
            }}
            onEachFeature={(feature, layer) => {
              const rawDist =
                feature.properties.district ||
                feature.properties.dt_nm ||
                feature.properties.name ||
                "";
              const districtName = formatDistrictName(rawDist);
              const isDistSelected =
                selectedDistrict &&
                selectedDistrict.toLowerCase() === rawDist.toLowerCase();

              // Show district name and action prompt on hover
              layer.bindTooltip(
                `<div style="font-family: monospace; font-size: 11px; color: #f8fafc; line-height: 1.3;">
                  <strong style="color: #38bdf8; font-size: 12px;">${districtName}</strong>
                  <div style="color: #94a3b8; font-size: 10px; margin-top: 2px;">
                    ${isDistSelected ? "Currently active district" : "Click to select & view FRA claims"}
                  </div>
                </div>`,
                { sticky: true, className: "custom-leaflet-tooltip" }
              );

              layer.on({
                mouseover: (e) => {
                  const l = e.target;
                  l.setStyle({
                    weight: 2.4,
                    color: "#38bdf8",
                    fillColor: "#06b6d4",
                    fillOpacity: isDistSelected ? 0.3 : 0.16,
                  });
                  l.bringToFront();
                },
                mouseout: (e) => {
                  const l = e.target;
                  l.setStyle({
                    fillColor: isDistSelected ? "#0891b2" : "#0891b2",
                    fillOpacity: isDistSelected ? 0.22 : 0.04,
                    color: isDistSelected ? "#38bdf8" : "rgba(56, 189, 248, 0.35)",
                    weight: isDistSelected ? 2.5 : 1.0,
                  });
                },
                click: (e) => {
                  if (onSelectDistrict) {
                    onSelectDistrict(rawDist);
                  }
                  try {
                    const layer = e.target;
                    const mapInstance = layer?._map || e.sourceTarget?._map;
                    if (layer && layer.getBounds && mapInstance) {
                      const bounds = layer.getBounds();
                      if (bounds && bounds.isValid && bounds.isValid()) {
                        mapInstance.fitBounds(bounds, { padding: [28, 28], maxZoom: 13, animate: true });
                      }
                    }
                  } catch (err) {
                    console.warn("Could not fitBounds on district click:", err);
                  }
                },
              });
            }}
          />
        )}

        {/* 6. Claim Markers & Polygons: Rendered strictly for the selected district */}
        {claims.map((claim) => {
          const isSelected = selectedClaim?.id === claim.id;
          let color = "#10b981"; // LOW
          if (claim.riskLevel === "HIGH") color = "#f43f5e";
          else if (claim.riskLevel === "MEDIUM") color = "#f59e0b";

          return (
            <Fragment key={claim.id || claim.claimId}>
              {claim.polygon && claim.polygon.length > 0 && (
                <Polygon
                  positions={claim.polygon}
                  pathOptions={{
                    color: isSelected ? "#38bdf8" : color,
                    weight: isSelected ? 3 : 1.6,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.45 : 0.22,
                  }}
                  eventHandlers={{
                    click: () => onSelectClaim && onSelectClaim(claim),
                  }}
                />
              )}

              <Marker
                position={claim.centroid}
                icon={createClaimMarkerIcon(claim.riskLevel, isSelected)}
                eventHandlers={{
                  click: () => onSelectClaim && onSelectClaim(claim),
                }}
              >
                <Popup>
                  <div className="font-mono text-xs p-1 space-y-1 text-slate-200 min-w-[170px]">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <strong className="text-cyan-400">{claim.claimId}</strong>
                      <span
                        style={{
                          backgroundColor:
                            claim.riskLevel === "HIGH"
                              ? "rgba(244, 63, 94, 0.2)"
                              : claim.riskLevel === "MEDIUM"
                              ? "rgba(245, 158, 11, 0.2)"
                              : "rgba(16, 185, 129, 0.2)",
                          color:
                            claim.riskLevel === "HIGH"
                              ? "#f43f5e"
                              : claim.riskLevel === "MEDIUM"
                              ? "#f59e0b"
                              : "#10b981",
                          border: `1px solid ${
                            claim.riskLevel === "HIGH"
                              ? "#f43f5e"
                              : claim.riskLevel === "MEDIUM"
                              ? "#f59e0b"
                              : "#10b981"
                          }`,
                        }}
                        className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase"
                      >
                        {claim.riskLevel}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <div>District: <span className="font-semibold text-white">{claim.district}</span></div>
                      <div>Claimed: <span className="font-semibold text-white">{formatArea(claim.claimedArea)}</span></div>
                      <div>Mismatch: <span className="font-semibold text-amber-300">{claim.areaMismatch}%</span></div>
                      <div>ML Score: <span className="font-semibold text-cyan-300">{claim.mlScore} / 100</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>

      {/* State & District Header Badge */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-200 flex items-center gap-2 shadow-lg">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold text-white">{state.name}</span>
        <span className="text-slate-500">/</span>
        <span className="text-cyan-300">
          {selectedDistrict ? `${selectedDistrict} (${claims.length} claims)` : "Click a district on map"}
        </span>
      </div>

      {/* ML Risk Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-3 shadow-lg">
        <span className="text-slate-400 font-semibold mr-0.5">ML Risk:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span> HIGH
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_#f59e0b]"></span> MEDIUM
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span> LOW
        </span>
      </div>
    </div>
  );
}
