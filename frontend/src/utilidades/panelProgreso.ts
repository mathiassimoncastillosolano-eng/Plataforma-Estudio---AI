import type { RespuestaRegistrada } from "./rendimiento";
import { NIVELES } from "./rendimiento";
import type { NivelPregunta } from "../tipos/prueba";
import { PREGUNTAS_POR_PERIODO } from "./adaptacion";

export const TAMANO_PERIODO = PREGUNTAS_POR_PERIODO;
const MINIMO_RESPUESTAS_DIAGNOSTICO = 5;
const UMBRAL_PUNTO_DEBIL = 0.7;

export interface TemaMinimo {
  id: string;
  titulo: string;
  dominio: number;
  preguntasRespondidas: number;
}

export type RendimientoPorTema = Record<string, RespuestaRegistrada[]>;

const porcentaje = (correctas: number, total: number): number | null => (total === 0 ? null : Math.round((correctas / total) * 1000) / 10);
const aciertos = (respuestas: RespuestaRegistrada[]) => respuestas.filter((r) => r.correcta).length;

export function cronologicas(rendimiento: RendimientoPorTema): RespuestaRegistrada[] {
  return Object.values(rendimiento)
    .flat()
    .sort((a, b) => a.at - b.at);
}

export interface PeriodoProgreso {
  numero: number;
  preguntas: number;
  correctas: number;
  porcentaje: number;
  variacion: number | null;
  completo: boolean;
}

export function periodosDeRespuestas(respuestas: RespuestaRegistrada[], tamano: number = TAMANO_PERIODO): PeriodoProgreso[] {
  const periodos: PeriodoProgreso[] = [];
  for (let inicio = 0; inicio < respuestas.length; inicio += tamano) {
    const bloque = respuestas.slice(inicio, inicio + tamano);
    const correctas = aciertos(bloque);
    const actual = porcentaje(correctas, bloque.length) ?? 0;
    const previo = periodos[periodos.length - 1];
    periodos.push({
      numero: periodos.length + 1,
      preguntas: bloque.length,
      correctas,
      porcentaje: actual,
      variacion: previo ? Math.round((actual - previo.porcentaje) * 10) / 10 : null,
      completo: bloque.length === tamano,
    });
  }
  return periodos;
}

export interface IndicadoresGlobales {
  dominioPromedio: number;
  preguntasRespondidas: number;
  respuestasRegistradas: number;
  precision: number | null;
  rachaActual: number;
  mejorRacha: number;
  variacionPrecision: number | null;
}

export function indicadoresGlobales(temas: TemaMinimo[], rendimiento: RendimientoPorTema): IndicadoresGlobales {
  const todas = cronologicas(rendimiento);
  let rachaActual = 0;
  let mejorRacha = 0;
  for (const r of todas) {
    rachaActual = r.correcta ? rachaActual + 1 : 0;
    mejorRacha = Math.max(mejorRacha, rachaActual);
  }
  const reciente = todas.slice(-TAMANO_PERIODO);
  const anterior = todas.slice(-TAMANO_PERIODO * 2, -TAMANO_PERIODO);
  const pctReciente = porcentaje(aciertos(reciente), reciente.length);
  const pctAnterior = porcentaje(aciertos(anterior), anterior.length);
  return {
    dominioPromedio: temas.length === 0 ? 0 : Math.round(temas.reduce((suma, t) => suma + t.dominio, 0) / temas.length),
    preguntasRespondidas: temas.reduce((suma, t) => suma + t.preguntasRespondidas, 0),
    respuestasRegistradas: todas.length,
    precision: porcentaje(aciertos(todas), todas.length),
    rachaActual,
    mejorRacha,
    variacionPrecision: pctReciente !== null && pctAnterior !== null && anterior.length >= TAMANO_PERIODO / 3 ? Math.round((pctReciente - pctAnterior) * 10) / 10 : null,
  };
}

export interface FilaComparativa {
  id: string;
  titulo: string;
  dominio: number;
  respondidas: number;
  precision: number | null;
  variacion: number | null;
}

export function comparativaTemas(temas: TemaMinimo[], rendimiento: RendimientoPorTema): FilaComparativa[] {
  return temas
    .map((tema) => {
      const respuestas = rendimiento[tema.id] ?? [];
      const periodos = periodosDeRespuestas(respuestas);
      const ultimo = periodos[periodos.length - 1];
      return {
        id: tema.id,
        titulo: tema.titulo,
        dominio: tema.dominio,
        respondidas: tema.preguntasRespondidas,
        precision: porcentaje(aciertos(respuestas), respuestas.length),
        variacion: ultimo?.variacion ?? null,
      };
    })
    .sort((a, b) => b.dominio - a.dominio || a.titulo.localeCompare(b.titulo));
}

export interface FilaDificultad {
  nivel: NivelPregunta;
  preguntas: number;
  correctas: number;
  porcentaje: number | null;
}

export function distribucionDificultad(rendimiento: RendimientoPorTema): FilaDificultad[] {
  const todas = Object.values(rendimiento).flat();
  return NIVELES.map((nivel) => {
    const delNivel = todas.filter((r) => r.dificultad === nivel);
    const correctas = aciertos(delNivel);
    return { nivel, preguntas: delNivel.length, correctas, porcentaje: porcentaje(correctas, delNivel.length) };
  });
}

export interface PuntoDebil {
  idTema: string;
  titulo: string;
  motivo: "precision-baja" | "sin-practica";
  precision: number | null;
  nivelDebil: NivelPregunta | null;
}

export function puntosDebiles(temas: TemaMinimo[], rendimiento: RendimientoPorTema, maximo = 3): PuntoDebil[] {
  const candidatos: (PuntoDebil & { orden: number })[] = [];
  for (const tema of temas) {
    const respuestas = rendimiento[tema.id] ?? [];
    if (respuestas.length === 0) {
      if (tema.dominio < 50) candidatos.push({ idTema: tema.id, titulo: tema.titulo, motivo: "sin-practica", precision: null, nivelDebil: null, orden: 1 });
      continue;
    }
    if (respuestas.length < MINIMO_RESPUESTAS_DIAGNOSTICO) continue;
    const precision = aciertos(respuestas) / respuestas.length;
    if (precision >= UMBRAL_PUNTO_DEBIL) continue;
    const porNivel = NIVELES.map((nivel) => {
      const delNivel = respuestas.filter((r) => r.dificultad === nivel);
      return { nivel, total: delNivel.length, ratio: delNivel.length === 0 ? 1 : aciertos(delNivel) / delNivel.length };
    })
      .filter((n) => n.total >= 2)
      .sort((a, b) => a.ratio - b.ratio);
    candidatos.push({
      idTema: tema.id,
      titulo: tema.titulo,
      motivo: "precision-baja",
      precision: Math.round(precision * 1000) / 10,
      nivelDebil: porNivel[0]?.nivel ?? null,
      orden: 0 + precision,
    });
  }
  return candidatos
    .sort((a, b) => a.orden - b.orden)
    .slice(0, maximo)
    .map(({ orden: _orden, ...punto }) => punto);
}
