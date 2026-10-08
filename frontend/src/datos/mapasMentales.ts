import type { MapaMental } from "../tipos";

export const mapasMentales: Record<string, MapaMental> = {
  "1": {
    idTema: "1",
    nodos: [
      { id: "root", etiqueta: "Sistema circulatorio", nivel: 0, idPadre: null, x: 400, y: 20 },
      { id: "corazon", etiqueta: "Corazón", detalle: "Bomba muscular de cuatro cavidades", nivel: 1, idPadre: "root", x: 100, y: 160 },
      { id: "sangre", etiqueta: "Sangre", detalle: "Plasma, glóbulos y plaquetas", nivel: 1, idPadre: "root", x: 400, y: 160 },
      { id: "vasos", etiqueta: "Vasos sanguíneos", detalle: "Arterias, venas y capilares", nivel: 1, idPadre: "root", x: 700, y: 160 },
      { id: "auriculas", etiqueta: "Aurículas", nivel: 2, idPadre: "corazon", x: -40, y: 300 },
      { id: "ventriculos", etiqueta: "Ventrículos", nivel: 2, idPadre: "corazon", x: 160, y: 300 },
      { id: "plasma", etiqueta: "Plasma", nivel: 2, idPadre: "sangre", x: 320, y: 300 },
      { id: "celulas", etiqueta: "Células sanguíneas", nivel: 2, idPadre: "sangre", x: 500, y: 300 },
      { id: "arterias", etiqueta: "Arterias", nivel: 2, idPadre: "vasos", x: 620, y: 300 },
      { id: "venas", etiqueta: "Venas", nivel: 2, idPadre: "vasos", x: 800, y: 300 },
    ],
    aristas: [
      { id: "e1", fuente: "root", objetivo: "corazon" },
      { id: "e2", fuente: "root", objetivo: "sangre" },
      { id: "e3", fuente: "root", objetivo: "vasos" },
      { id: "e4", fuente: "corazon", objetivo: "auriculas" },
      { id: "e5", fuente: "corazon", objetivo: "ventriculos" },
      { id: "e6", fuente: "sangre", objetivo: "plasma" },
      { id: "e7", fuente: "sangre", objetivo: "celulas" },
      { id: "e8", fuente: "vasos", objetivo: "arterias" },
      { id: "e9", fuente: "vasos", objetivo: "venas" },
    ],
  },
  "3": {
    idTema: "3",
    nodos: [
      { id: "root", etiqueta: "Programación orientada a objetos", nivel: 0, idPadre: null, x: 400, y: 20 },
      { id: "clases", etiqueta: "Clases y objetos", nivel: 1, idPadre: "root", x: 60, y: 160 },
      { id: "encap", etiqueta: "Encapsulamiento", nivel: 1, idPadre: "root", x: 300, y: 160 },
      { id: "herencia", etiqueta: "Herencia", nivel: 1, idPadre: "root", x: 540, y: 160 },
      { id: "poli", etiqueta: "Polimorfismo", nivel: 1, idPadre: "root", x: 780, y: 160 },
      { id: "atributos", etiqueta: "Atributos", nivel: 2, idPadre: "clases", x: -20, y: 300 },
      { id: "metodos", etiqueta: "Métodos", nivel: 2, idPadre: "clases", x: 140, y: 300 },
      { id: "sobrecarga", etiqueta: "Sobrecarga", nivel: 2, idPadre: "poli", x: 700, y: 300 },
      { id: "sobrescritura", etiqueta: "Sobrescritura", nivel: 2, idPadre: "poli", x: 870, y: 300 },
    ],
    aristas: [
      { id: "e1", fuente: "root", objetivo: "clases" },
      { id: "e2", fuente: "root", objetivo: "encap" },
      { id: "e3", fuente: "root", objetivo: "herencia" },
      { id: "e4", fuente: "root", objetivo: "poli" },
      { id: "e5", fuente: "clases", objetivo: "atributos" },
      { id: "e6", fuente: "clases", objetivo: "metodos" },
      { id: "e7", fuente: "poli", objetivo: "sobrecarga" },
      { id: "e8", fuente: "poli", objetivo: "sobrescritura" },
    ],
  },
};

/**
 * Genera un mapa conceptual básico de respaldo a partir de los conceptos
 * fundamentales del resumen, para temas que no tienen un mapa curado.
 */
export function construirMapaMentalRespaldo(
  idTema: string,
  etiquetaRaiz: string,
  conceptos: { termino: string; definicion: string }[]
): MapaMental {
  const nodos: MapaMental["nodos"] = [
    { id: "root", etiqueta: etiquetaRaiz, nivel: 0, idPadre: null, x: 400, y: 20 },
  ];
  const aristas: MapaMental["aristas"] = [];
  const espaciado = 800 / Math.max(conceptos.length, 1);

  conceptos.forEach((concepto, indice) => {
    const id = `c-${indice}`;
    nodos.push({
      id,
      etiqueta: concepto.termino,
      detalle: concepto.definicion,
      nivel: 1,
      idPadre: "root",
      x: 40 + indice * espaciado,
      y: 180,
    });
    aristas.push({ id: `e-${indice}`, fuente: "root", objetivo: id });
  });

  return { idTema, nodos, aristas };
}
