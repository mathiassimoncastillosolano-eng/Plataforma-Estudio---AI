import { useEffect, useRef } from "react";
import type { TemaEstudio } from "../tipos";
import { useBuddy } from "./BuddyProvider";
import { celebracionDominioCompleto, celebracionTemaCompletado } from "./mensajes";

export function useLogroDominio(tema: TemaEstudio | null) {
  const { anunciar } = useBuddy();
  const previo = useRef<{ id: string; dominio: number } | null>(null);

  useEffect(() => {
    if (!tema) return;
    const anterior = previo.current;
    previo.current = { id: tema.id, dominio: tema.dominio };
    if (!anterior || anterior.id !== tema.id || anterior.dominio === tema.dominio) return;
    if (anterior.dominio < 100 && tema.dominio >= 100) anunciar(celebracionDominioCompleto(tema.id, tema.titulo));
    else if (anterior.dominio < 95 && tema.dominio >= 95) anunciar(celebracionTemaCompletado(tema.id, tema.titulo, tema.dominio));
  }, [tema, anunciar]);
}
