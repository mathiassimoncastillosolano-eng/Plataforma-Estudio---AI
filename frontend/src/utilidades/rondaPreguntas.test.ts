import { describe, expect, it } from "vitest";
import type { PreguntaEstudio } from "../tipos";
import { cantidadNuevasNecesarias, componerRonda, dificultadSegunNivel, registrarResultado, repartoRonda, rondaCompleta, type HistorialPreguntas } from "./rondaPreguntas";

const pregunta = (id: string, enunciado = `Enunciado ${id}`): PreguntaEstudio => ({
  id,
  idTema: "t",
  enunciado,
  tipo: "opcion-multiple",
  dificultad: "media",
  opciones: [{ id: "a", etiqueta: "A" }],
  idOpcionCorrecta: "a",
  explicacion: "x",
});

const banco = (n: number) => Array.from({ length: n }, (_, i) => pregunta(`b${i + 1}`));
const historialDe = (fallos: string[], aciertos: string[]): HistorialPreguntas => {
  let h: HistorialPreguntas = {};
  for (const id of fallos) h = registrarResultado(h, id, false);
  for (const id of aciertos) h = registrarResultado(h, id, true);
  return h;
};
const sinAzar = () => 0.5;

describe("historial de preguntas", () => {
  it("acumula aciertos y errores y recuerda el último resultado", () => {
    let h = registrarResultado({}, "p1", false);
    h = registrarResultado(h, "p1", false);
    h = registrarResultado(h, "p1", true);
    expect(h.p1).toEqual({ aciertos: 1, errores: 2, ultimo: "ok" });
  });

  it("no muta el historial recibido", () => {
    const original: HistorialPreguntas = {};
    registrarResultado(original, "p1", true);
    expect(original).toEqual({});
  });
});

describe("reparto de la ronda", () => {
  it("con 10 preguntas y todo disponible da 6 falladas, 3 nuevas y 1 acertada", () => {
    expect(repartoRonda(10, { falladas: 20, nuevas: 20, acertadas: 20 })).toEqual({ falladas: 6, nuevas: 3, acertadas: 1 });
  });

  it("siempre suma el total pedido cuando hay suficientes", () => {
    for (let total = 1; total <= 30; total += 1) {
      const r = repartoRonda(total, { falladas: 99, nuevas: 99, acertadas: 99 });
      expect(r.falladas + r.nuevas + r.acertadas).toBe(total);
    }
  });

  it("si no hay falladas, completa con nuevas", () => {
    const r = repartoRonda(10, { falladas: 0, nuevas: 20, acertadas: 5 });
    expect(r.falladas).toBe(0);
    expect(r.falladas + r.nuevas + r.acertadas).toBe(10);
    expect(r.acertadas).toBeLessThan(r.nuevas);
  });

  it("si no hay nuevas, completa con falladas y luego con acertadas", () => {
    const r = repartoRonda(10, { falladas: 3, nuevas: 0, acertadas: 20 });
    expect(r.falladas).toBe(3);
    expect(r.nuevas).toBe(0);
    expect(r.acertadas).toBe(7);
  });

  it("nunca excede lo disponible", () => {
    const r = repartoRonda(10, { falladas: 1, nuevas: 1, acertadas: 1 });
    expect(r).toEqual({ falladas: 1, nuevas: 1, acertadas: 1 });
  });

  it("acepta una proporción distinta", () => {
    const r = repartoRonda(10, { falladas: 99, nuevas: 99, acertadas: 99 }, { falladas: 0.5, nuevas: 0.5, acertadas: 0 });
    expect(r.falladas).toBe(5);
    expect(r.nuevas).toBe(5);
  });

  it("con total 0 no reparte nada", () => {
    expect(repartoRonda(0, { falladas: 5, nuevas: 5, acertadas: 5 })).toEqual({ falladas: 0, nuevas: 0, acertadas: 0 });
  });
});

