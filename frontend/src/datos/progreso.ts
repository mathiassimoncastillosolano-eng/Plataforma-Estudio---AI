import type { EstadisticasPanel, InstantaneaProgreso } from "../tipos";

export const estadisticasPanel: EstadisticasPanel = {
  temasEstudiados: 12,
  horasEstudio: 18.5,
  preguntasRespondidas: 247,
  dominioPromedio: 78,
};

export const evolucionDominio: InstantaneaProgreso[] = [
  { fecha: "Ago 1", promedioDominio: 52 },
  { fecha: "Ago 8", promedioDominio: 58 },
  { fecha: "Ago 15", promedioDominio: 61 },
  { fecha: "Ago 22", promedioDominio: 65 },
  { fecha: "Ago 29", promedioDominio: 69 },
  { fecha: "Sep 5", promedioDominio: 71 },
  { fecha: "Sep 12", promedioDominio: 74 },
  { fecha: "Sep 19", promedioDominio: 78 },
];

export const preguntasPorSemana = [
  { semana: "Sem 1", respondida: 24 },
  { semana: "Sem 2", respondida: 31 },
  { semana: "Sem 3", respondida: 18 },
  { semana: "Sem 4", respondida: 40 },
  { semana: "Sem 5", respondida: 29 },
  { semana: "Sem 6", respondida: 35 },
];

export const dominioPorCategoria = [
  { categoria: "Biología", dominio: 65 },
  { categoria: "Historia", dominio: 64 },
  { categoria: "Informática", dominio: 91 },
  { categoria: "Matemáticas", dominio: 45 },
];
