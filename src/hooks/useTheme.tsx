import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";
export type Accent = "blue" | "purple";

const THEME_KEY = "cursa.theme";
const ACCENT_KEY = "cursa.accent";

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStored<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const stored = window.localStorage.getItem(key);
    return stored && (allowed as readonly string[]).includes(stored) ? (stored as T) : null;
  } catch {
    return null;
  }
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = readStored<Theme>(THEME_KEY, ["light", "dark"]);
  if (stored) return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** El azul es la identidad nueva; el morado se conserva como alternativa. */
function getInitialAccent(): Accent {
  if (typeof window === "undefined") return "blue";
  return readStored<Accent>(ACCENT_KEY, ["blue", "purple"]) ?? "blue";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [accent, setAccentState] = useState<Accent>(getInitialAccent);
  const firstRender = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    // Transición de color suave, solo cuando el usuario cambia la apariencia
    // (no en la carga inicial, para evitar un destello).
    if (!firstRender.current) {
      root.classList.add("theme-switching");
      window.setTimeout(() => root.classList.remove("theme-switching"), 300);
    }
    firstRender.current = false;

    root.setAttribute("data-theme", theme);
    root.setAttribute("data-accent", accent);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
      window.localStorage.setItem(ACCENT_KEY, accent);
    } catch {
      /* almacenamiento no disponible: la preferencia vive solo en esta sesión */
    }

    // Color de la barra del navegador en móvil
    const meta = document.querySelector('meta[name="theme-color"]');
    const bg = getComputedStyle(root).getPropertyValue("--meta-theme-color").trim();
    if (meta && bg) meta.setAttribute("content", bg);
  }, [theme, accent]);

  const setTheme = useCallback((next: Theme) => setThemeState(next), []);
  const setAccent = useCallback((next: Accent) => setAccentState(next), []);
  const toggleTheme = useCallback(() => setThemeState((prev) => (prev === "dark" ? "light" : "dark")), []);

  const value = useMemo(() => ({ theme, accent, toggleTheme, setTheme, setAccent }), [theme, accent, toggleTheme, setTheme, setAccent]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  return ctx;
}
