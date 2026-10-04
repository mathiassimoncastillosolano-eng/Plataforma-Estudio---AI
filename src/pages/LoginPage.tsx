import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/Input";
import Button from "../components/Button";
import { DEMO_CREDENTIALS } from "../data/users";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: string })?.from ?? "/dashboard";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Completa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-visual">
        <div />
        <div>
          <p className="auth-visual-quote">
            Convierte cualquier material en un plan de estudio <span>que se adapta a tu progreso.</span>
          </p>
          <p className="auth-visual-attribution">Cursa — estudio asistido por IA</p>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              <GraduationCap size={18} color="#fff" />
            </div>
            <span className="auth-brand-name">Cursa</span>
          </div>

          <h1 className="auth-heading">Bienvenido nuevamente</h1>
          <p className="auth-subheading">Inicia sesión para continuar con tus temas de estudio.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <Button type="submit" fullWidth loading={loading}>
              Iniciar sesión
            </Button>
          </form>

          <div className="auth-demo-hint">
            <strong>Cuenta demo:</strong> estudiante@demo.com · contraseña 123456
          </div>

          <p className="auth-switch">
            ¿No tienes una cuenta? <Link to="/register">Crear cuenta</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
