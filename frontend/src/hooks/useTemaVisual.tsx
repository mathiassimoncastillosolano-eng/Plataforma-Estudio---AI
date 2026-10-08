import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type TemaVisual = "light" | "dark";
export type Acento = "blue" | "purple";

const CLAVE_TEMA_VISUAL = "estudioai.temaVisual";
const CLAVE_ACENTO = "estudioai.acento";

interface ValorContextoTemaVisual {
  temaVisual: TemaVisual;
  acento: Acento;
  alternarTemaVisual: () => void;
  establecerTemaVisual: (temaVisual: TemaVisual) => void;
  establecerAcento: (acento: Acento) => void;
}

const ContextoTemaVisual = createContext<ValorContextoTemaVisual | undefined>(undefined);

function leerAlmacenado<T extends string>(clave: string, permitidos: readonly T[]): T | null {
  try {
    const almacenado = window.localStorage.getItem(clave);
    return almacenado && (permitidos as readonly string[]).includes(almacenado) ? (almacenado as T) : null;
  } catch {
    return null;
  }
}

function obtenerTemaVisualInicial(): TemaVisual {
  if (typeof window === "undefined") return "light";
  const almacenado = leerAlmacenado<TemaVisual>(CLAVE_TEMA_VISUAL, ["light", "dark"]);
  if (almacenado) return almacenado;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** El azul es la identidad nueva; el morado se conserva como alternativa. */
function obtenerAcentoInicial(): Acento {
  if (typeof window === "undefined") return "blue";
  return leerAlmacenado<Acento>(CLAVE_ACENTO, ["blue", "purple"]) ?? "blue";
}

export function ProveedorTemaVisual({ children }: { children: ReactNode }) {
  const [temaVisual, establecerEstadoTemaVisual] = useState<TemaVisual>(obtenerTemaVisualInicial);
  const [acento, establecerEstadoAcento] = useState<Acento>(obtenerAcentoInicial);
  const primerRender = useRef(true);

  useEffect(() => {
    const raiz = document.documentElement;
    // Transición de color suave, solo cuando el usuario cambia la apariencia
    // (no en la carga inicial, para evitar un destello).
    if (!primerRender.current) {
      raiz.classList.add("theme-switching");
      window.setTimeout(() => raiz.classList.remove("theme-switching"), 300);
    }
    primerRender.current = false;

    raiz.setAttribute("data-theme", temaVisual);
    raiz.setAttribute("data-accent", acento);
    try {
      window.localStorage.setItem(CLAVE_TEMA_VISUAL, temaVisual);
      window.localStorage.setItem(CLAVE_ACENTO, acento);
    } catch {
      /* almacenamiento no disponible: la preferencia vive solo en esta sesión */
    }

    // Color de la barra del navegador en móvil
    const metadatos = document.querySelector('meta[name="theme-color"]');
    const bg = getComputedStyle(raiz).getPropertyValue("--meta-theme-color").trim();
    if (metadatos && bg) metadatos.setAttribute("content", bg);
  }, [temaVisual, acento]);

  const establecerTemaVisual = useCallback((siguiente: TemaVisual) => establecerEstadoTemaVisual(siguiente), []);
  const establecerAcento = useCallback((siguiente: Acento) => establecerEstadoAcento(siguiente), []);
  const alternarTemaVisual = useCallback(() => establecerEstadoTemaVisual((previo) => (previo === "dark" ? "light" : "dark")), []);

  const valor = useMemo(() => ({ temaVisual, acento, alternarTemaVisual, establecerTemaVisual, establecerAcento }), [temaVisual, acento, alternarTemaVisual, establecerTemaVisual, establecerAcento]);

  return <ContextoTemaVisual.Provider value={valor}>{children}</ContextoTemaVisual.Provider>;
}

export function useTemaVisual(): ValorContextoTemaVisual {
  const ctx = useContext(ContextoTemaVisual);
  if (!ctx) throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  return ctx;
}
