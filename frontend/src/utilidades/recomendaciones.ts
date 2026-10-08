import type { ResultadoPrueba, DificultadPregunta } from "../tipos";
import { DIFICULTADES } from "./constructorPruebas";

export interface Recomendacion {
  tono: "good" | "warn" | "info";
  texto: string;
}

const nombreNivel: Record<DificultadPregunta, string> = { facil: "fáciles", media: "medias", dificil: "difíciles" };

/**
 * Convierte un resultado en acciones concretas ("¿qué necesito estudiar ahora?").
 * Reglas simples y transparentes; el backend podría sustituirlas por IA.
 */
export function construirRecomendaciones(resultado: ResultadoPrueba): Recomendacion[] {
  const salida: Recomendacion[] = [];
  const niveles = DIFICULTADES.filter((l) => resultado.porDificultad[l].total > 0);

  if (resultado.tiempoAgotado) {
    salida.push({ tono: "warn", texto: "Se acabó el tiempo antes de terminar. Prueba con más minutos o practica a un ritmo menor a 1 minuto por pregunta." });
  } else if (resultado.cantidadOmitidas > 0) {
    salida.push({ tono: "warn", texto: `Dejaste ${resultado.cantidadOmitidas} ${resultado.cantidadOmitidas === 1 ? "pregunta" : "preguntas"} sin responder. Si dudas, descarta opciones y elige la más probable.` });
  }

  for (const w of resultado.conceptosDebiles) {
    salida.push({ tono: "warn", texto: `Repasa «${w.termino}»: fallaste ${w.falladas} de ${w.total} ${w.total === 1 ? "pregunta" : "preguntas"} de este bloque.` });
  }

  const masDebil = [...niveles].sort((a, b) => resultado.porDificultad[a].porcentaje - resultado.porDificultad[b].porcentaje)[0];
  if (masDebil && resultado.porDificultad[masDebil].porcentaje < 70 && resultado.porDificultad[masDebil].total >= 2) {
    salida.push({ tono: "info", texto: `Refuerza las preguntas ${nombreNivel[masDebil]}: tu acierto fue ${resultado.porDificultad[masDebil].porcentaje}%.` });
  }

  if (resultado.porcentajePuntaje >= 85 && resultado.configuracion.dificultad !== "dificil") {
    salida.push({ tono: "good", texto: "Dominas este nivel. Sube la dificultad para seguir progresando." });
  } else if (resultado.porcentajePuntaje >= 85) {
    salida.push({ tono: "good", texto: "Excelente resultado incluso en dificultad alta. Puedes pasar al siguiente tema." });
  } else if (resultado.porcentajePuntaje < 50) {
    salida.push({ tono: "info", texto: "Lee de nuevo el resumen completo antes de volver a intentarlo; después, practica con preguntas sueltas." });
  }

  return salida.slice(0, 5);
}

export function titularResultado(porcentaje: number): { titulo: string; tono: "good" | "mid" | "low" } {
  if (porcentaje >= 85) return { titulo: "¡Excelente resultado!", tono: "good" };
  if (porcentaje >= 70) return { titulo: "Muy buen trabajo", tono: "good" };
  if (porcentaje >= 50) return { titulo: "Vas por buen camino", tono: "mid" };
  return { titulo: "Todavía hay conceptos por reforzar", tono: "low" };
}
