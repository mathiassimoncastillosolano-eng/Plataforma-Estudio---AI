// ---------------------------------------------------------------------------
// Tipos centrales de la plataforma.
// Las secciones mock (temas, preguntas, pruebas, mapas) describen la forma
// esperada de futuros recursos; la sección "IA · Resúmenes" refleja el
// contrato real con el backend FastAPI.
// ---------------------------------------------------------------------------

/** Perfil de la cuenta de Google autenticada. Vive solo en memoria mientras dura la sesión. */
export interface Usuario {
  /** Identificador estable de Google (`sub`). */
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  /** Foto de perfil de Google (opcional). */
  foto?: string;
  /** Momento (ISO) en que se inició la sesión actual. */
  creadoEn: string;
}

export type NivelDominio = "inicial" | "en-progreso" | "buen-dominio" | "alto-dominio";

export interface TemaEstudio {
  id: string;
  titulo: string;
  categoria: string;
  descripcion?: string;
  dominio: number; // 0-100, indicador estimado de dominio
  nivelDominio: NivelDominio;
  ultimoEstudioEn: string; // texto amigable ("Hoy", "Ayer", "Hace 3 días")
  creadoEn: string;
  preguntasRespondidas: number;
  pruebasCompletadas: number;
  tipoFuente: "pdf" | "texto";
  nombreFuente?: string;
}

export interface BorradorFuente {
  tituloTema: string;
  categoria: string;
  tipoFuente: "pdf" | "texto";
  nombreArchivo?: string;
  etiquetaTamanoArchivo?: string;
  textoBruto?: string;
  /** PDF original: se conserva en la sesión y se envía tal cual a la IA al generar el resumen. */
  archivo?: File;
}

export interface SeccionResumenTema {
  subtitulo: string;
  cuerpo: string;
  puntos?: string[];
}

export interface ConceptoClave {
  orden: number;
  termino: string;
  definicion: string;
}

export interface ResumenTema {
  idTema: string;
  esencial: {
    introduccion: string;
    conceptosClave: ConceptoClave[];
    relaciones: string[];
  };
  completo: {
    secciones: SeccionResumenTema[];
  };
}

export type DificultadPregunta = "facil" | "media" | "dificil";
export type TipoPregunta = "opcion-multiple" | "verdadero-falso" | "abierta";

export interface OpcionPregunta {
  id: string;
  etiqueta: string;
}

export interface PreguntaEstudio {
  id: string;
  idTema: string;
  enunciado: string;
  tipo: TipoPregunta;
  dificultad: DificultadPregunta;
  opciones?: OpcionPregunta[];
  idOpcionCorrecta?: string;
  textoRespuestaCorrecta?: string;
  explicacion: string;
}

export interface IntentoPregunta {
  idPregunta: string;
  idOpcionSeleccionada?: string;
  textoRespuestaAbierta?: string;
  esCorrecta: boolean;
}

export interface DatosNodoMapaMental {
  id: string;
  etiqueta: string;
  detalle?: string;
  nivel: 0 | 1 | 2;
  idPadre?: string | null;
  x: number;
  y: number;
}

export interface DatosAristaMapaMental {
  id: string;
  fuente: string;
  objetivo: string;
  /** Frase de enlace (solo mapas generados con IA): se lee «fuente —etiqueta→ objetivo». */
  etiqueta?: string;
}

export interface MapaMental {
  idTema: string;
  nodos: DatosNodoMapaMental[];
  aristas: DatosAristaMapaMental[];
}

export interface InstantaneaProgreso {
  fecha: string; // etiqueta corta, ej. "Ene 12"
  promedioDominio: number;
}

export interface EstadisticasPanel {
  temasEstudiados: number;
  horasEstudio: number;
  preguntasRespondidas: number;
  dominioPromedio: number;
}

export interface EstadoAsincrono<T> {
  estado: "inactivo" | "cargando" | "exito" | "error";
  datos?: T;
  error?: string;
}

// ---------------------------------------------------------------------------
// IA · Resúmenes (contrato de POST /api/resumenes del backend FastAPI)
// ---------------------------------------------------------------------------

/** Vista que se muestra: el backend devuelve ambos resúmenes en una sola llamada. */
export type TipoResumen = "esencial" | "general";

export interface ConceptoClaveResumen {
  termino: string;
  definicion: string;
}

export interface TablaResumenGenerado {
  titulo: string;
  encabezados: string[];
  filas: string[][];
}

export interface SeccionResumen {
  titulo: string;
  contenido: string;
  puntos: string[];
  /** Tabla opcional que la IA extrae o sintetiza del material. */
  tabla?: TablaResumenGenerado | null;
}

export interface FormulaReglaResumen {
  nombre: string;
  expresion: string;
  explicacion: string;
}

export interface ResumenEsencial {
  ideaCentral: string;
  ideasClave: string[];
  conceptosClave: ConceptoClaveResumen[];
  minutosLectura: number;
  formulasYReglas?: FormulaReglaResumen[];
  /** Elementos del material que la IA no pudo interpretar con suficiente confianza. */
  notasDeFidelidad?: string[];
}

export interface ResumenGeneral {
  titulo: string;
  introduccion: string;
  secciones: SeccionResumen[];
  minutosLectura: number;
  notasDeFidelidad?: string[];
}

export interface MetadatosResumen {
  /** "ia" = generado por el backend con IA real · "ejemplo" = resumen demo incluido en el frontend. */
  origen: "ia" | "ejemplo";
  modelo: string | null;
  generadoEn: string;
  caracteresEntrada: number;
  /** Cómo llegó el material a la IA: texto escrito/pegado o PDF original. */
  entrada?: "texto" | "pdf";
  paginas?: number | null;
}

export interface ResumenesGenerados {
  esencial: ResumenEsencial;
  general: ResumenGeneral;
  metadatos: MetadatosResumen;
}

/** Respuesta de POST /api/contenido/extraer-pdf. */
export interface ContenidoPdf {
  texto: string;
  paginas: number;
  caracteres: number;
}
