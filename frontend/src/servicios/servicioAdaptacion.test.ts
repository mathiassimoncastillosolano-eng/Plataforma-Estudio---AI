import { beforeEach, describe, expect, it, vi } from "vitest";

const enviar = vi.hoisted(() => vi.fn());
vi.mock("./clienteApi", () => ({ enviarJson: enviar }));

import { obtenerEstadoAdaptacion, reiniciarSesionEstudio } from "../almacen/almacenSesion";
import { consolidarPractica, nivelADominio, registrarPractica, reiniciarAdaptacion } from "./servicioAdaptacion";
import { crearTemaEstudio, obtenerTemaEstudio } from "./servicioEstudio";

const respuestas = (n: number) => Array.from({ length: n }, () => ({ dificultad: "media" as const, correcta: true, segundos: 8 }));
const estado = (nivel: number) => ({ nivel, numero_periodo: 2, ultimo_porcentaje: 1, correctas_total: 15, pendientes: [] });

beforeEach(() => {
  sessionStorage.clear();
  enviar.mockReset();
  reiniciarSesionEstudio();
  reiniciarAdaptacion();
});

describe("servicioAdaptacion", () => {
  it("sin período cerrado no cambia el dominio", async () => {
    enviar.mockResolvedValue({ id_tema: "t1", estado: estado(0.57), periodos_cerrados: [], dificultad_objetivo: "media" });
    const r = await registrarPractica("t1", respuestas(10));
    expect(r).toMatchObject({ dominio: null, periodosCerrados: 0 });
  });

  it("con período cerrado convierte el nivel del modelo a 0-100, guarda el estado y lo reenvía después", async () => {
    enviar.mockResolvedValue({ id_tema: "t1", estado: estado(0.6775), periodos_cerrados: [{}], dificultad_objetivo: "media" });
    const r = await registrarPractica("t1", respuestas(15));
    expect(r).toMatchObject({ dominio: 68, periodosCerrados: 1 });
    expect(enviar.mock.calls[0]?.[1]).not.toHaveProperty("estado");
    expect(obtenerEstadoAdaptacion("t1")).toEqual(estado(0.6775));
    await registrarPractica("t1", respuestas(3));
    expect(enviar.mock.calls[1]?.[1]).toMatchObject({ estado: estado(0.6775) });
  });

  it("si el backend falla devuelve null, no guarda estado y reintenta con las respuestas acumuladas", async () => {
    enviar.mockRejectedValueOnce(new Error("falla"));
    expect(await registrarPractica("t1", respuestas(10))).toBeNull();
    expect(obtenerEstadoAdaptacion("t1")).toBeUndefined();
    enviar.mockResolvedValue({ id_tema: "t1", estado: estado(0.6), periodos_cerrados: [{}], dificultad_objetivo: "media" });
    await registrarPractica("t1", respuestas(5));
    expect((enviar.mock.calls[1]?.[1] as { respuestas: unknown[] }).respuestas).toHaveLength(15);
  });

  it("nivelADominio acota a 0-100", () => {
    expect(nivelADominio(1.4)).toBe(100);
    expect(nivelADominio(-0.2)).toBe(0);
  });
});

describe("consolidarPractica", () => {
  const nuevoTema = () => crearTemaEstudio({ tituloTema: "Tema", categoria: "X", tipoFuente: "texto" });

  it("las respuestas de una práctica abandonada llegan al motor y suman a las preguntas respondidas sin tocar el dominio", async () => {
    const tema = await nuevoTema();
    enviar.mockResolvedValue({ id_tema: tema.id, estado: { ...estado(0.57), pendientes: respuestas(7) }, periodos_cerrados: [], dificultad_objetivo: "media" });
    expect(await consolidarPractica(tema.id, respuestas(7), 7)).toBeNull();
    expect((enviar.mock.calls[0]?.[1] as { respuestas: unknown[] }).respuestas).toHaveLength(7);
    const guardado = await obtenerTemaEstudio(tema.id);
    expect(guardado).toMatchObject({ dominio: 0, preguntasRespondidas: 7 });
    expect(obtenerEstadoAdaptacion(tema.id)?.pendientes).toHaveLength(7);
  });

  it("con un período cerrado actualiza el dominio y devuelve el tema actualizado", async () => {
    const tema = await nuevoTema();
    enviar.mockResolvedValue({ id_tema: tema.id, estado: estado(0.6), periodos_cerrados: [{}], dificultad_objetivo: "media" });
    const actualizado = await consolidarPractica(tema.id, respuestas(15), 15);
    expect(actualizado).toMatchObject({ dominio: 60, preguntasRespondidas: 15 });
    expect(await obtenerTemaEstudio(tema.id)).toMatchObject({ dominio: 60 });
  });
});
