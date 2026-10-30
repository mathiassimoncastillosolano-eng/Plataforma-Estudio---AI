// -----------------------------------------------------------------------
// Distribución determinista de un mapa conceptual jerárquico (MOD-05).
//
// La IA solo entrega la estructura; las posiciones se calculan aquí, siempre
// igual para la misma entrada y sin librerías externas:
//  - árbol de arriba hacia abajo, con cada padre centrado sobre sus hijos;
//  - cada subárbol ocupa su propio tramo horizontal, de modo que dos nodos
//    nunca se solapan;
//  - los grupos de 3 o más hojas hermanas se reparten en dos filas
//    (zigzag) para que el mapa no se ensanche demasiado;
//  - el espacio reservado para cada hijo incluye el de su frase de enlace,
//    que se dibuja justo encima del nodo.
// -----------------------------------------------------------------------

export interface NodoDistribuible {
  id: string;
  etiqueta: string;
  nivel: number;
  idPadre: string | null;
  /** Frase de enlace del padre hacia este nodo (se usa para reservar espacio). */
  frase?: string;
  /** Tamaño real del nodo ya dibujado, si se conoce; si no, se estima por su texto. */
  ancho?: number;
  alto?: number;
}

export interface Posicion {
  x: number;
  y: number;
}

/** Distancia vertical entre niveles consecutivos. */
export const ALTO_NIVEL = 190;
/** Hueco horizontal mínimo entre dos nodos contiguos. */
const SEPARACION = 36;
/** Espacio vertical extra de la segunda fila de un grupo en zigzag (etiqueta de enlace incluida). */
const MARGEN_ZIGZAG = 56;
const ANCHO_MIN = 96;
const ANCHO_MAX = 220;
const ANCHO_FRASE_MAX = 140;
const MIN_HOJAS_ZIGZAG = 3;

const esRaiz = (n: NodoDistribuible) => n.nivel === 0;

/** Ancho estimado del nodo según su texto (el CSS lo limita a 96–220 px y el texto salta de línea). */
export function anchoNodo(n: NodoDistribuible): number {
  if (n.ancho) return n.ancho;
  const relleno = esRaiz(n) ? 56 : 40;
  const porCaracter = esRaiz(n) ? 9.4 : 7.8;
  return Math.min(ANCHO_MAX, Math.max(ANCHO_MIN, n.etiqueta.length * porCaracter + relleno));
}

/** Alto estimado del nodo (número de líneas × interlineado + relleno). */
export function altoNodo(n: NodoDistribuible): number {
  if (n.alto) return n.alto;
  const relleno = esRaiz(n) ? 56 : 40;
  const porCaracter = esRaiz(n) ? 9.4 : 7.8;
  const lineas = Math.max(1, Math.ceil((n.etiqueta.length * porCaracter) / (anchoNodo(n) - relleno)));
  return lineas * 21 + (esRaiz(n) ? 30 : 24);
}

function anchoFrase(frase?: string): number {
  return frase ? Math.min(ANCHO_FRASE_MAX, frase.length * 6.2 + 20) : 0;
}

/** Ancho que un nodo debe reservar: el mayor entre el nodo y su frase de enlace. */
function anchoReservado(n: NodoDistribuible): number {
  return Math.max(anchoNodo(n), anchoFrase(n.frase) + 12);
}

interface Hijo {
  id: string;
  dx: number;
  dy: number;
}

interface Medida {
  izq: number;
  der: number;
  hijos: Hijo[];
}

/**
 * Devuelve la posición (esquina superior izquierda, como espera React Flow) de cada nodo.
 * Tolera estructuras defectuosas: ciclos, padres inexistentes o varias raíces no rompen el cálculo.
 */
