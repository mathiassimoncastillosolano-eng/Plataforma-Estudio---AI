import { beforeEach, describe, expect, it } from "vitest";
import { CLAVES_SESION, VERSION_PERSISTENCIA, guardarEstudioPersistido, leerEstudioPersistido } from "./persistenciaSesion";
import { activarPersistenciaEstudio, eliminarDatosTema, guardarEstadoAdaptacion, obtenerEstadoAdaptacion, obtenerSesion, registrarRespuestas, reiniciarSesionEstudio, restaurarEstudio } from "./almacenSesion";
import type { EstadoAdaptacion } from "../utilidades/adaptacion";

const estado = (nivel: number, periodo = 1, pendientes: EstadoAdaptacion["pendientes"] = []): EstadoAdaptacion => ({ nivel, numero_periodo: periodo, ultimo_porcentaje: periodo > 1 ? 0.8 : null, pendientes });
const pendiente = { dificultad: "media" as const, correcta: true };
const resp = { dificultad: "media" as const, correcta: true, segundos: 3, origen: "practica" as const };
const base = { usuarioId: "g-1", iniciadoEn: 1, fuentes: {}, resumenes: {}, mapas: {}, actividad: [] };
const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms));

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  reiniciarSesionEstudio();
});

describe("MOD-08 · estado adaptativo en el almacén", () => {
  it("guarda y lee el estado por tema; un tema sin historial devuelve undefined", () => {
    guardarEstadoAdaptacion("t1", estado(0.6, 2, [pendiente]));
    expect(obtenerEstadoAdaptacion("t1")).toEqual(estado(0.6, 2, [pendiente]));
    expect(obtenerSesion().adaptacion.t1).toEqual(estado(0.6, 2, [pendiente]));
    expect(obtenerEstadoAdaptacion("t2")).toBeUndefined();
  });

  it("guardar reemplaza el estado completo del tema, sin mezclarlo con el anterior", () => {
    guardarEstadoAdaptacion("t1", estado(0.6, 2, [pendiente, pendiente]));
    guardarEstadoAdaptacion("t1", estado(0.7, 3));
    expect(obtenerEstadoAdaptacion("t1")).toEqual(estado(0.7, 3));
  });

  it("no comparte referencias con el objeto entregado", () => {
    const entregado = estado(0.6, 1, [pendiente]);
    guardarEstadoAdaptacion("t1", entregado);
    entregado.pendientes.push(pendiente);
    entregado.nivel = 0.99;
    expect(obtenerEstadoAdaptacion("t1")).toEqual(estado(0.6, 1, [pendiente]));
  });

  it("eliminar un tema borra su estado adaptativo y deja los demás", () => {
    guardarEstadoAdaptacion("t1", estado(0.6));
    guardarEstadoAdaptacion("t2", estado(0.7));
    eliminarDatosTema("t1");
    expect(Object.keys(obtenerSesion().adaptacion)).toEqual(["t2"]);
  });

  it("reiniciar la sesión (cierre de sesión) borra todo el estado adaptativo", () => {
    guardarEstadoAdaptacion("t1", estado(0.6));
    guardarEstadoAdaptacion("t2", estado(0.7));
    reiniciarSesionEstudio();
    expect(obtenerSesion().adaptacion).toEqual({});
  });

  it("es independiente del rendimiento: ninguno de los dos registros altera al otro", () => {
    registrarRespuestas("t1", [resp]);
    guardarEstadoAdaptacion("t1", estado(0.6));
    expect(obtenerSesion().rendimiento.t1).toHaveLength(1);
    registrarRespuestas("t1", [resp, resp]);
    expect(obtenerEstadoAdaptacion("t1")).toEqual(estado(0.6));
    eliminarDatosTema("t1");
    expect(obtenerSesion().rendimiento.t1).toBeUndefined();
    expect(obtenerEstadoAdaptacion("t1")).toBeUndefined();
  });
});

describe("MOD-08 · estado adaptativo en la persistencia", () => {
  it("se vuelca a sessionStorage cuando hay una cuenta activa", async () => {
    activarPersistenciaEstudio("g-1");
    guardarEstadoAdaptacion("t1", estado(0.6, 2, [pendiente]));
    await esperar(350);
    const guardado = JSON.parse(sessionStorage.getItem(CLAVES_SESION.estudio)!);
    expect(guardado.datos.adaptacion.t1).toEqual(estado(0.6, 2, [pendiente]));
  });

  it("sobrevive a una recarga solo para la misma cuenta", () => {
    guardarEstadoAdaptacion("t1", estado(0.6, 2, [pendiente]));
    guardarEstudioPersistido({ ...base, adaptacion: obtenerSesion().adaptacion });
    reiniciarSesionEstudio();
    restaurarEstudio("g-2");
    expect(obtenerSesion().adaptacion).toEqual({});
    restaurarEstudio("g-1");
    expect(obtenerEstadoAdaptacion("t1")).toEqual(estado(0.6, 2, [pendiente]));
  });

  it("los datos guardados sin el campo (versión anterior) se leen como vacíos", () => {
    sessionStorage.setItem(CLAVES_SESION.estudio, JSON.stringify({ v: VERSION_PERSISTENCIA, datos: base }));
    expect(leerEstudioPersistido("g-1")?.adaptacion).toEqual({});
  });

  it("descarta el tema con estado dañado y conserva los íntegros", () => {
    const dañados = {
      nivelFuera: { ...estado(0.5), nivel: 2 },
      periodoCero: { ...estado(0.5), numero_periodo: 0 },
      demasiadas: estado(0.5, 1, Array.from({ length: 15 }, () => pendiente)),
      respuestaMala: estado(0.5, 1, [{ dificultad: "x", correcta: true } as never]),
      basura: 5,
    };
    sessionStorage.setItem(CLAVES_SESION.estudio, JSON.stringify({ v: VERSION_PERSISTENCIA, datos: { ...base, adaptacion: { ok: estado(0.6, 2, [pendiente]), ...dañados } } }));
    expect(leerEstudioPersistido("g-1")!.adaptacion).toEqual({ ok: estado(0.6, 2, [pendiente]) });
  });

  it("restaurar no toca el rendimiento guardado ni lo mezcla con la adaptación", () => {
    registrarRespuestas("t1", [resp]);
    guardarEstadoAdaptacion("t1", estado(0.6));
    guardarEstudioPersistido({ ...base, rendimiento: obtenerSesion().rendimiento, adaptacion: obtenerSesion().adaptacion });
    reiniciarSesionEstudio();
    restaurarEstudio("g-1");
    expect(obtenerSesion().rendimiento.t1).toHaveLength(1);
    expect(obtenerEstadoAdaptacion("t1")).toEqual(estado(0.6));
  });
});
