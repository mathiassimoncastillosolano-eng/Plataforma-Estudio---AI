import { crearEvento, PRIORIDAD, type EstadoBuddy, type EventoBuddy } from "./tipos";
import { UMBRALES_RESULTADO } from "../utilidades/recomendaciones";

export type ClaveModulo = "panel" | "nuevo-tema" | "resumen" | "preguntas" | "prueba" | "mapa" | "progreso";
export type NivelResultado = "excelente" | "bueno" | "intermedio" | "bajo";

const DIA_MS = 24 * 60 * 60 * 1000;

const PRESENTACIONES: Record<ClaveModulo, { mensaje: string; estado: EstadoBuddy; enfriamientoMs: number }> = {
  panel: { mensaje: "¡Hola de nuevo! Retoma tu último tema o empieza uno nuevo cuando quieras.", estado: "greeting", enfriamientoMs: DIA_MS },
  "nuevo-tema": { mensaje: "¡Empecemos algo nuevo! Puedes crear tu tema a partir de un documento o del contenido que quieras estudiar.", estado: "greeting", enfriamientoMs: Infinity },
  resumen: { mensaje: "¡Aquí convertimos tu material en conocimiento! Puedes consultar tu resumen esencial y general.", estado: "greeting", enfriamientoMs: Infinity },
  preguntas: { mensaje: "¡Vamos a poner a prueba lo que sabes! Practica y fortalece tus conocimientos.", estado: "encouraging", enfriamientoMs: Infinity },
  prueba: { mensaje: "¡Es hora de demostrar lo aprendido! Prepárate para tu prueba.", estado: "encouraging", enfriamientoMs: Infinity },
  mapa: { mensaje: "¡Vamos a conectar tus ideas! Aquí puedes visualizar los conceptos más importantes de tu tema.", estado: "explaining", enfriamientoMs: Infinity },
  progreso: { mensaje: "¡Descubre cuánto has avanzado! Aquí puedes visualizar tu evolución y dominio de los temas.", estado: "happy", enfriamientoMs: Infinity },
};

export function presentacionModulo(clave: ClaveModulo, nombre?: string): EventoBuddy {
  const base = PRESENTACIONES[clave];
  const mensaje = clave === "panel" && nombre ? `¡Hola, ${nombre}! ${base.mensaje.replace("¡Hola de nuevo! ", "")}` : base.mensaje;
  return crearEvento({ id: `modulo:${clave}`, mensaje, estado: base.estado, prioridad: PRIORIDAD.modulo, duracionMs: 4800, enfriamientoMs: base.enfriamientoMs });
}

export function nivelDePorcentaje(porcentaje: number): NivelResultado {
  if (porcentaje >= UMBRALES_RESULTADO.excelente) return "excelente";
  if (porcentaje >= UMBRALES_RESULTADO.bueno) return "bueno";
  if (porcentaje >= UMBRALES_RESULTADO.intermedio) return "intermedio";
  return "bajo";
}

const MENSAJES: Record<NivelResultado | "reintento", string[]> = {
  excelente: [
    "¡INCREÍBLE! ¡Lo conseguiste! Has demostrado un excelente dominio de este tema.",
    "¡Impresionante! Respondiste con una precisión admirable. Este tema se te da de maravilla.",
    "¡Espectacular resultado! Tu esfuerzo se nota en cada respuesta.",
  ],
  bueno: [
    "¡Muy bien hecho! Estás avanzando muchísimo. ¡Sigue así!",
    "¡Gran trabajo! Tu base es sólida y cada vez se nota más.",
    "¡Muy buen resultado! Con esta constancia vas a llegar lejos.",
  ],
  intermedio: [
    "¡Buen trabajo! Ya tienes una buena base. Con un poco más de práctica puedes mejorar todavía más.",
    "¡Vas por buen camino! Repasa lo que se te escapó y volverás con más fuerza.",
  ],
  bajo: [
    "¡No te desanimes! Equivocarse también forma parte de aprender. Vamos a reforzar lo que todavía cuesta.",
    "¡Ánimo! Este resultado solo marca por dónde seguir. Repasemos juntos lo que falta.",
  ],
  reintento: [
    "¡Vamos otra vez! Cada intento te acerca un poquito más a dominar este tema.",
    "¡Otra vuelta! Lo que ya repasaste trabaja a tu favor en este nuevo intento.",
  ],
};

function indiceEstable(semilla: string, largo: number): number {
  let h = 0;
  for (let i = 0; i < semilla.length; i += 1) h = (h * 31 + semilla.charCodeAt(i)) >>> 0;
  return h % largo;
}

export function elegirMensaje(clave: NivelResultado | "reintento", semilla: string): string {
  const lista = MENSAJES[clave];
  return lista[indiceEstable(semilla, lista.length)];
}

