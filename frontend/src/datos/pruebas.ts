export interface PruebaPasada {
  id: string;
  idTema: string;
  tituloTema: string;
  fecha: string;
  porcentajePuntaje: number;
  cantidadCorrectas: number;
  totalPreguntas: number;
}

export const pruebasPasadas: PruebaPasada[] = [
  { id: "ex-1", idTema: "1", tituloTema: "Sistema circulatorio humano", fecha: "18 sep 2026", porcentajePuntaje: 82, cantidadCorrectas: 7, totalPreguntas: 8 },
  { id: "ex-2", idTema: "3", tituloTema: "Programación orientada a objetos", fecha: "16 sep 2026", porcentajePuntaje: 100, cantidadCorrectas: 6, totalPreguntas: 6 },
  { id: "ex-3", idTema: "2", tituloTema: "Revolución Francesa", fecha: "12 sep 2026", porcentajePuntaje: 67, cantidadCorrectas: 4, totalPreguntas: 6 },
  { id: "ex-4", idTema: "1", tituloTema: "Sistema circulatorio humano", fecha: "5 sep 2026", porcentajePuntaje: 75, cantidadCorrectas: 6, totalPreguntas: 8 },
  { id: "ex-5", idTema: "4", tituloTema: "Cálculo diferencial", fecha: "1 sep 2026", porcentajePuntaje: 60, cantidadCorrectas: 3, totalPreguntas: 5 },
];
