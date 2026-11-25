import { describe, expect, it } from "vitest";
import { etapaActual, progresoPercibido } from "./progresoPercibido";

describe("progreso percibido de la carga", () => {
  it("empieza en 0 y nunca llega a 100", () => {
    expect(progresoPercibido(0)).toBe(0);
    expect(progresoPercibido(10_000_000)).toBeLessThan(100);
  });

  it("crece de forma monótona", () => {
    let anterior = -1;
    for (let t = 0; t <= 60_000; t += 1000) {
      const actual = progresoPercibido(t);
      expect(actual).toBeGreaterThanOrEqual(anterior);
      anterior = actual;
    }
  });

  it("ignora tiempos negativos", () => {
    expect(progresoPercibido(-500)).toBe(0);
    expect(etapaActual(-500, 3)).toBe(0);
  });

  it("avanza de etapa y se detiene en la última", () => {
    expect(etapaActual(0, 3)).toBe(0);
    expect(etapaActual(2700, 3)).toBe(1);
    expect(etapaActual(999_999, 3)).toBe(2);
    expect(etapaActual(1000, 0)).toBe(0);
  });
});
