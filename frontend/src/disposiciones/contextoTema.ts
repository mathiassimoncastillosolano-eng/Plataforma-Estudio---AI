import { createContext, useContext } from "react";
import type { TemaEstudio } from "../tipos";

interface ValorContextoTema {
  tema: TemaEstudio;
  refrescar: () => Promise<void>;
  establecerTema: (tema: TemaEstudio) => void;
}

export const ContextoTema = createContext<ValorContextoTema | undefined>(undefined);

export function useContextoTema(): ValorContextoTema {
  const ctx = useContext(ContextoTema);
  if (!ctx) throw new Error("useTopicContext debe usarse dentro de TopicLayout");
  return ctx;
}
