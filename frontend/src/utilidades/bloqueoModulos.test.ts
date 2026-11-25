import { describe, expect, it } from "vitest";
import { mensajeBloqueo, moduloBloqueado, MENSAJE_MODULO_BLOQUEADO, MENSAJE_RESUMEN_EN_CURSO } from "./bloqueoModulos";

describe("bloqueo de módulos sin resumen", () => {
  it("bloquea preguntas y prueba mientras no hay resumen", () => {
    expect(moduloBloqueado("preguntas", false)).toBe(true);
    expect(moduloBloqueado("prueba", false)).toBe(true);
  });

  it("no bloquea resumen ni mapa conceptual", () => {
    expect(moduloBloqueado("resumen", false)).toBe(false);
    expect(moduloBloqueado("mapa-mental", false)).toBe(false);
  });

  it("desbloquea todo cuando existe el resumen", () => {
    expect(moduloBloqueado("preguntas", true)).toBe(false);
    expect(moduloBloqueado("prueba", true)).toBe(false);
    expect(moduloBloqueado("mapa-mental", true)).toBe(false);
  });

  it("durante la generación bloquea todos los demás módulos, incluso con resumen previo", () => {
    expect(moduloBloqueado("mapa-mental", false, true)).toBe(true);
    expect(moduloBloqueado("preguntas", true, true)).toBe(true);
    expect(moduloBloqueado("prueba", true, true)).toBe(true);
    expect(moduloBloqueado("resumen", false, true)).toBe(false);
  });

  it("elige el mensaje según el motivo del bloqueo", () => {
    expect(mensajeBloqueo(false)).toBe(MENSAJE_MODULO_BLOQUEADO);
    expect(mensajeBloqueo(true)).toBe(MENSAJE_RESUMEN_EN_CURSO);
  });
});
