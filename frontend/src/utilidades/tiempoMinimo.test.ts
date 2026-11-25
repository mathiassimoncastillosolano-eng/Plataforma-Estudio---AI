import { describe, expect, it } from "vitest";
import { restanteHasta } from "./tiempoMinimo";

describe("tiempo mínimo de carga visible", () => {
  it("completa lo que falta hasta el mínimo", () => {
    expect(restanteHasta(1000, 3000, 2000)).toBe(2000);
  });

  it("no espera si ya transcurrió el mínimo", () => {
    expect(restanteHasta(1000, 3000, 5000)).toBe(0);
  });

  it("espera el mínimo completo si acaba de empezar", () => {
    expect(restanteHasta(1000, 3000, 1000)).toBe(3000);
  });
});
