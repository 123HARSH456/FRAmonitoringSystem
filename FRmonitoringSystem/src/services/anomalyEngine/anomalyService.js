/**
 * Explainable Anomaly Detection Engine for FRA Claims
 * Based on DESIGN.md Section 6.
 * Generates transparent rule-based anomaly scores without opaque black-box assumptions.
 */

export const anomalyEngine = {
  /**
   * Evaluate a claim and return explainable signals + overall severity
   */
  evaluateClaim(claim) {
    const issues = [];
    let score = 0;

    // Signal A: Area Mismatch
    const claimedArea = claim.claimedAreaHa || 0;
    const recordedArea = claim.recordedAreaHa || 0;
    if (recordedArea > 0) {
      const diffPercent = ((claimedArea - recordedArea) / recordedArea) * 100;
      if (diffPercent > 25) {
        score += 35;
        issues.push({
          type: "AREA_MISMATCH",
          label: `Claimed area is ${diffPercent.toFixed(1)}% greater than cadastral record`,
          points: 35,
          severity: "high",
        });
      } else if (diffPercent > 10) {
        score += 15;
        issues.push({
          type: "MINOR_AREA_MISMATCH",
          label: `Claimed area is ${diffPercent.toFixed(1)}% greater than cadastral record`,
          points: 15,
          severity: "medium",
        });
      }
    }

    // Signal B: Processing Delay
    const days = claim.processingDays || 0;
    if (days > 200) {
      score += 25;
      issues.push({
        type: "EXTENDED_PROCESSING_DELAY",
        label: `Application unresolved for ${days} days (threshold: 90 days)`,
        points: 25,
        severity: "medium",
      });
    } else if (days > 120) {
      score += 15;
      issues.push({
        type: "MODERATE_PROCESSING_DELAY",
        label: `Application unresolved for ${days} days (threshold: 90 days)`,
        points: 15,
        severity: "low",
      });
    }

    // Signal C: LULC Change Indicator
    if (claim.historicalLulc && claim.historicalLulc.length >= 2) {
      const first = claim.historicalLulc[0].forestPercent;
      const last = claim.historicalLulc[claim.historicalLulc.length - 1].forestPercent;
      const forestLoss = first - last;
      if (forestLoss > 30) {
        score += 25;
        issues.push({
          type: "SIGNIFICANT_CANOPY_LOSS",
          label: `Historical satellite analysis shows ${forestLoss}% reduction in tree cover`,
          points: 25,
          severity: "high",
        });
      }
    }

    // Determine severity category
    let severity = "normal";
    if (score >= 60) {
      severity = "critical";
    } else if (score >= 30) {
      severity = "review";
    }

    return {
      score,
      severity,
      issues,
      explanation:
        severity === "critical"
          ? "Potential anomaly detected: Multiple independent signals exceed thresholds. Formal field verification strongly advised."
          : severity === "review"
          ? "Needs review: Minor boundary or tenure timeline deviations observed."
          : "Standard claim profile: Geometry and records align with FRA guidelines.",
    };
  },
};
