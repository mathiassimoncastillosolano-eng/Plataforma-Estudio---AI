// ---------------------------------------------------------------------------
// Tipos del módulo Pruebas (contrato con POST /api/pruebas/* del backend).
// El backend usa snake_case; `servicios/servicioPruebas.ts` lo convierte a estos tipos.
// ---------------------------------------------------------------------------

export type NivelPregunta = "facil" | "media" | "dificil";
export type DificultadElegida = NivelPregunta | "personalizada";

export interface DistribucionNiveles {
  facil: number;
  media: number;
  dificil: number;
}

/** Lo que el estudiante decide antes de empezar. */
export interface AjustesPrueba {
  cantidad: number;
  dificultad: DificultadElegida;
  /** Solo se usa con dificultad «personalizada». */
  personalizada: DistribucionNiveles;
  /** Minutos. null = sin límite. */
  limiteMinutos: number | null;
  modoAsistido: boolean;
  pausaBlindada: boolean;
  cronometroVisible: boolean;
}

export type EstadoPrueba = "lista" | "en_curso" | "pausada" | "finalizada";

/** Término del enunciado con su definición (posiciones dentro de `enunciado`). */
export interface TerminoAyuda {
  inicio: number;
  fin: number;
  definicion: string;
}

export interface OpcionExamen {
  id: string;
  texto: string;
}

/** Pregunta tal como se muestra durante la prueba: sin clave, sin explicación. */
export interface PreguntaExamen {
  id: string;
  enunciado: string;
  opciones: OpcionExamen[];
  dificultad: NivelPregunta;
  puntos: number;
  terminos: TerminoAyuda[];
}

export type MapaRespuestas = Record<string, string>;
export type MapaDescartes = Record<string, string[]>;

export interface PruebaPublica {
  id: string;
  idTema: string;
  tituloTema: string;
  estado: EstadoPrueba;
  total: number;
  dificultad: DificultadElegida;
  distribucion: DistribucionNiveles;
  limiteSegundos: number | null;
  puntajeMaximo: number;
  modoAsistido: boolean;
  pausaBlindada: boolean;
  cronometroVisible: boolean;
  modelo: string;
  respuestas: MapaRespuestas;
  descartes: MapaDescartes;
  /** null mientras la prueba está lista, pausada o vencida: el servidor no las entrega. */
  preguntas: PreguntaExamen[] | null;
}

export interface TiempoPrueba {
  estado: EstadoPrueba;
  limiteSegundos: number | null;
  /** Segundos restantes según el servidor en el momento de la respuesta (null = sin límite). */
  restanteSegundos: number | null;
  transcurridoSegundos: number;
  vencida: boolean;
}

export interface RespuestaPrueba {
  /** Estado de la prueba, cifrado: se devuelve tal cual en la siguiente llamada. */
  sello: string;
  prueba: PruebaPublica;
  tiempo: TiempoPrueba;
}

export interface RendimientoNivel {
  total: number;
  correctas: number;
  omitidas: number;
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
  totalPreguntas: number;
  correctas: number;
  incorrectas: number;
  omitidas: number;
  puntaje: number;
  puntajeMaximo: number;
  porcentaje: number;
  duracionSegundos: number;
  tiempoAgotado: boolean;
  porDificultad: Record<NivelPregunta, RendimientoNivel>;
  conceptosDebiles: ConceptoDebil[];
  configuracion: {
    cantidadPreguntas: number;
    dificultad: DificultadElegida;
    distribucion: DistribucionNiveles;
    limiteSegundos: number | null;
    modoAsistido: boolean;
    pausaBlindada: boolean;
  };
}

export type EstadoRespuesta = "correcta" | "incorrecta" | "omitida";

export interface ItemRevision {
  id: string;
  enunciado: string;
  dificultad: NivelPregunta;
  puntos: number;
  opciones: OpcionExamen[];
  idSeleccionada: string | null;
  idCorrecta: string;
  idsDescartadas: string[];
  estado: EstadoRespuesta;
  explicacion: string;
  fundamento: string;
  conceptos: string[];
}

export interface ResultadoCompleto {
  resultado: ResultadoPrueba;
  revision: ItemRevision[];
}
