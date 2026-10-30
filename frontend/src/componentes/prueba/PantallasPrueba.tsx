import { AlertTriangle, ListChecks, Loader2, PauseCircle, Play, RotateCcw, Send } from "lucide-react";
import type { PruebaPublica } from "../../tipos/prueba";
import { etiquetaDificultadElegida, etiquetaTiempo, formatearPuntos } from "../../utilidades/constructorPruebas";
import Boton from "../Boton";

/** Mientras el servidor genera las preguntas con IA (puede tardar medio minuto). */
export function GenerandoPrueba({ cantidad, alCancelar }: { cantidad: number; alCancelar: () => void }) {
  return (
    <div className="pr-pantalla" role="status" aria-live="polite">
      <Loader2 size={30} className="spin pr-pantalla-icono" aria-hidden="true" />
      <h2>Preparando tu prueba</h2>
      <p className="pr-sub">Estamos redactando {cantidad} preguntas a partir de tu resumen y comprobando que cada una esté respaldada por él. Puede tardar hasta un minuto.</p>
      <ul className="pr-esqueleto" aria-hidden="true">
        {Array.from({ length: Math.min(cantidad, 4) }, (_, i) => (
          <li key={i} style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </ul>
      <Boton variante="ghost" onClick={alCancelar}>
        Cancelar
      </Boton>
    </div>
  );
}

/** Prueba creada pero sin iniciar: el reloj arranca al pulsar «Comenzar». */
export function PruebaLista({ prueba, ocupado, aviso, alComenzar, alDescartar }: { prueba: PruebaPublica; ocupado: boolean; aviso: string | null; alComenzar: () => void; alDescartar: () => void }) {
  return (
    <div className="pr-pantalla">
      <ListChecks size={30} className="pr-pantalla-icono" aria-hidden="true" />
      <h2>Tu prueba está lista</h2>
      <dl className="pr-datos">
        <div><dt>Preguntas</dt><dd>{prueba.total}</dd></div>
        <div><dt>Dificultad</dt><dd>{etiquetaDificultadElegida(prueba.dificultad)}</dd></div>
        <div><dt>Tiempo</dt><dd>{etiquetaTiempo(prueba.limiteSegundos === null ? null : Math.round(prueba.limiteSegundos / 60))}</dd></div>
        <div><dt>Puntaje máximo</dt><dd>{formatearPuntos(prueba.puntajeMaximo)}</dd></div>
      </dl>
      <p className="pr-sub">El tiempo empieza a correr cuando pulses «Comenzar». {prueba.pausaBlindada ? "Podrás pausar la prueba." : "Esta prueba no admite pausas."}</p>
      {aviso && (
        <p className="pr-banner pr-banner-warn" role="alert">
          <AlertTriangle size={18} aria-hidden="true" /> {aviso}
        </p>
      )}
      <div className="pr-modal-acciones">
        <Boton tamano="lg" onClick={alComenzar} cargando={ocupado} icono={<Play size={18} />}>
          Comenzar
        </Boton>
        <Boton variante="ghost" onClick={alDescartar} icono={<RotateCcw size={16} />}>
          Cambiar la configuración
        </Boton>
      </div>
    </div>
  );
}

/** Pausa blindada: el servidor no entrega las preguntas y el tiempo está detenido. */
export function PausaPrueba({ restante, ocupado, aviso, alReanudar, alEntregar }: { restante: string | null; ocupado: boolean; aviso: string | null; alReanudar: () => void; alEntregar: () => void }) {
  return (
    <div className="pr-pantalla" role="status">
      <PauseCircle size={34} className="pr-pantalla-icono" aria-hidden="true" />
      <h2>Prueba en pausa</h2>
      <p className="pr-sub">El tiempo está detenido y las preguntas están ocultas. Tus respuestas están guardadas.{restante ? ` Te quedan ${restante}.` : ""}</p>
      {aviso && (
        <p className="pr-banner pr-banner-warn" role="alert">
          <AlertTriangle size={18} aria-hidden="true" /> {aviso}
        </p>
      )}
      <div className="pr-modal-acciones">
        <Boton tamano="lg" onClick={alReanudar} cargando={ocupado} icono={<Play size={18} />} autoFocus>
          Reanudar
        </Boton>
        <Boton variante="ghost" onClick={alEntregar} icono={<Send size={16} />}>
          Entregar ahora
        </Boton>
      </div>
    </div>
  );
}

export function EntregandoPrueba() {
  return (
    <div className="pr-pantalla" role="status" aria-live="polite">
      <Loader2 size={30} className="spin pr-pantalla-icono" aria-hidden="true" />
      <h2>Entregando y calificando…</h2>
      <p className="pr-sub">El servidor está calificando tus respuestas.</p>
    </div>
  );
}
