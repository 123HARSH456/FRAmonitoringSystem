import { createContext, useContext, useState, useEffect, useRef } from "react";

export const THEMES = {
  orange: {
    id: "orange",
    name: "Orange",
    label: "Warm Solar",
    swatch: "#f97316",
    swatchBg: "#17110c",
    accentPrimary: "#ea580c",
    accentHighlight: "#fed7aa",
    accentMuted: "#d5b298",
    bgPrimary: "#150f0a",
    bgSecondary: "#22170f",
    bgBase: "#150f0a",
    bgCard: "#22170f",
    borderMain: "#4a2610",
  },
  blue: {
    id: "blue",
    name: "Blue",
    label: "Deep Ocean",
    swatch: "#0284c7",
    swatchBg: "#0c131f",
    accentPrimary: "#0284c7",
    accentHighlight: "#bae6fd",
    accentMuted: "#94b5d4",
    bgPrimary: "#0a111c",
    bgSecondary: "#101c2e",
    bgBase: "#0a111c",
    bgCard: "#101c2e",
    borderMain: "#193556",
  },
  green: {
    id: "green",
    name: "Green",
    label: "Forest Emerald",
    swatch: "#10b981",
    swatchBg: "#0a150f",
    accentPrimary: "#059669",
    accentHighlight: "#a7f3d0",
    accentMuted: "#9dcbb4",
    bgPrimary: "#0a150f",
    bgSecondary: "#102219",
    bgBase: "#0a150f",
    bgCard: "#102219",
    borderMain: "#17422f",
  },
  black: {
    id: "black",
    name: "Black",
    label: "Stealth Zinc",
    swatch: "#71717a",
    swatchBg: "#09090b",
    accentPrimary: "#3f3f46",
    accentHighlight: "#e4e4e7",
    accentMuted: "#a1a1aa",
    bgPrimary: "#09090b",
    bgSecondary: "#141417",
    bgBase: "#09090b",
    bgCard: "#141417",
    borderMain: "#27272a",
  },
};

const ThemeContext = createContext({
  theme: "orange",
  currentThemeConfig: THEMES.orange,
  switchTheme: () => {},
  isSwiping: false,
  THEMES,
});

export function ThemeProvider({ children }) {
  // Read persisted theme or default to "orange"
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("canopy_theme");
      if (saved && THEMES[saved]) return saved;
    } catch {
      // ignore
    }
    return "orange";
  });

  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeAccent, setSwipeAccent] = useState(THEMES.orange.swatch);
  const wipeTimerRef = useRef(null);
  const switchTimerRef = useRef(null);

  // Apply data-theme to root html element on initial load and updates
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PowerPoint-style horizontal wipe transition
  const switchTheme = (targetThemeId) => {
    if (!THEMES[targetThemeId] || targetThemeId === theme) return;

    const targetTheme = THEMES[targetThemeId];
    setSwipeAccent(targetTheme.swatch);
    setIsSwiping(true);

    if (wipeTimerRef.current) clearTimeout(wipeTimerRef.current);
    if (switchTimerRef.current) clearTimeout(switchTimerRef.current);

    // Mid-flight of the swipe wave (~220ms), switch the theme variables
    switchTimerRef.current = setTimeout(() => {
      setTheme(targetThemeId);
      document.documentElement.setAttribute("data-theme", targetThemeId);
      try {
        localStorage.setItem("canopy_theme", targetThemeId);
      } catch {
        // ignore
      }
    }, 220);

    // Finish wipe animation at 580ms
    wipeTimerRef.current = setTimeout(() => {
      setIsSwiping(false);
    }, 580);
  };

  const currentThemeConfig = THEMES[theme] || THEMES.orange;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        currentThemeConfig,
        switchTheme,
        isSwiping,
        THEMES,
      }}
    >
      {children}
      {/* PowerPoint Horizontal Swipe / Wipe Transition Overlay */}
      {isSwiping && (
        <div className="theme-swipe-container">
          <div
            className="theme-swipe-beam"
            style={{ "--sweep-accent": swipeAccent }}
          />
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
