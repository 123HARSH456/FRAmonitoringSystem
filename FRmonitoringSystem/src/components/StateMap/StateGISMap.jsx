import { useState, useEffect, useMemo, useRef, Fragment } from "react";
import { MapContainer, TileLayer, Polygon, Marker, Popup, GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import { formatArea } from "../../utils/formatters";
import {
  fetchIndiaGeoJSON,
  fetchDistrictsGeoJSON,
  fetchStateMasks,
  findStateFeature,
  getDistrictsForState,
  getStateExteriorMask,
  formatDistrictName,
  createInvertedMask,
} from "../../utils/geoCache";
import { filterClaimsByState, isClaimInDistrict } from "../../services/claimsService";

// Native Leaflet vector layer for the outside-state mask.
// Uses precomputed topologically certified WGS84 inverted mask to guarantee zero clipping artifacts.
function StateExteriorMaskLayer({ stateFeature, stateId, maskFeature }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (!map) return;

    // 1. Prefer precomputed, topologically certified WGS84 inverted mask
    let targetMask = maskFeature;

    // 2. Fallback to clean inverted mask if precomputed data is not yet loaded
    if (!targetMask && stateFeature && stateFeature.geometry) {
      targetMask = createInvertedMask(stateFeature);
    }

    if (!targetMask || !targetMask.geometry) return;

    // Remove previous mask layer if switching states
    if (layerRef.current) {
      try {
        map.removeLayer(layerRef.current);
      } catch {
        // ignore
      }
      layerRef.current = null;
    }

    // Dedicated pane positioned strictly above satellite tiles (200) and below district vectors (400)
    let pane = map.getPane("stateMaskPane");
    if (!pane) {
      pane = map.createPane("stateMaskPane");
      pane.style.zIndex = "350";
      pane.style.pointerEvents = "none";
    }

    // High-padding SVG renderer (2.5x viewport) so dragging and zoom-out never reveal canvas edges
    const maskRenderer = L.svg({
      pane: "stateMaskPane",
      padding: 2.5,
    });

    // Stable native Leaflet GeoJSON layer created once
    const maskLayer = L.geoJSON(targetMask, {
      renderer: maskRenderer,
      interactive: false,
      style: {
        fillColor: "#180b15",
        fillOpacity: 1.0,
        stroke: false,
        weight: 0,
        color: "#180b15",
        fillRule: "evenodd",
        className: "state-mask-no-transition",
      },
    });

    maskLayer.addTo(map);
    layerRef.current = maskLayer;

    return () => {
      if (layerRef.current && map) {
        try {
          map.removeLayer(layerRef.current);
        } catch {
          // ignore
        }
        layerRef.current = null;
      }
    };
  }, [map, stateFeature, stateId, maskFeature]);

  return null;
}

// Helper for matching district names with parenthetical aliases
function isDistrictMatch(d1, d2) {
  if (!d1 || !d2) return false;
  const s1 = d1.toString().toLowerCase().trim();
  const s2 = d2.toString().toLowerCase().trim();
  if (s1 === s2) return true;
  const c1 = s1.replace(/\s*\([^)]*\)/g, "").trim();
  const c2 = s2.replace(/\s*\([^)]*\)/g, "").trim();
  return (
    c1 === c2 ||
    (c1.length > 3 && c2.includes(c1)) ||
    (c2.length > 3 && c1.includes(c2))
  );
}

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
        map.fitBounds(bounds, { padding: [28, 28], maxZoom: 12, animate: false });
        map.setMaxBounds(bounds.pad(0.35));
        const currentZoom = map.getZoom();
        map.setMinZoom(Math.max(4, currentZoom - 1));
        return;
      }
    }

    // Fallback if state feature not yet parsed
    if (state?.bounds) {
      map.fitBounds(state.bounds, { padding: [28, 28], maxZoom: 12, animate: false });
      map.setMaxBounds(L.latLngBounds(state.bounds).pad(0.35));
    } else if (state?.center) {
      map.setView(state.center, state.zoom || 7, { animate: false });
    }
  }, [stateFeature, state, map]);

  return null;
}

