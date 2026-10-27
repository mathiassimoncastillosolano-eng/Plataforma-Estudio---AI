import { useEffect, useState } from "react";
import { AlertTriangle, Check, RotateCw, WifiOff } from "lucide-react";
import MarcaLogo from "./MarcaLogo";
import Boton from "./Boton";
import { SALUD_UMBRAL_DESPERTAR_MS } from "../configuracion";
import { formatearSegundos } from "../utilidades/formato";
import type { EstadoBackend } from "../almacen/almacenBackend";

interface Props {
  estado: EstadoBackend;
  alReintentar: () => void;
}

type EstadoPaso = "hecho" | "activo" | "pendiente";

function useTranscurridoMs(inicio: number, activo: boolean): number {
  const [ahora, establecerAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    establecerAhora(Date.now());
    const id = window.setInterval(() => establecerAhora(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activo, inicio]);
  return Math.max(0, ahora - inicio);
}

const TEXTO_PASO: Record<EstadoPaso, string> = { hecho: "completado", activo: "en curso", pendiente: "pendiente" };

function Paso({ estado, children }: { estado: EstadoPaso; children: string }) {
  return (
    <li className="init-step" data-estado={estado}>
      <span className="init-step-marca" aria-hidden="true">
        {estado === "hecho" ? <Check size={12} strokeWidth={3} /> : null}
      </span>
      <span>{children}</span>
      <span className="sr-only"> — {TEXTO_PASO[estado]}</span>
    </li>
  );
}

/**
 * Fase real de preparación del entorno: se muestra antes del login mientras se comprueba
 * que el backend (Render) responde. Solo informa de lo que realmente sabe (no hay
 * porcentajes inventados) y nunca bloquea para siempre: ante un error ofrece reintentar.
 */
export default function PantallaInicializacion({ estado, alReintentar }: Props) {
  const enCurso = estado.fase === "solicitando" || estado.fase === "despertando";
  const transcurrido = useTranscurridoMs(estado.inicio, enCurso);
  const despertando = estado.fase === "despertando" && transcurrido >= SALUD_UMBRAL_DESPERTAR_MS;
  const errorConfiguracion = estado.fase === "error" && estado.motivoError === "configuracion";

  let titulo = "Preparando tu entorno de estudio";
  let detalle = "Conectando con nuestros servicios…";
  if (estado.fase === "despertando" && !despertando) {
    titulo = "Verificando la disponibilidad del sistema";
    detalle = "Esperando la respuesta del servidor…";
  }
  if (despertando) {
    titulo = "Iniciando el entorno de aprendizaje";
    detalle = "El servidor estaba en reposo y está arrancando. La primera vez puede tardar hasta un minuto.";
  }
  if (estado.fase === "error") {
    titulo = errorConfiguracion ? "Falta configurar el servidor" : "No pudimos conectar con el servidor";
    detalle = errorConfiguracion
      ? "Esta versión apunta a una dirección local. Define VITE_URL_BASE_API con la URL de Render en Vercel y vuelve a desplegar."
      : "El servicio tardó más de lo esperado en responder. Puede que siga arrancando o que haya un problema de conexión.";
  }

  const pasoSolicitud: EstadoPaso = errorConfiguracion ? "pendiente" : estado.fase === "solicitando" ? "activo" : "hecho";
  const pasoEspera: EstadoPaso = estado.fase === "despertando" ? "activo" : "pendiente";

  return (
    <main className="init-screen" aria-labelledby="init-titulo">
      <div className="init-contenido">
        <div className="init-orbita" data-error={estado.fase === "error" || undefined} aria-hidden="true">
          <span className="init-anillo init-anillo-exterior" />
          <span className="init-anillo init-anillo-interior" />
          {enCurso && <span className="init-satelite" />}
          <div className="init-logo">{estado.fase === "error" ? <WifiOff size={30} strokeWidth={2} /> : <MarcaLogo tamano={64} />}</div>
        </div>

        <div className="init-textos" aria-live="polite">
          <h1 id="init-titulo" className="init-titulo" key={titulo}>
            {titulo}
          </h1>
          <p className="init-detalle" key={detalle}>
            {detalle}
          </p>
        </div>

        {enCurso && (
          <>
            <div className="init-progreso" role="progressbar" aria-label="Preparando el entorno de estudio" />
            <ul className="init-pasos">
              <Paso estado={pasoSolicitud}>Solicitud enviada al servidor</Paso>
              <Paso estado={pasoEspera}>Esperando que el servidor responda</Paso>
              <Paso estado="pendiente">Entorno de estudio listo</Paso>
            </ul>
            <p className="init-meta">
              <span className="mono">{formatearSegundos(Math.floor(transcurrido / 1000))}</span>
              {estado.intentos > 0 && <span> · comprobación {estado.intentos + 1}</span>}
            </p>
          </>
        )}

        {estado.fase === "error" && (
          <div className="init-error">
            <div className="auth-error" role="alert">
              <AlertTriangle size={16} aria-hidden="true" />
              <span>{errorConfiguracion ? "No se intentó la conexión para evitar usar una URL local en producción." : "No hay conexión con el backend todavía."}</span>
            </div>
            {!errorConfiguracion && (
              <Boton tamano="lg" icono={<RotateCw size={17} aria-hidden="true" />} onClick={alReintentar}>
                Reintentar conexión
              </Boton>
            )}
          </div>
        )}
      </div>
      <p className="init-pie">Cursa — estudio asistido por IA</p>
    </main>
  );
}