describe("composición de la siguiente ronda", () => {
  const preguntas = banco(10);
  const fallos = ["b1", "b2", "b3", "b4", "b5", "b6", "b7"];
  const aciertos = ["b8", "b9", "b10"];
  const historial = historialDe(fallos, aciertos);
  const nuevas = [pregunta("n1"), pregunta("n2"), pregunta("n3"), pregunta("n4"), pregunta("n5")];

  it("repite sobre todo las falladas, agrega nuevas y muy pocas acertadas", () => {
    const ronda = componerRonda({ banco: preguntas, historial, nuevas, total: 10, azar: sinAzar });
    const ids = ronda.map((p) => p.id);
    expect(ronda).toHaveLength(10);
    expect(ids.filter((id) => fallos.includes(id))).toHaveLength(6);
    expect(ids.filter((id) => id.startsWith("n"))).toHaveLength(3);
    expect(ids.filter((id) => aciertos.includes(id))).toHaveLength(1);
  });

  it("prioriza las preguntas con más errores", () => {
    let h = historialDe(fallos, aciertos);
    h = registrarResultado(h, "b7", false);
    h = registrarResultado(h, "b7", false);
    const ronda = componerRonda({ banco: preguntas, historial: h, nuevas, total: 10, azar: sinAzar });
    expect(ronda.map((p) => p.id)).toContain("b7");
  });

  it("no repite como nuevas preguntas ya vistas por id ni por enunciado", () => {
    const repetidas = [pregunta("b1"), pregunta("otra", "enunciado b2".replace("enunciado b2", "Enunciado b2")), pregunta("n9")];
    const ronda = componerRonda({ banco: preguntas, historial, nuevas: repetidas, total: 10, azar: sinAzar });
    const ids = ronda.map((p) => p.id);
    expect(ids.filter((id) => id === "b1")).toHaveLength(1);
    expect(ids).toContain("n9");
    expect(ids).not.toContain("otra");
  });

  it("sin nuevas disponibles usa solo el banco", () => {
    const ronda = componerRonda({ banco: preguntas, historial, nuevas: [], total: 10, azar: sinAzar });
    expect(ronda).toHaveLength(10);
    expect(ronda.every((p) => p.id.startsWith("b"))).toBe(true);
  });

  it("no duplica preguntas dentro de la ronda", () => {
    const ronda = componerRonda({ banco: preguntas, historial, nuevas, total: 10, azar: sinAzar });
    expect(new Set(ronda.map((p) => p.id)).size).toBe(ronda.length);
  });
});

describe("preguntas nuevas necesarias", () => {
  it("pide solo la cuota de nuevas de la ronda", () => {
    const preguntas = banco(10);
    const historial = historialDe(["b1", "b2", "b3", "b4", "b5", "b6", "b7"], ["b8", "b9", "b10"]);
    expect(cantidadNuevasNecesarias(10, preguntas, historial)).toBe(3);
  });

  it("si no hay falladas pide más nuevas para completar la ronda", () => {
    const preguntas = banco(10);
    const historial = historialDe([], ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9", "b10"]);
    expect(cantidadNuevasNecesarias(10, preguntas, historial)).toBeGreaterThan(3);
  });
});

describe("dificultad según el nivel", () => {
  it("usa los mismos umbrales que el motor", () => {
    expect(dificultadSegunNivel(undefined)).toBe("media");
    expect(dificultadSegunNivel(0.2)).toBe("facil");
    expect(dificultadSegunNivel(0.5)).toBe("media");
    expect(dificultadSegunNivel(0.79)).toBe("media");
    expect(dificultadSegunNivel(0.8)).toBe("dificil");
  });
});

describe("fin de ronda", () => {
  it("se completa cuando todas están respondidas", () => {
    const preguntas = banco(3);
    expect(rondaCompleta(preguntas, () => true)).toBe(true);
    expect(rondaCompleta(preguntas, (id) => id !== "b2")).toBe(false);
    expect(rondaCompleta([], () => true)).toBe(false);
  });
});
