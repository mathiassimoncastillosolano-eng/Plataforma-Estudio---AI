import { describe, expect, it } from "vitest";
import type { PreguntaEstudio } from "../tipos";
import { ampliarBanco, crearPractica, esEstadoPractica, preguntasPorIds, sinRepetidas } from "./practicaPreguntas";

const pregunta = (id: string, enunciado = `Enunciado ${id}`): PreguntaEstudio => ({
  id,
  idTema: "t1",
  enunciado,
  tipo: "opcion-multiple",
  dificultad: "media",
  opciones: [{ id: "a", etiqueta: "A" }],
  idOpcionCorrecta: "a",
  explicacion: "x",
});

describe("practicaPreguntas", () => {
  it("sinRepetidas descarta ids y enunciados repetidos sin distinguir mayúsculas", () => {
    const lista = sinRepetidas([pregunta("1", "¿Qué es X?"), pregunta("1", "Otro"), pregunta("2", " ¿QUÉ ES X? "), pregunta("3")]);
    expect(lista.map((p) => p.id)).toEqual(["1", "3"]);
  });

  it("crearPractica parte de la ronda 1 con todo el banco y sin respondidas", () => {
    const estado = crearPractica([pregunta("1"), pregunta("2")]);
    expect(estado).toEqual({ ronda: 1, banco: [pregunta("1"), pregunta("2")], idsRonda: ["1", "2"], idsSiguiente: null, respondidas: [], historial: {} });
  });

  it("ampliarBanco conserva el orden y no duplica", () => {
    const banco = ampliarBanco([pregunta("1"), pregunta("2")], [pregunta("2"), pregunta("3")]);
    expect(banco.map((p) => p.id)).toEqual(["1", "2", "3"]);
  });

  it("preguntasPorIds respeta el orden pedido e ignora ids desconocidos", () => {
    expect(preguntasPorIds([pregunta("1"), pregunta("2")], ["2", "x", "1"]).map((p) => p.id)).toEqual(["2", "1"]);
  });

  it("esEstadoPractica acepta un estado íntegro y rechaza datos corruptos", () => {
    const estado = crearPractica([pregunta("1")]);
    expect(esEstadoPractica(estado)).toBe(true);
    expect(esEstadoPractica({ ...estado, ronda: 0 })).toBe(false);
    expect(esEstadoPractica({ ...estado, banco: [{ id: 1 }] })).toBe(false);
    expect(esEstadoPractica({ ...estado, historial: { a: { aciertos: "x" } } })).toBe(false);
    expect(esEstadoPractica(null)).toBe(false);
  });
});
