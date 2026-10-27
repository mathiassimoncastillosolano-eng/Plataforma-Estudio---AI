import { describe, expect, it, vi } from "vitest";
import { crearAlmacenBackend } from "./almacenBackend";

const respuesta = (ok: boolean, cuerpo: unknown = { estado: "ok" }) => ({ ok, json: async () => cuerpo }) as Response;

/** Reloj y pausas controlados: las esperas avanzan el reloj sin tiempo real. */
function entorno(fetchFn: typeof fetch, extra = {}) {
  let reloj = 0;
  const esperas: number[] = [];
  const almacen = crearAlmacenBackend({
    fetchFn,
    ahora: () => reloj,
    esperar: async (ms) => {
      esperas.push(ms);
      reloj += ms;
    },
    urlBase: "https://api.test",
    urlLocalEnProduccion: false,
    tiempoIntentoMs: 50,
    tiempoTotalMs: 20_000,
    pausasMs: [1_000, 2_000, 3_000],
    ...extra,
  });
  return { almacen, esperas };
}
const esperarFase = (almacen: ReturnType<typeof crearAlmacenBackend>, fase: string) =>
  vi.waitFor(() => expect(almacen.obtenerEstado().fase).toBe(fase));

describe("almacenBackend", () => {
  it("con el backend activo queda listo al primer intento, sin esperas artificiales", async () => {
    const fetchFn = vi.fn(async (_url: string) => respuesta(true));
    const { almacen, esperas } = entorno(fetchFn as unknown as typeof fetch);
    almacen.iniciar();
    await esperarFase(almacen, "listo");
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(fetchFn.mock.calls[0][0]).toBe("https://api.test/api/salud");
    expect(esperas).toEqual([]);
    expect(almacen.obtenerEstado().intentos).toBe(1);
  });

  it("reintenta con pausas crecientes mientras Render arranca (502 y fallos de red) hasta responder", async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(respuesta(false, null))
      .mockResolvedValueOnce(respuesta(true, { estado: "iniciando" })) // 200 sin estado "ok": todavía no
      .mockResolvedValue(respuesta(true));
    const { almacen, esperas } = entorno(fetchFn as unknown as typeof fetch);
    almacen.iniciar();
    await esperarFase(almacen, "listo");
    expect(esperas).toEqual([1_000, 2_000, 3_000]);
    expect(almacen.obtenerEstado().intentos).toBe(4);
  });

  it("pasa a «despertando» tras el primer intento fallido", async () => {
    let liberar!: () => void;
    const fetchFn = vi.fn().mockRejectedValueOnce(new TypeError("x")).mockResolvedValue(respuesta(true));
    const { almacen } = entorno(fetchFn as unknown as typeof fetch, { esperar: () => new Promise<void>((r) => (liberar = r)) });
    almacen.iniciar();
    await esperarFase(almacen, "despertando");
    liberar();
    await esperarFase(almacen, "listo");
  });

  it("agota el tiempo total, informa del error y permite reintentar a mano", async () => {
    let disponible = false;
    const fetchFn = vi.fn(async () => respuesta(disponible));
    const { almacen } = entorno(fetchFn as unknown as typeof fetch);
    almacen.iniciar();
    await esperarFase(almacen, "error");
    expect(almacen.obtenerEstado().motivoError).toBe("tiempo");

    disponible = true;
    almacen.reintentar();
    await esperarFase(almacen, "listo");
  });

  it("un intento colgado se corta por tiempo (no bloquea la pantalla)", async () => {
    const fetchFn = vi
      .fn()
      .mockImplementationOnce((_url: string, init: RequestInit) => new Promise((_, rechazar) => init.signal!.addEventListener("abort", () => rechazar(new DOMException("abortado", "AbortError")))))
      .mockResolvedValue(respuesta(true));
    const { almacen } = entorno(fetchFn as unknown as typeof fetch);
    almacen.iniciar();
    await esperarFase(almacen, "listo");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("no duplica peticiones si iniciar() se llama varias veces (StrictMode)", async () => {
    const fetchFn = vi.fn(async () => respuesta(true));
    const { almacen } = entorno(fetchFn as unknown as typeof fetch);
    almacen.iniciar();
    almacen.iniciar();
    await esperarFase(almacen, "listo");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("en producción con URL local no consulta y avisa de la configuración", async () => {
    const fetchFn = vi.fn();
    const { almacen } = entorno(fetchFn as unknown as typeof fetch, { urlLocalEnProduccion: true });
    almacen.iniciar();
    await esperarFase(almacen, "error");
    expect(almacen.obtenerEstado().motivoError).toBe("configuracion");
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
