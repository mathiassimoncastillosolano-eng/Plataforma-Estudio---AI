import { describe, expect, it } from "vitest";
import { PALETAS_EXPORTACION, aplanarJerarquia, construirJerarquia, generarFreeMind, nombreArchivoMapa, type MapaExportable } from "./exportacionMapa";

/** Mapa como queda tras editarlo: «Sinapsis» es un nodo añadido a mano y «Glía» se renombró. */
const MAPA: MapaExportable = {
  titulo: "Sistema nervioso",
  origen: "ia",
  nodos: [
    { id: "root", etiqueta: "Sistema nervioso", descripcion: "Coordina el cuerpo.", nivel: 0, x: 300, y: 0 },
    { id: "n2", etiqueta: "Periférico", nivel: 1, x: 500, y: 150 },
    { id: "n1", etiqueta: "Central", descripcion: "Encéfalo y médula.", nivel: 1, x: 100, y: 150 },
    { id: "n3", etiqueta: "Neurona <célula>", descripcion: "Transmite impulsos & señales.", nivel: 2, x: 100, y: 300 },
    { id: "nuevo", etiqueta: "Sinapsis", descripcion: "Unión entre neuronas.\nPuede ser química.", nivel: 2, x: 250, y: 300 },
  ],
  aristas: [
    { id: "e1", origen: "root", destino: "n1", frase: "se divide en", conFlecha: true },
    { id: "e2", origen: "root", destino: "n2", frase: "y en", conFlecha: true },
    { id: "e3", origen: "n1", destino: "n3", frase: "está formado por", conFlecha: true },
    { id: "e4", origen: "n1", destino: "nuevo", frase: "", conFlecha: true },
  ],
};

describe("jerarquía del mapa", () => {
  it("reconstruye el árbol desde las conexiones actuales, con los hermanos de izquierda a derecha", () => {
    const lista = aplanarJerarquia(construirJerarquia(MAPA));
    expect(lista.map((c) => [c.etiqueta, c.profundidad])).toEqual([
      ["Sistema nervioso", 0],
      ["Central", 1],
      ["Neurona <célula>", 2],
      ["Sinapsis", 2],
      ["Periférico", 1],
    ]);
  });

  it("refleja los nodos eliminados y no pierde los que quedaron sin concepto superior", () => {
    // Se eliminó «Central» (y sus conexiones): sus subconceptos quedan sueltos y se cuelgan del tema central.
    const sinCentral: MapaExportable = { ...MAPA, nodos: MAPA.nodos.filter((n) => n.id !== "n1"), aristas: MAPA.aristas.filter((a) => a.origen !== "n1" && a.destino !== "n1") };
    const lista = aplanarJerarquia(construirJerarquia(sinCentral));
    expect(lista.map((c) => c.etiqueta)).not.toContain("Central");
    expect(lista).toHaveLength(4);
    expect(lista[0].profundidad).toBe(0);
    expect(lista.filter((c) => c.profundidad === 1).map((c) => c.etiqueta).sort()).toEqual(["Neurona <célula>", "Periférico", "Sinapsis"]);
  });

  it("ignora conexiones que formarían un ciclo", () => {
    const conCiclo: MapaExportable = { ...MAPA, aristas: [...MAPA.aristas, { id: "x", origen: "n3", destino: "n1", conFlecha: false }] };
    const lista = aplanarJerarquia(construirJerarquia(conCiclo));
    expect(lista).toHaveLength(5);
    expect(new Set(lista.map((c) => c.id)).size).toBe(5);
  });

  it("devuelve una lista vacía si el mapa no tiene nodos", () => {
    expect(aplanarJerarquia(construirJerarquia({ nodos: [], aristas: [] }))).toEqual([]);
  });
});

describe("FreeMind (.mm)", () => {
  const xml = generarFreeMind(MAPA, PALETAS_EXPORTACION.purple);
  const documento = new DOMParser().parseFromString(xml, "application/xml");

  it("genera XML válido con un único nodo raíz", () => {
    expect(documento.getElementsByTagName("parsererror")).toHaveLength(0);
    expect(documento.documentElement.tagName).toBe("map");
    expect(documento.documentElement.getAttribute("version")).toBe("1.0.1");
    expect(documento.querySelectorAll("map > node")).toHaveLength(1);
  });

  it("conserva la jerarquía, las ediciones, las descripciones y las frases de enlace", () => {
    const raiz = documento.querySelector("map > node")!;
    expect(raiz.getAttribute("TEXT")).toBe("Sistema nervioso");
    expect(raiz.getAttribute("BACKGROUND_COLOR")).toBe(PALETAS_EXPORTACION.purple.solido);
    const ramas = [...raiz.children].filter((e) => e.tagName === "node");
    expect(ramas.map((r) => r.getAttribute("TEXT"))).toEqual(["Central", "Periférico"]);
    expect(ramas.map((r) => r.getAttribute("POSITION"))).toEqual(["right", "left"]);
    const hijos = [...ramas[0].children].filter((e) => e.tagName === "node");
    expect(hijos.map((h) => h.getAttribute("TEXT"))).toEqual(["Neurona <célula>", "Sinapsis"]);
    expect(hijos[0].querySelector("attribute")?.getAttribute("VALUE")).toBe("está formado por");
    expect(hijos[0].querySelector("richcontent")?.textContent).toContain("Transmite impulsos & señales.");
    expect(hijos[1].querySelectorAll("richcontent p")).toHaveLength(2);
  });
});

describe("nombres de archivo", () => {
  it("son descriptivos, distintos por formato y sin caracteres no válidos", () => {
    expect(nombreArchivoMapa("Sistema nervioso", "pdf")).toBe("Sistema_Nervioso_Mapa_Conceptual.pdf");
    expect(nombreArchivoMapa("Sistema nervioso", "mm")).toBe("Sistema_Nervioso_Mapa_Editable.mm");
    expect(nombreArchivoMapa("Sistema nervioso", "png")).toBe("Sistema_Nervioso_Mapa_Alta_Calidad.png");
    expect(nombreArchivoMapa("  La célula: ¿núcleo/membrana?  ", "pdf")).toBe("La_Celula_Nucleo_Membrana_Mapa_Conceptual.pdf");
    expect(nombreArchivoMapa("¿?*", "png")).toBe("Tema_Mapa_Alta_Calidad.png");
    expect(nombreArchivoMapa("a".repeat(200), "mm").length).toBeLessThanOrEqual(60 + "_Mapa_Editable.mm".length);
  });
});
