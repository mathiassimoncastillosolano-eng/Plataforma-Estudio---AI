import { describe, expect, it } from "vitest";
import { planificarHabla } from "./habla";

const abiertos = (texto: string) => planificarHabla(texto).pasos.filter((p) => p.apertura > 0.3).length;

describe("habla articulada de Cursa Buddy", () => {
  it("un mensaje breve produce pocos movimientos y termina con la boca cerrada", () => {
    const plan = planificarHabla("¡Excelente trabajo!");
    expect(abiertos("¡Excelente trabajo!")).toBeLessThan(9);
    expect(plan.duracionMs).toBeLessThan(2000);
    expect(plan.pasos[plan.pasos.length - 1].apertura).toBe(0);
  });

  it("un mensaje extenso dura proporcionalmente más", () => {
    const corto = planificarHabla("¡Excelente trabajo!");
    const largo = planificarHabla("Has completado correctamente esta evaluación. Tu dominio del tema ha mejorado considerablemente.");
    expect(largo.duracionMs).toBeGreaterThan(corto.duracionMs * 3);
    expect(abiertos("Has completado correctamente esta evaluación. Tu dominio del tema ha mejorado considerablemente.")).toBeGreaterThan(20);
  });

  it("alterna aperturas y cierres, sin mantener la boca abierta", () => {
    const { pasos } = planificarHabla("Vamos a conectar tus ideas con calma y buen ritmo");
    for (let i = 1; i < pasos.length; i++) {
      expect(pasos[i].apertura > 0.3 && pasos[i - 1].apertura > 0.3).toBe(false);
    }
  });

  it("hace una pausa más larga tras un punto que tras una coma", () => {
    const pausas = (texto: string) => planificarHabla(texto).pasos.filter((p) => p.apertura === 0).map((p) => p.duracionMs);
    expect(Math.max(...pausas("Hola, amigo mío. Seguimos"))).toBeGreaterThan(400);
    expect(Math.max(...pausas("Hola, amigo mío seguimos"))).toBeLessThan(300);
  });

  it("no genera movimientos con texto vacío o solo símbolos", () => {
    expect(planificarHabla("").silabas).toBe(0);
    expect(planificarHabla("¡¡ ?? ...").silabas).toBe(0);
  });

  it("lee los números y el porcentaje como sonidos", () => {
    expect(planificarHabla("95 %").silabas).toBeGreaterThan(2);
  });
});
