import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import ThemeSelector from "./ThemeSelector";

export default function Header() {
  const location = useLocation();
  const isStateView = location.pathname.startsWith("/state");

  return (
    <header className="relative z-[9999] bg-[#180b15]/95 backdrop-blur-md border-b border-[#49243E]/80 px-3 lg:px-5 py-2 shrink-0">
      <div className="w-full flex items-center justify-between">
        {/* Simple Branding */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center shrink-0">
            <img
              srcSet="/Gemini_Generated_Image_r9ps5lr9ps5lr9ps-400w.webp 400w, /Gemini_Generated_Image_r9ps5lr9ps5lr9ps-600w.webp 600w, /Gemini_Generated_Image_r9ps5lr9ps5lr9ps-800w.webp 800w, /Gemini_Generated_Image_r9ps5lr9ps5lr9ps-1000w.webp 1000w, /Gemini_Generated_Image_r9ps5lr9ps5lr9ps-1200w.webp 1200w"
              sizes="(max-width: 400px) 400px, (max-width: 600px) 600px, (max-width: 800px) 800px, (max-width: 1000px) 1000px, (min-width: 1001px) 1200px"
              src="/Gemini_Generated_Image_r9ps5lr9ps5lr9ps.png"
              alt="CANOPY Emblem"
              width="1533"
              height="1771"
              className="h-10 sm:h-11 w-auto max-w-[48px] object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-[#DBAFA0] transition-colors leading-tight">
              CANOPY
            </span>
            <span className="text-[11px] text-[#c2a3b0] font-mono hidden sm:inline tracking-wider">
              Community Access &amp; Navigation for Ownership and Protection of Yields
            </span>
          </div>
        </Link>

        {/* Navigation & Global Theme Selector */}
        <div className="flex items-center gap-2.5 sm:gap-3 text-xs font-mono">
          {isStateView && (
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#241120] hover:bg-[#35182e] text-[#DBAFA0] hover:text-white border border-[#704264]/60 transition-colors text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#DBAFA0]" />
              <span>India Map</span>
            </Link>
          )}
          <ThemeSelector />
        </div>
      </div>
    </header>
  );
}