// Shared tooltip state controller for all district hovers
// Guarantees at most ONE active district tooltip and closes immediately on drag/pan/zoom/click.
function DistrictTooltipController() {
  const map = useMap();
  const tooltipRef = useRef(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!map) return;

    const districtTooltip = L.tooltip({
      className: "custom-leaflet-tooltip",
      opacity: 0.95,
      direction: "auto",
      interactive: false,
    });
    tooltipRef.current = districtTooltip;

    const closeDistrictTooltip = () => {
      try {
        if (tooltipRef.current && map.hasLayer(tooltipRef.current)) {
          tooltipRef.current.close();
        }
      } catch {
        // ignore
      }
    };

    const onMoveStart = () => {
      isDraggingRef.current = true;
      closeDistrictTooltip();
    };

    const onMoveEnd = () => {
      isDraggingRef.current = false;
      closeDistrictTooltip();
    };

    const container = map.getContainer();
    const onMouseDown = () => {
      closeDistrictTooltip();
    };
    const onMouseLeave = () => {
      isDraggingRef.current = false;
      closeDistrictTooltip();
    };

    map.on("dragstart movestart zoomstart", onMoveStart);
    map.on("dragend moveend zoomend", onMoveEnd);
    if (container) {
      container.addEventListener("mousedown", onMouseDown);
      container.addEventListener("mouseleave", onMouseLeave);
    }

    return () => {
      map.off("dragstart movestart zoomstart", onMoveStart);
      map.off("dragend moveend zoomend", onMoveEnd);
      if (container) {
        container.removeEventListener("mousedown", onMouseDown);
        container.removeEventListener("mouseleave", onMouseLeave);
      }
      closeDistrictTooltip();
      tooltipRef.current = null;
    };
  }, [map]);

  return null;
}

