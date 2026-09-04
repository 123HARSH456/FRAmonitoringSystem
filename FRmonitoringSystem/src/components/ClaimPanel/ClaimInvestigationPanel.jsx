import { X, AlertOctagon, AlertTriangle, CheckCircle2, MapPin, Sparkles, ArrowUpRight, BarChart3 } from "lucide-react";
import { formatArea } from "../../utils/formatters";

export default function ClaimInvestigationPanel({ claim, onClose }) {
  if (!claim) return null;

  const isCritical = claim.severity === "critical";
  const isReview = claim.severity === "review";

  return (
    <div className="glass-panel-glow rounded-xl p-5 border border-slate-700/80 text-xs font-mono space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Header Bar with Severity Badge & Close button */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isCritical
                  ? "bg-rose-950/80 text-rose-300 border border-rose-600/60"
                  : isReview
                  ? "bg-amber-950/80 text-amber-300 border border-amber-600/60"
                  : "bg-emerald-950/80 text-emerald-300 border border-emerald-600/60"
              }`}
            >
              {isCritical && <AlertOctagon className="w-3 h-3 text-rose-400" />}
              {isReview && <AlertTriangle className="w-3 h-3 text-amber-400" />}
              {!isCritical && !isReview && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              <span>
                {isCritical
                  ? "HIGH PRIORITY ANOMALY"
                  : isReview
                  ? "ATTENTION REQUIRED"
                  : "NORMAL CLAIM PROFILE"}
              </span>
            </span>

            <span className="text-slate-500 text-[10px]">SCORE: {claim.aiScore}/100</span>
          </div>
          <h3 className="text-base font-bold text-white mt-1.5 flex items-center gap-2">
            <span>{claim.id}</span>
          </h3>
          <p className="text-[11px] text-slate-400">{claim.claimant}</p>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          title="Close Investigation Panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Cadastral & Temporal Metrics (DESIGN.md lines 156-164) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-[#241120]/90 p-2.5 rounded-lg border border-[#49243E]/80">
          <span className="text-[10px] text-[#c2a3b0] uppercase">District / Sector</span>
          <div className="text-slate-200 font-semibold text-xs mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[#DBAFA0] shrink-0" />
            <span className="truncate">{claim.district}</span>
          </div>
          <span className="text-[10px] text-[#c2a3b0]/70 truncate block mt-0.5">{claim.village}</span>
        </div>

        <div className="bg-[#241120]/90 p-2.5 rounded-lg border border-[#49243E]/80">
          <span className="text-[10px] text-[#c2a3b0] uppercase">Tenure Category</span>
          <div className="text-[#DBAFA0] font-semibold text-xs mt-0.5 truncate">
            {claim.claimType}
          </div>
          <span className="text-[10px] text-[#c2a3b0]/70 block mt-0.5">Under FRA 2006</span>
        </div>

        <div className="bg-[#241120]/90 p-2.5 rounded-lg border border-[#49243E]/80">
          <span className="text-[10px] text-[#c2a3b0] uppercase">Area Comparison</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-white font-bold text-sm">
              {formatArea(claim.claimedAreaHa)}
            </span>
            <span className="text-[10px] text-slate-400">
              (Rec: {formatArea(claim.recordedAreaHa)})
            </span>
          </div>
          {claim.claimedAreaHa > claim.recordedAreaHa ? (
            <span className="text-[10px] text-rose-400 font-semibold block mt-0.5">
              +{(claim.claimedAreaHa - claim.recordedAreaHa).toFixed(1)} ha discrepancy
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 block mt-0.5">Concordant</span>
          )}
        </div>

        <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase">Processing Duration</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`font-bold text-sm ${
                claim.processingDays > 180 ? "text-amber-400" : "text-slate-200"
              }`}
            >
              {claim.processingDays} days
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Target SLA: 90 days
          </span>
        </div>
      </div>

      {/* Detected Issues (DESIGN.md lines 167-172) */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>DETECTED ISSUES ({claim.detectedIssues.length})</span>
        </div>
        {claim.detectedIssues.length > 0 ? (
          <div className="space-y-1.5">
            {claim.detectedIssues.map((issue, idx) => (
              <div
                key={idx}
                className={`p-2 rounded border text-xs flex items-start gap-2 ${
                  issue.severity === "high"
                    ? "bg-rose-950/40 border-rose-800/60 text-rose-200"
                    : "bg-amber-950/40 border-amber-800/60 text-amber-200"
                }`}
              >
                <span className="font-bold text-rose-400 shrink-0">⚠</span>
                <span className="leading-snug">{issue.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>No spatial or procedural anomalies identified in this record.</span>
          </div>
        )}
      </div>

      {/* Historical LULC Visualization (DESIGN.md lines 305-320) */}
      {claim.historicalLulc && (
        <div className="p-3 bg-[#241120]/90 rounded-lg border border-[#49243E]/80 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#DBAFA0]" />
              <span>HISTORICAL LAND COVER (BHUVAN AOI)</span>
            </span>
            <span className="text-[10px] text-slate-500">2010–2024</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {claim.historicalLulc.map((entry) => (
              <div key={entry.year} className="flex items-center gap-2 text-[11px]">
                <span className="w-9 text-slate-400 font-mono">{entry.year}</span>
                <div className="flex-1 h-3.5 bg-slate-800 rounded overflow-hidden flex">
                  <div
                    style={{ width: `${entry.forestPercent}%` }}
                    className="bg-emerald-600 hover:bg-emerald-500 transition-all"
                    title={`Forest: ${entry.forestPercent}%`}
                  />
                  <div
                    style={{ width: `${entry.agriculturePercent}%` }}
                    className="bg-amber-600 hover:bg-amber-500 transition-all"
                    title={`Cultivation: ${entry.agriculturePercent}%`}
                  />
                </div>
                <span className="w-12 text-right text-emerald-400 font-mono text-[10px]">
                  {entry.forestPercent}% tree
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-3 text-[10px] text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Forest Cover
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Agro/Cultivation
            </span>
          </div>
        </div>
      )}

      {/* AI Assessment (DESIGN.md lines 175-180 & 191-204) */}
      <div className="p-3 rounded-lg bg-[#49243E]/40 border border-[#BB8493]/40 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[#DBAFA0] text-[11px] font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI SPATIAL REASONING ASSESSMENT</span>
        </div>
        <p className="text-slate-200 text-xs leading-relaxed">
          {claim.aiAssessment}
        </p>
      </div>

      {/* Recommended Action (DESIGN.md lines 183-190) */}
      <div className="p-3 rounded-lg bg-[#241120] border border-[#49243E]/80 space-y-1.5">
        <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
          RECOMMENDED ACTION
        </div>
        <p className="text-[#c2a3b0] text-xs leading-relaxed">
          {claim.recommendedAction}
        </p>
      </div>

      {/* Action CTA Buttons */}
      <div className="pt-2 flex items-center gap-2">
        <button
          onClick={() => alert(`Generating Bhuvan LULC verification report for ${claim.id}...`)}
          className="flex-1 py-2 px-3 rounded-lg bg-[#704264] hover:bg-[#864e77] text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(112,66,100,0.4)] border border-[#BB8493]/30 cursor-pointer"
        >
          <span>View LULC Report</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => alert(`Opening cadastral title dossier for ${claim.id}...`)}
          className="py-2 px-3 rounded-lg bg-[#241120] hover:bg-[#35182e] text-[#DBAFA0] text-xs border border-[#49243E] transition-colors cursor-pointer"
        >
          View Title Dossier
        </button>
      </div>
    </div>
  );
}
