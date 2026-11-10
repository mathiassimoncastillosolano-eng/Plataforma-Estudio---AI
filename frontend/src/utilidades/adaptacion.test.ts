import { describe, expect, it } from "vitest";
import { MAX_NUMERO_PERIODO, MAX_PENDIENTES_ADAPTACION, copiarEstadoAdaptacion, esEstadoAdaptacion, type EstadoAdaptacion } from "./adaptacion";

const pendiente = { dificultad: "media" as const, correcta: true };
const valido = (): EstadoAdaptacion => ({ nivel: 0.57, numero_periodo: 1, ultimo_porcentaje: null, pendientes: [] });

describe("esEstadoAdaptacion", () => {
  it("acepta el estado inicial del motor y uno con período cerrado y pendientes", () => {
    expect(esEstadoAdaptacion(valido())).toBe(true);
    expect(esEstadoAdaptacion({ nivel: 0.6775, numero_periodo: 2, ultimo_porcentaje: 0.8, pendientes: [pendiente, { dificultad: "dificil", correcta: false }] })).toBe(true);
  });

  it("acepta los extremos válidos", () => {
    expect(esEstadoAdaptacion({ ...valido(), nivel: 0, ultimo_porcentaje: 0 })).toBe(true);
    expect(esEstadoAdaptacion({ ...valido(), nivel: 1, ultimo_porcentaje: 1, numero_periodo: MAX_NUMERO_PERIODO })).toBe(true);
    expect(esEstadoAdaptacion({ ...valido(), pendientes: Array.from({ length: MAX_PENDIENTES_ADAPTACION }, () => pendiente) })).toBe(true);
  });

  it("rechaza nivel o porcentaje fuera de 0–1 o no numéricos", () => {
    for (const nivel of [-0.1, 1.1, NaN, Infinity, "0.5", null]) expect(esEstadoAdaptacion({ ...valido(), nivel })).toBe(false);
    for (const ultimo of [-1, 2, "x", undefined]) expect(esEstadoAdaptacion({ ...valido(), ultimo_porcentaje: ultimo })).toBe(false);
  });

  it("rechaza un número de período que el backend no aceptaría", () => {
    for (const n of [0, -1, 1.5, MAX_NUMERO_PERIODO + 1, "2"]) expect(esEstadoAdaptacion({ ...valido(), numero_periodo: n })).toBe(false);
  });

  it("rechaza pendientes de más (15 completan un período) o con datos inválidos", () => {
    expect(esEstadoAdaptacion({ ...valido(), pendientes: Array.from({ length: MAX_PENDIENTES_ADAPTACION + 1 }, () => pendiente) })).toBe(false);
    expect(esEstadoAdaptacion({ ...valido(), pendientes: [{ dificultad: "imposible", correcta: true }] })).toBe(false);
    expect(esEstadoAdaptacion({ ...valido(), pendientes: [{ dificultad: "media", correcta: "si" }] })).toBe(false);
    expect(esEstadoAdaptacion({ ...valido(), pendientes: [7] })).toBe(false);
    expect(esEstadoAdaptacion({ ...valido(), pendientes: "no" })).toBe(false);
  });

  it("rechaza lo que no es un objeto", () => {
    for (const x of [null, undefined, 5, "texto", []]) expect(esEstadoAdaptacion(x)).toBe(false);
  });
});

describe("copiarEstadoAdaptacion", () => {
  it("devuelve una copia independiente (incluidas las pendientes)", () => {
    const original: EstadoAdaptacion = { ...valido(), pendientes: [{ ...pendiente }] };
    const copia = copiarEstadoAdaptacion(original);
    expect(copia).toEqual(original);
    original.pendientes[0].correcta = false;
    original.pendientes.push(pendiente);
    original.nivel = 0.9;
    expect(copia.pendientes).toEqual([pendiente]);
    expect(copia.nivel).toBe(0.57);
  });
});
