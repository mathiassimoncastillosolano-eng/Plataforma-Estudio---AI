import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useAutenticacion } from "../hooks/useAutenticacion";
import { Entrada } from "../componentes/Entrada";
import Boton from "../componentes/Boton";
import { PortadaMovilAutenticacion, AlternadorTemaAutenticacion, VisualAutenticacion } from "../componentes/Autenticacion";

interface EstadoFormulario {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}

const estadoInicial: EstadoFormulario = {
  nombre: "",
  apellido: "",
  correo: "",
  contrasena: "",
  confirmarContrasena: "",
};

export default function PaginaRegistro() {
  const { registrar, estaAutenticado } = useAutenticacion();
  const navegar = useNavigate();
  const [formulario, establecerFormulario] = useState<EstadoFormulario>(estadoInicial);
  const [errores, establecerErrores] = useState<Partial<Record<keyof EstadoFormulario, string>>>({});
  const [errorFormulario, establecerErrorFormulario] = useState("");
  const [cargando, establecerCargando] = useState(false);

  if (estaAutenticado) return <Navigate to="/panel" replace />;

  function actualizar(campo: keyof EstadoFormulario, valor: string) {
    establecerFormulario((previo) => ({ ...previo, [campo]: valor }));
  }

  function validar(): boolean {
    const siguiente: Partial<Record<keyof EstadoFormulario, string>> = {};
    if (!formulario.nombre.trim()) siguiente.nombre = "Ingresa tus nombres.";
    if (!formulario.apellido.trim()) siguiente.apellido = "Ingresa tus apellidos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo)) siguiente.correo = "Ingresa un correo válido.";
    if (formulario.contrasena.length < 6) siguiente.contrasena = "Debe tener al menos 6 caracteres.";
    if (formulario.confirmarContrasena !== formulario.contrasena) siguiente.confirmarContrasena = "Las contraseñas no coinciden.";
    establecerErrores(siguiente);
    return Object.keys(siguiente).length === 0;
  }

  async function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    establecerErrorFormulario("");
    if (!validar()) return;
    establecerCargando(true);
    try {
      await registrar(formulario);
      navegar("/panel");
    } catch (fallo) {
      establecerErrorFormulario(fallo instanceof Error ? fallo.message : "No pudimos crear tu cuenta.");
    } finally {
      establecerCargando(false);
    }
  }

  return (
    <div className="auth-shell">
      <VisualAutenticacion
        mensaje={
          <>
            Sube tus apuntes y <span>estudia con un plan claro.</span>
          </>
        }
        descripcion="La IA organiza tu material en resúmenes, preguntas y un examen, y tú avanzas a tu ritmo."
      />

      <main className="auth-form-side">
        <AlternadorTemaAutenticacion />
        <PortadaMovilAutenticacion mensaje="Sube tus apuntes y estudia con un plan claro." />

        <div className="auth-form-card stagger">
          <div>
            <h1 className="auth-heading">Crea tu cuenta</h1>
            <p className="auth-subheading">Empieza a estudiar de forma más inteligente en minutos.</p>
          </div>

          <form className="auth-form" onSubmit={manejarEnvio}>
            {errorFormulario && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{errorFormulario}</span>
              </div>
            )}
            <div className="auth-form-row">
              <Entrada
                etiqueta="Nombres"
                autoComplete="given-name"
                placeholder="Juan"
                value={formulario.nombre}
                error={errores.nombre}
                onChange={(e) => actualizar("nombre", e.target.value)}
              />
              <Entrada
                etiqueta="Apellidos"
                autoComplete="family-name"
                placeholder="Pérez"
                value={formulario.apellido}
                error={errores.apellido}
                onChange={(e) => actualizar("apellido", e.target.value)}
              />
            </div>
            <Entrada
              etiqueta="Correo"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={formulario.correo}
              error={errores.correo}
              onChange={(e) => actualizar("correo", e.target.value)}
            />
            <Entrada
              etiqueta="Contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={formulario.contrasena}
              error={errores.contrasena}
              onChange={(e) => actualizar("contrasena", e.target.value)}
            />
            <Entrada
              etiqueta="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              value={formulario.confirmarContrasena}
              error={errores.confirmarContrasena}
              onChange={(e) => actualizar("confirmarContrasena", e.target.value)}
            />
            <Boton type="submit" tamano="lg" anchoCompleto cargando={cargando} className="auth-submit">
              Crear cuenta
              {!cargando && <ArrowRight size={18} className="icon-nudge" aria-hidden="true" />}
            </Boton>
          </form>

          <p className="auth-switch">
            ¿Ya tienes una cuenta? <Link to="/iniciar-sesion">Iniciar sesión</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
