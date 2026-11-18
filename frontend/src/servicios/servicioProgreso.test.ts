import { beforeEach, describe, expect, it } from "vitest";
import { obtenerEstadisticasPanel } from "./servicioProgreso";
import { actualizarDominioTema, crearTemaEstudio, obtenerTemasEstudio } from "./servicioEstudio";

const promedio = (valores: number[]) => (valores.length ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : 0);

beforeEach(() => sessionStorage.clear());

describe("obtenerEstadisticasPanel", () => {
  it("el dominio promedio y los totales salen de los temas reales", async () => {
    const tema = await crearTemaEstudio({ tituloTema: "Tema", categoria: "X", tipoFuente: "texto" });
    await actualizarDominioTema(tema.id, 100);
    const temas = await obtenerTemasEstudio();
    const estadisticas = await obtenerEstadisticasPanel();
    expect(estadisticas.temasEstudiados).toBe(temas.length);
    expect(estadisticas.dominioPromedio).toBe(promedio(temas.map((t) => t.dominio)));
    expect(estadisticas.preguntasRespondidas).toBe(temas.reduce((suma, t) => suma + t.preguntasRespondidas, 0));
  });

  it("sin temas todo queda en cero", async () => {
    sessionStorage.setItem("estudioai.temas", "[]");
    const estadisticas = await obtenerEstadisticasPanel();
    expect(estadisticas).toMatchObject({ temasEstudiados: 0, dominioPromedio: 0, preguntasRespondidas: 0 });
  });
});
