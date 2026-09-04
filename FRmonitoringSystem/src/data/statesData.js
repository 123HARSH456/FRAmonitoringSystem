/**
 * Forest Rights Act (FRA) Monitoring System - National State Registry
 * Contains geographic centroids, bounding boxes, and FRA metrics for Indian states & UTs.
 * Note: Data represents DEMONSTRATION / SYNTHETIC baseline values for hackathon prototyping.
 */

export const STATES_DATA = [
  {
    id: "mp",
    name: "Madhya Pradesh",
    aliases: ["madhya pradesh", "mp"],
    code: "MP",
    center: [23.4733, 77.9479],
    zoom: 7,
    bounds: [[21.08, 74.04], [26.87, 82.81]],
    stats: {
      totalClaims: 627410,
      pendingClaims: 48210,
      anomalies: 342,
      criticalAnomalies: 48,
      forestCoverKm2: 77493,
      tribalPopulationPercent: 21.1,
    },
    districts: ["Sehore", "Betul", "Dindori", "Mandla", "Balaghat", "Hoshangabad", "Chhindwara"],
    description: "Highest forest cover state with substantial CFR and IFR titles under active spatial surveillance.",
  },
  {
    id: "odisha",
    name: "Odisha",
    aliases: ["odisha", "orissa", "od"],
    code: "OD",
    center: [20.9517, 85.0985],
    zoom: 7,
    bounds: [[17.82, 81.38], [22.57, 87.52]],
    stats: {
      totalClaims: 638120,
      pendingClaims: 39150,
      anomalies: 289,
      criticalAnomalies: 34,
      forestCoverKm2: 52156,
      tribalPopulationPercent: 22.8,
    },
    districts: ["Mayurbhanj", "Koraput", "Kandhamal", "Rayagada", "Sundargarh", "Malkangiri"],
    description: "Extensive Community Forest Resource (CFR) rights recognized across tribal belts.",
  },
  {
    id: "chhattisgarh",
    name: "Chhattisgarh",
    aliases: ["chhattisgarh", "cg"],
    code: "CG",
    center: [21.2787, 81.8661],
    zoom: 7,
    bounds: [[17.78, 80.25], [24.11, 84.40]],
    stats: {
      totalClaims: 512940,
      pendingClaims: 54100,
      anomalies: 412,
      criticalAnomalies: 62,
      forestCoverKm2: 55717,
      tribalPopulationPercent: 30.6,
    },
    districts: ["Bastar", "Dantewada", "Kanker", "Surguja", "Korba", "Bijapur"],
    description: "Dense Sal and Teak forest reserves with active Gram Sabha community stewardship.",
  },
  {
    id: "maharashtra",
    name: "Maharashtra",
    aliases: ["maharashtra", "mh"],
    code: "MH",
    center: [19.7515, 75.7139],
    zoom: 7,
    bounds: [[15.60, 72.63], [22.03, 80.90]],
    stats: {
      totalClaims: 385600,
      pendingClaims: 29400,
      anomalies: 198,
      criticalAnomalies: 23,
      forestCoverKm2: 50798,
      tribalPopulationPercent: 9.4,
    },
    districts: ["Gadchiroli", "Nandurbar", "Palghar", "Thane", "Amravati", "Chandrapur"],
    description: "Pioneer in CFR governance (Mendha Lekha model) with high biodiversity corridors.",
  },
  {
    id: "jharkhand",
    name: "Jharkhand",
    aliases: ["jharkhand", "jh"],
    code: "JH",
    center: [23.6102, 85.2799],
    zoom: 7,
    bounds: [[21.97, 83.33], [25.32, 87.95]],
    stats: {
      totalClaims: 310500,
      pendingClaims: 36200,
      anomalies: 265,
      criticalAnomalies: 39,
      forestCoverKm2: 23721,
      tribalPopulationPercent: 26.2,
    },
    districts: ["Ranchi", "West Singhbhum", "Latehar", "Dumka", "Gumla", "Khunti"],
    description: "Mineral-rich plateau forests requiring precise satellite land use change monitoring.",
  },
  {
    id: "telangana",
    name: "Telangana",
    aliases: ["telangana", "tg", "ts"],
    code: "TG",
    center: [18.1124, 79.0193],
    zoom: 7,
    bounds: [[15.83, 77.24], [19.92, 81.32]],
    stats: {
      totalClaims: 215300,
      pendingClaims: 18900,
      anomalies: 142,
      criticalAnomalies: 19,
      forestCoverKm2: 21214,
      tribalPopulationPercent: 9.3,
    },
    districts: ["Bhadradri Kothagudem", "Adilabad", "Khammam", "Mulugu", "Asifabad"],
    description: "Podu lands regularisation and FRA recognition across Godavari valley fringe zones.",
  },
  {
    id: "andhra_pradesh",
    name: "Andhra Pradesh",
    aliases: ["andhra pradesh", "ap"],
    code: "AP",
    center: [15.9129, 79.74],
    zoom: 7,
    bounds: [[12.6, 76.7], [19.1, 84.8]],
    stats: {
      totalClaims: 198200,
      pendingClaims: 16400,
      anomalies: 124,
      criticalAnomalies: 16,
      forestCoverKm2: 29784,
      tribalPopulationPercent: 5.5,
    },
    districts: ["Alluri Sitharama Raju", "Parvathipuram Manyam", "East Godavari"],
    description: "Eastern Ghats tribal tracts with traditional RoFR land claims.",
  },
  {
    id: "gujarat",
    name: "Gujarat",
    aliases: ["gujarat", "gj"],
    code: "GJ",
    center: [22.2587, 71.1924],
    zoom: 7,
    bounds: [[20.10, 68.10], [24.70, 74.47]],
    stats: {
      totalClaims: 189400,
      pendingClaims: 14300,
      anomalies: 115,
      criticalAnomalies: 14,
      forestCoverKm2: 14926,
      tribalPopulationPercent: 14.8,
    },
    districts: ["Dangs", "Narmada", "Dahod", "Tapi", "Chhota Udaipur"],
    description: "Eastern tribal belt claims bordering Western Ghats and Satpura ranges.",
  },
  {
    id: "rajasthan",
    name: "Rajasthan",
    aliases: ["rajasthan", "rj"],
    code: "RJ",
    center: [27.0238, 74.2179],
    zoom: 7,
    bounds: [[23.05, 69.48], [30.20, 78.28]],
    stats: {
      totalClaims: 98400,
      pendingClaims: 9100,
      anomalies: 82,
      criticalAnomalies: 9,
      forestCoverKm2: 16655,
      tribalPopulationPercent: 13.5,
    },
    districts: ["Udaipur", "Banswara", "Dungarpur", "Pratapgarh", "Baran"],
    description: "Southern Aravalli tribal communities with traditional agro-forestry claims.",
  },
  {
    id: "karnataka",
    name: "Karnataka",
    aliases: ["karnataka", "ka"],
    code: "KA",
    center: [15.3173, 75.7139],
    zoom: 7,
    bounds: [[11.59, 74.05], [18.45, 78.58]],
    stats: {
      totalClaims: 284000,
      pendingClaims: 22100,
      anomalies: 167,
      criticalAnomalies: 21,
      forestCoverKm2: 38730,
      tribalPopulationPercent: 7.0,
    },
    districts: ["Uttara Kannada", "Kodagu", "Chamarajanagar", "Mysuru"],
    description: "Western Ghats biodiversity hotspot with Jenu Kuruba and Soliga community rights.",
  },
  {
    id: "kerala",
    name: "Kerala",
    aliases: ["kerala", "kl"],
    code: "KL",
    center: [10.8505, 76.2711],
    zoom: 8,
    bounds: [[8.28, 74.86], [12.79, 77.41]],
    stats: {
      totalClaims: 43200,
      pendingClaims: 3400,
      anomalies: 31,
      criticalAnomalies: 4,
      forestCoverKm2: 21253,
      tribalPopulationPercent: 1.5,
    },
    districts: ["Wayanad", "Idukki", "Palakkad"],
    description: "High canopy Western Ghats hill ranges with Kadar and Kuruma indigenous territories.",
  },
  {
    id: "tamil_nadu",
    name: "Tamil Nadu",
    aliases: ["tamil nadu", "tn"],
    code: "TN",
    center: [11.1271, 78.6569],
    zoom: 7,
    bounds: [[8.08, 76.24], [13.57, 80.35]],
    stats: {
      totalClaims: 34500,
      pendingClaims: 2800,
      anomalies: 28,
      criticalAnomalies: 3,
      forestCoverKm2: 26419,
      tribalPopulationPercent: 1.1,
    },
    districts: ["Nilgiris", "Dharmapuri", "Salem", "Erode"],
    description: "Nilgiri biosphere and Anamalai reserve community titles.",
  },
  {
    id: "west_bengal",
    name: "West Bengal",
    aliases: ["west bengal", "wb"],
    code: "WB",
    center: [22.9868, 87.855],
    zoom: 7,
    bounds: [[21.5, 85.8], [27.3, 89.9]],
    stats: {
      totalClaims: 142000,
      pendingClaims: 13500,
      anomalies: 108,
      criticalAnomalies: 15,
      forestCoverKm2: 16902,
      tribalPopulationPercent: 5.8,
    },
    districts: ["Jalpaiguri", "Alipurduar", "Jhargram", "Purulia"],
    description: "Dooars Terai forest belt and Jangalmahal community stewardship areas.",
  },
  {
    id: "assam",
    name: "Assam",
    aliases: ["assam", "as"],
    code: "AS",
    center: [26.2006, 92.9376],
    zoom: 7,
    bounds: [[24.1, 89.7], [28.2, 96.1]],
    stats: {
      totalClaims: 156000,
      pendingClaims: 18200,
      anomalies: 134,
      criticalAnomalies: 18,
      forestCoverKm2: 28312,
      tribalPopulationPercent: 12.4,
    },
    districts: ["Karbi Anglong", "Dima Hasao", "Kokrajhar"],
    description: "Sixth Schedule Autonomous Council areas with customary forest tenure.",
  },
  {
    id: "himachal_pradesh",
    name: "Himachal Pradesh",
    aliases: ["himachal pradesh", "hp"],
    code: "HP",
    center: [31.1048, 77.1734],
    zoom: 7,
    bounds: [[30.38, 75.77], [33.22, 79.04]],
    stats: {
      totalClaims: 18400,
      pendingClaims: 2900,
      anomalies: 22,
      criticalAnomalies: 3,
      forestCoverKm2: 15443,
      tribalPopulationPercent: 5.7,
    },
    districts: ["Kinnaur", "Chamba", "Lahaul and Spiti"],
    description: "Himalayan pastoralist transhumance corridors and seasonal grazing rights.",
  },
  {
    id: "uttarakhand",
    name: "Uttarakhand",
    aliases: ["uttarakhand", "uttaranchal", "uk"],
    code: "UK",
    center: [30.0668, 79.0193],
    zoom: 7,
    bounds: [[28.7, 77.5], [31.5, 81.1]],
    stats: {
      totalClaims: 22100,
      pendingClaims: 3100,
      anomalies: 26,
      criticalAnomalies: 4,
      forestCoverKm2: 24305,
      tribalPopulationPercent: 2.9,
    },
    districts: ["Chamoli", "Uttarkashi", "Pithoragarh"],
    description: "Van Panchayat traditional community forestry systems under FRA harmonisation.",
  },
  {
    id: "jammu_and_kashmir",
    name: "Jammu and Kashmir",
    aliases: ["jammu and kashmir", "jk"],
    code: "JK",
    center: [33.7782, 76.5762],
    zoom: 7,
    bounds: [[32.2, 73.4], [37.1, 80.4]],
    stats: {
      totalClaims: 48900,
      pendingClaims: 7800,
      anomalies: 54,
      criticalAnomalies: 8,
      forestCoverKm2: 21387,
      tribalPopulationPercent: 11.9,
    },
    districts: ["Anantnag", "Rajouri", "Poonch", "Ganderbal"],
    description: "Gujjars and Bakarwals pastoral migratory grazing rights.",
  },
];

