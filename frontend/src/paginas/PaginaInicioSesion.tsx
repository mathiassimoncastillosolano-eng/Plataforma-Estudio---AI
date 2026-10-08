import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useAutenticacion } from "../hooks/useAutenticacion";
import { Entrada } from "../componentes/Entrada";
import Boton from "../componentes/Boton";
import { PortadaMovilAutenticacion, AlternadorTemaAutenticacion, VisualAutenticacion } from "../componentes/Autenticacion";
import { CREDENCIALES_DEMO } from "../datos/usuarios";

export default function PaginaInicioSesion() {
  const { iniciarSesion, estaAutenticado } = useAutenticacion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [correo, establecerCorreo] = useState(CREDENCIALES_DEMO.correo);
  const [contrasena, establecerContrasena] = useState(CREDENCIALES_DEMO.contrasena);
  const [error, establecerError] = useState("");
  const [cargando, establecerCargando] = useState(false);

  if (estaAutenticado) {
    const from = (ubicacion.state as { from?: string })?.from ?? "/panel";
    return <Navigate to={from} replace />;
  }

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    establecerError("");
    if (!correo || !contrasena) {
      establecerError("Completa tu correo y contraseña.");
      return;
    }
    establecerCargando(true);
    try {
      await iniciarSesion(correo, contrasena);
      navegar("/panel");
    } catch (fallo) {
      establecerError(fallo instanceof Error ? fallo.message : "No pudimos iniciar sesión.");
    } finally {
      establecerCargando(false);
    }
  }

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
            <h1 className="auth-heading">Bienvenido nuevamente</h1>
            <p className="auth-subheading">Inicia sesión para continuar con tus temas de estudio.</p>
          </div>

          <form className="auth-form" onSubmit={manejarEnvio}>
            {error && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <Entrada
              etiqueta="Correo electrónico"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={correo}
              onChange={(e) => establecerCorreo(e.target.value)}
              autoComplete="email"
            />
            <Entrada
              etiqueta="Contraseña"
              type="password"
              placeholder="••••••••"
              value={contrasena}
              onChange={(e) => establecerContrasena(e.target.value)}
              autoComplete="current-password"
            />
            <Boton type="submit" tamano="lg" anchoCompleto cargando={cargando} className="auth-submit">
              Iniciar sesión
              {!cargando && <ArrowRight size={18} className="icon-nudge" aria-hidden="true" />}
            </Boton>
          </form>

          <div>
            <div className="auth-demo-hint">
              <strong>Cuenta demo:</strong> estudiante@demo.com · contraseña 123456
            </div>

            <p className="auth-switch">
              ¿No tienes una cuenta? <Link to="/registro">Crear cuenta</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
