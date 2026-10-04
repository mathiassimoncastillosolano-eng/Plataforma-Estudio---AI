import type { MindMap } from "../types";

export const mindmaps: Record<string, MindMap> = {
  "1": {
    topicId: "1",
    nodes: [
      { id: "root", label: "Sistema circulatorio", level: 0, parentId: null, x: 400, y: 20 },
      { id: "corazon", label: "Corazón", detail: "Bomba muscular de cuatro cavidades", level: 1, parentId: "root", x: 100, y: 160 },
      { id: "sangre", label: "Sangre", detail: "Plasma, glóbulos y plaquetas", level: 1, parentId: "root", x: 400, y: 160 },
      { id: "vasos", label: "Vasos sanguíneos", detail: "Arterias, venas y capilares", level: 1, parentId: "root", x: 700, y: 160 },
      { id: "auriculas", label: "Aurículas", level: 2, parentId: "corazon", x: -40, y: 300 },
      { id: "ventriculos", label: "Ventrículos", level: 2, parentId: "corazon", x: 160, y: 300 },
      { id: "plasma", label: "Plasma", level: 2, parentId: "sangre", x: 320, y: 300 },
      { id: "celulas", label: "Células sanguíneas", level: 2, parentId: "sangre", x: 500, y: 300 },
      { id: "arterias", label: "Arterias", level: 2, parentId: "vasos", x: 620, y: 300 },
      { id: "venas", label: "Venas", level: 2, parentId: "vasos", x: 800, y: 300 },
    ],
    edges: [
      { id: "e1", source: "root", target: "corazon" },
      { id: "e2", source: "root", target: "sangre" },
      { id: "e3", source: "root", target: "vasos" },
      { id: "e4", source: "corazon", target: "auriculas" },
      { id: "e5", source: "corazon", target: "ventriculos" },
      { id: "e6", source: "sangre", target: "plasma" },
      { id: "e7", source: "sangre", target: "celulas" },
      { id: "e8", source: "vasos", target: "arterias" },
      { id: "e9", source: "vasos", target: "venas" },
    ],
  },
  "3": {
    topicId: "3",
    nodes: [
      { id: "root", label: "Programación orientada a objetos", level: 0, parentId: null, x: 400, y: 20 },
      { id: "clases", label: "Clases y objetos", level: 1, parentId: "root", x: 60, y: 160 },
      { id: "encap", label: "Encapsulamiento", level: 1, parentId: "root", x: 300, y: 160 },
      { id: "herencia", label: "Herencia", level: 1, parentId: "root", x: 540, y: 160 },
      { id: "poli", label: "Polimorfismo", level: 1, parentId: "root", x: 780, y: 160 },
      { id: "atributos", label: "Atributos", level: 2, parentId: "clases", x: -20, y: 300 },
      { id: "metodos", label: "Métodos", level: 2, parentId: "clases", x: 140, y: 300 },
      { id: "sobrecarga", label: "Sobrecarga", level: 2, parentId: "poli", x: 700, y: 300 },
      { id: "sobrescritura", label: "Sobrescritura", level: 2, parentId: "poli", x: 870, y: 300 },
    ],
    edges: [
      { id: "e1", source: "root", target: "clases" },
      { id: "e2", source: "root", target: "encap" },
      { id: "e3", source: "root", target: "herencia" },
      { id: "e4", source: "root", target: "poli" },
      { id: "e5", source: "clases", target: "atributos" },
      { id: "e6", source: "clases", target: "metodos" },
      { id: "e7", source: "poli", target: "sobrecarga" },
      { id: "e8", source: "poli", target: "sobrescritura" },
    ],
  },
};

/**
 * Genera un mapa conceptual básico de respaldo a partir de los conceptos
 * fundamentales del resumen, para temas que no tienen un mapa curado.
 */
export function buildFallbackMindMap(
  topicId: string,
  rootLabel: string,
  concepts: { term: string; definition: string }[]
): MindMap {
  const nodes: MindMap["nodes"] = [
    { id: "root", label: rootLabel, level: 0, parentId: null, x: 400, y: 20 },
  ];
  const edges: MindMap["edges"] = [];
  const spacing = 800 / Math.max(concepts.length, 1);

  concepts.forEach((concept, index) => {
    const id = `c-${index}`;
    nodes.push({
      id,
      label: concept.term,
      detail: concept.definition,
      level: 1,
      parentId: "root",
      x: 40 + index * spacing,
      y: 180,
    });
    edges.push({ id: `e-${index}`, source: "root", target: id });
  });

  return { topicId, nodes, edges };
}
