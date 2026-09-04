import { resolveState } from "../data/statesData";
import districtsUrl from "../data/districts.geojson";

let geoCache = null;
let districtsCache = null;

/**
 * Fetch and cache India States GeoJSON (193 KB).
 * Cached in memory so subsequent calls across pages are instantaneous.
 */
export async function fetchIndiaGeoJSON() {
  if (geoCache) return geoCache;
  const res = await fetch("/data/india-states.geojson");
  if (!res.ok) throw new Error("Failed to load India GeoJSON");
  geoCache = await res.json();
  return geoCache;
}

/**
 * Fetch and cache India Districts GeoJSON.
 * Loads src/data/districts.geojson via asset URL with fallback to public path.
 */
export async function fetchDistrictsGeoJSON() {
  if (districtsCache) return districtsCache;
  try {
    const res = await fetch(districtsUrl);
    if (res.ok) {
      districtsCache = await res.json();
      return districtsCache;
    }
  } catch (err) {
    console.warn("Could not fetch via districtsUrl, attempting fallback /data/districts.geojson:", err);
  }
  const fallbackRes = await fetch("/data/districts.geojson");
  if (!fallbackRes.ok) throw new Error("Failed to load districts GeoJSON");
  districtsCache = await fallbackRes.json();
  return districtsCache;
}

/**
 * Format raw district name to title case for display.
 */
export function formatDistrictName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Filter district features for a specific state object or name.
 */
export function getDistrictsForState(districtsData, state) {
  if (!districtsData || !districtsData.features || !state) return null;
  const stateId = (state.id || "").toLowerCase();
  const stateName = (state.name || "").toLowerCase();

  const filteredFeatures = districtsData.features.filter((f) => {
    const featureState = (f.properties.state || "").toLowerCase();
    if (featureState === stateName) return true;
    const resolved = resolveState(featureState);
    return resolved && (resolved.id === stateId || resolved.name.toLowerCase() === stateName);
  });

  return {
    type: "FeatureCollection",
    name: `${state.id || "state"}_districts`,
    features: filteredFeatures,
  };
}

/**
 * Find the GeoJSON feature for a given state object or state name/id.
 */
export function findStateFeature(geoData, state) {
  if (!geoData || !state) return null;
  const targetId = state.id ? state.id.toLowerCase() : "";
  const targetName = state.name ? state.name.toLowerCase() : "";

  return (
    geoData.features.find((f) => {
      const stNm = (f.properties.st_nm || f.properties.name || "").toLowerCase();
      if (stNm === targetName) return true;
      const resolved = resolveState(stNm);
      return resolved && (resolved.id === targetId || resolved.name.toLowerCase() === targetName);
    }) || null
  );
}

/**
 * Generate an Inverted Mask (Reverse Polygon Mask) for a state.
 * The outer ring covers the entire Mercator world: [-180, 85.0511] to [180, -85.0511].
 * The inner hole(s) correspond to the state's exact exterior boundary ring(s).
 *
 * When rendered with fillColor: "#060a12", fillOpacity: 1.0, and fillRule: "evenodd",
 * Leaflet completely masks out everything outside the state borders, revealing ONLY
 * the satellite imagery inside the state.
 */
let masksCache = null;

/**
 * Fetch and cache precomputed topologically certified WGS84 state exterior masks.
 * Precomputed via Shapely difference to eliminate SVG/Leaflet clipping artifacts.
 */
export async function fetchStateMasks() {
  if (masksCache) return masksCache;
  try {
    const res = await fetch("/data/india-state-masks.json");
    if (res.ok) {
      masksCache = await res.json();
      return masksCache;
    }
  } catch (err) {
    console.warn("Could not fetch state masks from /data/india-state-masks.json:", err);
  }
  return null;
}

/**
 * Retrieve the certified exterior mask GeoJSON feature for a given state.
 */
export function getStateExteriorMask(masksData, state) {
  if (!masksData || !state) return null;
  const stateId = (state.id || "").toLowerCase().trim();
  const stateName = (state.name || "").trim();

  return (
    masksData[stateName] ||
    masksData[stateId] ||
    masksData[stateId.replace(/-/g, "_")] ||
    null
  );
}

/**
 * Fallback generator for inverted mask if precomputed mask is not loaded.
 */
export function createInvertedMask(feature) {
  if (!feature || !feature.geometry) return null;

  // Maximum latitude in EPSG:3857 Web Mercator is ~85.0511287798
  const worldOuterRing = [
    [-180, 85.051129],
    [180, 85.051129],
    [180, -85.051129],
    [-180, -85.051129],
    [-180, 85.051129],
  ];

  const holes = [];

  if (feature.geometry.type === "Polygon") {
    // Single polygon: exterior ring is coordinates[0]
    if (feature.geometry.coordinates && feature.geometry.coordinates[0]) {
      holes.push(feature.geometry.coordinates[0]);
    }
  } else if (feature.geometry.type === "MultiPolygon") {
    // MultiPolygon: exterior ring of each sub-polygon is poly[0]
    feature.geometry.coordinates.forEach((poly) => {
      if (poly && poly[0]) {
        holes.push(poly[0]);
      }
    });
  }

  if (holes.length === 0) return null;

  return {
    type: "Feature",
    properties: {
      name: "state-satellite-inverted-mask",
      stateName: feature.properties.st_nm || feature.properties.name,
    },
    geometry: {
      type: "Polygon",
      coordinates: [worldOuterRing, ...holes],
    },
  };
}
