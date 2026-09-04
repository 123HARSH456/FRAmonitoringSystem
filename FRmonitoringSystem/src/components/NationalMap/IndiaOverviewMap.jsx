import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, GeoJSON, useMap, Pane } from "react-leaflet";
import L from "leaflet";
import { STATES_DATA, resolveState } from "../../data/statesData";
import { formatNumber } from "../../utils/formatters";
import { fetchIndiaGeoJSON, findStateFeature, fetchStateMasks } from "../../utils/geoCache";
import { fetchEnrichedClaims, computeAllStatesMetricsMap } from "../../services/claimsService";
import { ChevronRight, Search, Compass } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import StateBottomSheet from "./StateBottomSheet";

// Auto-fit bounds strictly to India on initial load with responsive mobile snug fitting
function FitIndiaBounds() {
  const map = useMap();

  useEffect(() => {
    const fitIndia = () => {
      const isMobile = window.innerWidth < 1024;
      // On mobile (narrow screen & 46-48vh height), minimal padding ensures India fills the viewport without dead space
      const padding = isMobile ? [4, 4] : [14, 14];
      const indiaBounds = [
        [6.5, 68.0],
        [37.2, 97.5],
      ];
      map.fitBounds(indiaBounds, { padding, animate: false });
      map.setMaxBounds([
        [4.0, 60.0],
        [40.0, 103.0],
      ]);
    };

    fitIndia();
    const handleResize = () => {
      map.invalidateSize();
      fitIndia();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [map]);

  return null;
}

// Tracks touch/drag interactions on map so dragging or pinch-zooming never triggers state selection
function MapTouchController({ isDraggingRef }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const container = map.getContainer();
    let startX = 0;
    let startY = 0;
    let hasMoved = false;
    let resetTimer = null;

    const onPointerDown = (e) => {
      startX = e.clientX;
      startY = e.clientY;
      hasMoved = false;
      if (resetTimer) {
        clearTimeout(resetTimer);
        resetTimer = null;
      }
      isDraggingRef.current = false;
    };

    const onPointerMove = (e) => {
      // 16px threshold for touch on capacitive Android/iOS screens, 6px for desktop mouse
      const threshold = e.pointerType === "touch" ? 16 : 6;
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > threshold || dy > threshold) {
        hasMoved = true;
        isDraggingRef.current = true;
      }
    };

    const onPointerUp = () => {
      if (hasMoved) {
        // Genuine drag/pan gesture: keep flag true briefly to swallow delayed synthetic clicks
        resetTimer = setTimeout(() => {
          isDraggingRef.current = false;
        }, 120);
      } else {
        // Clean tap/click: immediately false so click executes reliably
        isDraggingRef.current = false;
      }
    };

    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerup", onPointerUp, { passive: true });
    container.addEventListener("pointercancel", onPointerUp, { passive: true });

    return () => {
      if (resetTimer) clearTimeout(resetTimer);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerUp);
    };
  }, [map, isDraggingRef]);

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
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isTransitioning && targetBounds && map) {
      map.setMaxBounds(null);
      map.setMinZoom(3);
      map.setMaxZoom(18);

      try {
        map.flyToBounds(targetBounds, {
          padding: [28, 28],
          duration: 0.85,
          easeLinearity: 0.25,
        });
      } catch (err) {
        console.warn("flyToBounds error:", err);
      }

      // Timer with ref ensures navigation is never cancelled by parent re-renders
      const timer = setTimeout(() => {
        if (onCompleteRef.current) {
          onCompleteRef.current(targetStateId);
        }
      }, 750);

      return () => clearTimeout(timer);
    }
  }, [isTransitioning, targetBounds, targetStateId, map]);

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
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(187, 132, 147, 0.15)" stroke-width="0.8" />
              <circle cx="16" cy="16" r="1.2" fill="#DBAFA0" opacity="0.35" />
              <path d="M 0 16 L 3 16 M 29 16 L 32 16 M 16 0 L 16 3 M 16 29 L 16 32" stroke="#BB8493" stroke-width="0.6" opacity="0.25" />
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
  const [allClaims, setAllClaims] = useState([]);
  const [selectedState, setSelectedState] = useState(resolveState("madhya_pradesh"));
  const [searchFilter, setSearchFilter] = useState("");
  const [masksData, setMasksData] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionTargetId, setTransitionTargetId] = useState(null);
  const [transitionTargetBounds, setTransitionTargetBounds] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const isDraggingRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const selectedStateRef = useRef(selectedState);
  const geoJsonRef = useRef(null);
  const navigate = useNavigate();
  const { currentThemeConfig } = useTheme();

  useEffect(() => {
    selectedStateRef.current = selectedState;
  }, [selectedState]);

  // Safety failsafe to prevent UI from being stuck in transitioning state
  useEffect(() => {
    if (isTransitioning) {
      const failsafe = setTimeout(() => {
        setIsTransitioning(false);
        isTransitioningRef.current = false;
      }, 2500);
      return () => clearTimeout(failsafe);
    }
  }, [isTransitioning]);

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

    fetchStateMasks()
      .then((data) => {
        if (isMounted && data) {
          setMasksData(data);
        }
      })
      .catch((err) => {
        console.warn("Error loading state masks in IndiaOverviewMap:", err);
      });

    fetchEnrichedClaims()
      .then((claimsList) => {
        if (isMounted) {
          setAllClaims(claimsList);
        }
      })
      .catch((err) => {
        console.error("Error loading enriched claims for national overview:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Precomputed fast lookup of actual claims & ML metrics per state
  const stateMetricsMap = useMemo(() => {
    return computeAllStatesMetricsMap(allClaims);
  }, [allClaims]);

  // Helper to get verified, up-to-date metrics for any state
  const getStateMetrics = (stateObjOrId) => {
    const s = typeof stateObjOrId === "object" ? stateObjOrId : resolveState(stateObjOrId);
    if (!s) return null;
    const fromMap =
      stateMetricsMap.get(s.name.toLowerCase().trim()) ||
      stateMetricsMap.get(s.id.toLowerCase().trim());
    if (fromMap) {
      return {
        ...s.stats,
        ...fromMap,
      };
    }
    return s.stats;
  };

  // Precomputed, certified WGS84 topological national exterior mask
  const indiaMaskGeoJSON = useMemo(() => {
    if (masksData && masksData["INDIA_NATIONAL_MASK"]) {
      return masksData["INDIA_NATIONAL_MASK"];
    }

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
  }, [masksData, geoData]);

  const handleStateClick = (stateId, explicitBounds = null) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioning(true);

    const stateObj = resolveState(stateId);
    if (stateObj) {
      setSelectedState(stateObj);
      selectedStateRef.current = stateObj;
    }
    setTransitionTargetId(stateId);

    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      // On mobile / Android: guarantee immediate, reliable navigation without animation frame drops or hanging
      setTimeout(() => {
        navigate(`/state/${stateId}`);
        setTimeout(() => {
          setIsTransitioning(false);
          isTransitioningRef.current = false;
        }, 300);
      }, 100);
      return;
    }

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

    if (bounds && bounds.isValid()) {
      setTransitionTargetBounds(bounds);
    } else {
      navigate(`/state/${stateId}`);
      setIsTransitioning(false);
      isTransitioningRef.current = false;
    }
  };

  const filteredStates = STATES_DATA.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.code.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const getStateStyle = (feature) => {
    const rawState = feature.properties.st_nm || feature.properties.name || "Unknown State";
    const stateObj = resolveState(rawState);
    const isTarget = transitionTargetId
      ? stateObj?.id === transitionTargetId
      : selectedState && stateObj && selectedState.id === stateObj.id;
    const accentHighlight = currentThemeConfig?.accentHighlight || "#DBAFA0";
    const accentPrimary = currentThemeConfig?.accentPrimary || "#704264";
    const accentMuted = currentThemeConfig?.accentMuted || "rgba(219, 175, 160, 0.4)";
    const bgCard = currentThemeConfig?.bgCard || "rgba(36, 17, 32, 0.55)";
    const bgBase = currentThemeConfig?.bgBase || "#180b15";

    if (isTransitioning) {
      return {
        fillColor: isTarget ? accentPrimary : bgBase,
        fillOpacity: isTarget ? 0.35 : 0.0,
        color: isTarget ? accentHighlight : "rgba(219, 175, 160, 0.0)",
        weight: isTarget ? 2.5 : 0.5,
        opacity: isTarget ? 0.95 : 0.0,
        className: "leaflet-fade-transition",
      };
    }

    return {
      fillColor: isTarget ? accentPrimary : bgCard,
      fillOpacity: isTarget ? 0.38 : 0.04,
      color: isTarget ? accentHighlight : accentMuted,
      weight: isTarget ? 2.4 : 1.2,
      opacity: 0.95,
      className: "leaflet-fade-transition",
    };
  };

  const onEachFeature = (feature, layer) => {
    const rawState = feature.properties.st_nm || feature.properties.name || "Unknown State";
    const stateObj = resolveState(rawState);
    const stateDisplayName = stateObj?.name || rawState;
    const sMetrics = getStateMetrics(stateObj || rawState);
    const totalClaimsFormatted = sMetrics ? formatNumber(sMetrics.totalClaims) : "0";
    const anomaliesFormatted = sMetrics ? formatNumber(sMetrics.anomalies) : "0";
    const accentHighlight = currentThemeConfig?.accentHighlight || "#DBAFA0";
    const accentPrimary = currentThemeConfig?.accentPrimary || "#704264";

    // Show state name and overview metrics with clear action button
    layer.bindTooltip(
      `
      <div class="fra-state-tooltip-content" style="font-family: monospace; font-size: 12px; color: #fdf5f2; line-height: 1.35; min-width: 155px; pointer-events: auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <strong style="color: ${accentHighlight}; font-size: 13px;">${stateDisplayName}</strong>
          <span style="font-size: 10px; color: #c2a3b0; background: rgba(73, 36, 62, 0.7); padding: 1px 4px; border-radius: 3px;">${stateObj?.code || ""}</span>
        </div>
        <div style="color: #c2a3b0; font-size: 11px; margin-top: 3px;">
          Total Claims: <span style="color: #fdf5f2; font-weight: 600;">${totalClaimsFormatted}</span>
        </div>
        <div style="color: #c2a3b0; font-size: 11px;">
          Anomalies: <span style="color: ${accentHighlight}; font-weight: 600;">${anomaliesFormatted}</span>
        </div>
        <div
          class="fra-tooltip-cta-action"
          style="margin-top: 6px; padding: 6px 10px; background: ${accentPrimary}; color: #ffffff; border-radius: 6px; font-size: 11px; font-weight: 600; text-align: center; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px; border: 1px solid rgba(219, 175, 160, 0.35); box-shadow: 0 2px 6px rgba(0,0,0,0.4);"
        >
          <span>Click to view state monitoring</span>
          <span>&rarr;</span>
        </div>
      </div>
    `,
      {
        sticky: window.innerWidth >= 1024,
        interactive: true,
        className: "custom-leaflet-tooltip",
      }
    );

    // Tapping on the tooltip itself navigates directly to state monitoring
    layer.on("tooltipopen", (te) => {
      const el = te.tooltip?.getElement();
      if (!el) return;
      L.DomEvent.disableClickPropagation(el);
      L.DomEvent.disableScrollPropagation(el);

      let lastNavTime = 0;
      const triggerStateNavigation = (ev) => {
        if (ev) {
          if (ev.stopPropagation) ev.stopPropagation();
          if (ev.preventDefault) ev.preventDefault();
        }
        const now = Date.now();
        if (now - lastNavTime < 600) return;
        lastNavTime = now;

        if (stateObj) {
          handleStateClick(stateObj.id);
        }
      };

      el.onclick = triggerStateNavigation;
      el.ontouchend = triggerStateNavigation;
    });

    layer.on({
      mouseover: (e) => {
        if (isTransitioningRef.current) return;
        if (window.innerWidth < 1024) return;
        const l = e.target;
        l.setStyle({
          weight: 2.5,
          color: accentHighlight,
          fillColor: accentPrimary,
          fillOpacity: 0.42,
        });
        l.bringToFront();
        if (stateObj) {
          setSelectedState(stateObj);
          selectedStateRef.current = stateObj;
        }
      },
      mouseout: (e) => {
        if (isTransitioningRef.current) return;
        if (window.innerWidth < 1024) return;
        const l = e.target;
        l.setStyle(getStateStyle(feature));
      },
      click: (e) => {
        if (isTransitioningRef.current || isDraggingRef.current) return;
        const l = e.target;
        const bounds = l?.getBounds ? l.getBounds() : null;
        if (!stateObj) return;

        const isMobile = window.innerWidth < 1024;
        if (isMobile) {
          // If this state is already selected (e.g. user tapped "Click to view state monitoring" or tapped again), navigate immediately!
          if (selectedStateRef.current && selectedStateRef.current.id === stateObj.id) {
            handleStateClick(stateObj.id, bounds);
          } else {
            // First tap selects state to inspect and updates card
            setSelectedState(stateObj);
            selectedStateRef.current = stateObj;
          }
        } else {
          // On desktop, click triggers state view transition
          handleStateClick(stateObj.id, bounds);
        }
      },
    });
  };

  const selectedStateStats = useMemo(() => {
    return getStateMetrics(selectedState);
  }, [selectedState, stateMetricsMap]);

  return (
    <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 items-stretch flex-1 w-full h-full min-h-0">
      {/* Primary Map Canvas - Responsive size on mobile (46-48vh), 60% and full-height on desktop */}
      <div className="w-full lg:w-[60%] h-[46vh] sm:h-[48vh] lg:h-full min-h-[320px] sm:min-h-[380px] lg:min-h-0 relative rounded-xl overflow-hidden border border-[#49243E]/80 bg-[#180b15] shadow-2xl shrink-0">
        {/* Subtle grid background only for aesthetics */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none z-[400]"
          style={{
            backgroundImage: "radial-gradient(#704264 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {loading && (
          <div className="absolute inset-0 z-[2000] bg-[#180b15]/85 backdrop-blur-sm flex items-center justify-center text-[#DBAFA0] font-mono text-xs">
            <span>Loading India state boundaries...</span>
          </div>
        )}

        <MapContainer
          center={[22.5, 82.0]}
          zoom={5}
          minZoom={4.5}
          maxZoom={18}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={!isTransitioning}
          zoomControl={true}
          attributionControl={false}
          className="w-full h-full z-0 !bg-[#180b15]"
        >
          {/* Inject high-tech pattern defs for the static mask */}
          <MapPatternDefs />

          {/* Strictly lock initial zoom and center to India */}
          <FitIndiaBounds />

          {/* Touch controller ensuring map dragging never triggers state selection */}
          <MapTouchController isDraggingRef={isDraggingRef} />

          {/* Smooth zoom and cross-fade animation handler */}
          <MapTransitionController
            targetBounds={transitionTargetBounds}
            targetStateId={transitionTargetId}
            isTransitioning={isTransitioning}
            onComplete={(stateId) => {
              navigate(`/state/${stateId}`);
            }}
          />

          {/* Satellite Basemap: Real World Imagery */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution=""
            maxZoom={18}
          />

          {/* Dedicated Leaflet Pane for the exterior mask, positioned strictly above satellite tiles (z=250) */}
          <Pane name="indiaMaskPane" style={{ zIndex: 250, pointerEvents: "none" }} />

          {/* Stable Static Geographic Exterior Mask */}
          {indiaMaskGeoJSON && (
            <GeoJSON
              key={`india-exterior-static-mask-${currentThemeConfig?.id || "default"}`}
              data={indiaMaskGeoJSON}
              pane="indiaMaskPane"
              style={{
                fillColor: currentThemeConfig?.bgBase || "#180b15",
                fillOpacity: 1.0,
                stroke: false,
                weight: 0,
                fillRule: "evenodd",
                className: "india-mask-pattern state-mask-no-transition",
              }}
            />
          )}

          {/* India States Real GeoJSON Boundary Layer */}
          {geoData && (
            <GeoJSON
              key={`india-states-${currentThemeConfig?.id || "default"}`}
              ref={geoJsonRef}
              data={geoData}
              style={getStateStyle}
              onEachFeature={onEachFeature}
            />
          )}


        </MapContainer>

        {/* Helper prompt - Touch-friendly on mobile, hover-friendly on desktop */}
        {!isTransitioning && (
          <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 z-[1000] bg-[#180b15]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-[#49243E]/80 text-[10px] sm:text-[11px] font-mono text-[#c2a3b0] shadow-md pointer-events-none">
            <span className="lg:hidden">Tap a state to inspect • Drag to explore</span>
            <span className="hidden lg:inline">Hover a state to view details • Click to enter state view</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          MOBILE VIEW (< lg): Purpose-built touch-first mobile GIS layout
          ========================================================================= */}
      <div className="flex lg:hidden flex-col gap-3 w-full pb-6">
        {/* 1. Compact Selected-State Card */}
        <div className="glass-panel rounded-xl p-3 sm:p-3.5 border border-[#49243E]/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-mono uppercase text-[#DBAFA0] font-semibold tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#DBAFA0]" />
              Selected State
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#241120] text-[#c2a3b0] border border-[#49243E]">
              {selectedState.code} • {selectedStateStats.districtsCount || selectedState.districts?.length || 0} Districts
            </span>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
              {selectedState.name}
            </h3>
            {selectedState.description && (
              <p className="text-[11px] text-[#c2a3b0] mt-0.5 line-clamp-2 leading-relaxed">
                {selectedState.description}
              </p>
            )}
          </div>

          {/* 3 Key Metrics in a Single Horizontal Row */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-0.5">
            <div className="p-2 rounded-lg bg-[#241120]/70 border border-[#49243E]/60 text-center">
              <div className="text-[9px] font-mono text-[#c2a3b0] uppercase tracking-wider truncate">
                Forest Area
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                {formatNumber(selectedStateStats.totalAreaHa)} <span className="text-[9px] font-normal text-[#c2a3b0]">ha</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#241120]/70 border border-[#49243E]/60 text-center">
              <div className="text-[9px] font-mono text-[#c2a3b0] uppercase tracking-wider truncate">
                Districts
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                {selectedStateStats.districtsCount || 0} <span className="text-[9px] font-normal text-[#c2a3b0]">active</span>
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#241120]/70 border border-[#49243E]/60 text-center">
              <div className="text-[9px] font-mono text-[#c2a3b0] uppercase tracking-wider truncate">
                Tenure Types
              </div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                {selectedStateStats.ifrCount || 0} <span className="text-[9px] font-normal text-[#c2a3b0]">IFR</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Primary "View State Monitoring" CTA Button */}
        <button
          type="button"
          onClick={() => handleStateClick(selectedState.id)}
          disabled={isTransitioning}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(112,66,100,0.35)] active:scale-[0.98] select-none touch-manipulation ${
            isTransitioning
              ? "bg-[#704264]/70 text-white cursor-wait"
              : "bg-[#704264] hover:bg-[#864e77] text-white border border-[#BB8493]/30"
          }`}
        >
          <span>
            {isTransitioning
              ? `Loading ${selectedState.name}...`
              : `View ${selectedState.name} Monitoring (${selectedStateStats.totalClaims} Claims)`}
          </span>
          <ChevronRight className={`w-4 h-4 ${isTransitioning ? "animate-pulse" : ""}`} />
        </button>

        {/* 3. "Browse States" Button (Opens Mobile Bottom Sheet) */}
        <button
          onClick={() => setIsBottomSheetOpen(true)}
          className="w-full py-2.5 px-3.5 rounded-xl font-mono text-xs font-semibold bg-[#241120] hover:bg-[#35182e] border border-[#49243E] hover:border-[#BB8493] text-[#DBAFA0] flex items-center justify-between shadow-sm active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#DBAFA0]" />
            <span className="font-bold text-white">Browse States</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#c2a3b0]">
            <span className="px-1.5 py-0.5 rounded bg-[#49243E]/80 text-[#DBAFA0] text-[10px] font-semibold">
              36 States &amp; UTs
            </span>
            <ChevronRight className="w-4 h-4 text-[#c2a3b0]/70" />
          </div>
        </button>

        {/* 4. Detailed Monitoring Information Section (Reached by scrolling) */}
        <div className="glass-panel rounded-xl p-3 sm:p-3.5 border border-[#49243E]/80 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#49243E]/70">
            <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
              Monitoring Details
            </span>
            <span className="text-[10px] text-[#c2a3b0]">
              {selectedState.name} Summary
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-[#49243E]/50">
              <span className="text-[#c2a3b0]">Total Monitored Claims:</span>
              <span className="font-bold text-white text-xs">
                {formatNumber(selectedStateStats.totalClaims)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#49243E]/50">
              <span className="text-[#c2a3b0]">Title Granted / Approved:</span>
              <span className="font-bold text-emerald-400 text-xs">
                {formatNumber(selectedStateStats.approvedClaims || 0)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#49243E]/50">
              <span className="text-[#c2a3b0]">Pending Verification:</span>
              <span className="font-bold text-[#BB8493] text-xs">
                {formatNumber(selectedStateStats.pendingClaims)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#49243E]/50">
              <span className="text-[#c2a3b0]">ML Detected Anomalies:</span>
              <span className="font-bold text-[#DBAFA0] text-xs">
                {formatNumber(selectedStateStats.anomalies)}
              </span>
            </div>

            {selectedStateStats.criticalAnomalies > 0 ? (
              <div className="flex justify-between py-1 border-b border-[#49243E]/50">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  Critical Alerts:
                </span>
                <span className="font-bold text-rose-400 text-xs">
                  {selectedStateStats.criticalAnomalies} (High Risk)
                </span>
              </div>
            ) : (
              <div className="flex justify-between py-1 border-b border-[#49243E]/50">
                <span className="text-emerald-400">Critical Alerts:</span>
                <span className="font-semibold text-emerald-400 text-xs">
                  0 (Compliant)
                </span>
              </div>
            )}

            {/* FSI & Demographics */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-[#241120] border border-[#49243E]/60">
                <div className="text-[9px] text-[#c2a3b0]/70">Forest Cover (FSI)</div>
                <div className="font-semibold text-slate-200 mt-0.5 text-xs">
                  {selectedState.stats.forestCoverKm2 ? `${formatNumber(selectedState.stats.forestCoverKm2)} km²` : "N/A"}
                </div>
              </div>
              <div className="p-2 rounded bg-[#241120] border border-[#49243E]/60">
                <div className="text-[9px] text-[#c2a3b0]/70">Tribal Population</div>
                <div className="font-semibold text-slate-200 mt-0.5 text-xs">
                  {selectedState.stats.tribalPopulationPercent !== undefined ? `${selectedState.stats.tribalPopulationPercent}%` : "N/A"}
                </div>
              </div>
            </div>

            {/* AI Spatial Assessment */}
            <div className="p-2.5 rounded-lg bg-[#241120] border border-[#49243E]/80 text-[11px] text-[#c2a3b0] leading-relaxed mt-2">
              {selectedStateStats.criticalAnomalies > 0
                ? `${selectedStateStats.criticalAnomalies} high-risk claims flagged by ML for field boundary verification. ${selectedStateStats.pendingClaims} pending review across ${selectedStateStats.districtsCount || 0} districts.`
                : `All spatial bounds verified. ${selectedStateStats.approvedClaims || 0} titles granted with zero high-risk anomalies.`}
            </div>
          </div>
        </div>
      </div>

      {/* Contextual Information Panel - 40% width with scrollable All-India State Jump (Desktop Only) */}
      <div className="hidden lg:flex w-full lg:w-[40%] flex-col gap-3 lg:overflow-y-auto pr-0 lg:pr-1">
        {/* State Metrics Card */}
        <div className="glass-panel rounded-xl p-4 border border-[#49243E]/80 space-y-3.5 shrink-0">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase text-[#DBAFA0] font-semibold tracking-wider">
                Selected State
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#241120] text-[#c2a3b0] border border-[#49243E]">
                {selectedState.code} • {selectedStateStats.districtsCount || selectedState.districts?.length || 0} Districts
              </span>
            </div>
            <h3 className="text-xl font-bold text-white mt-0.5">
              {selectedState.name}
            </h3>
            {selectedState.description && (
              <p className="text-xs text-[#c2a3b0] mt-1 line-clamp-2 leading-relaxed">
                {selectedState.description}
              </p>
            )}
          </div>

          {/* Claim Volume & Spatial Coverage */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg bg-[#241120]/60 border border-[#49243E]/60">
              <div className="text-[10px] text-[#c2a3b0] uppercase tracking-wider truncate" title="Total Forest Area Claimed">
                Total Forest Area
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {formatNumber(selectedStateStats.totalAreaHa)} <span className="text-[10px] text-[#c2a3b0] font-normal">ha</span>
              </div>
              <div className="text-[9px] text-[#c2a3b0]/70 mt-0.5">Claimed forest land</div>
            </div>

            <div className="p-2 rounded-lg bg-[#241120]/60 border border-[#49243E]/60">
              <div className="text-[10px] text-[#c2a3b0] uppercase tracking-wider">Districts</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {selectedStateStats.districtsCount || 0} <span className="text-[10px] text-[#c2a3b0] font-normal">active</span>
              </div>
              <div className="text-[9px] text-[#c2a3b0]/70 mt-0.5">
                {selectedStateStats.villagesCount ? `${selectedStateStats.villagesCount} villages` : "Spatial coverage"}
              </div>
            </div>

            <div className="p-2 rounded-lg bg-[#241120]/60 border border-[#49243E]/60">
              <div className="text-[10px] text-[#c2a3b0] uppercase tracking-wider">Tenure Types</div>
              <div className="text-sm font-bold text-white mt-0.5">
                {selectedStateStats.ifrCount || 0} <span className="text-[10px] text-[#c2a3b0] font-normal">IFR</span>
              </div>
              <div className="text-[9px] text-[#c2a3b0]/70 mt-0.5">
                {selectedStateStats.cfrCount || 0} CFR
              </div>
            </div>
          </div>

          {/* Valid & Real FRA Claims & Anomaly Metrics */}
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between py-1 border-b border-[#49243E]/60">
              <span className="text-[#c2a3b0]">Total Monitored Claims:</span>
              <span className="font-bold text-white text-sm">
                {formatNumber(selectedStateStats.totalClaims)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#49243E]/60">
              <span className="text-[#c2a3b0]">Title Granted / Approved:</span>
              <span className="font-bold text-emerald-400 text-sm">
                {formatNumber(selectedStateStats.approvedClaims || 0)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#49243E]/60">
              <span className="text-[#c2a3b0]">Pending Verification:</span>
              <span className="font-bold text-[#BB8493] text-sm">
                {formatNumber(selectedStateStats.pendingClaims)}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#49243E]/60">
              <span className="text-[#c2a3b0]">ML Detected Anomalies:</span>
              <span className="font-bold text-[#DBAFA0] text-sm">
                {formatNumber(selectedStateStats.anomalies)}
              </span>
            </div>

            {selectedStateStats.criticalAnomalies > 0 ? (
              <div className="flex justify-between py-1 border-b border-[#49243E]/60">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                  Critical Alerts (High Risk):
                </span>
                <span className="font-bold text-rose-400 text-sm">
                  {selectedStateStats.criticalAnomalies}
                </span>
              </div>
            ) : (
              <div className="flex justify-between py-1 border-b border-[#49243E]/60">
                <span className="text-emerald-400">Critical Alerts:</span>
                <span className="font-semibold text-emerald-400 text-sm">
                  0 (Compliant)
                </span>
              </div>
            )}

            {/* FSI Forest Cover & Census Tribal Demographic Context */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2 rounded bg-[#241120] border border-[#49243E]/60">
                <div className="text-[10px] text-[#c2a3b0]/70">Forest Cover (FSI)</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {selectedState.stats.forestCoverKm2 ? `${formatNumber(selectedState.stats.forestCoverKm2)} km²` : "N/A"}
                </div>
              </div>
              <div className="p-2 rounded bg-[#241120] border border-[#49243E]/60">
                <div className="text-[10px] text-[#c2a3b0]/70">Tribal Population</div>
                <div className="font-semibold text-slate-200 mt-0.5">
                  {selectedState.stats.tribalPopulationPercent !== undefined ? `${selectedState.stats.tribalPopulationPercent}%` : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic AI / Spatial Assessment */}
          <div className="p-2.5 rounded-lg bg-[#241120] border border-[#49243E]/80 text-xs text-[#c2a3b0] leading-relaxed">
            {selectedStateStats.criticalAnomalies > 0
              ? `${selectedStateStats.criticalAnomalies} high-risk claims flagged by ML for field boundary verification. ${selectedStateStats.pendingClaims} pending review across ${selectedStateStats.districtsCount || 0} districts.`
              : `All spatial bounds verified. ${selectedStateStats.approvedClaims || 0} titles granted with zero high-risk anomalies.`}
          </div>

          {/* Action button */}
          <button
            onClick={() => handleStateClick(selectedState.id)}
            disabled={isTransitioning}
            className={`w-full py-2.5 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(112,66,100,0.4)] ${
              isTransitioning
                ? "bg-[#704264]/70 text-white cursor-wait"
                : "bg-[#704264] hover:bg-[#864e77] text-white border border-[#BB8493]/30"
            }`}
          >
            <span>
              {isTransitioning
                ? `Transitioning to ${selectedState.name}...`
                : `View ${selectedState.name} Monitoring (${selectedStateStats.totalClaims} Claims)`}
            </span>
            <ChevronRight className={`w-4 h-4 ${isTransitioning ? "animate-pulse" : ""}`} />
          </button>
        </div>

        {/* Quick State Jump: All 36 States of India in a Scrollable Way */}
        <div className="glass-panel rounded-xl p-3.5 border border-[#49243E]/80 font-mono text-xs flex flex-col flex-1 min-h-[220px]">
          <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#49243E]/70">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                Quick State Jump
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#49243E]/80 text-[#DBAFA0] font-semibold">
                {STATES_DATA.length} States &amp; UTs
              </span>
            </div>

            {/* Quick Filter Search */}
            <div className="relative w-36">
              <Search className="w-3 h-3 text-[#c2a3b0]/60 absolute left-2 top-2 pointer-events-none" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search..."
                className="w-full pl-6 pr-2 py-1 text-[11px] bg-[#241120] border border-[#49243E] rounded text-slate-100 placeholder-[#c2a3b0]/60 focus:outline-none focus:border-[#BB8493]"
              />
            </div>
          </div>

          {/* Scrollable list of ALL Indian states */}
          <div className="flex-1 overflow-y-auto max-h-60 space-y-1 pr-1 custom-scrollbar">
            {filteredStates.map((s) => {
              const isSelected = selectedState?.id === s.id;
              const sStats = getStateMetrics(s);
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedState(s)}
                  onDoubleClick={() => handleStateClick(s.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg border transition-all flex items-center justify-between text-xs cursor-pointer ${
                    isSelected
                      ? "bg-[#49243E]/80 border-[#BB8493] text-white shadow-[0_0_10px_rgba(187,132,147,0.25)]"
                      : "bg-[#241120]/60 border-[#49243E]/60 text-[#c2a3b0] hover:bg-[#35182e] hover:border-[#704264]"
                  }`}
                  title="Click to select on map • Double-click to view state"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? "bg-[#DBAFA0]" : "bg-[#704264]"
                      }`}
                    />
                    <span className="font-medium text-[11px] truncate max-w-[170px]">
                      {s.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-[#c2a3b0]/70">{s.code}</span>
                    {sStats.criticalAnomalies > 0 && (
                      <span className="px-1 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-semibold text-[9px]">
                        {sStats.criticalAnomalies} alert{sStats.criticalAnomalies > 1 ? "s" : ""}
                      </span>
                    )}
                    <span className="text-slate-200 font-semibold">
                      {sStats.totalClaims} {sStats.totalClaims === 1 ? "claim" : "claims"}
                    </span>
                  </div>
                </button>
              );
            })}

            {filteredStates.length === 0 && (
              <div className="text-center py-4 text-[#c2a3b0] text-xs">
                No matching states found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Browse States */}
      <StateBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        states={STATES_DATA}
        selectedState={selectedState}
        onSelectState={(s) => {
          setSelectedState(s);
          selectedStateRef.current = s;
        }}
        onNavigateState={(s) => {
          setIsBottomSheetOpen(false);
          handleStateClick(s.id);
        }}
        getStateMetrics={getStateMetrics}
      />
    </div>
  );
}
