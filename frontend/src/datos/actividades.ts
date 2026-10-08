export type TipoActividad = "resumen" | "preguntas" | "prueba" | "mapaMental" | "tema-creado";

export interface ElementoActividad {
  id: string;
  tipo: TipoActividad;
  tituloTema: string;
  descripcion: string;
  tiempo: string;
}

export const actividadReciente: ElementoActividad[] = [
  {
    id: "a1",
    tipo: "prueba",
    tituloTema: "Sistema circulatorio humano",
    descripcion: "Completaste una prueba con 82% de aciertos.",
    tiempo: "Hoy, 10:24",
  },
  {
    id: "a2",
    tipo: "preguntas",
    tituloTema: "Programación orientada a objetos",
    descripcion: "Practicaste 6 preguntas nuevas.",
    tiempo: "Ayer, 19:02",
  },
  {
    id: "a3",
    tipo: "resumen",
    tituloTema: "Revolución Francesa",
    descripcion: "Revisaste el resumen completo del tema.",
    tiempo: "Hace 2 días",
  },
  {
    id: "a4",
    tipo: "mapaMental",
    tituloTema: "Sistema circulatorio humano",
    descripcion: "Editaste el mapa conceptual del tema.",
    tiempo: "Hace 3 días",
  },
  {
    id: "a5",
    tipo: "tema-creado",
    tituloTema: "Sistema nervioso",
    descripcion: "Creaste un nuevo tema de estudio.",
    tiempo: "Hace 1 semana",
  },
];
