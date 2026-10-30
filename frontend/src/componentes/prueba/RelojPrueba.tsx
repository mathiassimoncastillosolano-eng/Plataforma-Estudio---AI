import { useEffect, useRef, useState } from "react";
import { Clock, Infinity as Infinito } from "lucide-react";
import type { TiempoPrueba } from "../../tipos/prueba";
import { useRelojPrueba } from "../../hooks/useRelojPrueba";
import { describirTiempo, formatearReloj, vistaReloj } from "../../utilidades/tiempoPrueba";

interface Props {
  tiempo: TiempoPrueba;
  cronometroVisible: boolean;
  alAgotar: () => void;
}

/**
 * Cronómetro con barra de progreso. Si el estudiante lo ocultó, el número solo reaparece (en rojo y con
 * texto «Quedan…») cuando entra en la zona de alerta; sin parpadeos ni sonidos.
 */
export default function RelojPrueba({ tiempo, cronometroVisible, alAgotar }: Props) {
  const restante = useRelojPrueba(tiempo, alAgotar);
  const sinLimite = tiempo.limiteSegundos === null || restante === null;
  const vista = vistaReloj(restante, tiempo.limiteSegundos, cronometroVisible);

  // Aviso para lectores de pantalla: solo al entrar en alerta y luego cada minuto (no cada segundo).
  const [anuncio, establecerAnuncio] = useState("");
  const ultimoMinuto = useRef<number | null>(null);
  useEffect(() => {
    if (!vista.alerta || restante === null) {
      ultimoMinuto.current = null;
      return;
    }
    const minuto = Math.ceil(restante / 60);
    if (ultimoMinuto.current !== minuto) {
      ultimoMinuto.current = minuto;
      establecerAnuncio(`Atención: quedan ${describirTiempo(restante)}.`);
    }
  }, [vista.alerta, restante]);

  if (sinLimite) {
    return (
      <div className="pr-reloj" data-estado="sin-limite">
        <Infinito size={16} aria-hidden="true" />
        <span>Sin límite de tiempo</span>
      </div>
    );
  }

  return (
    <div className="pr-reloj" data-alerta={vista.alerta || undefined} data-estado={tiempo.estado}>
      {vista.mostrarNumero ? (
        <div className="pr-reloj-numero">
          <Clock size={16} aria-hidden="true" />
          {vista.alerta && <span className="pr-reloj-texto">Quedan</span>}
          <span className="pr-reloj-valor" role="timer" aria-label={`Tiempo restante: ${describirTiempo(restante)}`}>
            {formatearReloj(restante)}
          </span>
        </div>
      ) : (
        <div className="pr-reloj-numero">
          <Clock size={16} aria-hidden="true" />
          <span className="pr-reloj-texto">Tiempo restante</span>
        </div>
      )}
      <div className="pr-reloj-barra" role="progressbar" aria-label="Tiempo restante" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(vista.proporcion * 100)}>
        <span style={{ transform: `scaleX(${vista.proporcion})` }} />
      </div>
      <span className="pr-solo-lector" aria-live="polite">
        {anuncio}
      </span>
    </div>
  );
}
