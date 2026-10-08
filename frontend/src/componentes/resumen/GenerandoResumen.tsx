import { useEffect, useState } from "react";
import Boton from "../Boton";

const ETAPAS = ["Analizando contenido…", "Organizando conceptos…", "Preparando tus resúmenes…"];

/**
 * Estado de carga mientras la petición está en curso. No añade esperas:
 * desaparece en cuanto responde el backend. Los mensajes solo avanzan
 * mientras la petición sigue pendiente.
 */
export default function GenerandoResumen({ alCancelar }: { alCancelar: () => void }) {
  const [etapa, establecerEtapa] = useState(0);

  useEffect(() => {
    const temporizador = window.setInterval(() => establecerEtapa((s) => Math.min(s + 1, ETAPAS.length - 1)), 2200);
    return () => window.clearInterval(temporizador);
  }, []);

  return (
    <div className="generating" aria-busy="true">
      <div className="generating-head">
        <span className="generating-orb" aria-hidden="true" />
        <div>
          <p className="generating-type">Resumen general y esencial</p>
          <p className="generating-stage" aria-live="polite" key={etapa}>
            {ETAPAS[etapa]}
          </p>
        </div>
        <Boton variante="ghost" tamano="sm" onClick={alCancelar}>
          Cancelar
        </Boton>
      </div>
      <div className="generating-skeleton" aria-hidden="true">
        <span className="skeleton" style={{ width: "92%" }} />
        <span className="skeleton" style={{ width: "86%" }} />
        <span className="skeleton" style={{ width: "64%" }} />
        <span className="skeleton skeleton-heading" style={{ width: "38%" }} />
        <span className="skeleton" style={{ width: "88%" }} />
        <span className="skeleton" style={{ width: "72%" }} />
      </div>
    </div>
  );
}
