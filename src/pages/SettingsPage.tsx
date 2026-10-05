import { useState } from "react";
import { Mail, ShieldCheck, Palette } from "lucide-react";
import ThemeSelector from "../components/ThemeSelector";
import ColorSchemeSelector from "../components/ColorSchemeSelector";
import Card from "../components/Card";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";

interface SettingToggle {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  icon: typeof Mail;
}

const initialToggles: SettingToggle[] = [
  {
    key: "email-reminders",
    label: "Recordatorios por correo",
    description: "Recibe un correo si llevas varios días sin estudiar un tema.",
    enabled: true,
    icon: Mail,
  },
  {
    key: "exam-difficulty",
    label: "Exámenes más exigentes",
    description: "Prioriza preguntas de dificultad media y alta en tus pruebas.",
    enabled: false,
    icon: ShieldCheck,
  },
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState(initialToggles);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  function toggle(key: string) {
    setToggles((prev) => prev.map((t) => (t.key === key ? { ...t, enabled: !t.enabled } : t)));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    localStorage.setItem("cursa.settings", JSON.stringify(toggles));
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSaving(false);
    setDirty(false);
    showToast("Preferencias guardadas correctamente.");
  }

  return (
    <div className="flow-shell" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 23 }}>Configuración</h1>
      <p className="text-muted" style={{ fontSize: 13.5, marginTop: 6, marginBottom: 26 }}>
        Ajusta tus preferencias de estudio. Estas opciones se guardan localmente en esta demo.
      </p>

      <Card>
        <div className="stack" style={{ gap: 0 }}>
          <div className="appearance-block">
            <div className="row gap-sm" style={{ alignItems: "flex-start" }}>
              <div className="stat-card-icon" style={{ marginTop: 2 }}>
                <Palette size={16} />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 14 }}>Apariencia</p>
                <p className="text-muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                  Elige el modo y el color de acento. Se aplica al instante en toda la plataforma.
                </p>
              </div>
            </div>
            <p className="panel-label">Modo</p>
            <ThemeSelector />
            <p className="panel-label">Color de acento</p>
            <ColorSchemeSelector />
          </div>

          {toggles.map((t, i) => {
            const Icon = t.icon;
            return (
              <div
                key={t.key}
                className="row-between"
                style={{
                  gap: 20,
                  padding: "18px 4px",
                  borderBottom: i < toggles.length - 1 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <div className="row gap-sm" style={{ alignItems: "flex-start" }}>
                  <div className="stat-card-icon" style={{ marginTop: 2 }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 14 }}>{t.label}</p>
                    <p className="text-muted" style={{ fontSize: 12.5, marginTop: 3, maxWidth: "38ch" }}>
                      {t.description}
                    </p>
                  </div>
                </div>
                <button
                  className={`switch ${t.enabled ? "on" : ""}`}
                  onClick={() => toggle(t.key)}
                  role="switch"
                  aria-checked={t.enabled}
                  aria-label={t.label}
                >
                  <span className="switch-knob" />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="row gap-sm" style={{ marginTop: 22 }}>
        <Button onClick={handleSave} loading={saving} disabled={!dirty && !saving}>
          Guardar cambios
        </Button>
        {dirty && !saving && (
          <span className="text-muted" style={{ fontSize: 12.5 }}>
            Tienes cambios sin guardar.
          </span>
        )}
      </div>
    </div>
  );
}
