// -----------------------------------------------------------------------
// Exportación del mapa conceptual (MOD-05): lógica pura, sin DOM.
// Parte siempre del estado ACTUAL del lienzo (con los nodos añadidos, editados
// o eliminados por el estudiante), no del mapa original que generó la IA.
// El dibujo en PNG vive en `dibujoMapa.ts`; el PDF lo compone el backend.
// -----------------------------------------------------------------------

export type AcentoExportacion = "blue" | "purple";
export type FormatoExportacion = "pdf" | "mm" | "png";

/**
 * Variante CLARA de cada paleta (la hoja y la imagen tienen fondo blanco aunque la
 * plataforma esté en modo oscuro). Copia de los tokens de `estilos/tokens.css` (morado)
 * y `estilos/temas.css` (azul): si cambian allí, actualízalos aquí.
 */
export interface PaletaExportacion {
  /** Relleno del tema central (texto blanco encima). */
  solido: string;
  /** Fondo de los conceptos de primer nivel. */
  tinte: string;
  /** Borde de los conceptos de primer nivel. */
  medio: string;
  /** Texto sobre el tinte. */
  tinta: string;
  texto: string;
  textoSecundario: string;
  textoSuave: string;
  borde: string;
  bordeFuerte: string;
}

export const PALETAS_EXPORTACION: Record<AcentoExportacion, PaletaExportacion> = {
  blue: {
    solido: "#2563eb",
    tinte: "#e8f0ff",
    medio: "#c9dcff",
    tinta: "#1e40af",
    texto: "#0e1a33",
    textoSecundario: "#38486a",
    textoSuave: "#55657f",
    borde: "#dde5f2",
    bordeFuerte: "#c0cde3",
  },
  purple: {
    solido: "#4f46e5",
    tinte: "#eef0ff",
    medio: "#d9ddff",
    tinta: "#3a33b8",
    texto: "#1a1938",
    textoSecundario: "#46456a",
    textoSuave: "#5f5e82",
    borde: "#e3e1f0",
    bordeFuerte: "#c9c6de",
  },
};

/** Nodo del mapa tal como está en el lienzo en el momento de exportar. */
export interface NodoExportable {
  id: string;
  etiqueta: string;
  descripcion?: string;
  nivel: number;
  x: number;
  y: number;
  /** Tamaño real dibujado en pantalla (si se conoce). */
  ancho?: number;
  alto?: number;
}

/** Conexión padre → hijo. `frase` solo existe en los mapas generados con IA. */
export interface AristaExportable {
  id: string;
  origen: string;
  destino: string;
  frase?: string;
  /** Las aristas de los mapas con IA llevan flecha y frase de enlace. */
  conFlecha: boolean;
}

export interface MapaExportable {
  titulo: string;
  origen: "ia" | "ejemplo";
  nodos: NodoExportable[];
  aristas: AristaExportable[];
}

/** Concepto en orden de lectura (preorden), con la profundidad que ocupa en la jerarquía. */
export interface ConceptoJerarquico {
  id: string;
  etiqueta: string;
  descripcion: string;
  profundidad: number;
  hijos: ConceptoJerarquico[];
}

const TEXTO_SIN_TITULO = "Sin título";

function etiquetaLegible(etiqueta: string): string {
  return etiqueta.trim() || TEXTO_SIN_TITULO;
}

/**
 * Reconstruye la jerarquía a partir de las conexiones actuales. Un concepto cuelga del primer
 * nodo que apunta a él. El tema central (nivel 0) es la raíz; los conceptos que quedaron sin
 * concepto superior (p. ej. tras eliminar a su padre) se cuelgan de la raíz para no perderlos.
 * Las conexiones que formarían un ciclo se ignoran.
 */
export function construirJerarquia(mapa: Pick<MapaExportable, "nodos" | "aristas">): ConceptoJerarquico | null {
  if (mapa.nodos.length === 0) return null;
  const porId = new Map(mapa.nodos.map((n) => [n.id, n]));
  const padreDe = new Map<string, string>();
  mapa.aristas.forEach((a) => {
    if (porId.has(a.origen) && porId.has(a.destino) && a.origen !== a.destino && !padreDe.has(a.destino)) padreDe.set(a.destino, a.origen);
  });

  // Orden estable para los hermanos: de izquierda a derecha y de arriba abajo, como se leen en el lienzo.
  const ordenados = [...mapa.nodos].sort((a, b) => a.y - b.y || a.x - b.x);
  const hijosDe = new Map<string, string[]>();
  ordenados.forEach((n) => {
    const padre = padreDe.get(n.id);
    if (padre) hijosDe.set(padre, [...(hijosDe.get(padre) ?? []), n.id]);
  });

  const raiz = ordenados.find((n) => n.nivel === 0 && !padreDe.has(n.id)) ?? ordenados.find((n) => !padreDe.has(n.id)) ?? ordenados[0];
  const visitados = new Set<string>();

  function construir(id: string, profundidad: number): ConceptoJerarquico {
    visitados.add(id);
    const nodo = porId.get(id)!;
    const hijos = (hijosDe.get(id) ?? []).filter((h) => !visitados.has(h)).map((h) => construir(h, profundidad + 1));
    return { id, etiqueta: etiquetaLegible(nodo.etiqueta), descripcion: nodo.descripcion?.trim() ?? "", profundidad, hijos };
  }

  const arbol = construir(raiz.id, 0);
  // Nodos que no se alcanzan desde la raíz (sueltos o dentro de un ciclo): se añaden bajo la raíz.
  ordenados.forEach((n) => {
    if (!visitados.has(n.id)) arbol.hijos.push(construir(n.id, 1));
  });
  return arbol;
}