// Helper to calculate national aggregate totals
export const NATIONAL_SUMMARY = STATES_DATA.reduce(
  (acc, s) => ({
    totalClaims: acc.totalClaims + s.stats.totalClaims,
    pendingClaims: acc.pendingClaims + s.stats.pendingClaims,
    anomalies: acc.anomalies + s.stats.anomalies,
    criticalAnomalies: acc.criticalAnomalies + s.stats.criticalAnomalies,
  }),
  { totalClaims: 0, pendingClaims: 0, anomalies: 0, criticalAnomalies: 0 }
);

/**
 * Resolve any state name or id, with automatic fallback for any unrecognized Indian territory.
 */
export function resolveState(nameOrId) {
  if (!nameOrId) return STATES_DATA[0];
  const query = nameOrId.toString().toLowerCase().trim();

  // Exact ID match
  const byId = STATES_DATA.find((s) => s.id === query);
  if (byId) return byId;

  // Exact Name or Alias match
  const byAlias = STATES_DATA.find(
    (s) =>
      s.name.toLowerCase() === query ||
      (s.aliases && s.aliases.some((a) => a === query))
  );
  if (byAlias) return byAlias;

  // Substring match
  const bySub = STATES_DATA.find(
    (s) =>
      s.name.toLowerCase().includes(query) ||
      query.includes(s.name.toLowerCase())
  );
  if (bySub) return bySub;

  // Graceful fallback: return a dynamic state descriptor so that every single hovered state works!
  const sanitizedId = query.replace(/\s+/g, "_").toLowerCase();
  return {
    id: sanitizedId,
    name: nameOrId,
    code: nameOrId.slice(0, 2).toUpperCase(),
    center: [22.0, 79.0],
    zoom: 7,
    bounds: [[20.0, 75.0], [25.0, 83.0]],
    stats: {
      totalClaims: 45000,
      pendingClaims: 4200,
      anomalies: 38,
      criticalAnomalies: 5,
      forestCoverKm2: 12500,
      tribalPopulationPercent: 8.5,
    },
    districts: ["Sector North", "Sector Central", "Sector Forest"],
    description: `Geospatial tracking enabled for ${nameOrId}. Baseline cadastral records synchronized with National Spatial Grid.`,
  };
}

export const getStateById = (id) => resolveState(id);
