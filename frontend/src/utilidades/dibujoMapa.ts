import type { MapaExportable, PaletaExportacion } from "./exportacionMapa";

// -----------------------------------------------------------------------
// Dibuja el mapa conceptual en un <canvas> (sin dependencias) y lo devuelve
// como PNG. Reproduce la geometría del lienzo de `MapaConceptual.tsx`
// (tamaño real de los nodos, conectores en ángulo recto, flecha y frase de
// enlace) con la paleta CLARA y fondo blanco, a alta resolución.
// Las medidas imitan `.cm-node` y la etiqueta de `AristaEnlace`.
// -----------------------------------------------------------------------

const FUENTE_CUERPO = '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const FUENTE_TITULO = '"Bricolage Grotesque", "Figtree", -apple-system, "Segoe UI", sans-serif';

const MARGEN = 56;
const ALTO_ENCABEZADO = 84;
const BORDE_NODO = 1.5;
const RADIO_NODO = 14;
const ANCHO_MIN_NODO = 96;
const ANCHO_MAX_NODO = 220;
// Mismos valores que AristaEnlace: tramo horizontal común bajo el padre y frase justo encima del hijo.
const SALTO_CONECTOR = 30;
const DESPLAZAMIENTO_FRASE = 26;
const ANCHO_MAX_FRASE = 140;
// Límites seguros del canvas en los navegadores (lado y área).
const LADO_MAXIMO_CANVAS = 14_000;
const AREA_MAXIMA_CANVAS = 90_000_000;

interface EstiloTexto {
  familia: string;
  tamano: number;
  peso: number;
  interlineado: number;
}

interface EstiloNodo extends EstiloTexto {
  rellenoX: number;
  rellenoY: number;
}

function estiloNodo(nivel: number): EstiloNodo {
  return nivel <= 0
    ? { familia: FUENTE_TITULO, tamano: 15, peso: 700, interlineado: 20, rellenoX: 26, rellenoY: 14 }
    : { familia: FUENTE_CUERPO, tamano: 14, peso: 600, interlineado: 19, rellenoX: 18, rellenoY: 10 };
}

const ESTILO_FRASE: EstiloTexto = { familia: FUENTE_CUERPO, tamano: 11, peso: 500, interlineado: 14 };

const fuenteCss = (e: EstiloTexto) => `${e.peso} ${e.tamano}px ${e.familia}`;

/** Parte un texto en líneas que caben en `anchoMax` (también corta palabras muy largas, como `overflow-wrap: anywhere`). */
function partirLineas(ctx: CanvasRenderingContext2D, texto: string, anchoMax: number): string[] {
  const lineas: string[] = [];
  let actual = "";
  const empujarPalabraLarga = (palabra: string) => {
    let trozo = "";
    for (const letra of palabra) {
      if (trozo && ctx.measureText(trozo + letra).width > anchoMax) {
        lineas.push(trozo);
        trozo = letra;
      } else trozo += letra;
    }
    return trozo;
  };
  for (const palabra of texto.split(/\s+/).filter(Boolean)) {
    const candidata = actual ? `${actual} ${palabra}` : palabra;
    if (ctx.measureText(candidata).width <= anchoMax) {
      actual = candidata;
      continue;
    }
    if (actual) lineas.push(actual);
    actual = ctx.measureText(palabra).width > anchoMax ? empujarPalabraLarga(palabra) : palabra;
  }
  if (actual) lineas.push(actual);
  return lineas.length ? lineas : [""];
}

interface Caja {
  id: string;
  nivel: number;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  lineas: string[];
  estilo: EstiloNodo;
}

interface Frase {
  cx: number;
  cy: number;
  ancho: number;
  alto: number;
  lineas: string[];
}

interface Conector {
  puntos: { x: number; y: number }[];
  conFlecha: boolean;
  frase: Frase | null;
}

