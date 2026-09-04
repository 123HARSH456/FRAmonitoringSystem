import { NATIONAL_SUMMARY } from "../../data/statesData";
import { formatNumber } from "../../utils/formatters";
import IndiaOverviewMap from "../../components/NationalMap/IndiaOverviewMap";
import { Shield, FileCheck, Clock, AlertTriangle, AlertOctagon, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function NationalOverviewPage() {
  return (
    <div className="space-y-6 pb-12">
      {/* Hero Command Bar / Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>NATIONAL GEOSPATIAL MONITORING GRID</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight mt-1">
            Forest Rights Act (FRA) Intelligence Command
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-3xl">
            Real-time multi-layered spatial decision support system for Gram Sabhas, SDLCs, and State Forest Departments under Scheduled Tribes and Other Traditional Forest Dwellers Act.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/state/mp"
            className="px-4 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2"
          >
            <span>DRILL INTO ACTIVE PILOT (MP)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 4 Primary National KPI Cards (DESIGN.md requirements lines 42-44) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Claims */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-start justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              TOTAL RECORDED CLAIMS
            </span>
            <div className="text-2xl font-black text-white font-mono">
              {formatNumber(NATIONAL_SUMMARY.totalClaims)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span className="text-cyan-400 font-semibold">8 Pilot States</span>
              <span>• IFR & CFR Titles</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Claims */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-start justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              PENDING VERIFICATIONS
            </span>
            <div className="text-2xl font-black text-blue-300 font-mono">
              {formatNumber(NATIONAL_SUMMARY.pendingClaims)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span className="text-blue-400 font-semibold">
                {((NATIONAL_SUMMARY.pendingClaims / NATIONAL_SUMMARY.totalClaims) * 100).toFixed(1)}%
              </span>
              <span>of total claims awaiting review</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-800/50 text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Anomalies */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800 flex items-start justify-between relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
              DETECTED ANOMALIES
            </span>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {formatNumber(NATIONAL_SUMMARY.anomalies)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span className="text-amber-400 font-semibold">Rule-Based Flags</span>
              <span>• Cadastral / SLA</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/50 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="glass-panel-glow rounded-xl p-4 border border-rose-900/50 flex items-start justify-between relative overflow-hidden group hover:border-rose-700 transition-all">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <span>CRITICAL ESCALATIONS</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            </span>
            <div className="text-2xl font-black text-rose-300 font-mono">
              {formatNumber(NATIONAL_SUMMARY.criticalAnomalies)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <span className="text-rose-400 font-semibold">Requires Ground Verification</span>
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-400">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Geospatial Overview (Screen 1 in DESIGN.md) */}
      <IndiaOverviewMap />

      {/* Hackathon Architecture / Workflow Guide Card */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800/80">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase font-mono">
              SYSTEM WORKFLOW & ARCHITECTURE (DESIGN.md)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">10-HOUR HACKATHON FOUNDATION</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-cyan-400 font-bold">1. NATIONAL GRID</div>
            <p className="text-slate-400 leading-relaxed">
              Synthesized state telemetry, forest cover metrics, and national claim status tracking.
            </p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-cyan-400 font-bold">2. STATE WEBGIS</div>
            <p className="text-slate-400 leading-relaxed">
              Esri World Imagery satellite basemap with cadastral claim polygons and district boundaries.
            </p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-cyan-400 font-bold">3. EXPLAINABLE AI</div>
            <p className="text-slate-400 leading-relaxed">
              Area discrepancy, processing duration, and canopy change indicators scored transparently.
            </p>
          </div>
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-cyan-400 font-bold">4. ACTIONABLE DOSSIER</div>
            <p className="text-slate-400 leading-relaxed">
              Right-side investigation panel recommending verified ground checks and Gram Sabha hearings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
