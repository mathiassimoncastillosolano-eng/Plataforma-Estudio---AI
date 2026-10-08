// ---------------------------------------------------------------------------
// Tipos centrales de la plataforma.
// Las secciones mock (temas, preguntas, pruebas, mapas) describen la forma
// esperada de futuros recursos; la sección "IA · Resúmenes" refleja el
// contrato real con el backend FastAPI.
// ---------------------------------------------------------------------------

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
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

export type DificultadPrueba = DificultadPregunta;
export type LimiteTiempoPrueba = number | null; // minutos; null = sin límite

/** Configuración elegida por el usuario antes de iniciar una prueba. */
export interface ConfiguracionPrueba {
  idTema: string;
  cantidadPreguntas: number;
  dificultad: DificultadPrueba;
  /** Duración en minutos. null = sin límite de tiempo. */
  limiteTiempoMinutos: LimiteTiempoPrueba;
}

export type ConteosDificultad = Record<DificultadPregunta, number>;

export interface IntentoPrueba {
  id: string;
  idTema: string;
  iniciadoEn: string;
  finalizadoEn?: string;
  respuestas: IntentoPregunta[];
  idsPreguntas: string[];
  duracionSegundos?: number;
}

export interface RendimientoDificultad {
  total: number;
  correcta: number;
  /** puntos obtenidos / puntos máximos de este nivel */
  obtenidos: number;
  max: number;
  porcentaje: number;
}

export interface ConceptoDebil {
  termino: string;
  falladas: number;
  total: number;
}

export interface ResultadoPrueba {
  idPrueba: string;
  idTema: string;
  configuracion: ConfiguracionPrueba;
  cantidadCorrectas: number;
  cantidadIncorrectas: number;
  cantidadOmitidas: number;
  totalPreguntas: number;
  /** Puntaje ponderado (fácil 0.5 · media 1 · difícil 2) */
  puntaje: number;
  puntajeMaximo: number;
  /** Porcentaje ponderado = score / maxScore */
  porcentajePuntaje: number;
  duracionSegundos: number;
  etiquetaDuracion: string;
  tiempoAgotado: boolean;
  porDificultad: Record<DificultadPregunta, RendimientoDificultad>;
  conceptosDebiles: ConceptoDebil[];
  idsPreguntasRepaso: string[];
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

export interface SeccionResumen {
  titulo: string;
  contenido: string;
  puntos: string[];
}

export interface ResumenEsencial {
  ideaCentral: string;
  ideasClave: string[];
  conceptosClave: ConceptoClaveResumen[];
  minutosLectura: number;
}

export interface ResumenGeneral {
  titulo: string;
  introduccion: string;
  secciones: SeccionResumen[];
  minutosLectura: number;
}

export interface MetadatosResumen {
  /** "ia" = generado por el backend con IA real · "ejemplo" = resumen demo incluido en el frontend. */
  origen: "ia" | "ejemplo";
  modelo: string | null;
  generadoEn: string;
  caracteresEntrada: number;
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
