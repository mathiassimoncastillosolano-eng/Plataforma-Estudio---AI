import { useEffect, useRef } from "react";
import { useBuddy } from "../BuddyProvider";
import { PRIORIDAD } from "../tipos";
import { useTutorial } from "./TutorialProvider";

export default function GestorInvitacion() {
  const { usuarioId, persistido, anunciar, establecerInvitacion } = useBuddy();
  const { iniciar } = useTutorial();
  const intentado = useRef<string | null>(null);
  const pendiente = persistido.invitacion === "pendiente";

  useEffect(() => {
    if (!usuarioId || !pendiente || intentado.current === usuarioId) return;
    const temporizador = window.setTimeout(() => {
      intentado.current = usuarioId;
      anunciar({
        id: "invitacion:bienvenida",
        modo: "invitacion",
        prioridad: PRIORIDAD.tutorial,
        estado: "greeting",
        titulo: "¡Hola! ¿Conocemos Cursa AI?",
        mensaje: "Te puedo mostrar cómo aprovechar todas las herramientas de estudio.",
        duracionMs: null,
        cerrable: false,
        retener: true,
        cancelarAlNavegar: false,
        accion: {
          etiqueta: "Sí, guíame",
          alPulsar: () => {
            establecerInvitacion("aceptada");
            iniciar("conoce-cursa");
          },
        },
        accionSecundaria: { etiqueta: "Ahora no", alPulsar: () => establecerInvitacion("rechazada") },
      });
    }, 1600);
    return () => window.clearTimeout(temporizador);
  }, [usuarioId, pendiente, anunciar, establecerInvitacion, iniciar]);

  return null;
}
