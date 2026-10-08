// Estado de estudio por pregunta, persistido por tema en localStorage.
//   known  → la respondió/marcó bien
//   review → la falló o la marcó para repasar
// Una pregunta sin registro está "pendiente".
export type EstadoPregunta = "conocida" | "repaso";
export type MapaEstados = Record<string, EstadoPregunta>;

const clave = (idTema: string) => `estudioai.estadoPreguntas.${idTema}`;

export function cargarEstados(idTema: string): MapaEstados {
  try {
    const bruto = localStorage.getItem(clave(idTema));
    return bruto ? (JSON.parse(bruto) as MapaEstados) : {};
  } catch {
    return {};
  }
}

export function guardarEstados(idTema: string, mapa: MapaEstados) {
  try {
    localStorage.setItem(clave(idTema), JSON.stringify(mapa));
  } catch {
    /* almacenamiento lleno o bloqueado: se ignora, no es crítico */
  }
}

export function establecerEstados(idTema: string, actualizaciones: MapaEstados): MapaEstados {
  const siguiente = { ...cargarEstados(idTema), ...actualizaciones };
  guardarEstados(idTema, siguiente);
  return siguiente;
}
