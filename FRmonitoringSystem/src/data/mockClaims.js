/**
 * DEMONSTRATION DATA / SYNTHETIC FRA CLAIMS
 * Strictly synthetic mock data for hackathon prototype testing.
 * Not real government records.
 */

import { resolveState } from "./statesData";
import { FRA_DEMO_CLAIMS } from "./fraDemoDataset";

export const MOCK_CLAIMS = [
  {
    id: "FRA-2026-00421",
    stateId: "mp",
    district: "Sehore",
    village: "Budhni Forest Fringe",
    claimant: "Rameshwar Uike (Tribe: Gond)",
    claimType: "IFR (Individual Forest Rights)",
    severity: "critical", // critical | review | normal
    status: "Pending Verification",
    claimedAreaHa: 4.2,
    recordedAreaHa: 3.1,
    processingDays: 235,
    submissionDate: "2025-07-14",
    // Representative polygon in Sehore / Budhni forest region
    polygon: [
      [22.775, 77.685],
      [22.784, 77.698],
      [22.779, 77.712],
      [22.768, 77.702],
      [22.775, 77.685],
    ],
    centroid: [22.7765, 77.699],
    detectedIssues: [
      { id: "area_mismatch", label: "Claimed area exceeds recorded perimeter (+35%)", severity: "high" },
      { id: "proc_delay", label: "Processing time (235 days) exceeds standard 90-day SLA", severity: "medium" },
      { id: "lulc_change", label: "Historical Bhuvan LULC indicates rapid tree cover reduction (2018–2024)", severity: "high" },
      { id: "slope_risk", label: "Terrain gradient > 18° inside demarcated reserve buffer", severity: "low" },
    ],
    aiScore: 88,
    aiAssessment:
      "Potential anomaly flagged: Multiple independent indicators deviate from baseline patterns. Claimed geometry polygon is 1.1 ha larger than Patwari land register entries, combined with non-contiguous forest clearing detected in satellite imagery.",
    recommendedAction:
      "Conduct joint GPS field verification with Gram Sabha Forest Rights Committee (FRC) and verify Sub-Divisional Level Committee (SDLC) title records.",
    historicalLulc: [
      { year: "2010", forestPercent: 88, agriculturePercent: 12 },
      { year: "2015", forestPercent: 79, agriculturePercent: 21 },
      { year: "2019", forestPercent: 62, agriculturePercent: 38 },
      { year: "2024", forestPercent: 44, agriculturePercent: 56 },
    ],
  },
  {
    id: "FRA-2026-00388",
    stateId: "mp",
    district: "Betul",
    village: "Shahpur Reserved Sector",
    claimant: "Korku Community Forest Committee",
    claimType: "CFR (Community Forest Resource)",
    severity: "review",
    status: "DLC Under Review",
    claimedAreaHa: 145.0,
    recordedAreaHa: 140.5,
    processingDays: 142,
    submissionDate: "2025-10-18",
    polygon: [
      [22.185, 77.892],
      [22.202, 77.915],
      [22.193, 77.938],
      [22.172, 77.922],
      [22.185, 77.892],
    ],
    centroid: [22.188, 77.917],
    detectedIssues: [
      { id: "boundary_overlap", label: "Minor border overlap with Compartment 402 boundary", severity: "medium" },
      { id: "proc_delay", label: "Inter-departmental NOC pending from Divisional Forest Officer", severity: "medium" },
    ],
    aiScore: 54,
    aiAssessment:
      "Moderate review recommended: Community boundary polygon shows a 4.5 ha discrepancy with forest department demarcation line. Gram Sabha resolution meets procedural criteria.",
    recommendedAction:
      "Re-align GIS boundary nodes in consultation with Forest Range Officer and Gram Sabha leaders before final DLC sign-off.",
    historicalLulc: [
      { year: "2010", forestPercent: 94, agriculturePercent: 6 },
      { year: "2015", forestPercent: 92, agriculturePercent: 8 },
      { year: "2019", forestPercent: 91, agriculturePercent: 9 },
      { year: "2024", forestPercent: 89, agriculturePercent: 11 },
    ],
  },
  {
    id: "FRA-2026-00109",
    stateId: "mp",
    district: "Dindori",
    village: "Karanjia Baiga Chak",
    claimant: "Manglu Baiga (PVTG)",
    claimType: "IFR (Individual Forest Rights)",
    severity: "normal",
    status: "Title Dispatched",
    claimedAreaHa: 2.4,
    recordedAreaHa: 2.38,
    processingDays: 68,
    submissionDate: "2025-12-02",
    polygon: [
      [22.682, 81.341],
      [22.691, 81.352],
      [22.686, 81.365],
      [22.675, 81.354],
      [22.682, 81.341],
    ],
    centroid: [22.6835, 81.353],
    detectedIssues: [],
    aiScore: 12,
    aiAssessment:
      "Normal claim profile: Claim geometry perfectly matches ground survey plots and historical cultivation evidence without boundary conflicts.",
    recommendedAction:
      "Proceed with digital land title (Pattas) synchronization to State Land Records repository.",
    historicalLulc: [
      { year: "2010", forestPercent: 70, agriculturePercent: 30 },
      { year: "2015", forestPercent: 69, agriculturePercent: 31 },
      { year: "2019", forestPercent: 68, agriculturePercent: 32 },
      { year: "2024", forestPercent: 67, agriculturePercent: 33 },
    ],
  },
  {
    id: "FRA-2026-00512",
    stateId: "mp",
    district: "Balaghat",
    village: "Baihar Buffer Belt",
    claimant: "Sukhdev Markam (Tribe: Gond)",
    claimType: "IFR (Individual Forest Rights)",
    severity: "critical",
    status: "Under Query",
    claimedAreaHa: 5.8,
    recordedAreaHa: 2.9,
    processingDays: 310,
    submissionDate: "2025-04-20",
    polygon: [
      [22.085, 80.521],
      [22.102, 80.545],
      [22.091, 80.568],
      [22.072, 80.548],
      [22.085, 80.521],
    ],
    centroid: [22.087, 80.545],
    detectedIssues: [
      { id: "critical_area_mismatch", label: "Declared area exceeds physical ceiling by 100%", severity: "high" },
      { id: "core_zone_intrusion", label: "Intersecting protected National Park buffer corridor", severity: "high" },
      { id: "extreme_delay", label: "Stalled in SDLC review (> 300 days)", severity: "high" },
    ],
    aiScore: 94,
    aiAssessment:
      "Critical anomaly alert: Claim perimeter infringes on eco-sensitive core forest zone. High risk of commercial encroachment disguised as ancestral cultivation.",
    recommendedAction:
      "Immediate on-site drone survey and summoning of Gram Sabha records for validation.",
    historicalLulc: [
      { year: "2010", forestPercent: 96, agriculturePercent: 4 },
      { year: "2015", forestPercent: 90, agriculturePercent: 10 },
      { year: "2019", forestPercent: 75, agriculturePercent: 25 },
      { year: "2024", forestPercent: 51, agriculturePercent: 49 },
    ],
  },
  {
    id: "FRA-2026-00219",
    stateId: "odisha",
    district: "Mayurbhanj",
    village: "Similipal Peripheral Village",
    claimant: "Santhal Community Rights Union",
    claimType: "CFR (Community Forest Resource)",
    severity: "critical",
    status: "Investigation Pending",
    claimedAreaHa: 210.0,
    recordedAreaHa: 165.0,
    processingDays: 280,
    submissionDate: "2025-05-19",
    polygon: [
      [21.882, 86.351],
      [21.912, 86.385],
      [21.895, 86.418],
      [21.865, 86.388],
      [21.882, 86.351],
    ],
    centroid: [21.888, 86.385],
    detectedIssues: [
      { id: "area_expansion", label: "45-hectare expansion beyond traditional Nistar rights limit", severity: "high" },
      { id: "proc_delay", label: "280 days processing with multiple jurisdiction disputes", severity: "medium" },
    ],
    aiScore: 82,
    aiAssessment:
      "Potential anomaly detected: Claim boundary overlaps with adjoining village customary jurisdiction and Similipal Biosphere buffer zone.",
    recommendedAction:
      "Convene joint Gram Sabha hearing between neighboring panchayats with revenue survey records.",
    historicalLulc: [
      { year: "2010", forestPercent: 92, agriculturePercent: 8 },
      { year: "2015", forestPercent: 88, agriculturePercent: 12 },
      { year: "2019", forestPercent: 78, agriculturePercent: 22 },
      { year: "2024", forestPercent: 65, agriculturePercent: 35 },
    ],
  },
  {
    id: "FRA-2026-00144",
    stateId: "odisha",
    district: "Koraput",
    village: "Semiliguda Tribal Settlement",
    claimant: "Bikram Majhi (Tribe: Khond)",
    claimType: "IFR (Individual Forest Rights)",
    severity: "normal",
    status: "Approved by DLC",
    claimedAreaHa: 1.8,
    recordedAreaHa: 1.76,
    processingDays: 82,
    submissionDate: "2025-11-10",
    polygon: [
      [18.712, 82.851],
      [18.721, 82.862],
      [18.715, 82.875],
      [18.705, 82.864],
      [18.712, 82.851],
    ],
    centroid: [18.713, 82.863],
    detectedIssues: [],
    aiScore: 15,
    aiAssessment:
      "Verified normal claim: Cultivation records predate December 13, 2005 cutoff date consistently across elder depositions.",
    recommendedAction: "Finalize Patta issuance and digital land passbook generation.",
    historicalLulc: [
      { year: "2010", forestPercent: 62, agriculturePercent: 38 },
      { year: "2015", forestPercent: 61, agriculturePercent: 39 },
      { year: "2019", forestPercent: 60, agriculturePercent: 40 },
      { year: "2024", forestPercent: 60, agriculturePercent: 40 },
    ],
  },
];

