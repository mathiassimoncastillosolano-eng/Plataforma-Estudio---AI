import { ArrowRight, Loader2, PartyPopper } from "lucide-react";
import Boton from "../Boton";

interface PropsRondaCompletada {
  ronda: number;
  conocidas: number;
  total: number;
  preparando: boolean;
  lista: boolean;
  alEmpezar: () => void;
}

export default function RondaCompletada({ ronda, conocidas, total, preparando, lista, alEmpezar }: PropsRondaCompletada) {
  return (
    <div className="preg-ronda-lista" role="status" aria-live="polite">
      <span className="preg-ronda-icono" aria-hidden="true">
        {preparando ? <Loader2 size={22} className="spin" /> : <PartyPopper size={22} />}
      </span>
      <div className="preg-ronda-texto">
        <strong>Completaste la ronda {ronda}</strong>
        <p>
          {conocidas} de {total} acertadas.{" "}
          {preparando
            ? "Estamos preparando la siguiente: repasarás lo que fallaste y habrá preguntas nuevas."
            : lista
              ? "Tu siguiente ronda está lista: repite lo que fallaste, suma preguntas nuevas y unas pocas que ya dominas."
              : "No pudimos preparar una ronda nueva. Puedes seguir repasando esta."}
        </p>
      </div>
      {lista && (
        <Boton variante="primary" tamano="sm" icono={<ArrowRight size={15} />} onClick={alEmpezar}>
          Empezar ronda {ronda + 1}
        </Boton>
      )}
    </div>
  );
}