// Clean, compact div icon for claim markers with ML risk levels and visual emphasis for selected district
function createClaimMarkerIcon(riskLevel, isSelected, isInSelectedDistrict) {
  let color = "#10b981"; // LOW: emerald
  let pulseRgbaSubtle = "rgba(16, 185, 129, 0.3)";
  if (riskLevel === "HIGH") {
    color = "#f43f5e"; // HIGH: rose/red
    pulseRgbaSubtle = "rgba(244, 63, 94, 0.35)";
  } else if (riskLevel === "MEDIUM") {
    color = "#f59e0b"; // MEDIUM: amber
    pulseRgbaSubtle = "rgba(245, 158, 11, 0.35)";
  }

  // Visual hierarchy:
  // - Selected Claim: 18px dot, cyan halo border, zIndex 1000
  // - In Selected District: 15px dot, white border, blinking beacon ripple & breathing pulse, zIndex 500
  // - Normal / In Other Districts: 13px dot, dark slate border, subtle glow, visible normally, zIndex 100
  const dotSize = isSelected ? 18 : isInSelectedDistrict ? 15 : 13;
  const borderSize = isSelected ? 3 : isInSelectedDistrict ? 2.5 : 2;
  const borderColor = isSelected ? "#DBAFA0" : isInSelectedDistrict ? "#ffffff" : "#241120";
  const zIndex = isSelected ? 1000 : isInSelectedDistrict ? 500 : 100;

  // Beacon ripple ring for emphasized/blinking claims inside the active district
  const beaconHtml = isInSelectedDistrict
    ? `<span class="district-marker-beacon" style="border-color: ${color};"></span>`
    : "";

  return L.divIcon({
    className: `ml-claim-marker-icon ${isInSelectedDistrict ? "marker-in-district" : "marker-normal"} ${isSelected ? "marker-selected" : ""}`,
    html: `
      <div style="
        position: relative;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${zIndex};
      ">
        ${beaconHtml}
        <div class="${isInSelectedDistrict ? "pulse-district-claim" : ""}" style="
          width: ${dotSize}px;
          height: ${dotSize}px;
          border-radius: 50%;
          background-color: ${color};
          border: ${borderSize}px solid ${borderColor};
          box-shadow: ${
            isSelected
              ? `0 0 16px ${color}, 0 0 0 4px #DBAFA0`
              : isInSelectedDistrict
              ? `0 0 12px ${color}, 0 0 0 2px ${pulseRgbaSubtle}`
              : `0 0 6px ${color}`
          };
          cursor: pointer;
          transition: all 0.2s ease;
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -16],
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
  const [masksData, setMasksData] = useState(null);
  const [loadingBoundary, setLoadingBoundary] = useState(true);
  const [districtsLoaded, setDistrictsLoaded] = useState(false);

  // Load cached India States GeoJSON & precomputed exterior masks
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
        console.error("Error loading boundary for state GIS:", err);
        if (isMounted) setLoadingBoundary(false);
      });

    fetchStateMasks()
      .then((data) => {
        if (isMounted && data) {
          setMasksData(data);
        }
      })
      .catch((err) => {
        console.warn("Error loading state masks in StateGISMap:", err);
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

  // Find exact GeoJSON feature for this state (untouched official high-resolution curves)
  const stateFeature = useMemo(() => {
    return findStateFeature(geoData, state);
  }, [geoData, state]);

  // Precomputed, certified WGS84 topological mask for this state
  const stateMaskFeature = useMemo(() => {
    return getStateExteriorMask(masksData, state);
  }, [masksData, state]);

  // Filter districts strictly for this state (untouched real geometries from districts.geojson)
  const stateDistricts = useMemo(() => {
    return getDistrictsForState(districtsData, state);
  }, [districtsData, state]);

  // 1. visibleClaims: ALL claims belonging to the currently selected state
  // Even when a district is clicked/selected, ALL claims in the state must remain visible on the map.
  const visibleClaims = useMemo(() => {
    if (!claims || claims.length === 0) return [];
    if (state?.name || state?.id) {
      const stateFiltered = filterClaimsByState(claims, state.name || state.id);
      return stateFiltered.length > 0 ? stateFiltered : claims;
    }
    return claims;
  }, [claims, state]);

  // 2. selectedDistrict: purely visual selection/highlight state
  // Used to visually emphasize / blink claims inside that district, while claims in other districts remain visible normally.
  const selectedDistrictClaimsCount = useMemo(() => {
    if (!selectedDistrict) return 0;
    return visibleClaims.filter((c) => isClaimInDistrict(c, selectedDistrict)).length;
  }, [visibleClaims, selectedDistrict]);

  // Smoothly fade in district boundaries once loaded
  useEffect(() => {
    if (stateDistricts && stateDistricts.features && stateDistricts.features.length > 0) {
      const timer = setTimeout(() => {
        setDistrictsLoaded(true);
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [stateDistricts]);

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] lg:h-full min-h-[320px] sm:min-h-[420px] lg:min-h-0 rounded-xl overflow-hidden border border-[#49243E]/80 bg-[#180b15] shadow-2xl">
      {loadingBoundary && (
        <div className="absolute inset-0 z-[1500] bg-[#180b15]/85 backdrop-blur-sm flex items-center justify-center text-[#DBAFA0] font-mono text-xs">
          <span>Loading {state.name} satellite boundary &amp; districts...</span>
        </div>
      )}

      <MapContainer
        center={state.center}
        zoom={state.zoom}
        scrollWheelZoom={true}
        attributionControl={false}
        className="w-full h-full !bg-[#180b15]"
      >
        <MapController stateFeature={stateFeature} state={state} />
        <DistrictTooltipController />

        {/* 1. Esri World Imagery (High-Resolution Satellite) */}
        <TileLayer
          attribution=""
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />

        {/* 2. Esri Place labels overlay */}
        <TileLayer
          attribution=""
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
          opacity={0.65}
        />

        {/* 3. Stable Native Leaflet Mask: Precomputed topologically certified WGS84 inverted mask */}
        <StateExteriorMaskLayer
          stateFeature={stateFeature}
          stateId={state?.id}
          maskFeature={stateMaskFeature}
        />

        {/* 3b. Authentic Official State Outer Perimeter Border (High-Resolution Curves) */}
        {stateFeature && (
          <GeoJSON
            key={`state-perimeter-${state.id}-${stateFeature.properties?.vertex_count || "hires"}`}
            data={stateFeature}
            style={{
              fill: false,
              color: "#DBAFA0",
              weight: 2.2,
              opacity: 0.95,
              interactive: false,
            }}
          />
        )}

        {/* 4. District Boundaries Layer: Exactly as in districts.geojson with visual selection highlight */}
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
              const isDistSelected = isDistrictMatch(selectedDistrict, rawDist);

              return {
                fillColor: "#704264",
                fillOpacity: districtsLoaded ? (isDistSelected ? 0.32 : 0.08) : 0,
                color: isDistSelected ? "#DBAFA0" : "rgba(187, 132, 147, 0.4)",
                weight: isDistSelected ? 2.5 : 1.0,
                opacity: districtsLoaded ? 0.95 : 0,
                className: "district-fade-in",
              };
            }}
            onEachFeature={(feature, layer) => {
              const rawDist =
                feature.properties.district ||
                feature.properties.dt_nm ||
                feature.properties.name ||
                "";
              const districtName = formatDistrictName(rawDist);
              const isDistSelected = isDistrictMatch(selectedDistrict, rawDist);

              layer.on({
                mouseover: (e) => {
                  const l = e.target;
                  const mapInstance = l._map;
                  if (!mapInstance || mapInstance._isDraggingMap) {
                    return;
                  }

                  l.setStyle({
                    weight: 2.4,
                    color: "#DBAFA0",
                    fillColor: "#BB8493",
                    fillOpacity: isDistSelected ? 0.38 : 0.22,
                  });
                  l.bringToFront();

                  if (mapInstance._districtTooltip) {
                    const tooltipContent = `
                      <div style="font-family: monospace; font-size: 11px; color: #fdf5f2; line-height: 1.3;">
                        <strong style="color: #DBAFA0; font-size: 12px;">${districtName}</strong>
                        <div style="color: #c2a3b0; font-size: 10px; margin-top: 2px;">
                          ${isDistSelected ? "Currently active district" : "Click to select & highlight claims"}
                        </div>
                      </div>`;
                    mapInstance._districtTooltip
                      .setContent(tooltipContent)
                      .setLatLng(e.latlng);
                    if (!mapInstance.hasLayer(mapInstance._districtTooltip)) {
                      mapInstance._districtTooltip.openOn(mapInstance);
                    }
                  }
                },
                mousemove: (e) => {
                  const l = e.target;
                  const mapInstance = l._map;
                  if (!mapInstance || mapInstance._isDraggingMap) return;
                  if (mapInstance._districtTooltip && mapInstance.hasLayer(mapInstance._districtTooltip)) {
                    mapInstance._districtTooltip.setLatLng(e.latlng);
                  }
                },
                mouseout: (e) => {
                  const l = e.target;
                  const mapInstance = l._map;
                  if (mapInstance && mapInstance._districtTooltip) {
                    mapInstance._districtTooltip.close();
                  }
                  l.setStyle({
                    fillColor: "#704264",
                    fillOpacity: isDistSelected ? 0.32 : 0.08,
                    color: isDistSelected ? "#DBAFA0" : "rgba(187, 132, 147, 0.4)",
                    weight: isDistSelected ? 2.5 : 1.0,
                    opacity: 0.95,
                  });
                },
                click: (e) => {
                  const l = e.target;
                  const mapInstance = l._map || e.sourceTarget?._map;
                  // Immediately close tooltip on click so no tooltip stays open after selecting
                  if (mapInstance && mapInstance._districtTooltip) {
                    mapInstance._districtTooltip.close();
                  }

                  if (onSelectDistrict) {
                    onSelectDistrict(rawDist);
                  }
                  try {
                    if (l && l.getBounds && mapInstance) {
                      const bounds = l.getBounds();
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

        {/* 5. Claim Markers & Polygons: ALL state claims remain visible. Selected district claims are visually emphasized/blinking. */}
        {visibleClaims.map((claim) => {
          const isSelected = selectedClaim?.id === claim.id;
          const isInSelectedDistrict = Boolean(
            selectedDistrict && isClaimInDistrict(claim, selectedDistrict)
          );
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
                    weight: isSelected ? 3 : isInSelectedDistrict ? 2 : 1.2,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.45 : isInSelectedDistrict ? 0.25 : 0.08,
                    opacity: isInSelectedDistrict ? 0.9 : 0.5,
                  }}
                  eventHandlers={{
                    click: () => {
                      if (onSelectDistrict && claim.district) {
                        onSelectDistrict(claim.district);
                      }
                      if (onSelectClaim) onSelectClaim(claim);
                    },
                  }}
                />
              )}

              <Marker
                position={claim.centroid}
                icon={createClaimMarkerIcon(claim.riskLevel, isSelected, isInSelectedDistrict)}
                eventHandlers={{
                  click: () => {
                    if (onSelectDistrict && claim.district) {
                      onSelectDistrict(claim.district);
                    }
                    if (onSelectClaim) onSelectClaim(claim);
                  },
                }}
              >
                <Popup>
                  <div className="font-mono text-xs p-1 space-y-1 text-slate-200 min-w-[170px]">
                    <div className="flex items-center justify-between border-b border-[#49243E] pb-1">
                      <strong className="text-[#DBAFA0]">{claim.claimId}</strong>
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
                      <div>ML Score: <span className="font-semibold text-[#BB8493]">{claim.mlScore} / 100</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </Fragment>
          );
        })}
      </MapContainer>

      {/* State & District Header Badge - shifted to left-14 to prevent overlapping the Leaflet plus zoom button */}
      <div className="absolute top-3 left-14 sm:left-14 z-[1000] bg-[#180b15]/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#49243E]/80 text-[11px] font-mono text-slate-200 flex items-center gap-2 shadow-lg max-w-[calc(100%-72px)] truncate">
        <span className="w-2 h-2 rounded-full bg-[#DBAFA0] animate-pulse shrink-0" />
        <span className="font-semibold text-white shrink-0">{state.name}</span>
        <span className="text-[#c2a3b0] shrink-0">/</span>
        <span className="text-[#DBAFA0] truncate">
          {selectedDistrict
            ? `${selectedDistrict} (${selectedDistrictClaimsCount} claims · ${visibleClaims.length} state total)`
            : `All Districts (${visibleClaims.length} claims)`}
        </span>
      </div>

      {/* ML Risk Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#180b15]/85 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-[#49243E]/80 text-[11px] font-mono text-[#c2a3b0] flex items-center gap-3 shadow-lg">
        <span className="text-[#c2a3b0] font-semibold mr-0.5">ML Risk:</span>
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
