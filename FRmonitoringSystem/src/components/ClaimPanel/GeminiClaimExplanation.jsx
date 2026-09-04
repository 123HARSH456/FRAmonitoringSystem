import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2 } from "lucide-react";
import {
  fetchGeminiExplanation,
  getCachedExplanation,
  getSimulatedEvidenceExplanation,
} from "../../services/geminiService";

export default function GeminiClaimExplanation({ claim }) {
  const claimId = claim?.claimId || claim?.id;
  const initialCached = getCachedExplanation(claimId);

  const [loading, setLoading] = useState(!initialCached);
  const [explanation, setExplanation] = useState(initialCached || "");
  const [error, setError] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    let ignore = false;
    if (!claim) return;

    // Check if we already have it in cache
    const existing = getCachedExplanation(claim.claimId || claim.id);
    if (existing) {
      return;
    }

    fetchGeminiExplanation(claim, false)
      .then((res) => {
        if (!ignore) {
          setExplanation(res.explanation);
          setIsSimulated(false);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || "Could not retrieve Gemini explanation.");
          if (err.code === "NO_API_KEY" || !err.code) {
            setExplanation(getSimulatedEvidenceExplanation(claim));
            setIsSimulated(true);
          }
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [claim]);

  const handleRegenerate = async () => {
    if (!claim || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetchGeminiExplanation(claim, true);
      setExplanation(res.explanation);
      setIsSimulated(false);
    } catch (err) {
      setError(err.message || "Could not retrieve Gemini explanation.");
      if (err.code === "NO_API_KEY" || !err.code) {
        setExplanation(getSimulatedEvidenceExplanation(claim));
        setIsSimulated(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!claim) return null;

  const isHigh = claim.riskLevel === "HIGH";
  const isMedium = claim.riskLevel === "MEDIUM";

  return (
    <div className="border-t border-[#49243E]/80 pt-3 space-y-2.5 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[#DBAFA0] text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-[#DBAFA0] animate-pulse" />
          <span>Gemini AI Evidence Explanation</span>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="text-[#c2a3b0] hover:text-[#DBAFA0] transition-colors p-1 rounded hover:bg-[#35182e] disabled:opacity-40 cursor-pointer"
          title="Regenerate explanation"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin text-[#DBAFA0]" : ""}`} />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-3 rounded bg-[#241120]/90 border border-[#49243E] space-y-2">
          <div className="flex items-center gap-2 text-[#DBAFA0] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#DBAFA0] animate-ping" />
            <span>Analyzing structured evidence with Gemini AI...</span>
          </div>
          <div className="space-y-1.5 pt-1 opacity-60">
            <div className="h-2.5 bg-[#49243E]/60 rounded animate-pulse w-full" />
            <div className="h-2.5 bg-[#49243E]/60 rounded animate-pulse w-5/6" />
            <div className="h-2.5 bg-[#49243E]/60 rounded animate-pulse w-3/4" />
          </div>
        </div>
      )}

      {/* Error Notice (if API key not configured or API call failed) */}
      {!loading && error && (
        <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-amber-200 text-[11px] space-y-1">
          <div className="flex items-start gap-1.5 font-semibold text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
          {isSimulated && (
            <div className="text-[10px] text-amber-300/80 pl-5">
              Displaying simulated decision-support reasoning derived directly from the claim&apos;s structured evidence below.
            </div>
          )}
        </div>
      )}

      {/* Explanation Content */}
      {!loading && explanation && (
        <div
          className={`p-3 rounded border text-xs leading-relaxed transition-all ${
            isHigh
              ? "bg-rose-950/20 border-rose-800/40 text-slate-200"
              : isMedium
              ? "bg-amber-950/20 border-amber-800/40 text-slate-200"
              : "bg-[#49243E]/30 border-[#BB8493]/40 text-slate-200"
          }`}
        >
          <div className="flex items-start gap-2">
            {isHigh ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : isMedium ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <p className="text-[11.5px] leading-relaxed text-slate-200">{explanation}</p>
          </div>

          {/* Factual Disclaimer */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/70 text-[9.5px] text-slate-400 flex items-center justify-between">
            <span>
              {isSimulated ? "Simulated Structured Evidence Analysis" : "Gemini 1.5/2.0 Decision Support"}
            </span>
            <span className="text-slate-500">Non-adjudicative • Does not alter ML score</span>
          </div>
        </div>
      )}
    </div>
  );
}
