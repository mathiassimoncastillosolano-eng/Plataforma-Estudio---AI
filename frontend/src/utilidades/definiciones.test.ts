import { describe, expect, it } from "vitest";
import { segmentarEnunciado } from "./definiciones";

const t = (inicio: number, fin: number, definicion = "def") => ({ inicio, fin, definicion });

describe("segmentarEnunciado", () => {
  const texto = "La frecuencia mide las oscilaciones";
  it("parte el enunciado en tramos y términos", () => {
    const s = segmentarEnunciado(texto, [t(3, 13, "Oscilaciones por segundo")]);
    expect(s.map((x) => x.texto).join("")).toBe(texto);
    expect(s.find((x) => x.termino)?.texto).toBe("frecuencia");
  });
  it("ignora posiciones inválidas, vacías o solapadas", () => {
    const s = segmentarEnunciado(texto, [t(-1, 4), t(5, 5), t(10, 999), t(3, 13), t(8, 15), { inicio: 20, fin: 25, definicion: "  " }]);
    expect(s.filter((x) => x.termino)).toHaveLength(1);
    expect(s.map((x) => x.texto).join("")).toBe(texto);
  });
  it("conserva el HTML como texto plano", () => {
    const e = "<b>x</b> término";
    const s = segmentarEnunciado(e, [t(9, 16)]);
    expect(s[0].texto).toBe("<b>x</b> ");
  });
  it("sin términos devuelve el enunciado entero", () => {
    expect(segmentarEnunciado(texto, [])).toEqual([{ texto }]);
  });
});
