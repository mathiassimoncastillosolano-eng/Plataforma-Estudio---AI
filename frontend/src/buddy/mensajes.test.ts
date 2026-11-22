import { describe, expect, it } from "vitest";
import { buddyInicial, marcarVisto, puedeMostrarse } from "./persistencia";
import { elegirMensaje, felicitacionResultado, nivelDePorcentaje, presentacionModulo } from "./mensajes";
import { titularResultado, UMBRALES_RESULTADO } from "../utilidades/recomendaciones";

describe("mensajes de Cursa Buddy", () => {
  it("clasifica con los mismos umbrales que la pantalla de resultados", () => {
    expect(nivelDePorcentaje(UMBRALES_RESULTADO.excelente)).toBe("excelente");
    expect(nivelDePorcentaje(UMBRALES_RESULTADO.excelente - 1)).toBe("bueno");
    expect(nivelDePorcentaje(UMBRALES_RESULTADO.bueno - 1)).toBe("intermedio");
    expect(nivelDePorcentaje(UMBRALES_RESULTADO.intermedio - 1)).toBe("bajo");
    for (const p of [0, 49, 50, 69, 70, 84, 85, 100]) {
      const alto = nivelDePorcentaje(p) === "excelente" || nivelDePorcentaje(p) === "bueno";
      expect(titularResultado(p).tono === "good").toBe(alto);
    }
  });

  it("elige el mensaje de forma estable según el evento", () => {
    expect(elegirMensaje("bueno", "prueba:1")).toBe(elegirMensaje("bueno", "prueba:1"));
  });

  it("usa el reintento solo cuando el resultado es bajo", () => {
    const datos = { idEvento: "x", correctas: 1, total: 10, reintento: true };
    expect(felicitacionResultado({ ...datos, porcentaje: 10 }).mensaje).toBe(elegirMensaje("reintento", "x"));
    expect(felicitacionResultado({ ...datos, porcentaje: 90 }).mensaje).toBe(elegirMensaje("excelente", "x"));
  });

  it("muestra el resultado real sin inventar datos", () => {
    const e = felicitacionResultado({ idEvento: "y", porcentaje: 80, correctas: 8, total: 10, mejora: 3 });
    expect(e.detalles).toEqual(["80 % de aciertos", "8 de 10 correctas"]);
  });

  it("las presentaciones de módulo se muestran una sola vez", () => {
    const e = presentacionModulo("resumen");
    expect(puedeMostrarse(buddyInicial, e, 1000)).toBe(true);
    const visto = marcarVisto(buddyInicial, e.id, 1000);
    expect(puedeMostrarse(visto, e, 1000 + 400 * 24 * 3600 * 1000)).toBe(false);
  });

  it("el saludo del panel respeta su enfriamiento", () => {
    const e = presentacionModulo("panel", "Ana");
    expect(e.mensaje.startsWith("¡Hola, Ana!")).toBe(true);
    const visto = marcarVisto(buddyInicial, e.id, 0);
    expect(puedeMostrarse(visto, e, 1000)).toBe(false);
    expect(puedeMostrarse(visto, e, 25 * 3600 * 1000)).toBe(true);
  });
});
