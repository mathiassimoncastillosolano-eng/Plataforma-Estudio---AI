import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/Input";
import Button from "../components/Button";
import { AuthMobileHero, AuthThemeToggle, AuthVisual } from "../components/Auth";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialState: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = "Ingresa tus nombres.";
    if (!form.lastName.trim()) next.lastName = "Ingresa tus apellidos.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Ingresa un correo válido.";
    if (form.password.length < 6) next.password = "Debe tener al menos 6 caracteres.";
    if (form.confirmPassword !== form.password) next.confirmPassword = "Las contraseñas no coinciden.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No pudimos crear tu cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <AuthVisual
        message={
          <>
            Sube tus apuntes y <span>estudia con un plan claro.</span>
          </>
        }
        description="La IA organiza tu material en resúmenes, preguntas y un examen, y tú avanzas a tu ritmo."
      />

      <main className="auth-form-side">
        <AuthThemeToggle />
        <AuthMobileHero message="Sube tus apuntes y estudia con un plan claro." />

        <div className="auth-form-card stagger">
          <div>
            <h1 className="auth-heading">Crea tu cuenta</h1>
            <p className="auth-subheading">Empieza a estudiar de forma más inteligente en minutos.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {formError && (
              <div className="auth-error" role="alert">
                <AlertCircle size={16} aria-hidden="true" />
                <span>{formError}</span>
              </div>
            )}
            <div className="auth-form-row">
              <Input
                label="Nombres"
                autoComplete="given-name"
                placeholder="Juan"
                value={form.firstName}
                error={errors.firstName}
                onChange={(e) => update("firstName", e.target.value)}
              />
              <Input
                label="Apellidos"
                autoComplete="family-name"
                placeholder="Pérez"
                value={form.lastName}
                error={errors.lastName}
                onChange={(e) => update("lastName", e.target.value)}
              />
            </div>
            <Input
              label="Correo"
              type="email"
              autoComplete="email"
              placeholder="tucorreo@ejemplo.com"
              value={form.email}
              error={errors.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <Input
              label="Contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              error={errors.password}
              onChange={(e) => update("password", e.target.value)}
            />
            <Input
              label="Confirmar contraseña"
              type="password"
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
            />
            <Button type="submit" size="lg" fullWidth loading={loading} className="auth-submit">
              Crear cuenta
              {!loading && <ArrowRight size={18} className="icon-nudge" aria-hidden="true" />}
            </Button>
          </form>

          <p className="auth-switch">
            ¿Ya tienes una cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