function medirCajas(ctx: CanvasRenderingContext2D, mapa: MapaExportable): Map<string, Caja> {
  const cajas = new Map<string, Caja>();
  mapa.nodos.forEach((n) => {
    const estilo = estiloNodo(n.nivel);
    ctx.font = fuenteCss(estilo);
    const texto = n.etiqueta.trim() || "Sin título";
    const extra = 2 * estilo.rellenoX + 2 * BORDE_NODO;
    // Si el lienzo ya midió el nodo se respeta su tamaño (es lo que el estudiante ve); si no, se calcula igual que el CSS.
    const ancho = n.ancho && n.ancho > 0 ? n.ancho : Math.min(ANCHO_MAX_NODO, Math.max(ANCHO_MIN_NODO, Math.ceil(ctx.measureText(texto).width) + extra));
    const lineas = partirLineas(ctx, texto, Math.max(20, ancho - extra));
    const altoTexto = lineas.length * estilo.interlineado + 2 * estilo.rellenoY + 2 * BORDE_NODO;
    const alto = Math.max(n.alto && n.alto > 0 ? n.alto : 0, altoTexto);
    cajas.set(n.id, { id: n.id, nivel: n.nivel, x: n.x, y: n.y, ancho, alto, lineas, estilo });
  });
  return cajas;
}

function trazarConectores(ctx: CanvasRenderingContext2D, mapa: MapaExportable, cajas: Map<string, Caja>): Conector[] {
  ctx.font = fuenteCss(ESTILO_FRASE);
  return mapa.aristas.flatMap((a) => {
    const origen = cajas.get(a.origen);
    const destino = cajas.get(a.destino);
    if (!origen || !destino) return [];
    const sx = origen.x + origen.ancho / 2;
    const sy = origen.y + origen.alto;
    const tx = destino.x + destino.ancho / 2;
    const ty = destino.y;
    const haySitio = a.conFlecha && ty - sy > SALTO_CONECTOR * 2;
    const medioY = haySitio ? sy + SALTO_CONECTOR : (sy + ty) / 2;
    const puntos = [
      { x: sx, y: sy },
      { x: sx, y: medioY },
      { x: tx, y: medioY },
      { x: tx, y: ty },
    ];
    const textoFrase = a.frase?.trim();
    let frase: Frase | null = null;
    if (a.conFlecha && textoFrase) {
      const lineas = partirLineas(ctx, textoFrase, ANCHO_MAX_FRASE - 16);
      const ancho = Math.min(ANCHO_MAX_FRASE, Math.max(...lineas.map((l) => ctx.measureText(l).width)) + 16);
      frase = { cx: tx, cy: haySitio ? ty - DESPLAZAMIENTO_FRASE : (sy + ty) / 2, ancho, alto: lineas.length * ESTILO_FRASE.interlineado + 4, lineas };
    }
    return [{ puntos, conFlecha: a.conFlecha, frase }];
  });
}

function rectanguloRedondeado(ctx: CanvasRenderingContext2D, x: number, y: number, ancho: number, alto: number, radio: number) {
  const r = Math.min(radio, ancho / 2, alto / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, r);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, r);
  ctx.arcTo(x, y + alto, x, y, r);
  ctx.arcTo(x, y, x + ancho, y, r);
  ctx.closePath();
}

/** Polilínea en ángulo recto con las esquinas suavizadas (como `getSmoothStepPath`). */
function trazarPolilinea(ctx: CanvasRenderingContext2D, puntos: { x: number; y: number }[], radio: number) {
  ctx.beginPath();
  ctx.moveTo(puntos[0].x, puntos[0].y);
  for (let i = 1; i < puntos.length - 1; i++) {
    const anterior = puntos[i - 1];
    const actual = puntos[i];
    const siguiente = puntos[i + 1];
    const r = Math.min(radio, Math.hypot(actual.x - anterior.x, actual.y - anterior.y) / 2, Math.hypot(siguiente.x - actual.x, siguiente.y - actual.y) / 2);
    if (r < 0.5) ctx.lineTo(actual.x, actual.y);
    else ctx.arcTo(actual.x, actual.y, siguiente.x, siguiente.y, r);
  }
  const ultimo = puntos[puntos.length - 1];
  ctx.lineTo(ultimo.x, ultimo.y);
}

