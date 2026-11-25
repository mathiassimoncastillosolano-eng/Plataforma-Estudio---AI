import { describe, expect, it } from "vitest";
import type { RespuestaRegistrada } from "./rendimiento";
import { comparativaTemas, cronologicas, distribucionDificultad, indicadoresGlobales, periodosDeRespuestas, puntosDebiles, type RendimientoPorTema, type TemaMinimo } from "./panelProgreso";

let reloj = 0;
const resp = (correcta: boolean, dificultad: RespuestaRegistrada["dificultad"] = "media"): RespuestaRegistrada => ({ dificultad, correcta, segundos: 10, origen: "practica", at: ++reloj });
const serie = (patron: string, dificultad: RespuestaRegistrada["dificultad"] = "media") => patron.split("").map((c) => resp(c === "1", dificultad));

const temas: TemaMinimo[] = [
  { id: "a", titulo: "Álgebra", dominio: 80, preguntasRespondidas: 30 },
  { id: "b", titulo: "Biología", dominio: 40, preguntasRespondidas: 12 },
  { id: "c", titulo: "Cálculo", dominio: 20, preguntasRespondidas: 0 },
];

describe("periodos de respuestas", () => {
  it("agrupa en bloques de 15 y calcula la variación contra el anterior", () => {
    const respuestas = [...serie("111111111100000"), ...serie("111111111111100")];
    const periodos = periodosDeRespuestas(respuestas);
    expect(periodos).toHaveLength(2);
    expect(periodos[0].porcentaje).toBe(66.7);
    expect(periodos[0].variacion).toBeNull();
    expect(periodos[1].porcentaje).toBe(86.7);
    expect(periodos[1].variacion).toBe(20);
    expect(periodos[1].completo).toBe(true);
  });

  it("marca como incompleto el último bloque parcial", () => {
    const periodos = periodosDeRespuestas(serie("1111111111111111111"));
    expect(periodos).toHaveLength(2);
    expect(periodos[1].completo).toBe(false);
    expect(periodos[1].preguntas).toBe(4);
  });

  it("sin respuestas no hay periodos", () => {
    expect(periodosDeRespuestas([])).toEqual([]);
  });
});

describe("indicadores globales", () => {
  it("calcula dominio promedio, precisión y rachas sobre todo el historial", () => {
    const rendimiento: RendimientoPorTema = { a: serie("1110111"), b: serie("01") };
    const g = indicadoresGlobales(temas, rendimiento);
    expect(g.dominioPromedio).toBe(47);
    expect(g.preguntasRespondidas).toBe(42);
    expect(g.respuestasRegistradas).toBe(9);
    expect(g.precision).toBe(77.8);
    expect(g.mejorRacha).toBe(3);
    expect(g.rachaActual).toBe(1);
  });

  it("sin datos no inventa cifras", () => {
    const g = indicadoresGlobales([], {});
    expect(g.precision).toBeNull();
    expect(g.variacionPrecision).toBeNull();
    expect(g.dominioPromedio).toBe(0);
    expect(g.mejorRacha).toBe(0);
  });

  it("compara las últimas 15 respuestas con las 15 anteriores", () => {
    const rendimiento: RendimientoPorTema = { a: [...serie("000000000011111"), ...serie("111111111111110")] };
    expect(indicadoresGlobales(temas, rendimiento).variacionPrecision).toBe(60);
  });

  it("ordena el historial por fecha entre temas", () => {
    const a = resp(true);
    const b = resp(false);
    const c = resp(true);
    expect(cronologicas({ x: [a, c], y: [b] }).map((r) => r.at)).toEqual([a.at, b.at, c.at]);
  });
});

describe("comparativa entre temas", () => {
  it("ordena por dominio y calcula precisión y variación por tema", () => {
    const rendimiento: RendimientoPorTema = { a: [...serie("111111111111111"), ...serie("11111111100000")], b: serie("1010") };
    const filas = comparativaTemas(temas, rendimiento);
    expect(filas.map((f) => f.id)).toEqual(["a", "b", "c"]);
    expect(filas[0].precision).toBe(82.8);
    expect(filas[0].variacion).toBe(-35.7);
    expect(filas[1].precision).toBe(50);
    expect(filas[1].variacion).toBeNull();
    expect(filas[2].precision).toBeNull();
  });
});

describe("distribución por dificultad", () => {
  it("separa aciertos por nivel y deja null los niveles sin respuestas", () => {
    const rendimiento: RendimientoPorTema = { a: [...serie("110", "facil"), ...serie("01", "dificil")] };
    const d = distribucionDificultad(rendimiento);
    expect(d.find((f) => f.nivel === "facil")?.porcentaje).toBe(66.7);
    expect(d.find((f) => f.nivel === "dificil")?.porcentaje).toBe(50);
    expect(d.find((f) => f.nivel === "media")?.porcentaje).toBeNull();
  });
});

describe("puntos débiles", () => {
  it("señala temas con precisión baja y el nivel donde más fallan", () => {
    const rendimiento: RendimientoPorTema = { a: serie("1111111111"), b: [...serie("111", "facil"), ...serie("000000", "dificil")] };
    const puntos = puntosDebiles(temas, rendimiento);
    const b = puntos.find((p) => p.idTema === "b");
    expect(b?.motivo).toBe("precision-baja");
    expect(b?.nivelDebil).toBe("dificil");
    expect(puntos.find((p) => p.idTema === "a")).toBeUndefined();
  });

  it("incluye temas de bajo dominio que aún no se practicaron", () => {
    const puntos = puntosDebiles(temas, { a: serie("1111111111") });
    expect(puntos.find((p) => p.idTema === "c")?.motivo).toBe("sin-practica");
  });

  it("no diagnostica con muy pocas respuestas", () => {
    const puntos = puntosDebiles(temas, { b: serie("00") });
    expect(puntos.find((p) => p.idTema === "b")).toBeUndefined();
  });

  it("respeta el máximo pedido", () => {
    const muchos: TemaMinimo[] = ["1", "2", "3", "4", "5"].map((id) => ({ id, titulo: id, dominio: 10, preguntasRespondidas: 0 }));
    expect(puntosDebiles(muchos, {}, 2)).toHaveLength(2);
  });
});
