export function formatearSegundos(segundosTotales: number): string {
  const minutos = Math.floor(segundosTotales / 60);
  const segundos = segundosTotales % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}

export function formatearTamanoArchivo(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export function etiquetaDificultad(dificultad: string): string {
  switch (dificultad) {
    case "facil":
      return "Fácil";
    case "media":
      return "Media";
    case "dificil":
      return "Difícil";
    case "mixta":
      return "Mixta";
    default:
      return dificultad;
  }
}

/** "Ahora mismo", "Hace 5 min", "Hace 2 h" (para actividad de la sesión). */
export function formatearTiempoRelativo(marcaTiempo: number, ahora = Date.now()): string {
  const minutos = Math.floor((ahora - marcaTiempo) / 60_000);
  if (minutos < 1) return "Ahora mismo";
  if (minutos < 60) return `Hace ${minutos} min`;
  return `Hace ${Math.floor(minutos / 60)} h`;
}
