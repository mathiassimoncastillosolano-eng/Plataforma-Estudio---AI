import { useSesion } from "../almacen/almacenSesion";
import { obtenerResumenesEjemplo } from "../servicios/servicioResumen";
import type { IdModulo } from "../datos/modulosEstudio";
import { mensajeBloqueo, moduloBloqueado } from "../utilidades/bloqueoModulos";

export function useBloqueoModulos(idTema: string | undefined) {
  const generado = useSesion((s) => (idTema ? Boolean(s.resumenes[idTema]) : false));
  const generando = useSesion((s) => (idTema ? Boolean(s.generandoResumen[idTema]) : false));
  const tieneResumen = generado || (idTema ? obtenerResumenesEjemplo(idTema) !== null : false);
  return {
    bloqueado: (modulo: IdModulo) => moduloBloqueado(modulo, tieneResumen, generando),
    mensaje: mensajeBloqueo(generando),
  };
}
