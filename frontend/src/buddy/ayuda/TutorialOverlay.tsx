import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import Boton from "../../componentes/Boton";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import BuddyAvatar from "../BuddyAvatar";
import { useBuddy } from "../BuddyProvider";
import { normalizarRuta, resolverRuta } from "./guias";
import { useTutorial } from "./TutorialProvider";

interface Caja {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ANCHO_TARJETA = 340;
const MARGEN = 12;
const HUECO = 18;
const RELLENO = 8;

function buscarObjetivo(ids: string[]): HTMLElement | null {
  for (const id of ids) {
    const candidatos = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`));
    const visible = candidatos.find((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
    });
    if (visible) return visible;
  }
  return null;
}

function colocar(caja: Caja | null, vista: { w: number; h: number }, ancho: number, alto: number): { x: number; y: number } {
  const limitarX = (x: number) => Math.max(MARGEN, Math.min(vista.w - ancho - MARGEN, x));
  const limitarY = (y: number) => Math.max(MARGEN, Math.min(vista.h - alto - MARGEN, y));
  if (!caja) return { x: limitarX((vista.w - ancho) / 2), y: limitarY((vista.h - alto) / 2) };
  const centro = caja.left + caja.width / 2;
  const abajo = caja.top + caja.height + HUECO;
  if (abajo + alto <= vista.h - MARGEN) return { x: limitarX(centro - ancho / 2), y: abajo };
  const arriba = caja.top - HUECO - alto;
  if (arriba >= MARGEN) return { x: limitarX(centro - ancho / 2), y: arriba };
  if (caja.left + caja.width + HUECO + ancho <= vista.w - MARGEN) return { x: caja.left + caja.width + HUECO, y: limitarY(caja.top) };
  if (caja.left - HUECO - ancho >= MARGEN) return { x: caja.left - HUECO - ancho, y: limitarY(caja.top) };
  return { x: limitarX(centro - ancho / 2), y: vista.h - alto - MARGEN };
}

export default function TutorialOverlay() {
  const { guia, indice, temaId, sinTema, idEvento, siguiente, anterior, omitir, cerrar, irAPaso } = useTutorial();
  const { actual } = useBuddy();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  const movil = useMediaQuery("(max-width: 640px)");
  const reducido = useMediaQuery("(prefers-reduced-motion: reduce)");

  const visible = guia !== null && actual?.id === idEvento;
  const paso = guia && !sinTema ? guia.pasos[indice] : undefined;
  const total = guia?.pasos.length ?? 0;
  const ruta = paso ? resolverRuta(paso.ruta, temaId) : null;
  const rutaActual = normalizarRuta(ubicacion.pathname);
  const enRuta = ruta !== null && rutaActual === ruta;
  const clave = visible && guia ? `${guia.id}:${indice}` : "";

  const [objetivo, establecerObjetivo] = useState<HTMLElement | null>(null);
  const [ausente, establecerAusente] = useState(false);
  const [caja, establecerCaja] = useState<Caja | null>(null);
  const [reintento, establecerReintento] = useState(0);
  const [fuera, establecerFuera] = useState(false);
  const [angulo, establecerAngulo] = useState<number | null>(null);
  const [tam, establecerTam] = useState({ w: ANCHO_TARJETA, h: 200 });
  const [vista, establecerVista] = useState({ w: window.innerWidth, h: window.innerHeight });
  const navegadoRef = useRef("");
  const direccionRef = useRef(1);
  const refTarjeta = useRef<HTMLDivElement>(null);
  const refAvatar = useRef<HTMLDivElement>(null);
  const refSiguiente = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!visible || !guia || !ruta) {
      establecerFuera(false);
      return;
    }
    if (rutaActual === ruta) {
      navegadoRef.current = clave;
      establecerFuera(false);
      return;
    }
    if (navegadoRef.current !== clave) {
      navegadoRef.current = clave;
      establecerFuera(false);
      navegar(ruta);
      return;
    }
    const salto = guia.pasos.findIndex((p, i) => i > indice && resolverRuta(p.ruta, temaId) === rutaActual);
    if (salto >= 0) {
      establecerFuera(false);
      irAPaso(salto);
      return;
    }
    establecerFuera(true);
  }, [visible, guia, ruta, rutaActual, clave, indice, temaId, navegar, irAPaso]);

  useEffect(() => {
    establecerObjetivo(null);
    establecerAusente(false);
    establecerCaja(null);
    establecerAngulo(null);
    if (!visible || !paso || !enRuta) return;
    let intentos = 0;
    let activo = true;
    let temporizador = 0;
    const buscar = () => {
      if (!activo) return;
      const elemento = buscarObjetivo(paso.objetivos);
      if (elemento) {
        establecerObjetivo(elemento);
        elemento.scrollIntoView({ block: "center", inline: "nearest", behavior: reducido ? "auto" : "smooth" });
        return;
      }
      intentos += 1;
      if (intentos >= 28) {
        establecerAusente(true);
        return;
      }
      temporizador = window.setTimeout(buscar, 160);
    };
    buscar();
    return () => {
      activo = false;
      window.clearTimeout(temporizador);
    };
  }, [visible, paso, enRuta, reintento, reducido]);

  useEffect(() => {
    if (!objetivo) return;
    let cuadro = 0;
    const medir = () => {
      if (!objetivo.isConnected) {
        establecerReintento((r) => r + 1);
        return;
      }
      const r = objetivo.getBoundingClientRect();
      establecerCaja((previa) =>
        previa && Math.abs(previa.top - r.top) < 0.5 && Math.abs(previa.left - r.left) < 0.5 && Math.abs(previa.width - r.width) < 0.5 && Math.abs(previa.height - r.height) < 0.5
          ? previa
          : { top: r.top, left: r.left, width: r.width, height: r.height }
      );
    };
    const programar = () => {
      window.cancelAnimationFrame(cuadro);
      cuadro = window.requestAnimationFrame(medir);
    };
    medir();
    window.addEventListener("scroll", programar, true);
    window.addEventListener("resize", programar);
    const observador = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(programar);
    observador?.observe(objetivo);
    const intervalo = window.setInterval(medir, 300);
    return () => {
      window.cancelAnimationFrame(cuadro);
      window.removeEventListener("scroll", programar, true);
      window.removeEventListener("resize", programar);
      observador?.disconnect();
      window.clearInterval(intervalo);
    };
  }, [objetivo]);

  useEffect(() => {
    const alRedimensionar = () => establecerVista({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", alRedimensionar);
    return () => window.removeEventListener("resize", alRedimensionar);
  }, []);

  useEffect(() => {
    const tarjeta = refTarjeta.current;
    if (!visible || !tarjeta || typeof ResizeObserver === "undefined") return;
    const observador = new ResizeObserver(() => establecerTam({ w: tarjeta.offsetWidth, h: tarjeta.offsetHeight }));
    observador.observe(tarjeta);
    establecerTam({ w: tarjeta.offsetWidth, h: tarjeta.offsetHeight });
    return () => observador.disconnect();
  }, [visible, fuera, sinTema, indice]);

  useEffect(() => {
    if (!visible || !ausente || !paso?.opcional) return;
    if (direccionRef.current < 0 && indice > 0) irAPaso(indice - 1);
    else if (direccionRef.current >= 0) siguiente();
  }, [visible, ausente, paso, indice, irAPaso, siguiente]);

  useEffect(() => {
    if (visible) refSiguiente.current?.focus({ preventScroll: true });
  }, [visible, indice, sinTema]);

  useEffect(() => {
    if (!visible) return;
    const alTecla = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const escribiendo = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "Escape") cerrar();
      else if (!escribiendo && e.key === "ArrowRight") {
        direccionRef.current = 1;
        siguiente();
      } else if (!escribiendo && e.key === "ArrowLeft") {
        direccionRef.current = -1;
        anterior();
      }
    };
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, [visible, cerrar, siguiente, anterior]);

  const ancho = movil ? vista.w - MARGEN * 2 : 104 + 8 + ANCHO_TARJETA;
  const alto = Math.max(tam.h, 130);
  const posicion = colocar(!ausente && !fuera && !sinTema ? caja : null, vista, ancho, alto);
  const abajoMovil = caja ? caja.top + caja.height / 2 < vista.h * 0.5 : true;

  useLayoutEffect(() => {
    const avatar = refAvatar.current;
    if (!visible || !caja || ausente || !avatar) {
      return;
    }
    const r = avatar.getBoundingClientRect();
    const objetivoX = caja.left + caja.width / 2;
    const objetivoY = caja.top + caja.height / 2;
    const derecha = objetivoX >= r.left + r.width / 2;
    const hombroX = r.left + ((derecha ? 138 : 62) / 200) * r.width;
    const hombroY = r.top + (162 / 250) * r.height;
    const bruto = (Math.atan2(-(objetivoX - hombroX), objetivoY - hombroY) * 180) / Math.PI;
    const limitado = Math.max(-155, Math.min(155, derecha ? Math.min(bruto, 0) : Math.max(bruto, 0)));
    establecerAngulo((previo) => (previo !== null && Math.abs(previo - limitado) < 1 ? previo : Math.round(limitado)));
  }, [visible, caja, ausente, posicion.x, posicion.y, movil, tam.h]);

  if (!visible || !guia) return null;

  const enPausa = fuera && !sinTema;
  const apuntando = !!caja && !ausente && !enPausa && !sinTema;
  const gesto = apuntando ? "senalar-objetivo" : enPausa ? "inclinar" : "saludar";
  const expresion = enPausa ? "duda" : paso?.expresion ?? (apuntando ? "entusiasmo" : "feliz");
  const esUltimo = indice >= total - 1;
  const tamanoAvatar = movil ? 76 : 104;

  const estiloContenedor = movil
    ? undefined
    : { transform: `translate(${Math.round(posicion.x)}px, ${Math.round(posicion.y)}px)`, width: ancho };

  const spotlight =
    apuntando && caja ? { top: caja.top - RELLENO, left: caja.left - RELLENO, width: caja.width + RELLENO * 2, height: caja.height + RELLENO * 2 } : null;

  let titulo = paso?.titulo ?? "";
  let mensaje = paso ? (ausente ? paso.alternativa ?? "Este elemento todavía no está disponible en esta pantalla. Puedes seguir con el siguiente paso." : paso.mensaje) : "";
  if (sinTema) {
    titulo = "Primero necesitas un tema";
    mensaje = "Esta guía se muestra sobre un tema real. Crea el tuyo y vuelve a abrirla desde la ayuda.";
  } else if (enPausa) {
    titulo = "Recorrido en pausa";
    mensaje = `Saliste de la pantalla de «${guia.titulo}». Puedes retomarlo donde lo dejaste.`;
  }

  return (
    <div className="buddy-tut" data-fuera={enPausa || undefined}>
      {spotlight && <div className="buddy-tut-foco" style={spotlight} aria-hidden="true" />}
      {!spotlight && !enPausa && <div className="buddy-tut-velo" aria-hidden="true" />}

      <div className={`buddy-tut-caja ${movil ? `movil ${abajoMovil ? "abajo" : "arriba"}` : ""} ${reducido ? "sin-movimiento" : ""}`} style={estiloContenedor}>
        <div className="buddy-tut-avatar" ref={refAvatar}>
          <BuddyAvatar expresion={expresion} gesto={gesto} anguloSenal={apuntando ? angulo : null} tamano={tamanoAvatar} mensaje={mensaje} />
        </div>
        <div className="buddy-tut-tarjeta" ref={refTarjeta} role="dialog" aria-live="polite" aria-label={titulo}>
          <button type="button" className="buddy-cerrar" aria-label="Cerrar recorrido" onClick={cerrar}>
            <X size={14} />
          </button>
          {!sinTema && !enPausa && (
            <div className="buddy-tut-progreso">
              <span>
                Paso {indice + 1} de {total}
              </span>
              <div className="buddy-tut-barra" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={indice + 1}>
                <i style={{ width: `${((indice + 1) / total) * 100}%` }} />
              </div>
            </div>
          )}
          <strong className="buddy-titulo">{titulo}</strong>
          <p className="buddy-texto">{mensaje}</p>

          {sinTema ? (
            <div className="buddy-acciones">
              <Boton
                tamano="sm"
                onClick={() => {
                  cerrar();
                  navegar("/estudio/nuevo");
                }}
              >
                Crear un tema
              </Boton>
              <Boton tamano="sm" variante="ghost" onClick={cerrar}>
                Cerrar
              </Boton>
            </div>
          ) : enPausa ? (
            <div className="buddy-acciones">
              <Boton
                tamano="sm"
                onClick={() => {
                  if (ruta) navegar(ruta);
                }}
              >
                Retomar
              </Boton>
              <Boton tamano="sm" variante="ghost" onClick={cerrar}>
                Salir
              </Boton>
            </div>
          ) : (
            <div className="buddy-tut-pie">
              <button type="button" className="buddy-omitir" onClick={omitir}>
                Omitir
              </button>
              <div className="buddy-tut-nav">
                <Boton
                  tamano="sm"
                  variante="ghost"
                  disabled={indice === 0}
                  onClick={() => {
                    direccionRef.current = -1;
                    anterior();
                  }}
                  icono={<ArrowLeft size={14} />}
                >
                  Anterior
                </Boton>
                <button
                  ref={refSiguiente}
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    direccionRef.current = 1;
                    siguiente();
                  }}
                >
                  {esUltimo ? "Finalizar" : "Siguiente"}
                  {esUltimo ? <Check size={14} /> : <ArrowRight size={14} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