function escalaSegura(ancho: number, alto: number, ladoMaximo: number, escalaMaxima: number): number {
  const porLado = Math.min(ladoMaximo, LADO_MAXIMO_CANVAS) / Math.max(ancho, alto);
  const porArea = Math.sqrt(AREA_MAXIMA_CANVAS / (ancho * alto));
  return Math.max(0.5, Math.min(escalaMaxima, porLado, porArea));
}

/** Espera a que las fuentes de la interfaz estén cargadas para que el canvas las use (y no una de sistema). */
async function esperarFuentes() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load(`600 14px ${FUENTE_CUERPO}`),
      document.fonts.load(`500 11px ${FUENTE_CUERPO}`),
      document.fonts.load(`700 15px ${FUENTE_TITULO}`),
    ]);
    await document.fonts.ready;
  } catch {
    /* sin fuentes web: el canvas usa las de respaldo */
  }
}

export interface OpcionesDibujo {
  /** Añade el título del tema y el origen del mapa encima del dibujo (PNG). El PDF pone su propio encabezado. */
  conEncabezado: boolean;
  /** Lado mayor máximo de la imagen, en píxeles. */
  ladoMaximo?: number;
  /** Píxeles por unidad del lienzo (3 = triple de la resolución de pantalla). */
  escalaMaxima?: number;
}