export function calcularPosiciones(nodos: NodoDistribuible[]): Map<string, Posicion> {
  const porId = new Map(nodos.map((n) => [n.id, n]));
  const hijosDe = new Map<string, NodoDistribuible[]>();
  const raices: NodoDistribuible[] = [];
  for (const n of nodos) {
    const padre = n.idPadre && n.idPadre !== n.id ? porId.get(n.idPadre) : undefined;
    if (padre) hijosDe.set(padre.id, [...(hijosDe.get(padre.id) ?? []), n]);
    else raices.push(n);
  }

  const medidas = new Map<string, Medida>();
  const enCurso = new Set<string>();

  function medir(n: NodoDistribuible): Medida {
    const previa = medidas.get(n.id);
    if (previa) return previa;
    const propio = anchoReservado(n) / 2;
    // Un ciclo (no debería llegar aquí) se corta tratando el nodo como hoja.
    const hijos = enCurso.has(n.id) ? [] : (hijosDe.get(n.id) ?? []);
    enCurso.add(n.id);

    let medida: Medida;
    if (hijos.length === 0) {
      medida = { izq: propio, der: propio, hijos: [] };
    } else if (hijos.length >= MIN_HOJAS_ZIGZAG && hijos.every((h) => (hijosDe.get(h.id) ?? []).length === 0)) {
      // Hojas hermanas en zigzag: contiguas en horizontal pero en dos filas alternas.
      const ancho = Math.max(...hijos.map(anchoReservado));
      const paso = (ancho + SEPARACION) / 2;
      const desvio = Math.max(...hijos.map(altoNodo)) + MARGEN_ZIGZAG;
      const total = (hijos.length - 1) * paso + ancho;
      const mitad = Math.max(total / 2, propio);
      medida = {
        izq: mitad,
        der: mitad,
        hijos: hijos.map((h, i) => ({ id: h.id, dx: (i - (hijos.length - 1) / 2) * paso, dy: (i % 2) * desvio })),
      };
    } else {
      // Subárboles uno junto a otro; el padre se centra entre el primer y el último hijo.
      let cursor = 0;
      const centros: { id: string; centro: number }[] = [];
      for (const h of hijos) {
        const m = medir(h);
        centros.push({ id: h.id, centro: cursor + m.izq });
        cursor += m.izq + m.der + SEPARACION;
      }
      const fin = cursor - SEPARACION;
      const centroPadre = (centros[0].centro + centros[centros.length - 1].centro) / 2;
      medida = {
        izq: Math.max(centroPadre, propio),
        der: Math.max(fin - centroPadre, propio),
        hijos: centros.map((c) => ({ id: c.id, dx: c.centro - centroPadre, dy: 0 })),
      };
    }
    enCurso.delete(n.id);
    medidas.set(n.id, medida);
    return medida;
  }

  const posiciones = new Map<string, Posicion>();

  function colocar(n: NodoDistribuible, centroX: number, y: number) {
    if (posiciones.has(n.id)) return;
    posiciones.set(n.id, { x: Math.round(centroX - anchoNodo(n) / 2), y: Math.round(y) });
    for (const h of medir(n).hijos) {
      const hijo = porId.get(h.id);
      if (hijo) colocar(hijo, centroX + h.dx, y + ALTO_NIVEL + h.dy);
    }
  }

  // Normalmente hay una sola raíz; si hubiera varias se colocan una junto a otra.
  let cursor = 0;
  for (const raiz of raices) {
    const m = medir(raiz);
    colocar(raiz, cursor + m.izq, 0);
    cursor += m.izq + m.der + SEPARACION * 2;
  }
  // Nodos inalcanzables (p. ej. dentro de un ciclo): se apilan debajo para que nunca se pierdan.
  let ultimoY = Math.max(0, ...[...posiciones.values()].map((p) => p.y)) + ALTO_NIVEL;
  for (const n of nodos) {
    if (!posiciones.has(n.id)) {
      posiciones.set(n.id, { x: 0, y: ultimoY });
      ultimoY += ALTO_NIVEL;
    }
  }
  return posiciones;
}