const PRESENCIA_NIVEL: Record<NivelResultado, { estado: EstadoBuddy; modo: "tarjeta" | "burbuja"; particulas: "intensas" | "suaves" | "ninguna"; duracionMs: number }> = {
  excelente: { estado: "celebrating", modo: "tarjeta", particulas: "intensas", duracionMs: 9000 },
  bueno: { estado: "happy", modo: "burbuja", particulas: "ninguna", duracionMs: 8000 },
  intermedio: { estado: "happy", modo: "burbuja", particulas: "ninguna", duracionMs: 8000 },
  bajo: { estado: "concerned", modo: "burbuja", particulas: "ninguna", duracionMs: 9000 },
};

export interface DatosResultado {
  idEvento: string;
  porcentaje: number;
  correctas: number;
  total: number;
  reintento?: boolean;
  primera?: boolean;
  tituloPrimera?: string;
  mejora?: number | null;
  rutaRepaso?: string;
  accionVer?: string;
  nivelConocimiento?: { anterior: number; nuevo: number };
}

export function felicitacionResultado(datos: DatosResultado): EventoBuddy {
  const nivel = nivelDePorcentaje(datos.porcentaje);
  const presencia = PRESENCIA_NIVEL[nivel];
  const usaReintento = datos.reintento === true && nivel === "bajo";
  const detalles = [`${datos.porcentaje} % de aciertos`, `${datos.correctas} de ${datos.total} correctas`];
  if (datos.nivelConocimiento) detalles.push(`Nivel de conocimiento: ${datos.nivelConocimiento.anterior} % → ${datos.nivelConocimiento.nuevo} %`);
  if (datos.mejora && datos.mejora >= 5) detalles.push(`+${datos.mejora} puntos frente a tus rondas anteriores`);
  const accion = nivel === "bajo" && datos.rutaRepaso ? { etiqueta: "Repasar el resumen", ruta: datos.rutaRepaso } : datos.accionVer ? { etiqueta: datos.accionVer } : undefined;
  return crearEvento({
    id: datos.idEvento,
    modo: presencia.modo,
    prioridad: PRIORIDAD.resultado,
    estado: presencia.estado,
    titulo: datos.primera ? datos.tituloPrimera : undefined,
    mensaje: elegirMensaje(usaReintento ? "reintento" : nivel, datos.idEvento),
    detalles,
    duracionMs: presencia.duracionMs,
    particulas: presencia.particulas,
    accion,
    enfriamientoMs: Infinity,
  });
}

export function celebracionDominioCompleto(idTema: string, tituloTema: string): EventoBuddy {
  return crearEvento({
    id: `dominio-100:${idTema}`,
    modo: "tarjeta",
    prioridad: PRIORIDAD.celebracion,
    estado: "success",
    titulo: tituloTema,
    mensaje: "¡LO LOGRASTE! ¡Has alcanzado el 100 % de dominio! Este tema ya es tuyo.",
    detalles: ["100 % de dominio"],
    duracionMs: 10000,
    particulas: "intensas",
    enfriamientoMs: Infinity,
  });
}

export function celebracionTemaCompletado(idTema: string, tituloTema: string, dominio: number): EventoBuddy {
  return crearEvento({
    id: `tema-dominado:${idTema}`,
    modo: "tarjeta",
    prioridad: PRIORIDAD.celebracion,
    estado: "congratulating",
    titulo: tituloTema,
    mensaje: "¡Un tema más dominado! Estás construyendo grandes conocimientos.",
    detalles: [`${dominio} % de dominio`],
    duracionMs: 8000,
    particulas: "suaves",
    enfriamientoMs: Infinity,
  });
}

export type ClaveHito = "primer-resumen" | "primer-mapa";

const HITOS: Record<ClaveHito, { mensaje: string; titulo: string }> = {
  "primer-resumen": { titulo: "¡Tu primer resumen!", mensaje: "Ya tienes tu material convertido en conocimiento. Ahora practica con preguntas para fijarlo." },
  "primer-mapa": { titulo: "¡Tu primer mapa conceptual!", mensaje: "Explora sus conceptos: al pulsar uno verás su definición y sus relaciones." },
};

export function celebracionHito(clave: ClaveHito): EventoBuddy {
  const hito = HITOS[clave];
  return crearEvento({
    id: `hito:${clave}`,
    prioridad: PRIORIDAD.resultado,
    estado: "happy",
    titulo: hito.titulo,
    mensaje: hito.mensaje,
    duracionMs: 7000,
    enfriamientoMs: Infinity,
  });
}

export function cierreGuia(idGuia: string, titulo: string): EventoBuddy {
  return crearEvento({
    id: `guia-lista:${idGuia}:${Date.now()}`,
    prioridad: PRIORIDAD.tutorial,
    estado: "success",
    titulo: "¡Recorrido completado!",
    mensaje: `Ya conoces «${titulo}». Puedes repetirlo cuando quieras desde el botón de ayuda.`,
    duracionMs: 5500,
  });
}