/** Dibuja el mapa completo (incluidas las ramas contraídas) y lo devuelve como PNG. */
export async function dibujarMapaPng(mapa: MapaExportable, paleta: PaletaExportacion, opciones: OpcionesDibujo): Promise<Blob> {
  if (mapa.nodos.length === 0) throw new Error("El mapa no tiene conceptos para exportar.");
  await esperarFuentes();

  const lienzo = document.createElement("canvas");
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite dibujar la imagen.");

  const cajas = medirCajas(ctx, mapa);
  const conectores = trazarConectores(ctx, mapa, cajas);

  // Encuadre de todo el contenido (nodos y frases de enlace)
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const incluir = (x1: number, y1: number, x2: number, y2: number) => {
    minX = Math.min(minX, x1);
    minY = Math.min(minY, y1);
    maxX = Math.max(maxX, x2);
    maxY = Math.max(maxY, y2);
  };
  cajas.forEach((c) => incluir(c.x, c.y, c.x + c.ancho, c.y + c.alto));
  conectores.forEach((c) => c.frase && incluir(c.frase.cx - c.frase.ancho / 2, c.frase.cy - c.frase.alto / 2, c.frase.cx + c.frase.ancho / 2, c.frase.cy + c.frase.alto / 2));

  const titulo = mapa.titulo.trim() || "Mapa conceptual";
  const subtitulo = `Mapa conceptual · ${mapa.origen === "ia" ? "Generado con IA" : "Mapa de ejemplo"}`;
  const encabezado = opciones.conEncabezado ? ALTO_ENCABEZADO : 0;
  ctx.font = `700 24px ${FUENTE_TITULO}`;
  const anchoTitulo = opciones.conEncabezado ? ctx.measureText(titulo).width : 0;

  const anchoContenido = maxX - minX;
  const ancho = Math.max(anchoContenido, anchoTitulo) + 2 * MARGEN;
  const alto = maxY - minY + 2 * MARGEN + encabezado;
  const escala = escalaSegura(ancho, alto, opciones.ladoMaximo ?? LADO_MAXIMO_CANVAS, opciones.escalaMaxima ?? 3);

  lienzo.width = Math.ceil(ancho * escala);
  lienzo.height = Math.ceil(alto * escala);
  ctx.scale(escala, escala);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);

  if (opciones.conEncabezado) {
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = paleta.texto;
    ctx.font = `700 24px ${FUENTE_TITULO}`;
    ctx.fillText(titulo, MARGEN, MARGEN + 4);
    ctx.fillStyle = paleta.textoSuave;
    ctx.font = `500 13px ${FUENTE_CUERPO}`;
    ctx.fillText(subtitulo, MARGEN, MARGEN + 28);
    ctx.fillStyle = paleta.solido;
    ctx.fillRect(MARGEN, MARGEN + 42, 48, 3);
  }

  // Centra horizontalmente el dibujo si el título es más ancho que el mapa
  const desplazamientoX = MARGEN - minX + (ancho - 2 * MARGEN - anchoContenido) / 2;
  const desplazamientoY = MARGEN + encabezado - minY;
  ctx.save();
  ctx.translate(desplazamientoX, desplazamientoY);

  // 1) Conectores y flechas
  ctx.strokeStyle = paleta.bordeFuerte;
  ctx.fillStyle = paleta.bordeFuerte;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  conectores.forEach((c) => {
    const radio = c.conFlecha ? 10 : 5;
    trazarPolilinea(ctx, c.puntos, radio);
    ctx.stroke();
    if (c.conFlecha) {
      const punta = c.puntos[c.puntos.length - 1];
      ctx.beginPath();
      ctx.moveTo(punta.x, punta.y);
      ctx.lineTo(punta.x - 5, punta.y - 9);
      ctx.lineTo(punta.x + 5, punta.y - 9);
      ctx.closePath();
      ctx.fill();
    }
  });

  // 2) Frases de enlace
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  conectores.forEach(({ frase }) => {
    if (!frase) return;
    rectanguloRedondeado(ctx, frase.cx - frase.ancho / 2, frase.cy - frase.alto / 2, frase.ancho, frase.alto, 8);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = paleta.borde;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = paleta.textoSecundario;
    ctx.font = fuenteCss(ESTILO_FRASE);
    const inicio = frase.cy - ((frase.lineas.length - 1) * ESTILO_FRASE.interlineado) / 2;
    frase.lineas.forEach((l, i) => ctx.fillText(l, frase.cx, inicio + i * ESTILO_FRASE.interlineado));
  });

  // 3) Conceptos
  cajas.forEach((c) => {
    const relleno = c.nivel <= 0 ? paleta.solido : c.nivel === 1 ? paleta.tinte : "#ffffff";
    const borde = c.nivel <= 0 ? paleta.solido : c.nivel === 1 ? paleta.medio : paleta.bordeFuerte;
    const colorTexto = c.nivel <= 0 ? "#ffffff" : c.nivel === 1 ? paleta.tinta : paleta.texto;
    const mitad = BORDE_NODO / 2;
    rectanguloRedondeado(ctx, c.x + mitad, c.y + mitad, c.ancho - BORDE_NODO, c.alto - BORDE_NODO, RADIO_NODO);
    ctx.fillStyle = relleno;
    ctx.fill();
    ctx.strokeStyle = borde;
    ctx.lineWidth = BORDE_NODO;
    ctx.stroke();
    ctx.fillStyle = colorTexto;
    ctx.font = fuenteCss(c.estilo);
    const centroX = c.x + c.ancho / 2;
    const inicio = c.y + c.alto / 2 - ((c.lineas.length - 1) * c.estilo.interlineado) / 2;
    c.lineas.forEach((l, i) => ctx.fillText(l, centroX, inicio + i * c.estilo.interlineado));
  });
  ctx.restore();

  return new Promise<Blob>((resolver, rechazar) => {
    lienzo.toBlob((blob) => (blob && blob.size > 0 ? resolver(blob) : rechazar(new Error("No se pudo crear la imagen."))), "image/png");
  });
}
