import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAutenticacion } from "../hooks/useAutenticacion";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { colaInicial, reducirCola } from "./cola";
import { crearEvento, type EventoBuddy, type EventoParcial } from "./tipos";
import { presentacionModulo, type ClaveModulo } from "./mensajes";
import { buddyInicial, guardarBuddy, leerBuddy, marcarVisto, puedeMostrarse, type BuddyPersistido, type EstadoGuia, type EstadoInvitacion } from "./persistencia";

interface ValorBuddy {
  usuarioId: string | null;
  actual: EventoBuddy | null;
  saliendo: boolean;
  anunciar: (evento: EventoParcial) => void;
  cerrar: () => void;
  quitar: (id: string) => void;
  bloquear: () => () => void;
  ayudaAbierta: boolean;
  abrirAyuda: () => void;
  cerrarAyuda: () => void;
  persistido: BuddyPersistido;
  establecerInvitacion: (valor: EstadoInvitacion) => void;
  registrarGuia: (id: string, estado: EstadoGuia) => void;
}

const ContextoBuddy = createContext<ValorBuddy | undefined>(undefined);

export function ProveedorBuddy({ children }: { children: ReactNode }) {
  const { usuario } = useAutenticacion();
  const ubicacion = useLocation();
  const usuarioId = usuario?.id ?? null;
  const reducido = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [cola, despachar] = useReducer(reducirCola, colaInicial);
  const [version, establecerVersion] = useState(0);
  const [ayudaAbierta, establecerAyudaAbierta] = useState(false);

  const usuarioRef = useRef<string | null>(null);
  const persistidoRef = useRef<BuddyPersistido>(buddyInicial);
  const rutaRef = useRef(ubicacion.pathname);
  const bloqueosRef = useRef(0);
  const montadoRef = useRef(false);

  rutaRef.current = ubicacion.pathname;
  if (usuarioRef.current !== usuarioId) {
    usuarioRef.current = usuarioId;
    persistidoRef.current = usuarioId ? leerBuddy(usuarioId) : buddyInicial;
  }

  useEffect(() => {
    if (!montadoRef.current) {
      montadoRef.current = true;
      return;
    }
    bloqueosRef.current = 0;
    despachar({ tipo: "reiniciar" });
    establecerAyudaAbierta(false);
    establecerVersion((v) => v + 1);
  }, [usuarioId]);

  const actualizarPersistido = useCallback((cambio: (previo: BuddyPersistido) => BuddyPersistido) => {
    const id = usuarioRef.current;
    if (!id) return;
    persistidoRef.current = cambio(persistidoRef.current);
    guardarBuddy(id, persistidoRef.current);
    establecerVersion((v) => v + 1);
  }, []);

  const anunciar = useCallback((parcial: EventoParcial) => {
    if (!usuarioRef.current) return;
    const evento = crearEvento(parcial, rutaRef.current);
    if (bloqueosRef.current > 0 && evento.modo !== "tutorial") return;
    if (!puedeMostrarse(persistidoRef.current, evento, Date.now())) return;
    despachar({ tipo: "anunciar", evento });
  }, []);

  const cerrar = useCallback(() => despachar({ tipo: "cerrar" }), []);
  const quitar = useCallback((id: string) => despachar({ tipo: "quitar", id }), []);

  const bloquear = useCallback(() => {
    bloqueosRef.current += 1;
    if (bloqueosRef.current === 1) despachar({ tipo: "bloquear" });
    let activo = true;
    return () => {
      if (!activo) return;
      activo = false;
      bloqueosRef.current = Math.max(0, bloqueosRef.current - 1);
    };
  }, []);

  const abrirAyuda = useCallback(() => establecerAyudaAbierta(true), []);
  const cerrarAyuda = useCallback(() => establecerAyudaAbierta(false), []);

  const establecerInvitacion = useCallback((valor: EstadoInvitacion) => actualizarPersistido((p) => ({ ...p, invitacion: valor })), [actualizarPersistido]);
  const registrarGuia = useCallback((id: string, estado: EstadoGuia) => actualizarPersistido((p) => ({ ...p, guias: { ...p.guias, [id]: estado } })), [actualizarPersistido]);

  const idActual = cola.actual?.id;
  useEffect(() => {
    const actual = cola.actual;
    if (!actual || actual.enfriamientoMs === undefined) return;
    actualizarPersistido((p) => marcarVisto(p, actual.id, Date.now()));
  }, [idActual]);

  useEffect(() => {
    const actual = cola.actual;
    if (!actual || cola.saliendo || actual.duracionMs === null) return;
    const temporizador = window.setTimeout(() => despachar({ tipo: "cerrar" }), actual.duracionMs);
    return () => window.clearTimeout(temporizador);
  }, [idActual, cola.saliendo]);

  useEffect(() => {
    if (!cola.saliendo) return;
    const temporizador = window.setTimeout(() => despachar({ tipo: "terminarSalida" }), reducido ? 0 : 260);
    return () => window.clearTimeout(temporizador);
  }, [cola.saliendo, reducido]);

  useEffect(() => {
    despachar({ tipo: "cancelarRuta", ruta: ubicacion.pathname });
  }, [ubicacion.pathname]);

  const valor = useMemo<ValorBuddy>(
    () => ({
      usuarioId,
      actual: cola.actual,
      saliendo: cola.saliendo,
      anunciar,
      cerrar,
      quitar,
      bloquear,
      ayudaAbierta,
      abrirAyuda,
      cerrarAyuda,
      persistido: persistidoRef.current,
      establecerInvitacion,
      registrarGuia,
    }),
    [usuarioId, cola.actual, cola.saliendo, anunciar, cerrar, quitar, bloquear, ayudaAbierta, abrirAyuda, cerrarAyuda, establecerInvitacion, registrarGuia, version]
  );

  return <ContextoBuddy.Provider value={valor}>{children}</ContextoBuddy.Provider>;
}

export function useBuddy(): ValorBuddy {
  const ctx = useContext(ContextoBuddy);
  if (!ctx) throw new Error("useBuddy debe usarse dentro de un ProveedorBuddy");
  return ctx;
}

export function useBloqueoBuddy(activo: boolean) {
  const { bloquear } = useBuddy();
  useEffect(() => {
    if (!activo) return;
    return bloquear();
  }, [activo, bloquear]);
}

export function usePresentacionModulo(clave: ClaveModulo) {
  const { anunciar, persistido } = useBuddy();
  const { usuario } = useAutenticacion();
  const omitir = useRef(clave === "panel" && persistido.invitacion === "pendiente");
  const nombre = usuario?.nombre;
  useEffect(() => {
    if (omitir.current) return;
    anunciar(presentacionModulo(clave, nombre));
  }, [anunciar, clave, nombre]);
}
