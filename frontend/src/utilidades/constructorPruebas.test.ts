import { describe, expect, it } from "vitest";
import {
  CANTIDADES_PREGUNTAS,
  PERFILES_DIFICULTAD,
  ajustesPorDefecto,
  calcularDistribucion,
  distribucionEfectiva,
  limitePorContenido,
  puntajeMaximoPara,
  segundosPorPregunta,
  sumarConteos,
  validarPersonalizada,
} from "./constructorPruebas";

describe("calcularDistribucion", () => {
  for (const cantidad of [...CANTIDADES_PREGUNTAS, 1, 3, 7, 99]) {
    for (const perfil of Object.keys(PERFILES_DIFICULTAD) as (keyof typeof PERFILES_DIFICULTAD)[]) {
      it(`suma exactamente ${cantidad} en ${perfil}`, () => {
        const d = calcularDistribucion(cantidad, perfil);
        expect(sumarConteos(d)).toBe(cantidad);
        expect(Object.values(d).every((v) => Number.isInteger(v) && v >= 0)).toBe(true);
      });
    }
  }

  it("coincide con el backend en repartos conocidos", () => {
    expect(calcularDistribucion(20, "media")).toEqual({ facil: 4, media: 12, dificil: 4 });
    expect(calcularDistribucion(10, "facil")).toEqual({ facil: 8, media: 2, dificil: 0 });
    expect(calcularDistribucion(10, "dificil")).toEqual({ facil: 0, media: 2, dificil: 8 });
    expect(calcularDistribucion(5, "media")).toEqual({ facil: 1, media: 3, dificil: 1 });
    expect(calcularDistribucion(25, "dificil")).toEqual({ facil: 1, media: 5, dificil: 19 });
  });
});

describe("validarPersonalizada", () => {
  it("acepta sumas exactas y ceros", () => {
    expect(validarPersonalizada(20, { facil: 5, media: 10, dificil: 5 }).valida).toBe(true);
    expect(validarPersonalizada(10, { facil: 0, media: 10, dificil: 0 }).valida).toBe(true);
  });
  it("rechaza sumas incorrectas con un mensaje que dice cuánto falta o sobra", () => {
    const falta = validarPersonalizada(20, { facil: 5, media: 10, dificil: 4 });
    expect(falta.valida).toBe(false);
    expect(falta.diferencia).toBe(-1);
    expect(falta.mensaje).toContain("Falta");
    const sobra = validarPersonalizada(20, { facil: 5, media: 10, dificil: 7 });
    expect(sobra.valida).toBe(false);
    expect(sobra.mensaje).toContain("Sobran 2");
  });
  it("rechaza negativos y decimales", () => {
    expect(validarPersonalizada(20, { facil: -1, media: 11, dificil: 10 }).valida).toBe(false);
    expect(validarPersonalizada(20, { facil: 5.5, media: 9.5, dificil: 5 }).valida).toBe(false);
  });
});

describe("pesos y tiempos", () => {
  it("pondera 0.5 / 1 / 2", () => {
    expect(puntajeMaximoPara({ facil: 4, media: 12, dificil: 4 })).toBe(2 + 12 + 8);
    expect(puntajeMaximoPara({ facil: 1, media: 0, dificil: 0 })).toBe(0.5);
  });
  it("segundos por pregunta", () => {
    expect(segundosPorPregunta(10, 5)).toBe(30);
    expect(segundosPorPregunta(10, null)).toBeNull();
  });
  it("la capacidad coincide con el backend", () => {
    expect(limitePorContenido(100)).toBe(0);
    expect(limitePorContenido(1500)).toBe(5);
    expect(limitePorContenido(10_000)).toBe(25);
  });
  it("la distribución efectiva usa la personalizada solo si se eligió", () => {
    const base = ajustesPorDefecto(10);
    expect(distribucionEfectiva(base)).toEqual(calcularDistribucion(10, "media"));
    expect(distribucionEfectiva({ ...base, dificultad: "personalizada", personalizada: { facil: 1, media: 2, dificil: 7 } })).toEqual({ facil: 1, media: 2, dificil: 7 });
  });
});
