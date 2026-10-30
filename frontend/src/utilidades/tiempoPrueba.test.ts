import { describe, expect, it } from "vitest";
import { describirTiempo, formatearReloj, umbralAlertaSegundos, vistaReloj } from "./tiempoPrueba";

describe("umbralAlertaSegundos", () => {
  it("aplica min(10 min, 25 %) con mínimo de 60 s", () => {
    expect(umbralAlertaSegundos(60 * 60)).toBe(600);
    expect(umbralAlertaSegundos(30 * 60)).toBe(450);
    expect(umbralAlertaSegundos(15 * 60)).toBe(225);
    expect(umbralAlertaSegundos(5 * 60)).toBe(75);
    expect(umbralAlertaSegundos(2 * 60)).toBe(60);
  });
  it("sin límite no hay alerta", () => expect(umbralAlertaSegundos(null)).toBeNull());
});

describe("vistaReloj", () => {
  it("con el cronómetro oculto el número solo aparece en la zona de alerta", () => {
    const limite = 15 * 60;
    expect(vistaReloj(limite, limite, false)).toMatchObject({ mostrarNumero: false, alerta: false, proporcion: 1 });
    expect(vistaReloj(226, limite, false).alerta).toBe(false);
    expect(vistaReloj(225, limite, false)).toMatchObject({ mostrarNumero: true, alerta: true });
  });
  it("con el cronómetro visible siempre se ve el número", () => {
    expect(vistaReloj(800, 900, true).mostrarNumero).toBe(true);
  });
  it("sin límite no hay alerta ni barra", () => {
    expect(vistaReloj(null, null, false)).toMatchObject({ alerta: false, proporcion: 1 });
  });
  it("la proporción queda entre 0 y 1", () => {
    expect(vistaReloj(-5, 100, true).proporcion).toBe(0);
    expect(vistaReloj(500, 100, true).proporcion).toBe(1);
  });
});

describe("formato", () => {
  it("reloj", () => {
    expect(formatearReloj(0)).toBe("00:00");
    expect(formatearReloj(65.2)).toBe("01:06");
    expect(formatearReloj(3661)).toBe("1:01:01");
    expect(formatearReloj(-3)).toBe("00:00");
  });
  it("texto para lectores de pantalla", () => {
    expect(describirTiempo(330)).toBe("5 minutos y 30 segundos");
    expect(describirTiempo(60)).toBe("1 minuto");
    expect(describirTiempo(1)).toBe("1 segundo");
  });
});
