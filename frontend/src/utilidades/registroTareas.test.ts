import { describe, expect, it } from "vitest";
import { crearRegistroTareas } from "./registroTareas";

const diferido = <T,>() => {
  let resolver!: (v: T) => void;
  let rechazar!: (e: unknown) => void;
  const promesa = new Promise<T>((res, rej) => {
    resolver = res;
    rechazar = rej;
  });
  return { promesa, resolver, rechazar };
};

describe("registro de tareas en segundo plano", () => {
  it("reutiliza la tarea en curso con la misma huella y la ejecuta una sola vez", async () => {
    const registro = crearRegistroTareas<number>();
    const d = diferido<number>();
    let ejecuciones = 0;
    const a = registro.iniciar("t1", "h", () => {
      ejecuciones += 1;
      return d.promesa;
    });
    const b = registro.iniciar("t1", "h", () => {
      ejecuciones += 1;
      return d.promesa;
    });
    expect(a).toBe(b);
    d.resolver(7);
    expect(await a).toBe(7);
    expect(ejecuciones).toBe(1);
  });

  it("llama a alTerminar una vez y libera la clave", async () => {
    const registro = crearRegistroTareas<number>();
    const guardados: number[] = [];
    await registro.iniciar("t1", "h", async () => 5, (v) => guardados.push(v));
    expect(guardados).toEqual([5]);
    expect(registro.enCurso("t1")).toBeUndefined();
  });

  it("cancela la tarea anterior si cambia la huella y descarta su resultado", async () => {
    const registro = crearRegistroTareas<string>();
    const vieja = diferido<string>();
    let senalVieja!: AbortSignal;
    const guardados: string[] = [];
    registro.iniciar("t1", "a", (senal) => {
      senalVieja = senal;
      return vieja.promesa;
    }, (v) => guardados.push(v));
    const nueva = registro.iniciar("t1", "b", async () => "nueva", (v) => guardados.push(v));
    expect(senalVieja.aborted).toBe(true);
    vieja.resolver("vieja");
    await nueva;
    await vieja.promesa;
    expect(guardados).toEqual(["nueva"]);
  });

  it("cancelar impide guardar el resultado", async () => {
    const registro = crearRegistroTareas<number>();
    const d = diferido<number>();
    const guardados: number[] = [];
    const tarea = registro.iniciar("t1", "h", () => d.promesa, (v) => guardados.push(v));
    registro.cancelar("t1");
    d.resolver(1);
    await tarea;
    expect(guardados).toEqual([]);
    expect(registro.enCurso("t1")).toBeUndefined();
  });

  it("tras un fallo permite reintentar", async () => {
    const registro = crearRegistroTareas<number>();
    let rechazada = false;
    try {
      await registro.iniciar("t1", "h", () => Promise.reject(new Error("x")));
    } catch {
      rechazada = true;
    }
    expect(rechazada).toBe(true);
    expect(registro.enCurso("t1")).toBeUndefined();
    expect(await registro.iniciar("t1", "h", async () => 2)).toBe(2);
  });
});
