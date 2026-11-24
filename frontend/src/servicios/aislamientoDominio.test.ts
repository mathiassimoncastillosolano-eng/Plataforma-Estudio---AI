import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearTemaEstudio, incrementarPruebasCompletadas, obtenerTemaEstudio, actualizarDominioTema } from "./servicioEstudio";
import { registrarPractica, reiniciarAdaptacion } from "./servicioAdaptacion";
import { obtenerEstadoAdaptacion, obtenerSesion, registrarRespuestas, reiniciarSesionEstudio } from "../almacen/almacenSesion";

let llamadasAlMotor = 0;
let nivelDelMotor = 0.6;

const estado = (nivel: number) => ({ nivel, numero_periodo: 2, ultimo_porcentaje: 0.6, correctas_total: 9, pendientes: [] });
const respuestas = Array.from({ length: 15 }, () => ({ dificultad: "media" as const, correcta: true, segundos: 4 }));

async function practicar(idTema: string) {
  respuestas.forEach((r) => registrarRespuestas(idTema, [{ ...r, origen: "practica" }]));
  const resultado = await registrarPractica(idTema, respuestas);
  if (resultado?.dominio != null) await actualizarDominioTema(idTema, resultado.dominio);
}

async function terminarPrueba(idTema: string) {
  await incrementarPruebasCompletadas(idTema);
  return obtenerTemaEstudio(idTema);
}

beforeEach(() => {
  sessionStorage.clear();
  reiniciarSesionEstudio();
  reiniciarAdaptacion();
  llamadasAlMotor = 0;
  nivelDelMotor = 0.6;
  vi.stubGlobal("fetch", async () => {
    llamadasAlMotor += 1;
    const datos = { id_tema: "t", estado: estado(nivelDelMotor), periodos_cerrados: [{}], dificultad_objetivo: "media" };
    return { status: 200, json: async () => ({ exito: true, datos }) };
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("el dominio solo lo actualiza el módulo de preguntas", () => {
  it("terminar pruebas, con cualquier resultado, deja intactos el dominio, el estado del motor y el rendimiento", async () => {
    const tema = await crearTemaEstudio({ tituloTema: "Tema", categoria: "X", tipoFuente: "texto" });
    expect(obtenerEstadoAdaptacion(tema.id)).toBeUndefined();
    await practicar(tema.id);
    const dominio = (await obtenerTemaEstudio(tema.id))!.dominio;
    const motor = obtenerEstadoAdaptacion(tema.id);
    const rendimiento = obtenerSesion().rendimiento[tema.id];
    expect(dominio).toBe(60);
    expect(llamadasAlMotor).toBe(1);

    for (let i = 0; i < 3; i++) {
      const actual = await terminarPrueba(tema.id);
      expect(actual!.dominio).toBe(dominio);
    }

    expect((await obtenerTemaEstudio(tema.id))!.pruebasCompletadas).toBe(3);
    expect(obtenerEstadoAdaptacion(tema.id)).toEqual(motor);
    expect(obtenerSesion().rendimiento[tema.id]).toEqual(rendimiento);
    expect(llamadasAlMotor).toBe(1);
  });

  it("sin historial, terminar una prueba no inventa un dominio ni un estado del motor", async () => {
    const tema = await crearTemaEstudio({ tituloTema: "Tema", categoria: "X", tipoFuente: "texto" });
    const actual = await terminarPrueba(tema.id);
    expect(actual!.dominio).toBe(0);
    expect(obtenerEstadoAdaptacion(tema.id)).toBeUndefined();
    expect(llamadasAlMotor).toBe(0);
  });

  it("nuevas respuestas de práctica con un período cerrado sí actualizan el dominio, aunque haya pruebas en medio", async () => {
    const tema = await crearTemaEstudio({ tituloTema: "Tema", categoria: "X", tipoFuente: "texto" });
    await practicar(tema.id);
    await terminarPrueba(tema.id);
    nivelDelMotor = 0.7;
    await practicar(tema.id);
    expect((await terminarPrueba(tema.id))!.dominio).toBe(70);
  });
});
