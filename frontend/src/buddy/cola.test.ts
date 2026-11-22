import { describe, expect, it } from "vitest";
import { colaInicial, reducirCola, type EstadoCola } from "./cola";
import { crearEvento, PRIORIDAD, type EventoBuddy } from "./tipos";

const evento = (id: string, prioridad: number, extra: Partial<EventoBuddy> = {}) => crearEvento({ id, mensaje: id, prioridad, ...extra }, "/a");
const anunciar = (estado: EstadoCola, e: EventoBuddy) => reducirCola(estado, { tipo: "anunciar", evento: e });

describe("cola de eventos de Cursa Buddy", () => {
  it("muestra el primer evento y descarta duplicados", () => {
    const e = evento("uno", PRIORIDAD.modulo);
    const a = anunciar(colaInicial, e);
    expect(a.actual?.id).toBe("uno");
    expect(anunciar(a, e)).toBe(a);
  });

  it("una celebración desplaza a una presentación de módulo y esta no vuelve", () => {
    const a = anunciar(colaInicial, evento("modulo", PRIORIDAD.modulo));
    const b = anunciar(a, evento("logro", PRIORIDAD.celebracion));
    expect(b.actual?.id).toBe("logro");
    expect(b.pendientes).toHaveLength(0);
  });

  it("una presentación no interrumpe una celebración y se descarta", () => {
    const a = anunciar(colaInicial, evento("logro", PRIORIDAD.celebracion));
    const b = anunciar(a, evento("modulo", PRIORIDAD.modulo));
    expect(b.actual?.id).toBe("logro");
    expect(b.pendientes).toHaveLength(0);
  });

  it("los resultados esperan su turno ordenados por prioridad", () => {
    let e = anunciar(colaInicial, evento("logro", PRIORIDAD.celebracion));
    e = anunciar(e, evento("resultado-b", PRIORIDAD.resultado));
    e = anunciar(e, evento("resultado-a", PRIORIDAD.resultado));
    e = anunciar(e, evento("otro-logro", PRIORIDAD.celebracion));
    expect(e.pendientes.map((p) => p.id)).toEqual(["otro-logro", "resultado-b", "resultado-a"]);
    e = reducirCola(reducirCola(e, { tipo: "cerrar" }), { tipo: "terminarSalida" });
    expect(e.actual?.id).toBe("otro-logro");
  });

  it("un evento retenido iniciado por el usuario se encola en lugar de perderse", () => {
    const a = anunciar(colaInicial, evento("logro", PRIORIDAD.celebracion));
    const b = anunciar(a, evento("guia", PRIORIDAD.tutorial, { retener: true, modo: "tutorial" }));
    expect(b.pendientes.map((p) => p.id)).toEqual(["guia"]);
  });

  it("cancela por ruta solo los eventos ligados a otra pantalla", () => {
    let e = anunciar(colaInicial, evento("local", PRIORIDAD.modulo));
    e = anunciar(e, evento("guia", PRIORIDAD.tutorial, { retener: true, cancelarAlNavegar: false, modo: "tutorial" }));
    const otra = reducirCola(e, { tipo: "cancelarRuta", ruta: "/b" });
    expect(otra.actual?.id).toBe("guia");
    const misma = reducirCola(e, { tipo: "cancelarRuta", ruta: "/a" });
    expect(misma.actual?.id).toBe("guia");
  });

  it("bloquear conserva solo el tutorial", () => {
    let e = anunciar(colaInicial, evento("resultado", PRIORIDAD.resultado));
    e = anunciar(e, evento("guia", PRIORIDAD.tutorial, { retener: true, modo: "tutorial" }));
    const b = reducirCola(e, { tipo: "bloquear" });
    expect(b.actual?.id).toBe("guia");
    expect(b.pendientes).toHaveLength(0);
  });
});
