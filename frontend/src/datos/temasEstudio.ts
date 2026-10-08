import type { TemaEstudio } from "../tipos";

export const temasEstudio: TemaEstudio[] = [
  {
    id: "1",
    titulo: "Sistema circulatorio humano",
    categoria: "Biología",
    descripcion: "Anatomía y funcionamiento del corazón, la sangre y los vasos sanguíneos.",
    dominio: 78,
    nivelDominio: "buen-dominio",
    ultimoEstudioEn: "Hoy",
    creadoEn: "2026-08-12",
    preguntasRespondidas: 42,
    pruebasCompletadas: 2,
    tipoFuente: "pdf",
    nombreFuente: "sistema-circulatorio-apuntes.pdf",
  },
  {
    id: "2",
    titulo: "Revolución Francesa",
    categoria: "Historia",
    descripcion: "Causas, etapas y consecuencias del proceso revolucionario de 1789.",
    dominio: 64,
    nivelDominio: "en-progreso",
    ultimoEstudioEn: "Ayer",
    creadoEn: "2026-08-05",
    preguntasRespondidas: 31,
    pruebasCompletadas: 1,
    tipoFuente: "texto",
  },
  {
    id: "3",
    titulo: "Programación orientada a objetos",
    categoria: "Informática",
    descripcion: "Clases, objetos, herencia, polimorfismo y encapsulamiento.",
    dominio: 91,
    nivelDominio: "alto-dominio",
    ultimoEstudioEn: "Hace 3 días",
    creadoEn: "2026-07-20",
    preguntasRespondidas: 67,
    pruebasCompletadas: 4,
    tipoFuente: "pdf",
    nombreFuente: "poo-fundamentos.pdf",
  },
  {
    id: "4",
    titulo: "Cálculo diferencial",
    categoria: "Matemáticas",
    descripcion: "Límites, derivadas y sus aplicaciones al estudio de funciones.",
    dominio: 45,
    nivelDominio: "en-progreso",
    ultimoEstudioEn: "Hace 5 días",
    creadoEn: "2026-07-15",
    preguntasRespondidas: 18,
    pruebasCompletadas: 1,
    tipoFuente: "texto",
  },
  {
    id: "5",
    titulo: "Sistema nervioso",
    categoria: "Biología",
    descripcion: "Organización del sistema nervioso central y periférico.",
    dominio: 22,
    nivelDominio: "inicial",
    ultimoEstudioEn: "Hace 1 semana",
    creadoEn: "2026-07-02",
    preguntasRespondidas: 9,
    pruebasCompletadas: 0,
    tipoFuente: "pdf",
    nombreFuente: "neurociencia-basica.pdf",
  },
];

export function obtenerNivelDominio(dominio: number): TemaEstudio["nivelDominio"] {
  if (dominio <= 25) return "inicial";
  if (dominio <= 50) return "en-progreso";
  if (dominio <= 75) return "buen-dominio";
  return "alto-dominio";
}

export const etiquetasNivelDominio: Record<TemaEstudio["nivelDominio"], string> = {
  inicial: "Nivel inicial",
  "en-progreso": "En progreso",
  "buen-dominio": "Buen dominio",
  "alto-dominio": "Alto dominio",
};

export const textosNivelDominio: Record<TemaEstudio["nivelDominio"], string> = {
  inicial: "Estás dando tus primeros pasos con este tema. Sigue explorando el resumen esencial.",
  "en-progreso": "Vas avanzando. Refuerza los conceptos que más se te resisten con más preguntas.",
  "buen-dominio": "Has demostrado un buen dominio de los conceptos principales.",
  "alto-dominio": "Dominas este tema con solidez. Considera pasar a un examen más exigente.",
};

export type EstadoTema = "pendiente" | "en-progreso" | "completado";

export function obtenerEstadoTema(tema: TemaEstudio): EstadoTema {
  if (tema.preguntasRespondidas === 0 && tema.pruebasCompletadas === 0) return "pendiente";
  if (tema.dominio >= 95) return "completado";
  return "en-progreso";
}

export const etiquetasEstadoTema: Record<EstadoTema, string> = {
  pendiente: "Pendiente",
  "en-progreso": "En progreso",
  completado: "Completado",
};
