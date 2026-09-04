/**
 * Gemini AI Explanation Service for FRA Monitoring
 *
 * Communicates with the backend-safe /api/gemini/explain endpoint.
 * Passes only structured evidence. Never exposes API keys in frontend code.
 * Enforces strict guardrails:
 * - Does not calculate or modify ML risk scores.
 * - Does not make fraud accusations.
 * - Explains existing evidence factually and highlights why human ground verification is helpful.
 */

// In-memory cache for explanations to avoid redundant network requests
const explanationCache = new Map();

/**
 * Check if an explanation is already cached.
 */
export function getCachedExplanation(claimId) {
  if (!claimId) return null;
  return explanationCache.get(claimId) || null;
}

/**
 * Extracts strictly the 8 evidence metrics from a claim object.
 */
export function extractStructuredEvidence(claim) {
  if (!claim) return null;

  const claimedArea = Number(claim.claimedArea ?? claim.claimedAreaHa ?? 0);
  const recordedArea = Number(claim.recordedArea ?? claim.recordedAreaHa ?? 0);
  const areaMismatch = Number(
    claim.areaMismatch ??
      (recordedArea > 0
        ? ((Math.abs(claimedArea - recordedArea) / recordedArea) * 100).toFixed(1)
        : 0)
  );

  return {
    claimId: claim.claimId || claim.id || "UNKNOWN",
    claimedArea: Number(claimedArea.toFixed(2)),
    recordedArea: Number(recordedArea.toFixed(2)),
    areaMismatch: Number(areaMismatch.toFixed(1)),
    processingDays: Number(claim.processingDays ?? 0),
    landCoverChange: Number((claim.landCoverChange ?? 0).toFixed(1)),
    mlScore: Number((claim.mlScore ?? 0).toFixed(1)),
    riskLevel: claim.riskLevel || "LOW",
  };
}

/**
 * Request Gemini to generate a factual explanation of why a claim was flagged.
 *
 * @param {Object} claim - The FRA claim object
 * @param {boolean} forceRefresh - If true, bypass cache
 * @returns {Promise<{ explanation: string, cached: boolean }>}
 */
export async function fetchGeminiExplanation(claim, forceRefresh = false) {
  const evidence = extractStructuredEvidence(claim);
  if (!evidence) {
    throw new Error("Invalid claim data provided for explanation.");
  }

  // Return cached result if available and not forced
  if (!forceRefresh && explanationCache.has(evidence.claimId)) {
    return {
      explanation: explanationCache.get(evidence.claimId),
      cached: true,
    };
  }

  try {
    const response = await fetch("/api/gemini/explain", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(evidence),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const err = new Error(
        data.error || `Server returned HTTP ${response.status} when requesting explanation`
      );
      err.code = data.code || "REQUEST_FAILED";
      throw err;
    }

    const explanation = (data.explanation || "").trim();
    if (explanation) {
      explanationCache.set(evidence.claimId, explanation);
    }

    return {
      explanation,
      cached: false,
    };
  } catch (err) {
    console.warn(`[GeminiService] Failed to generate live explanation for ${evidence.claimId}:`, err);
    throw err;
  }
}

/**
 * Generates an objective, deterministic simulated explanation strictly from the structured evidence
 * for offline demo preview or when GEMINI_API_KEY has not yet been configured in the environment.
 */
export function getSimulatedEvidenceExplanation(claim) {
  const evidence = extractStructuredEvidence(claim);
  if (!evidence) return "";

  const reasons = [];

  if (evidence.areaMismatch > 20) {
    reasons.push(
      `a ${evidence.areaMismatch}% cadastral discrepancy between claimed (${evidence.claimedArea} ha) and recorded (${evidence.recordedArea} ha) area`
    );
  } else if (evidence.areaMismatch > 10) {
    reasons.push(
      `a moderate area mismatch of ${evidence.areaMismatch}% (${evidence.claimedArea} ha vs ${evidence.recordedArea} ha)`
    );
  }

  if (evidence.landCoverChange < -12) {
    reasons.push(
      `a substantial negative vegetation index change (${evidence.landCoverChange}%) indicating recent canopy reduction`
    );
  } else if (evidence.landCoverChange < -5) {
    reasons.push(`minor vegetative cover thinning (${evidence.landCoverChange}%)`);
  }

  if (evidence.processingDays > 200) {
    reasons.push(
      `an extended processing timeline of ${evidence.processingDays} days exceeding customary review periods`
    );
  } else if (evidence.processingDays < 30) {
    reasons.push(
      `an accelerated processing duration of ${evidence.processingDays} days`
    );
  }

  if (reasons.length === 0) {
    return `This claim presents standard metrics with an area mismatch of ${evidence.areaMismatch}%, ${evidence.processingDays} processing days, and ${evidence.landCoverChange}% vegetative change. Model indicators are concordant with expected baseline parameters.`;
  }

  const factors = reasons.join(", ");
  return `This claim was flagged (ML anomaly score ${evidence.mlScore}/100, ${evidence.riskLevel} risk) primarily due to ${factors}. Physical ground boundary verification and cadastral committee cross-referencing are recommended to confirm field coordinates.`;
}

/**
 * Clear cached explanations (for testing/reset).
 */
export function clearExplanationCache() {
  explanationCache.clear();
}
