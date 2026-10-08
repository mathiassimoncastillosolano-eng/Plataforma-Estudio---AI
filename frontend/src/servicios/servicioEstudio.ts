import type { BorradorFuente, TemaEstudio } from "../tipos";
import { temasEstudio as temasBase, obtenerNivelDominio } from "../datos/temasEstudio";
import { retardoSimulado, idAleatorio } from "../utilidades/retardoSimulado";

// -----------------------------------------------------------------------
// Servicio de temas de estudio.
// Reemplazará llamadas como GET /api/topics, POST /api/topics,
// GET /api/temas/:id si el backend llega a gestionar temas (hoy no hay BD).
// Mientras tanto, persiste los temas creados en memoria + localStorage
// para que la sesión se sienta real al navegar entre pantallas.
// -----------------------------------------------------------------------

const CLAVE_TEMAS = "estudioai.temas";

function cargarTemas(): TemaEstudio[] {
  try {
    const bruto = localStorage.getItem(CLAVE_TEMAS);
    if (bruto) return JSON.parse(bruto) as TemaEstudio[];
  } catch {
    /* ignore corrupted storage */
  }
  return temasBase;
}

function guardarTemas(temas: TemaEstudio[]) {
  localStorage.setItem(CLAVE_TEMAS, JSON.stringify(temas));
}

export async function obtenerTemasEstudio(): Promise<TemaEstudio[]> {
  return retardoSimulado(cargarTemas(), 500);
}

export async function obtenerTemaEstudio(id: string): Promise<TemaEstudio | undefined> {
  const tema = cargarTemas().find((t) => t.id === id);
  return retardoSimulado(tema, 350);
}

export async function crearTemaEstudio(borrador: BorradorFuente): Promise<TemaEstudio> {
  const temas = cargarTemas();
  const temaNuevo: TemaEstudio = {
    id: idAleatorio("topic"),
    titulo: borrador.tituloTema,
    categoria: borrador.categoria || "General",
    dominio: 0,
    nivelDominio: obtenerNivelDominio(0),
    ultimoEstudioEn: "Hoy",
    creadoEn: new Date().toISOString(),
    preguntasRespondidas: 0,
    pruebasCompletadas: 0,
    tipoFuente: borrador.tipoFuente,
    nombreFuente: borrador.nombreArchivo,
  };

  guardarTemas([temaNuevo, ...temas]);
  return retardoSimulado(temaNuevo, 300);
}

export async function actualizarDominioTema(idTema: string, dominio: number): Promise<TemaEstudio | undefined> {
  const temas = cargarTemas();
  const posicion = temas.findIndex((t) => t.id === idTema);
  if (posicion === -1) return undefined;

  const actualizado: TemaEstudio = {
    ...temas[posicion],
    dominio,
    nivelDominio: obtenerNivelDominio(dominio),
    ultimoEstudioEn: "Hoy",
  };
  temas[posicion] = actualizado;
  guardarTemas(temas);
  return retardoSimulado(actualizado, 200);
}

export async function incrementarPreguntasRespondidas(idTema: string, cantidad: number): Promise<void> {
  const temas = cargarTemas();
  const posicion = temas.findIndex((t) => t.id === idTema);
  if (posicion === -1) return;
  temas[posicion] = { ...temas[posicion], preguntasRespondidas: temas[posicion].preguntasRespondidas + cantidad };
  guardarTemas(temas);
}

export async function incrementarPruebasCompletadas(idTema: string): Promise<void> {
  const temas = cargarTemas();
  const posicion = temas.findIndex((t) => t.id === idTema);
  if (posicion === -1) return;
  temas[posicion] = { ...temas[posicion], pruebasCompletadas: temas[posicion].pruebasCompletadas + 1 };
  guardarTemas(temas);
}
