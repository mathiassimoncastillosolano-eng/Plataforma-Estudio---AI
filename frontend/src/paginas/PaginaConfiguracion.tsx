import { useState } from "react";
import { Mail, ShieldCheck, Palette } from "lucide-react";
import SelectorTemaVisual from "../componentes/SelectorTemaVisual";
import SelectorEsquemaColor from "../componentes/SelectorEsquemaColor";
import Tarjeta from "../componentes/Tarjeta";
import Boton from "../componentes/Boton";
import { useAviso } from "../hooks/useAviso";
import EncabezadoPagina from "../componentes/EncabezadoPagina";

interface InterruptorConfiguracion {
  clave: string;
  etiqueta: string;
  descripcion: string;
  habilitado: boolean;
  icono: typeof Mail;
}

const interruptoresIniciales: InterruptorConfiguracion[] = [
  {
    clave: "email-reminders",
    etiqueta: "Recordatorios por correo",
    descripcion: "Recibe un correo si llevas varios días sin estudiar un tema.",
    habilitado: true,
    icono: Mail,
  },
  {
    clave: "exam-difficulty",
    etiqueta: "Exámenes más exigentes",
    descripcion: "Prioriza preguntas de dificultad media y alta en tus pruebas.",
    habilitado: false,
    icono: ShieldCheck,
  },
];

export default function PaginaConfiguracion() {
  const [interruptores, establecerInterruptores] = useState(interruptoresIniciales);
  const [modificado, establecerModificado] = useState(false);
  const [guardando, establecerGuardando] = useState(false);
  const { mostrarAviso } = useAviso();

  function alternar(clave: string) {
    establecerInterruptores((previo) => previo.map((t) => (t.clave === clave ? { ...t, habilitado: !t.habilitado } : t)));
    establecerModificado(true);
  }

  async function manejarGuardado() {
    establecerGuardando(true);
    localStorage.setItem("estudioai.configuracion", JSON.stringify(interruptores));
    await new Promise((resolver) => setTimeout(resolver, 500));
    establecerGuardando(false);
    establecerModificado(false);
    mostrarAviso("Preferencias guardadas correctamente.");
  }

  return (
    <div className="page-narrow is-small">
      <EncabezadoPagina titulo="Configuración" descripcion="Ajusta tus preferencias de estudio. Estas opciones se guardan localmente en esta demo." />

      <Tarjeta>
        <div className="stack">
          <div className="appearance-block">
            <div className="settings-row-label">
              <div className="stat-card-icon">
                <Palette size={16} />
              </div>
              <div>
                <strong>Apariencia</strong>
                <small>Elige el modo y el color de acento. Se aplica al instante en toda la plataforma.</small>
              </div>
            </div>
            <p className="panel-label">Modo</p>
            <SelectorTemaVisual />
            <p className="panel-label">Color de acento</p>
            <SelectorEsquemaColor />
          </div>

          {interruptores.map((t) => {
            const Icono = t.icono;
            return (
              <div key={t.clave} className="settings-row">
                <div className="settings-row-label">
                  <div className="stat-card-icon">
                    <Icono size={16} />
                  </div>
                  <div>
                    <strong>{t.etiqueta}</strong>
                    <small>{t.descripcion}</small>
                  </div>
                </div>
                <button
                  className={`switch ${t.habilitado ? "on" : ""}`}
                  onClick={() => alternar(t.clave)}
                  role="switch"
                  aria-checked={t.habilitado}
                  aria-label={t.etiqueta}
                >
                  <span className="switch-knob" />
                </button>
              </div>
            );
          })}
        </div>
      </Tarjeta>

      <div className="form-actions">
        <Boton onClick={manejarGuardado} cargando={guardando} disabled={!modificado && !guardando}>
          Guardar cambios
        </Boton>
        {modificado && !guardando && <span>Tienes cambios sin guardar.</span>}
      </div>
    </div>
  );
}