export const getClaimsByState = (stateId) => {
  if (!stateId) return [];
  const resolved = resolveState(stateId);
  const queryName = resolved ? resolved.name.toLowerCase() : stateId.toLowerCase().replace(/_/g, " ");

  // 1. Check if state has claims in the official 35-claim FRA demo dataset
  const demoMatched = FRA_DEMO_CLAIMS.filter(
    (c) =>
      c.state.toLowerCase() === queryName ||
      (resolved && c.state.toLowerCase() === resolved.id.replace(/_/g, " "))
  );

  if (demoMatched.length > 0) {
    return demoMatched.map((c) => {
      const [lat, lng] = [c.latitude, c.longitude];
      const severity = c.riskScore >= 70 ? "critical" : c.riskScore >= 40 ? "review" : "normal";
      return {
        ...c,
        stateId: resolved ? resolved.id : stateId.toLowerCase(),
        claimedAreaHa: c.claimedArea,
        recordedAreaHa: c.recordedArea,
        severity,
        aiScore: c.riskScore,
        centroid: [lat, lng],
        polygon: [
          [lat + 0.005, lng - 0.006],
          [lat + 0.008, lng + 0.004],
          [lat - 0.002, lng + 0.007],
          [lat - 0.007, lng - 0.001],
          [lat + 0.005, lng - 0.006],
        ],
        detectedIssues:
          c.riskScore >= 70
            ? [
                { id: "spatial_anomaly", label: `Anomaly: ${c.landCoverChange}`, severity: "high" },
                { id: "proc_delay", label: `SLA delay: ${c.processingDays} days elapsed`, severity: "medium" },
              ]
            : c.riskScore >= 40
            ? [{ id: "review_alert", label: `Review: ${c.landCoverChange}`, severity: "medium" }]
            : [],
      };
    });
  }

  // 2. Otherwise fallback to MOCK_CLAIMS
  const matched = MOCK_CLAIMS.filter(
    (c) =>
      c.stateId === stateId.toLowerCase() ||
      (resolved &&
        (c.stateId === resolved.id ||
          c.stateId === resolved.code.toLowerCase() ||
          (resolved.aliases && resolved.aliases.includes(c.stateId))))
  );
  if (matched.length > 0) return matched;

  // Generate realistic claims for any state in India using its center coordinates & districts
  if (!resolved || !resolved.center) return [];
  const [cLat, cLng] = resolved.center;
  const d1 = resolved.districts?.[0] || `${resolved.name} Forest Sector`;
  const d2 = resolved.districts?.[1] || `${resolved.name} East Range`;
  const d3 = resolved.districts?.[2] || `${resolved.name} Reserve Buffer`;

  return [
    {
      id: `FRA-${resolved.code || "IN"}-001`,
      stateId: resolved.id,
      district: d1,
      village: `${d1} Sector`,
      claimant: "Tribal Rights Committee",
      claimType: "CFR (Community Forest Resource)",
      severity: "critical",
      status: "Investigation Pending",
      claimedAreaHa: 16.5,
      recordedAreaHa: 11.2,
      processingDays: 190,
      submissionDate: "2025-06-12",
      polygon: [
        [cLat + 0.03, cLng + 0.04],
        [cLat + 0.045, cLng + 0.065],
        [cLat + 0.035, cLng + 0.08],
        [cLat + 0.015, cLng + 0.06],
        [cLat + 0.03, cLng + 0.04],
      ],
      centroid: [cLat + 0.031, cLng + 0.061],
      detectedIssues: [
        { id: "area_mismatch", label: "Claimed area exceeds recorded patta (+47%)", severity: "high" },
        { id: "proc_delay", label: "Processing elapsed time > 180 days SLA", severity: "medium" },
      ],
      aiScore: 84,
      aiAssessment: "Spatial boundary discrepancy flagged between revenue survey and Gram Sabha claim polygon.",
    },
    {
      id: `FRA-${resolved.code || "IN"}-002`,
      stateId: resolved.id,
      district: d2,
      village: `${d2} Range`,
      claimant: "Local FRC Beneficiary",
      claimType: "IFR (Individual Forest Rights)",
      severity: "review",
      status: "SDLC Under Review",
      claimedAreaHa: 3.8,
      recordedAreaHa: 3.4,
      processingDays: 112,
      submissionDate: "2025-08-20",
      polygon: [
        [cLat - 0.04, cLng - 0.03],
        [cLat - 0.025, cLng - 0.015],
        [cLat - 0.035, cLng + 0.005],
        [cLat - 0.05, cLng - 0.01],
        [cLat - 0.04, cLng - 0.03],
      ],
      centroid: [cLat - 0.037, cLng - 0.012],
      detectedIssues: [
        { id: "border_align", label: "Forest compartment border adjustment needed", severity: "medium" },
      ],
      aiScore: 48,
      aiAssessment: "Minor boundary misalignment with adjoining reserved forest compartment.",
    },
    {
      id: `FRA-${resolved.code || "IN"}-003`,
      stateId: resolved.id,
      district: d3,
      village: `${d3} Fringe`,
      claimant: "Gram Sabha Patta Holder",
      claimType: "IFR (Individual Forest Rights)",
      severity: "normal",
      status: "Title Dispatched",
      claimedAreaHa: 2.1,
      recordedAreaHa: 2.1,
      processingDays: 58,
      submissionDate: "2025-11-15",
      polygon: [
        [cLat + 0.05, cLng - 0.04],
        [cLat + 0.062, cLng - 0.028],
        [cLat + 0.055, cLng - 0.015],
        [cLat + 0.042, cLng - 0.025],
        [cLat + 0.05, cLng - 0.04],
      ],
      centroid: [cLat + 0.052, cLng - 0.027],
      detectedIssues: [],
      aiScore: 10,
      aiAssessment: "Verified normal claim: Cadastral coordinates align with satellite imagery.",
    },
  ];
};

export const getClaimById = (claimId) => {
  return MOCK_CLAIMS.find((c) => c.id === claimId);
};

