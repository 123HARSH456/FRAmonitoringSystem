/**
 * Forest Rights Act (FRA) Monitoring System - Synthetic Demo Dataset
 *
 * NOTE: This is DEMONSTRATION / SYNTHETIC data created for hackathon prototyping.
 * Not real government cadastral records.
 */

import demoData from "./fraDemoDataset.json";

export const FRA_DEMO_METADATA = demoData._metadata;
export const FRA_DEMO_STATE_STATISTICS = demoData.stateStatistics;
export const FRA_DEMO_CLAIMS = demoData.claims;

/**
 * Get all claims for a specific state name or id
 */
export function getDemoClaimsByState(stateNameOrId) {
  if (!stateNameOrId) return [];
  const query = stateNameOrId.toString().toLowerCase().replace(/_/g, " ").trim();

  return FRA_DEMO_CLAIMS.filter((claim) => {
    const claimState = claim.state.toLowerCase();
    return (
      claimState === query ||
      claimState.includes(query) ||
      query.includes(claimState)
    );
  });
}

/**
 * Get state statistics for a specific state
 */
export function getDemoStateStatistics(stateName) {
  if (!stateName) return null;
  return FRA_DEMO_STATE_STATISTICS[stateName] || null;
}

export default demoData;
