import { useEffect, useRef } from "react";
import { ArrowRight, Check, X } from "lucide-react";
import BuddyAvatar from "../BuddyAvatar";
import { useBuddy } from "../BuddyProvider";
import { CATEGORIAS_GUIA, GUIAS } from "./guias";
import { useTutorial } from "./TutorialProvider";

export default function CentroAyuda() {
  const { ayudaAbierta, cerrarAyuda, persistido } = useBuddy();
  const { iniciar } = useTutorial();
  const refCerrar = useRef<HTMLButtonElement>(null);
  const refPrevio = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!ayudaAbierta) return;
    refPrevio.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    refCerrar.current?.focus();
    const desbordePrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const alTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") cerrarAyuda();
    };
    window.addEventListener("keydown", alTecla);
    return () => {
      window.removeEventListener("keydown", alTecla);
      document.body.style.overflow = desbordePrevio;
      refPrevio.current?.focus?.();
    };
  }, [ayudaAbierta, cerrarAyuda]);

  if (!ayudaAbierta) return null;

  return (
    <div className="buddy-ayuda-velo" onClick={cerrarAyuda}>
      <div className="buddy-ayuda" role="dialog" aria-modal="true" aria-labelledby="buddy-ayuda-titulo" onClick={(e) => e.stopPropagation()}>
        <header className="buddy-ayuda-cabecera">
          <BuddyAvatar estado="greeting" tamano={96} hablando />
          <div>
            <p className="eyebrow">Centro de ayuda</p>
            <h2 id="buddy-ayuda-titulo">¿Qué quieres aprender hoy?</h2>
            <p>Elige una guía y te lo muestro paso a paso, directamente sobre la plataforma.</p>
          </div>
          <button ref={refCerrar} type="button" className="buddy-cerrar" aria-label="Cerrar ayuda" onClick={cerrarAyuda}>
            <X size={16} />
          </button>
        </header>

        <div className="buddy-ayuda-cuerpo">
          {CATEGORIAS_GUIA.map((categoria) => (
            <section key={categoria} aria-label={categoria}>
              <h3 className="buddy-ayuda-seccion">{categoria}</h3>
              <ul className="buddy-ayuda-rejilla">
                {GUIAS.filter((g) => g.categoria === categoria).map((guia) => {
                  const Icono = guia.icono;
                  const estado = persistido.guias[guia.id];
                  return (
                    <li key={guia.id}>
                      <button type="button" className="buddy-guia" data-tono={guia.tono} onClick={() => iniciar(guia.id)}>
                        <span className="buddy-guia-icono" aria-hidden="true">
                          <Icono size={22} strokeWidth={1.9} />
                        </span>
                        <span className="buddy-guia-texto">
                          <strong>{guia.titulo}</strong>
                          <small>{guia.descripcion}</small>
                        </span>
                        {estado === "completada" ? (
                          <span className="buddy-guia-estado" aria-label="Guía completada">
                            <Check size={14} />
                          </span>
                        ) : (
                          <ArrowRight size={16} className="buddy-guia-ir" aria-hidden="true" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
