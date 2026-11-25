import { BookOpen, ClipboardCheck, LayoutDashboard, Lightbulb, ListChecks, MessageCircleQuestion, Network, PenLine, Plus, Sparkles, TrendingUp, FileText, type LucideIcon } from "lucide-react";
import type { Expresion } from "../tipos";

export type RutaPaso = string | { tema: string };

export interface PasoGuia {
  ruta: RutaPaso;
  objetivos: string[];
  titulo: string;
  mensaje: string;
  expresion?: Expresion;
  opcional?: boolean;
  alternativa?: string;
}

export type CategoriaGuia = "Primeros pasos" | "Aprendizaje" | "Herramientas";

export interface Guia {
  id: string;
  categoria: CategoriaGuia;
  titulo: string;
  descripcion: string;
  icono: LucideIcon;
  tono: "azul" | "naranja" | "verde" | "morado";
  requiereTema: boolean;
  pasos: PasoGuia[];
}

export const CATEGORIAS_GUIA: CategoriaGuia[] = ["Primeros pasos", "Aprendizaje", "Herramientas"];

export const GUIAS: Guia[] = [
  {
    id: "conoce-cursa",
    categoria: "Primeros pasos",
    titulo: "Conoce Cursa AI",
    descripcion: "Un paseo rápido por lo esencial.",
    icono: Sparkles,
    tono: "morado",
    requiereTema: false,
    pasos: [
      { ruta: "/panel", objetivos: ["nav-principal"], titulo: "Tu menú", mensaje: "Salta entre tu panel, tus estudios y tu progreso." },
      { ruta: "/panel", objetivos: ["nuevo-tema"], titulo: "Todo empieza aquí", mensaje: "Sube un PDF o pega tu texto y la IA prepara tu material." },
      { ruta: "/panel", objetivos: ["buscador"], titulo: "Encuentra tus temas", mensaje: "Escribe y abre cualquier tema al instante. Atajo: la tecla «/».", opcional: true },
      { ruta: "/panel", objetivos: ["menu-usuario"], titulo: "Tu cuenta", mensaje: "Consulta tu perfil, tu configuración o cierra sesión.", opcional: true },
      { ruta: "/panel", objetivos: ["ayuda"], titulo: "Aquí estaré", mensaje: "Cuando dudes, abre la ayuda y te lo muestro paso a paso." },
    ],
  },
  {
    id: "crear-tema",
    categoria: "Primeros pasos",
    titulo: "Cómo crear mi primer tema",
    descripcion: "Del botón al documento, sin perderte.",
    icono: Plus,
    tono: "azul",
    requiereTema: false,
    pasos: [
      { ruta: "/temas", objetivos: ["crear-tema"], titulo: "Crea tu tema", mensaje: "¡Empieza aquí! Pulsa este botón para crear tu tema.", expresion: "entusiasmo" },
      { ruta: "/estudio/nuevo", objetivos: ["tema-titulo"], titulo: "Ponle nombre", mensaje: "Escribe un nombre claro para encontrarlo fácilmente." },
      { ruta: "/estudio/nuevo", objetivos: ["tema-categoria"], titulo: "Elige una categoría", mensaje: "Ayuda a mantener tus estudios organizados." },
      { ruta: "/estudio/nuevo", objetivos: ["tema-continuar"], titulo: "Continúa", mensaje: "Después elegirás entre subir un PDF o escribir tu contenido." },
    ],
  },
  {
    id: "organizar-estudios",
    categoria: "Primeros pasos",
    titulo: "Cómo organizar mis estudios",
    descripcion: "Filtra, busca y retoma tus temas.",
    icono: LayoutDashboard,
    tono: "verde",
    requiereTema: false,
    pasos: [
      { ruta: "/temas", objetivos: ["filtros-estado"], titulo: "Filtra por estado", mensaje: "Separa lo que ya dominas de lo que aún falta." },
      { ruta: "/temas", objetivos: ["busqueda-temas"], titulo: "Busca al instante", mensaje: "Encuentra un tema por su nombre o su categoría." },
      {
        ruta: "/temas",
        objetivos: ["lista-temas"],
        titulo: "Tus temas",
        mensaje: "Cada tarjeta muestra tu dominio. Pulsa una para seguir estudiando.",
        alternativa: "Cuando crees temas, aparecerán aquí con su nivel de dominio.",
      },
    ],
  },
  {
    id: "generar-resumen",
    categoria: "Aprendizaje",
    titulo: "Cómo generar resúmenes",
    descripcion: "Convierte tu material en ideas claras.",
    icono: FileText,
    tono: "azul",
    requiereTema: true,
    pasos: [
      { ruta: { tema: "" }, objetivos: ["modulos-tema"], titulo: "Cuatro formas de estudiar", mensaje: "El resumen es la puerta de entrada. Pulsa el primero." },
      {
        ruta: { tema: "resumen" },
        objetivos: ["resumen-generar", "resumen-nuevo"],
        titulo: "Genera tu resumen",
        mensaje: "Transforma tu material en información fácil de estudiar.",
        expresion: "entusiasmo",
        alternativa: "Este tema ya tiene resumen. Usa «Nuevo resumen» cuando quieras generar otro.",
      },
    ],
  },
  {
    id: "diferencias-resumen",
    categoria: "Aprendizaje",
    titulo: "Resumen esencial y general",
    descripcion: "Cuándo usar cada uno.",
    icono: PenLine,
    tono: "morado",
    requiereTema: true,
    pasos: [
      {
        ruta: { tema: "resumen" },
        objetivos: ["resumen-tipos"],
        titulo: "Dos vistas, un solo resumen",
        mensaje: "Esencial: lo imprescindible. General: el desarrollo completo por secciones.",
        alternativa: "Al generar un resumen verás dos pestañas: Esencial para repasar rápido y General para profundizar.",
      },
      {
        ruta: { tema: "resumen" },
        objetivos: ["resumen-indice"],
        titulo: "Salta a lo que buscas",
        mensaje: "El índice te lleva directo a cada sección.",
        opcional: true,
      },
    ],
  },
  {
    id: "estudiar-tema",
    categoria: "Aprendizaje",
    titulo: "Cómo estudiar un tema",
    descripcion: "Tu ruta de estudio, paso a paso.",
    icono: BookOpen,
    tono: "verde",
    requiereTema: true,
    pasos: [
      { ruta: { tema: "" }, objetivos: ["progreso-tema"], titulo: "Tu progreso", mensaje: "Aquí ves tu dominio real del tema." },
      { ruta: { tema: "" }, objetivos: ["modulos-tema"], titulo: "Sigue este orden", mensaje: "Resumen, preguntas, prueba y mapa. Empieza por donde lo necesites." },
    ],
  },
  {
    id: "practica-preguntas",
    categoria: "Aprendizaje",
    titulo: "Cómo usar las preguntas de práctica",
    descripcion: "Practica y mira tu avance.",
    icono: MessageCircleQuestion,
    tono: "naranja",
    requiereTema: true,
    pasos: [
      { ruta: { tema: "preguntas" }, objetivos: ["preguntas-filtros"], titulo: "Elige qué practicar", mensaje: "Filtra por dificultad o por las que quedaron por repasar." },
      { ruta: { tema: "preguntas" }, objetivos: ["preguntas-practicar"], titulo: "Empieza una ronda", mensaje: "Responde una a una con retroalimentación inmediata.", expresion: "motivacion" },
    ],
  },
  {
    id: "realizar-prueba",
    categoria: "Aprendizaje",
    titulo: "Cómo realizar una prueba",
    descripcion: "Configúrala a tu medida.",
    icono: ListChecks,
    tono: "verde",
    requiereTema: true,
    pasos: [
      {
        ruta: { tema: "prueba" },
        objetivos: ["prueba-cantidad"],
        titulo: "Cantidad de preguntas",
        mensaje: "Elige cuántas quieres responder.",
        alternativa: "Las pruebas se generan desde el resumen general. Crea el resumen y vuelve aquí.",
      },
      { ruta: { tema: "prueba" }, objetivos: ["prueba-dificultad"], titulo: "Dificultad", mensaje: "Fácil para empezar, difícil para exigirte más.", opcional: true },
      { ruta: { tema: "prueba" }, objetivos: ["prueba-tiempo"], titulo: "Tiempo", mensaje: "Con o sin límite: tú decides el ritmo.", opcional: true },
      { ruta: { tema: "prueba" }, objetivos: ["prueba-iniciar"], titulo: "Genera tu prueba", mensaje: "Cuando estés listo, pulsa aquí y a demostrar lo aprendido.", expresion: "motivacion", opcional: true },
    ],
  },
  {
    id: "interpretar-resultados",
    categoria: "Aprendizaje",
    titulo: "Cómo interpretar mis resultados",
    descripcion: "Entiende tu puntaje y qué repasar.",
    icono: ClipboardCheck,
    tono: "morado",
    requiereTema: true,
    pasos: [
      {
        ruta: { tema: "resultados" },
        objetivos: ["resultado-puntaje"],
        titulo: "Tu puntaje",
        mensaje: "Aciertos, puntos y tiempo de tu última prueba.",
        alternativa: "Cuando completes una prueba verás aquí tu puntaje, tus aciertos y el tiempo utilizado.",
      },
      { ruta: { tema: "resultados" }, objetivos: ["resultado-dificultad"], titulo: "Por dificultad", mensaje: "Descubre en qué nivel te cuesta más.", opcional: true },
      { ruta: { tema: "resultados" }, objetivos: ["resultado-siguientes"], titulo: "Qué estudiar ahora", mensaje: "Conceptos a reforzar y recomendaciones concretas.", opcional: true },
      { ruta: { tema: "resultados" }, objetivos: ["resultado-revision"], titulo: "Revisa cada respuesta", mensaje: "Con la explicación de por qué era correcta.", opcional: true },
    ],
  },
  {
    id: "mapas-conceptuales",
    categoria: "Herramientas",
    titulo: "Cómo generar mapas conceptuales",
    descripcion: "Visualiza cómo se conectan las ideas.",
    icono: Network,
    tono: "morado",
    requiereTema: true,
    pasos: [
      {
        ruta: { tema: "mapa-mental" },
        objetivos: ["mapa-generar"],
        titulo: "Genera tu mapa",
        mensaje: "La IA identifica los conceptos y cómo se relacionan.",
        expresion: "entusiasmo",
        alternativa: "Este tema ya tiene un mapa. Pulsa un concepto para ver su definición y arrastra para reorganizarlos.",
      },
    ],
  },
  {
    id: "consultar-progreso",
    categoria: "Herramientas",
    titulo: "Cómo consultar mi progreso",
    descripcion: "Tu evolución, de un vistazo.",
    icono: TrendingUp,
    tono: "azul",
    requiereTema: false,
    pasos: [
      {
        ruta: "/progreso",
        objetivos: ["progreso-nivel"],
        titulo: "Tu nivel actual",
        mensaje: "Resume tu dominio promedio en todos tus temas.",
        alternativa: "Con tu primer tema verás aquí tu nivel y tu evolución.",
      },
      { ruta: "/progreso", objetivos: ["progreso-temas"], titulo: "Dominio por tema", mensaje: "Compara cuáles dominas y cuáles aún necesitan repaso.", opcional: true },
    ],
  },
  {
    id: "entender-dominio",
    categoria: "Herramientas",
    titulo: "Cómo entender mi dominio",
    descripcion: "Qué significa cada nivel.",
    icono: Lightbulb,
    tono: "naranja",
    requiereTema: false,
    pasos: [
      {
        ruta: "/progreso",
        objetivos: ["ruta-niveles"],
        titulo: "Cuatro niveles",
        mensaje: "De inicial a alto dominio. El marcador muestra dónde estás.",
        alternativa: "Con tu primer tema verás aquí los cuatro niveles de dominio y dónde estás.",
      },
      { ruta: "/progreso", objetivos: ["progreso-temas"], titulo: "Se calcula por práctica", mensaje: "Tu dominio sube cuando respondes bien las preguntas de práctica.", opcional: true },
    ],
  },
];

export function buscarGuia(id: string): Guia | undefined {
  return GUIAS.find((g) => g.id === id);
}

export function normalizarRuta(ruta: string): string {
  const limpia = ruta.split("?")[0].split("#")[0];
  return limpia.length > 1 && limpia.endsWith("/") ? limpia.slice(0, -1) : limpia;
}

export function resolverRuta(ruta: RutaPaso, temaId: string | null): string | null {
  if (typeof ruta === "string") return ruta;
  if (!temaId) return null;
  return ruta.tema ? `/estudio/${temaId}/${ruta.tema}` : `/estudio/${temaId}`;
}
