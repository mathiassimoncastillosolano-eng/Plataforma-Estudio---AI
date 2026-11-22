import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAutenticacion } from "../../hooks/useAutenticacion";
import { obtenerTemasEstudio } from "../../servicios/servicioEstudio";
import { useBuddy } from "../BuddyProvider";
import { cierreGuia } from "../mensajes";
import { borrarTutorial, guardarTutorial, leerTutorial } from "../persistencia";
import { PRIORIDAD } from "../tipos";
import { buscarGuia, type Guia } from "./guias";

interface EstadoTutorial {
  guiaId: string;
  indice: number;
  temaId: string | null;
  sinTema: boolean;
}

interface ValorTutorial {
  guia: Guia | null;
  indice: number;
  temaId: string | null;
  sinTema: boolean;
  idEvento: string | null;
  iniciar: (guiaId: string) => void;
  siguiente: () => void;
  anterior: () => void;
  irAPaso: (indice: number) => void;
  omitir: () => void;
  cerrar: () => void;
}

const ContextoTutorial = createContext<ValorTutorial | undefined>(undefined);

export const idEventoTutorial = (guiaId: string) => `tutorial:${guiaId}`;

const COINCIDENCIA_TEMA = /^\/estudio\/([^/]+)/;

export function ProveedorTutorial({ children }: { children: ReactNode }) {
  const { usuario } = useAutenticacion();
  const { anunciar, quitar, cerrarAyuda, registrarGuia } = useBuddy();
  const ubicacion = useLocation();
  const usuarioId = usuario?.id ?? null;
  const [estado, establecerEstado] = useState<EstadoTutorial | null>(null);
  const rutaRef = useRef(ubicacion.pathname);
  const estadoRef = useRef<EstadoTutorial | null>(null);
  rutaRef.current = ubicacion.pathname;
  estadoRef.current = estado;

  const guia = estado ? buscarGuia(estado.guiaId) ?? null : null;

  const anunciarGuia = useCallback(
    (g: Guia) => {
      anunciar({
        id: idEventoTutorial(g.id),
        modo: "tutorial",
        prioridad: PRIORIDAD.tutorial,
        estado: "pointing",
        mensaje: g.titulo,
        duracionMs: null,
        cerrable: false,
        retener: true,
        cancelarAlNavegar: false,
      });
    },
    [anunciar]
  );

  const salir = useCallback(() => {
    const actual = estadoRef.current;
    if (!actual) return;
    quitar(idEventoTutorial(actual.guiaId));
    establecerEstado(null);
    if (usuarioId) borrarTutorial(usuarioId);
  }, [quitar, usuarioId]);

  const iniciar = useCallback(
    (guiaId: string) => {
      const g = buscarGuia(guiaId);
      if (!g) return;
      cerrarAyuda();
      const previa = estadoRef.current;
      if (previa) quitar(idEventoTutorial(previa.guiaId));
      void (async () => {
        let temaId: string | null = null;
        if (g.requiereTema) {
          const coincidencia = rutaRef.current.match(COINCIDENCIA_TEMA);
          if (coincidencia && coincidencia[1] !== "nuevo") temaId = coincidencia[1];
          else {
            try {
              temaId = (await obtenerTemasEstudio())[0]?.id ?? null;
            } catch {
              temaId = null;
            }
          }
        }
        establecerEstado({ guiaId, indice: 0, temaId, sinTema: g.requiereTema && !temaId });
        anunciarGuia(g);
      })();
    },
    [anunciarGuia, cerrarAyuda, quitar]
  );

  const finalizar = useCallback(
    (resultado: "completada" | "omitida" | null) => {
      const actual = estadoRef.current;
      const g = actual ? buscarGuia(actual.guiaId) : undefined;
      salir();
      if (!actual || !g) return;
      if (resultado) registrarGuia(g.id, resultado);
      if (resultado === "completada") anunciar(cierreGuia(g.id, g.titulo));
    },
    [anunciar, registrarGuia, salir]
  );

  const irAPaso = useCallback((indice: number) => {
    establecerEstado((previo) => {
      const g = previo ? buscarGuia(previo.guiaId) : undefined;
      if (!previo || !g) return previo;
      return { ...previo, indice: Math.max(0, Math.min(g.pasos.length - 1, indice)) };
    });
  }, []);

  const siguiente = useCallback(() => {
    const actual = estadoRef.current;
    const g = actual ? buscarGuia(actual.guiaId) : undefined;
    if (!actual || !g) return;
    if (actual.sinTema || actual.indice >= g.pasos.length - 1) finalizar("completada");
    else irAPaso(actual.indice + 1);
  }, [finalizar, irAPaso]);

  const anterior = useCallback(() => {
    const actual = estadoRef.current;
    if (actual) irAPaso(actual.indice - 1);
  }, [irAPaso]);

  const omitir = useCallback(() => finalizar("omitida"), [finalizar]);
  const cerrar = useCallback(() => finalizar(null), [finalizar]);

  useEffect(() => {
    if (!usuarioId) return;
    const guardado = leerTutorial(usuarioId);
    const g = guardado ? buscarGuia(guardado.guiaId) : undefined;
    if (!guardado || !g) return;
    establecerEstado({ guiaId: g.id, indice: Math.min(guardado.indice, g.pasos.length - 1), temaId: guardado.temaId, sinTema: false });
    anunciarGuia(g);
    return () => {
      establecerEstado(null);
    };
  }, [usuarioId, anunciarGuia]);

  useEffect(() => {
    if (!usuarioId || !estado || estado.sinTema) return;
    guardarTutorial(usuarioId, { guiaId: estado.guiaId, indice: estado.indice, temaId: estado.temaId });
  }, [usuarioId, estado]);

  const valor = useMemo<ValorTutorial>(
    () => ({
      guia,
      indice: estado?.indice ?? 0,
      temaId: estado?.temaId ?? null,
      sinTema: estado?.sinTema ?? false,
      idEvento: guia ? idEventoTutorial(guia.id) : null,
      iniciar,
      siguiente,
      anterior,
      irAPaso,
      omitir,
      cerrar,
    }),
    [guia, estado, iniciar, siguiente, anterior, irAPaso, omitir, cerrar]
  );

  return <ContextoTutorial.Provider value={valor}>{children}</ContextoTutorial.Provider>;
}

export function useTutorial(): ValorTutorial {
  const ctx = useContext(ContextoTutorial);
  if (!ctx) throw new Error("useTutorial debe usarse dentro de un ProveedorTutorial");
  return ctx;
}
