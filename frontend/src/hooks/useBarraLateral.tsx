import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const CLAVE_ALMACENAMIENTO = "estudioai.barraLateralContraida";

interface ValorContextoBarraLateral {
  contraida: boolean;
  alternarContraido: () => void;
}

const ContextoBarraLateral = createContext<ValorContextoBarraLateral | undefined>(undefined);

function obtenerContraidoInicial(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(CLAVE_ALMACENAMIENTO) === "1";
}

export function ProveedorBarraLateral({ children }: { children: ReactNode }) {
  const [contraida, establecerContraida] = useState<boolean>(obtenerContraidoInicial);

  useEffect(() => {
    window.localStorage.setItem(CLAVE_ALMACENAMIENTO, contraida ? "1" : "0");
  }, [contraida]);

  const alternarContraido = useCallback(() => establecerContraida((previo) => !previo), []);

  const valor = useMemo(() => ({ contraida, alternarContraido }), [contraida, alternarContraido]);

  return <ContextoBarraLateral.Provider value={valor}>{children}</ContextoBarraLateral.Provider>;
}

export function useBarraLateral(): ValorContextoBarraLateral {
  const ctx = useContext(ContextoBarraLateral);
  if (!ctx) throw new Error("useSidebar debe usarse dentro de un SidebarProvider");
  return ctx;
}
