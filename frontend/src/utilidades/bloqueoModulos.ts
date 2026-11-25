import type { IdModulo } from "../datos/modulosEstudio";

const DEPENDEN_DEL_RESUMEN: readonly IdModulo[] = ["preguntas", "prueba"];

export const MENSAJE_MODULO_BLOQUEADO = "Genera primero el resumen para desbloquear este módulo";
export const MENSAJE_RESUMEN_EN_CURSO = "Espera a que termine de generarse el resumen";

export function moduloBloqueado(modulo: IdModulo, tieneResumen: boolean, generandoResumen = false): boolean {
  if (modulo === "resumen") return false;
  if (generandoResumen) return true;
  return !tieneResumen && DEPENDEN_DEL_RESUMEN.includes(modulo);
}

export function mensajeBloqueo(generandoResumen: boolean): string {
  return generandoResumen ? MENSAJE_RESUMEN_EN_CURSO : MENSAJE_MODULO_BLOQUEADO;
}
