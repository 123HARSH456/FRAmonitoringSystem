import { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Palette, Check } from "lucide-react";

export default function ThemeSelector() {
  const { theme, switchTheme, currentThemeConfig, THEMES } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const themeList = Object.values(THEMES);

  return (
    <div className="relative inline-block text-left z-[10000]" ref={dropdownRef}>
      {/* Compact Header Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#241120] hover:bg-[#35182e] border border-[#49243E] hover:border-[#BB8493] text-xs font-mono transition-all cursor-pointer shadow-sm group"
        title="Change UI Theme Palette"
        aria-label="Theme Selector"
      >
        <Palette className="w-3.5 h-3.5 text-[#DBAFA0] group-hover:scale-110 transition-transform" />
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30 shrink-0 shadow-sm"
            style={{ backgroundColor: currentThemeConfig.swatch }}
          />
          <span className="text-[#fdf5f2] font-semibold text-[11px] hidden sm:inline">
            {currentThemeConfig.name}
          </span>
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#241120] border border-[#49243E] shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-2 z-[10001] animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 border-b border-[#49243E]/60 mb-1 flex items-center justify-between">
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#c2a3b0] font-semibold">
              Global Theme
            </span>
            <span className="text-[9px] font-mono text-[#DBAFA0]/80">4 Palettes</span>
          </div>

          <div className="space-y-1">
            {themeList.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    switchTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#49243E]/80 text-white border border-[#BB8493]/50 shadow-sm"
                      : "text-[#c2a3b0] hover:text-white hover:bg-[#35182e] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-sm transition-transform ${
                        isSelected ? "scale-110 ring-2 ring-white/60" : "ring-1 ring-white/20"
                      }`}
                      style={{ backgroundColor: t.swatch }}
                    />
                    <div className="flex flex-col text-left leading-tight">
                      <span className="font-semibold text-[11px] text-slate-100">
                        {t.name}
                      </span>
                      <span className="text-[9px] text-[#c2a3b0]/70 font-normal">
                        {t.label}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[#DBAFA0] shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
