import { ArrowLeft } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import canopyLogo from "../../assets/canopy-logo.jpg";

export default function Header() {
  const location = useLocation();
  const isStateView = location.pathname.startsWith("/state");

  return (
    <header className="bg-[#180b15]/95 backdrop-blur-md border-b border-[#49243E]/80 px-3 lg:px-5 py-2.5">
      <div className="w-full flex items-center justify-between">
        {/* Simple Branding */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#BB8493]/50 shadow-sm shadow-black/50 flex items-center justify-center bg-[#241120] group-hover:border-[#DBAFA0] group-hover:ring-2 group-hover:ring-[#DBAFA0]/40 transition-all shrink-0">
            <img
              src={canopyLogo}
              alt="CANOPY Logo"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight text-white group-hover:text-[#DBAFA0] transition-colors">
              CANOPY
            </span>
            <span className="text-[11px] text-[#c2a3b0] font-mono hidden sm:inline tracking-wider">
              Community Access &amp; Navigation for Ownership and Protection of Yields
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-4 text-xs font-mono">
          {isStateView && (
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#241120] hover:bg-[#35182e] text-[#DBAFA0] hover:text-white border border-[#704264]/60 transition-colors text-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#DBAFA0]" />
              <span>India Map</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
