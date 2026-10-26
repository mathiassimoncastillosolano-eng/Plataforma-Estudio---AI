import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import type { TemaEstudio } from "../tipos";
import * as servicioEstudio from "../servicios/servicioEstudio";
import { eliminarDatosTema } from "../almacen/almacenSesion";
import { useAviso } from "./useAviso";
import Boton from "../componentes/Boton";
import Modal from "../componentes/Modal";

interface ResultadoUseEliminarTema {
  /** Abre el diálogo de confirmación para ese tema (no elimina nada todavía). */
  pedirEliminar: (tema: TemaEstudio) => void;
  /** Diálogo de confirmación: renderízalo una vez en la página. */
  dialogo: ReactNode;
}

/**
 * Eliminación individual de un tema de estudio con confirmación.
 * Solo se elimina el tema elegido, identificado por su id; cancelar no cambia nada.
 * `alEliminado` recibe el id eliminado para que la página quite su tarjeta de la lista.
 */
export function useEliminarTema(alEliminado: (id: string) => void): ResultadoUseEliminarTema {
  const { mostrarAviso } = useAviso();
  const [pendiente, establecerPendiente] = useState<TemaEstudio | null>(null);
  const [eliminando, establecerEliminando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);

  const cerrar = useCallback(() => {
    if (eliminando) return;
    establecerPendiente(null);
    establecerError(null);
  }, [eliminando]);

  const pedirEliminar = useCallback((tema: TemaEstudio) => {
    establecerError(null);
    establecerPendiente(tema);
  }, []);

  useEffect(() => {
    if (!pendiente) return;
    const alPulsar = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [pendiente, cerrar]);

  async function confirmar() {
    if (!pendiente || eliminando) return;
    const tema = pendiente;
    establecerError(null);
    establecerEliminando(true);
    try {
      const existia = await servicioEstudio.eliminarTemaEstudio(tema.id);
      eliminarDatosTema(tema.id);
      alEliminado(tema.id);
      establecerPendiente(null);
      mostrarAviso(existia ? `Eliminaste el tema «${tema.titulo}».` : `«${tema.titulo}» ya no existía; actualizamos tu lista.`);
    } catch {
      establecerError("No pudimos eliminar el tema. Inténtalo de nuevo.");
    } finally {
      establecerEliminando(false);
    }
  }

  const dialogo = (
    <Modal abierto={pendiente !== null} alCerrar={cerrar} titulo="¿Eliminar este tema?">
      {pendiente && (
        <>
          <p className="confirm-text">
            Vas a eliminar <strong>«{pendiente.titulo}»</strong> ({pendiente.categoria}). Se quitará de tu lista y dejarás de ver su resumen y su
            avance. Tus otros temas no se verán afectados. Esta acción no se puede deshacer.
          </p>
          {error && (
            <div className="inline-alert" role="alert" style={{ marginTop: 14 }}>
              <AlertCircle size={18} aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}
          <div className="confirm-actions">
            <Boton type="button" variante="ghost" onClick={cerrar} disabled={eliminando} autoFocus>
              Cancelar
            </Boton>
            <Boton type="button" variante="danger" onClick={confirmar} cargando={eliminando}>
              {eliminando ? "Eliminando…" : "Eliminar tema"}
            </Boton>
          </div>
        </>
      )}
    </Modal>
  );

  return { pedirEliminar, dialogo };
}
