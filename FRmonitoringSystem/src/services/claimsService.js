/**
 * FRA Claims Service
 * Loads synthetic claims from src/data/claims.geojson and merges
 * them with unsupervised Isolation Forest ML predictions from ml/results.json.
 */

import claimsUrl from "../data/claims.geojson";
import mlResults from "../../ml/results.json";

let cachedClaims = null;
let mlMap = null;

// Build lookup map from ml/results.json
function getMLMap() {
  if (mlMap) return mlMap;
  mlMap = new Map();
  if (mlResults && mlResults.claims) {
    for (const c of mlResults.claims) {
      mlMap.set(c.claimId, c);
    }
  }
  return mlMap;
}

/**
 * Fetch and merge claims with ML results.
 */
export async function fetchEnrichedClaims() {
  if (cachedClaims) return cachedClaims;

  let geojson = null;
  try {
    const res = await fetch(claimsUrl);
    if (res.ok) {
      geojson = await res.json();
    }
  } catch (err) {
    console.warn("Could not fetch via claimsUrl asset, trying public fallback:", err);
  }

  if (!geojson) {
    const fallbackRes = await fetch("/data/claims.geojson");
    if (!fallbackRes.ok) throw new Error("Failed to load claims GeoJSON");
    geojson = await fallbackRes.json();
  }

  const lookup = getMLMap();

  cachedClaims = geojson.features.map((f) => {
    const p = f.properties || {};
    const cid = p.claimId || f.id;
    const ml = lookup.get(cid) || {};

    const claimedArea = Number(p.claimedArea ?? p.claimedAreaHa ?? 0);
    const recordedArea = Number(p.recordedArea ?? p.recordedAreaHa ?? 0);
    const areaMismatch =
      ml.areaMismatchPct !== undefined
        ? Number(ml.areaMismatchPct)
        : recordedArea > 0
        ? Number(((Math.abs(claimedArea - recordedArea) / recordedArea) * 100).toFixed(2))
        : 0;

    const riskLevel = ml.riskLevel || (p.severity === "critical" ? "HIGH" : p.severity === "review" ? "MEDIUM" : "LOW");

    return {
      id: cid,
      claimId: cid,
      state: p.state || "",
      stateId: (p.stateId || "").toLowerCase(),
      district: p.district || "",
      village: p.village || "",
      claimant: p.claimant || "",
      claimType: p.claimType || "IFR",
      claimedArea,
      recordedArea,
      claimedAreaHa: claimedArea,
      recordedAreaHa: recordedArea,
      areaMismatch,
      processingDays: Number(p.processingDays ?? 0),
      landCoverChange: Number(p.landCoverChange ?? 0),
      status: p.status || "Pending Verification",
      mlScore: ml.normalizedAnomalyScore !== undefined ? Number(ml.normalizedAnomalyScore) : Number(p.aiScore ?? 0),
      rawAnomalyScore: ml.rawAnomalyScore !== undefined ? Number(ml.rawAnomalyScore) : 0,
      riskLevel,
      predictedAnomaly: ml.predictedAnomaly ?? false,
      centroid: p.centroid || [0, 0],
      polygon: p.polygon || [],
      geometry: f.geometry,
      isSynthetic: true,
      datasetType: "DEMO_SYNTHETIC",
    };
  });

  return cachedClaims;
}

/**
 * Filter claims for a given state name or state ID.
 */
export function filterClaimsByState(claims, stateNameOrId) {
  if (!claims || !stateNameOrId) return [];
  const query = stateNameOrId.toString().toLowerCase().trim().replace(/_/g, " ");

  return claims.filter((c) => {
    const stName = (c.state || "").toLowerCase().trim();
    const stId = (c.stateId || "").toLowerCase().trim().replace(/_/g, " ");
    return stName === query || stId === query || stName.includes(query) || query.includes(stName);
  });
}

/**
 * Check if a claim belongs to a given district name (with case-insensitive & alias handling).
 */
export function isClaimInDistrict(claim, districtName) {
  if (!claim || !districtName) return false;
  const query = districtName.toString().toLowerCase().trim();
  const dist = (claim.district || "").toLowerCase().trim();
  if (!dist) return false;
  if (dist === query) return true;

  const cleanQuery = query.replace(/\s*\([^)]*\)/g, "").trim();
  const cleanDist = dist.replace(/\s*\([^)]*\)/g, "").trim();
  return (
    cleanDist === cleanQuery ||
    (cleanQuery.length > 3 && cleanDist.includes(cleanQuery)) ||
    (cleanDist.length > 3 && query.includes(cleanDist))
  );
}

