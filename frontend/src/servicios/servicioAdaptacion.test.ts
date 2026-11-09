import { beforeEach, describe, expect, it, vi } from "vitest";

const enviar = vi.hoisted(() => vi.fn());
vi.mock("./clienteApi", () => ({ enviarJson: enviar }));

import { nivelADominio, registrarPractica, reiniciarAdaptacion } from "./servicioAdaptacion";

const respuestas = (n: number) => Array.from({ length: n }, () => ({ dificultad: "media" as const, correcta: true }));
const estado = (nivel: number) => ({ nivel, numero_periodo: 2, ultimo_porcentaje: 1, pendientes: [] });

beforeEach(() => {
  enviar.mockReset();
  reiniciarAdaptacion();
});

describe("servicioAdaptacion", () => {
  it("sin período cerrado no cambia el dominio", async () => {
    enviar.mockResolvedValue({ id_tema: "t1", estado: estado(0.57), periodos_cerrados: [], dificultad_objetivo: "media" });
    const r = await registrarPractica("t1", respuestas(10));
    expect(r).toMatchObject({ dominio: null, periodosCerrados: 0 });
  });

  it("con período cerrado convierte el nivel a 0-100 y reenvía el estado después", async () => {
    enviar.mockResolvedValue({ id_tema: "t1", estado: estado(0.6775), periodos_cerrados: [{}], dificultad_objetivo: "media" });
    const r = await registrarPractica("t1", respuestas(15));
    expect(r).toMatchObject({ dominio: 68, periodosCerrados: 1 });
    expect(enviar.mock.calls[0]?.[1]).not.toHaveProperty("estado");
    await registrarPractica("t1", respuestas(3));
    expect(enviar.mock.calls[1]?.[1]).toMatchObject({ estado: estado(0.6775) });
  });

  it("si el backend falla devuelve null y reintenta con las respuestas acumuladas", async () => {
    enviar.mockRejectedValueOnce(new Error("falla"));
    expect(await registrarPractica("t1", respuestas(10))).toBeNull();
    enviar.mockResolvedValue({ id_tema: "t1", estado: estado(0.6), periodos_cerrados: [{}], dificultad_objetivo: "media" });
    await registrarPractica("t1", respuestas(5));
    expect((enviar.mock.calls[1]?.[1] as { respuestas: unknown[] }).respuestas).toHaveLength(15);
  });

  it("nivelADominio acota a 0-100", () => {
    expect(nivelADominio(1.4)).toBe(100);
    expect(nivelADominio(-0.2)).toBe(0);
  });
});