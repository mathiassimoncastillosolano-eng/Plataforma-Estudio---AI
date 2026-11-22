import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Boton from "../componentes/Boton";
import BuddyAvatar from "./BuddyAvatar";
import { useBuddy } from "./BuddyProvider";
import type { AccionBuddy, EventoBuddy } from "./tipos";

function useEjecutarAccion(alCerrar: () => void) {
  const navegar = useNavigate();
  return (accion: AccionBuddy) => {
    accion.alPulsar?.();
    alCerrar();
    if (accion.ruta) navegar(accion.ruta);
  };
}

interface PropsEscena {
  evento: EventoBuddy;
  saliendo: boolean;
  alCerrar: () => void;
}

function Detalles({ detalles }: { detalles?: string[] }) {
  if (!detalles || detalles.length === 0) return null;
  return (
    <ul className="buddy-chips">
      {detalles.map((d) => (
        <li key={d}>{d}</li>
      ))}
    </ul>
  );
}

function Burbuja({ evento, saliendo, alCerrar }: PropsEscena) {
  const ejecutar = useEjecutarAccion(alCerrar);
  return (
    <div className={`buddy-escena buddy-burbuja ${saliendo ? "saliendo" : ""}`} role="status" aria-live="polite">
      <div className="buddy-globo">
        {evento.cerrable && (
          <button type="button" className="buddy-cerrar" aria-label="Cerrar mensaje" onClick={alCerrar}>
            <X size={14} />
          </button>
        )}
        {evento.titulo && <strong className="buddy-titulo">{evento.titulo}</strong>}
        <p className="buddy-texto">{evento.mensaje}</p>
        <Detalles detalles={evento.detalles} />
        {evento.accion && (
          <button type="button" className="btn btn-primary btn-sm buddy-accion" onClick={() => ejecutar(evento.accion!)}>
            {evento.accion.etiqueta}
          </button>
        )}
        {evento.duracionMs !== null && <span className="buddy-tiempo" aria-hidden="true" style={{ ["--dur" as string]: `${evento.duracionMs}ms` } as CSSProperties} />}
      </div>
      <BuddyAvatar className="buddy-escena-avatar" expresion={evento.expresion} gesto={evento.gesto} mensaje={evento.mensaje} tamano={112} />
    </div>
  );
}

function Chispas({ tipo }: { tipo: "suaves" | "intensas" }) {
  const cantidad = tipo === "intensas" ? 18 : 10;
  return (
    <div className="buddy-chispas" aria-hidden="true">
      {Array.from({ length: cantidad }, (_, i) => {
        const angulo = (i / cantidad) * Math.PI * 2 + (i % 2 ? 0.3 : 0);
        const radio = 92 + (i % 3) * 30;
        const estilo = {
          ["--dx" as string]: `${Math.round(Math.cos(angulo) * radio)}px`,
          ["--dy" as string]: `${Math.round(Math.sin(angulo) * radio * 0.8 - 20)}px`,
          ["--d" as string]: `${(i % 6) * 90}ms`,
          ["--s" as string]: `${10 + (i % 3) * 5}px`,
        } as CSSProperties;
        return <i key={i} className={`c${i % 3}`} style={estilo} />;
      })}
    </div>
  );
}

function Tarjeta({ evento, saliendo, alCerrar }: PropsEscena) {
  const [omitida, establecerOmitida] = useState(false);
  const ejecutar = useEjecutarAccion(alCerrar);
  const refContinuar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    refContinuar.current?.focus();
  }, []);

  const particulas = omitida ? "ninguna" : evento.particulas;
  return (
    <div className={`buddy-velo ${saliendo ? "saliendo" : ""}`} onClick={alCerrar}>
      <div
        className={`buddy-tarjeta ${evento.particulas === "intensas" ? "especial" : ""} ${omitida ? "estatica" : ""}`}
        role="dialog"
        aria-label={evento.titulo ?? "Cursa Buddy"}
        onClick={(e) => e.stopPropagation()}
      >
        {particulas !== "ninguna" && <Chispas tipo={particulas} />}
        <button type="button" className="buddy-cerrar" aria-label="Cerrar" onClick={alCerrar}>
          <X size={16} />
        </button>
        <BuddyAvatar className="buddy-tarjeta-avatar" expresion={evento.expresion} gesto={evento.gesto} mensaje={evento.mensaje} tamano={150} animado={!omitida} />
        {evento.titulo && <strong className="buddy-titulo">{evento.titulo}</strong>}
        <p className="buddy-texto">{evento.mensaje}</p>
        <Detalles detalles={evento.detalles} />
        <div className="buddy-acciones">
          <button ref={refContinuar} type="button" className="btn btn-primary" onClick={alCerrar}>
            Continuar
          </button>
          {evento.accion && (
            <button type="button" className="btn btn-secondary" onClick={() => ejecutar(evento.accion!)}>
              {evento.accion.etiqueta}
            </button>
          )}
        </div>
        {evento.particulas !== "ninguna" && !omitida && (
          <button type="button" className="buddy-omitir" onClick={() => establecerOmitida(true)}>
            Omitir animación
          </button>
        )}
      </div>
    </div>
  );
}

function Invitacion({ evento, saliendo, alCerrar }: PropsEscena) {
  const ejecutar = useEjecutarAccion(alCerrar);
  return (
    <div className={`buddy-escena buddy-invitacion ${saliendo ? "saliendo" : ""}`} role="dialog" aria-label={evento.titulo}>
      <BuddyAvatar className="buddy-escena-avatar" expresion={evento.expresion} gesto={evento.gesto} mensaje={evento.mensaje} tamano={112} />
      <div className="buddy-globo">
        {evento.titulo && <strong className="buddy-titulo">{evento.titulo}</strong>}
        <p className="buddy-texto">{evento.mensaje}</p>
        <div className="buddy-acciones">
          {evento.accion && (
            <Boton tamano="sm" onClick={() => ejecutar(evento.accion!)}>
              {evento.accion.etiqueta}
            </Boton>
          )}
          {evento.accionSecundaria && (
            <Boton tamano="sm" variante="ghost" onClick={() => ejecutar(evento.accionSecundaria!)}>
              {evento.accionSecundaria.etiqueta}
            </Boton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BuddyEscenario() {
  const { actual, saliendo, cerrar } = useBuddy();
  const cerrable = actual !== null && actual.cerrable && actual.modo !== "tutorial" && actual.modo !== "invitacion";

  useEffect(() => {
    if (!cerrable) return;
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrar();
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [cerrable, cerrar]);

  if (!actual || actual.modo === "tutorial") return null;
  if (actual.modo === "tarjeta") return <Tarjeta key={actual.id} evento={actual} saliendo={saliendo} alCerrar={cerrar} />;
  if (actual.modo === "invitacion") return <Invitacion key={actual.id} evento={actual} saliendo={saliendo} alCerrar={cerrar} />;
  return <Burbuja key={actual.id} evento={actual} saliendo={saliendo} alCerrar={cerrar} />;
}