/**
 * Filter claims for a specific district name.
 */
export function filterClaimsByDistrict(claims, districtName) {
  if (!claims || !districtName) return [];
  const query = districtName.toString().toLowerCase().trim();

  // 1. Exact match (case-insensitive & trimmed)
  const exact = claims.filter((c) => (c.district || "").toLowerCase().trim() === query);
  if (exact.length > 0) return exact;

  // 2. Fallback to clean name without parenthetical descriptors
  return claims.filter((c) => isClaimInDistrict(c, districtName));
}

/**
 * Get distinct districts that have claims in a given state, with their claim counts and risk breakdown.
 */
export function getDistrictsSummary(claims, stateNameOrId) {
  const stateClaims = filterClaimsByState(claims, stateNameOrId);
  const districtMap = new Map();

  for (const c of stateClaims) {
    const dist = c.district;
    if (!dist) continue;
    if (!districtMap.has(dist)) {
      districtMap.set(dist, {
        district: dist,
        total: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
    }
    const rec = districtMap.get(dist);
    rec.total += 1;
    if (c.riskLevel === "HIGH") rec.high += 1;
    else if (c.riskLevel === "MEDIUM") rec.medium += 1;
    else rec.low += 1;
  }

  return Array.from(districtMap.values()).sort((a, b) => b.total - a.total);
}

/**
 * Compute key FRA metrics from an array of claims for a given state.
 */
export function computeStateMetrics(stateClaims) {
  if (!stateClaims || !stateClaims.length) {
    return {
      totalClaims: 0,
      pendingClaims: 0,
      approvedClaims: 0,
      rejectedClaims: 0,
      anomalies: 0,
      criticalAnomalies: 0,
      mediumAnomalies: 0,
      lowAnomalies: 0,
      districtsCount: 0,
      totalAreaHa: 0,
    };
  }

  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let anomalies = 0;
  let high = 0;
  let medium = 0;
  let low = 0;
  let totalArea = 0;
  let ifrCount = 0;
  let cfrCount = 0;
  const districts = new Set();
  const villages = new Set();

  for (const c of stateClaims) {
    if (c.district) districts.add(c.district);
    if (c.village) villages.add(c.village);
    totalArea += Number(c.claimedArea ?? c.claimedAreaHa ?? 0);

    const ctype = (c.claimType || "").toLowerCase();
    if (ctype.includes("cfr") || ctype.includes("community")) {
      cfrCount++;
    } else {
      ifrCount++;
    }

    const status = (c.status || "").toLowerCase();
    if (
      status.includes("pending") ||
      status.includes("review") ||
      status.includes("sdlc") ||
      status.includes("gram")
    ) {
      pending++;
    } else if (status.includes("title") || status.includes("approved")) {
      approved++;
    } else if (status.includes("reject")) {
      rejected++;
    }

    if (c.predictedAnomaly || c.isAnomaly) {
      anomalies++;
    }

    if (c.riskLevel === "HIGH") {
      high++;
    } else if (c.riskLevel === "MEDIUM") {
      medium++;
    } else {
      low++;
    }
  }

  return {
    totalClaims: stateClaims.length,
    pendingClaims: pending,
    approvedClaims: approved,
    rejectedClaims: rejected,
    anomalies,
    criticalAnomalies: high,
    highRisk: high,
    mediumRisk: medium,
    lowRisk: low,
    mediumAnomalies: medium,
    lowAnomalies: low,
    districtsCount: districts.size,
    villagesCount: villages.size,
    ifrCount,
    cfrCount,
    totalAreaHa: Number(totalArea.toFixed(1)),
  };
}

/**
 * Precompute a fast lookup map of metrics for all states.
 */
export function computeAllStatesMetricsMap(allClaims) {
  const map = new Map();
  if (!allClaims || !allClaims.length) return map;

  const grouped = new Map();
  for (const c of allClaims) {
    const key = (c.state || "").toLowerCase().trim();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(c);
  }

  for (const [key, claims] of grouped) {
    const metrics = computeStateMetrics(claims);
    map.set(key, metrics);
  }

  return map;
}

