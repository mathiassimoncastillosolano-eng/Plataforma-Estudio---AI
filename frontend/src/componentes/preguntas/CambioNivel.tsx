import { ArrowDownRight, ArrowUpRight, Loader2, Minus, RotateCw, TriangleAlert } from "lucide-react";
import { useContadorAnimado } from "../../hooks/useContadorAnimado";
import Boton from "../Boton";

export type EstadoNivel =
  | { fase: "calculando" }
  | { fase: "listo"; anterior: number; nuevo: number }
  | { fase: "pendiente"; faltan: number }
  | { fase: "error" };

interface PropsCambioNivel {
  estado: EstadoNivel;
  alReintentar: () => void;
}

function NivelCalculado({ anterior, nuevo }: { anterior: number; nuevo: number }) {
  const valor = useContadorAnimado(anterior, nuevo);
  const diferencia = nuevo - anterior;
  const tono = diferencia > 0 ? "sube" : diferencia < 0 ? "baja" : "igual";
  const Icono = diferencia > 0 ? ArrowUpRight : diferencia < 0 ? ArrowDownRight : Minus;
  const texto = diferencia === 0 ? "Sin cambios" : `${diferencia > 0 ? "+" : "−"}${Math.abs(diferencia)} pts`;

  return (
    <div className="nivel-cambio" data-tono={tono} role="status" aria-live="polite">
      <div className="nivel-cambio-cabeza">
        <span className="nivel-cambio-etiqueta">Nivel de conocimiento</span>
        <span className="nivel-cambio-delta">
          <Icono size={15} aria-hidden="true" />
          {texto}
        </span>
      </div>
      <div className="nivel-cambio-valor">
        <strong className="mono">{valor}%</strong>
        <span className="mono">antes {anterior}%</span>
      </div>
      <div className="nivel-cambio-barra" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100} aria-label="Nivel de conocimiento">
        <span style={{ width: `${valor}%` }} />
        <i style={{ left: `${anterior}%` }} aria-hidden="true" />
      </div>
    </div>
  );
}

export default function CambioNivel({ estado, alReintentar }: PropsCambioNivel) {
  if (estado.fase === "listo") return <NivelCalculado anterior={estado.anterior} nuevo={estado.nuevo} />;

  if (estado.fase === "calculando") {
    return (
      <div className="nivel-cambio nivel-cambio-espera" role="status" aria-live="polite">
        <Loader2 size={18} className="spin" aria-hidden="true" />
        <span>Calculando tu nivel de conocimiento…</span>
      </div>
    );
  }

  if (estado.fase === "pendiente") {
    return (
      <div className="nivel-cambio nivel-cambio-espera" role="status">
        <span>
          Tu nivel se actualiza cada 15 respuestas. {estado.faltan === 1 ? "Falta 1 respuesta" : `Faltan ${estado.faltan} respuestas`}.
        </span>
      </div>
    );
  }

  return (
    <div className="nivel-cambio nivel-cambio-espera" role="alert">
      <TriangleAlert size={18} aria-hidden="true" />
      <span>No pudimos calcular tu nivel. Tus respuestas están guardadas.</span>
      <Boton variante="secondary" tamano="sm" icono={<RotateCw size={14} />} onClick={alReintentar}>
        Reintentar
      </Boton>
    </div>
  );
}