/** Recorre la jerarquía en orden de lectura (preorden). */
export function aplanarJerarquia(arbol: ConceptoJerarquico | null): ConceptoJerarquico[] {
  if (!arbol) return [];
  const salida: ConceptoJerarquico[] = [];
  const pendientes = [arbol];
  while (pendientes.length) {
    const actual = pendientes.shift()!;
    salida.push(actual);
    pendientes.unshift(...actual.hijos);
  }
  return salida;
}

// --- FreeMind (.mm) ------------------------------------------------------------------------

function escaparXml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/\r\n|\r|\n/g, "&#10;")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

/**
 * Genera un archivo FreeMind 1.0.1 (también lo abren Freeplane, XMind y otros). Conserva la
 * jerarquía completa; la descripción va como nota del nodo y la frase de enlace (si la hay)
 * como atributo, para que el estudiante pueda seguir ampliando el mapa en otro programa.
 */
export function generarFreeMind(mapa: MapaExportable, paleta: PaletaExportacion): string {
  const arbol = construirJerarquia(mapa);
  const frasePorHijo = new Map(mapa.aristas.filter((a) => a.frase?.trim()).map((a) => [a.destino, a.frase!.trim()]));
  const lineas: string[] = ['<map version="1.0.1">', "<!-- Mapa conceptual exportado desde Cursa. Ábrelo con FreeMind, Freeplane o XMind. -->"];
  let lado = 0;

  function nodoXml(concepto: ConceptoJerarquico, sangria: string, esRaiz: boolean) {
    const atributos = [`TEXT="${escaparXml(concepto.etiqueta)}"`, `ID="${escaparXml(`ID_${concepto.id}`)}"`];
    if (concepto.profundidad === 1) {
      // Reparte las ramas a ambos lados del tema central, como en el lienzo.
      atributos.push(`POSITION="${lado++ % 2 === 0 ? "right" : "left"}"`);
    }
    if (esRaiz) atributos.push(`BACKGROUND_COLOR="${paleta.solido}"`, 'COLOR="#ffffff"');
    else if (concepto.profundidad === 1) atributos.push(`BACKGROUND_COLOR="${paleta.tinte}"`, `COLOR="${paleta.tinta}"`);
    else atributos.push(`COLOR="${paleta.texto}"`);
    if (concepto.hijos.length > 0 && !esRaiz && concepto.profundidad >= 2) atributos.push('FOLDED="false"');

    lineas.push(`${sangria}<node ${atributos.join(" ")}>`);
    lineas.push(`${sangria}  <edge COLOR="${paleta.bordeFuerte}"/>`);
    if (esRaiz || concepto.profundidad === 1) lineas.push(`${sangria}  <font NAME="SansSerif" SIZE="${esRaiz ? 16 : 13}" BOLD="true"/>`);
    const frase = frasePorHijo.get(concepto.id);
    if (frase) lineas.push(`${sangria}  <attribute NAME="Frase de enlace" VALUE="${escaparXml(frase)}"/>`);
    if (concepto.descripcion) {
      const parrafos = concepto.descripcion
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map((p) => `<p>${escaparXml(p)}</p>`)
        .join("");
      lineas.push(`${sangria}  <richcontent TYPE="NOTE"><html><head></head><body>${parrafos}</body></html></richcontent>`);
    }
    concepto.hijos.forEach((h) => nodoXml(h, `${sangria}  `, false));
    lineas.push(`${sangria}</node>`);
  }

  if (arbol) nodoXml(arbol, "", true);
  else lineas.push(`<node TEXT="${escaparXml(etiquetaLegible(mapa.titulo))}"/>`);
  lineas.push("</map>", "");
  return lineas.join("\n");
}

// --- Nombres de archivo --------------------------------------------------------------------

const SUFIJOS: Record<FormatoExportacion, string> = {
  pdf: "Mapa_Conceptual.pdf",
  mm: "Mapa_Editable.mm",
  png: "Mapa_Alta_Calidad.png",
};

/**
 * Nombre descriptivo y seguro en cualquier sistema: `Sistema_Nervioso_Mapa_Conceptual.pdf`.
 * Quita tildes y caracteres no válidos, separa con guiones bajos y limita la longitud.
 */
export function nombreArchivoMapa(titulo: string, formato: FormatoExportacion): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join("_")
    .slice(0, 60)
    .replace(/_+$/, "");
  return `${base || "Tema"}_${SUFIJOS[formato]}`;
}
