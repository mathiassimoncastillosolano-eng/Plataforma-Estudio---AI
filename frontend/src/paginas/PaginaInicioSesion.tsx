import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle, Info, ShieldCheck, TimerReset, UserCheck, TriangleAlert } from "lucide-react";
import { useAutenticacion } from "../hooks/useAutenticacion";
import BotonGoogle from "../componentes/BotonGoogle";
import { PortadaMovilAutenticacion, AlternadorTemaAutenticacion, VisualAutenticacion } from "../componentes/Autenticacion";
import { cargarScriptGoogle, ErrorAutenticacion, googleConfigurado } from "../servicios/servicioGoogle";

type EstadoScript = "cargando" | "listo" | "fallo";

const PUNTOS_CONFIANZA = [
  { icono: UserCheck, texto: "Tu primer acceso crea tu espacio al instante, sin formularios de registro." },
  { icono: ShieldCheck, texto: "Google verifica tu identidad. Cursa nunca ve ni guarda tu contraseña." },
  { icono: TimerReset, texto: "Tu perfil solo vive durante esta sesión; no lo guardamos en ninguna base de datos." },
] as const;

export default function PaginaInicioSesion() {
  const { iniciarSesionConGoogle, estaAutenticado } = useAutenticacion();
  const ubicacion = useLocation();
  const configurado = googleConfigurado();
  const [estadoScript, establecerEstadoScript] = useState<EstadoScript>(configurado ? "cargando" : "fallo");
  const [aviso, establecerAviso] = useState<ErrorAutenticacion | null>(null);
  const [cargando, establecerCargando] = useState(false);

  // La ventana de Google solo puede abrirse dentro del gesto del clic: el script se carga antes.
  const prepararGoogle = useCallback(() => {
    if (!configurado) return;
    establecerEstadoScript("cargando");
    cargarScriptGoogle()
      .then(() => establecerEstadoScript("listo"))
      .catch((fallo: unknown) => {
        establecerEstadoScript("fallo");
        establecerAviso(fallo instanceof ErrorAutenticacion ? fallo : null);
      });
  }, [configurado]);

  useEffect(prepararGoogle, [prepararGoogle]);

  if (estaAutenticado) {
    const destino = (ubicacion.state as { from?: string } | null)?.from ?? "/panel";
    return <Navigate to={destino} replace />;
  }

  function manejarClic() {
    if (estadoScript === "fallo") {
      establecerAviso(null);
      prepararGoogle();
      return;
    }
    establecerAviso(null);
    establecerCargando(true);
    // Se llama síncronamente desde el clic para que el navegador permita la ventana emergente.
    iniciarSesionConGoogle()
      .catch((fallo: unknown) => {
        establecerAviso(fallo instanceof ErrorAutenticacion ? fallo : new ErrorAutenticacion("DESCONOCIDO", "No pudimos iniciar sesión. Inténtalo de nuevo."));
      })
      .finally(() => establecerCargando(false));
  }

  const preparando = configurado && estadoScript === "cargando";
  const requiereReintento = configurado && estadoScript === "fallo";

  return (
    <div className="auth-shell">
      <VisualAutenticacion
        mensaje={
          <>
            Tu forma de aprender <span>está a punto de cambiar.</span>
          </>
        }
        descripcion="Convierte cualquier material en resúmenes, preguntas y exámenes que se adaptan a tu progreso."
      />

      <main className="auth-form-side">
        <AlternadorTemaAutenticacion />
        <PortadaMovilAutenticacion mensaje="Tu forma de aprender está a punto de cambiar." />

        <div className="auth-form-card stagger">
          <div>
            <span className="auth-estado-sistema">
              <i aria-hidden="true" /> Servicios conectados
            </span>
            <h1 className="auth-heading">Bienvenido a Cursa</h1>
            <p className="auth-subheading auth-subheading-compacto">Entra con tu cuenta de Google y empieza a estudiar con IA. No necesitas crear una contraseña.</p>
          </div>

          {!configurado && (
            <div className="auth-aviso auth-aviso-advertencia" role="alert">
              <TriangleAlert size={16} aria-hidden="true" />
              <div>
                <strong>Falta configurar el acceso con Google.</strong>
                <span>Define VITE_GOOGLE_CLIENT_ID en el frontend (consulta el manual de configuración).</span>
              </div>
            </div>
          )}

          {aviso && (
            <div className={`auth-aviso ${aviso.esInformativo ? "auth-aviso-info" : "auth-aviso-error"}`} role={aviso.esInformativo ? "status" : "alert"}>
              {aviso.esInformativo ? <Info size={16} aria-hidden="true" /> : <AlertCircle size={16} aria-hidden="true" />}
              <span>{aviso.message}</span>
            </div>
          )}

          <div className="auth-accion">
            <BotonGoogle onClick={manejarClic} cargando={cargando || preparando} textoCargando={preparando ? "Preparando el acceso…" : "Esperando a Google…"} disabled={!configurado} />
            {requiereReintento && <p className="auth-ayuda">Pulsa de nuevo para reintentar la carga del servicio de Google.</p>}
          </div>

          <ul className="auth-confianza">
            {PUNTOS_CONFIANZA.map(({ icono: Icono, texto }) => (
              <li key={texto}>
                <span aria-hidden="true">
                  <Icono size={16} />
                </span>
                {texto}
              </li>
            ))}
          </ul>

          <p className="auth-legal">Al continuar, Cursa lee tu nombre, correo y foto de perfil de Google solo para personalizar tu espacio durante esta sesión.</p>
        </div>
      </main>
    </div>
  );
}
