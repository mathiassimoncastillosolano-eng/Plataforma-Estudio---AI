import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { planificarHabla } from "./habla";
import { PRESENCIA_ESTADO, type EstadoBuddy, type Expresion, type Gesto } from "./tipos";

interface PropsAvatar {
  estado?: EstadoBuddy;
  expresion?: Expresion;
  gesto?: Gesto;
  mensaje?: string;
  anguloSenal?: number | null;
  tamano?: number;
  animado?: boolean;
  className?: string;
}

const CIAN = "#8be9ff";
const MICROGESTOS: Gesto[] = ["curioso", "lateral", "rebotar", "girar", "inclinar"];

function ojoRedondo(cx: number, rx: number, ry: number, cy = 94): ReactNode {
  return (
    <g key={cx}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={CIAN} />
      <ellipse cx={cx - rx * 0.28} cy={cy - ry * 0.36} rx={rx * 0.34} ry={ry * 0.3} fill="#fff" opacity="0.92" />
    </g>
  );
}

function ojoArco(cx: number, ancho = 10, y = 99, alto = 15): ReactNode {
  return <path key={cx} d={`M${cx - ancho} ${y} q${ancho} ${-alto} ${ancho * 2} 0`} stroke={CIAN} strokeWidth="5.5" strokeLinecap="round" fill="none" />;
}

function ojoMedio(cx: number): ReactNode {
  return <path key={cx} d={`M${cx - 9} 93 a9 8 0 0 0 18 0z`} fill={CIAN} />;
}

function ceja(x1: number, y1: number, x2: number, y2: number): ReactNode {
  return <path key={`${x1}-${y1}`} d={`M${x1} ${y1} L${x2} ${y2}`} stroke={CIAN} strokeWidth="3.2" strokeLinecap="round" />;
}

function Ojos({ expresion }: { expresion: Expresion }) {
  switch (expresion) {
    case "entusiasmo":
      return <>{ojoArco(78)}{ojoArco(122)}</>;
    case "orgullo":
      return <>{ojoArco(78, 9, 100, 12)}{ojoArco(122, 9, 100, 12)}</>;
    case "sorpresa":
      return <>{ojoRedondo(78, 10, 13)}{ojoRedondo(122, 10, 13)}</>;
    case "curiosidad":
      return <>{ojoRedondo(78, 8.5, 12.5)}{ojoRedondo(122, 8.5, 8, 95)}</>;
    case "concentracion":
      return <>{ojoMedio(78)}{ojoMedio(122)}</>;
    case "duda":
      return <>{ojoRedondo(78, 7.5, 9.5, 95)}{ojoRedondo(122, 7.5, 9.5, 95)}{ceja(68, 80, 87, 77)}</>;
    case "tristeza":
      return <>{ojoRedondo(78, 8, 10, 97)}{ojoRedondo(122, 8, 10, 97)}{ceja(68, 87, 87, 80)}{ceja(113, 80, 132, 87)}</>;
    case "motivacion":
      return <>{ojoRedondo(78, 8.5, 11)}{ojoRedondo(122, 8.5, 11)}{ceja(68, 79, 87, 84)}{ceja(113, 84, 132, 79)}</>;
    case "satisfaccion":
      return <>{ojoArco(78, 9, 99, 11)}{ojoArco(122, 9, 99, 11)}</>;
    case "entrecerrado":
      return <>{ojoMedio(78)}{ojoMedio(122)}{ceja(68, 84, 88, 86)}{ceja(112, 86, 132, 84)}</>;
    case "feliz":
      return <>{ojoRedondo(78, 8.5, 10.5)}{ojoRedondo(122, 8.5, 10.5)}</>;
    default:
      return <>{ojoRedondo(78, 8.5, 11)}{ojoRedondo(122, 8.5, 11)}</>;
  }
}

const TRAZO = { stroke: "#d8b4fe", strokeWidth: 3.6, strokeLinecap: "round" as const, fill: "none" };

function Boca({ expresion }: { expresion: Expresion }) {
  switch (expresion) {
    case "entusiasmo":
    case "motivacion":
      return (
        <>
          <path d="M85 108 h30 q0 18-15 18 q-15 0-15-18z" fill="#a78bfa" />
          <ellipse cx="100" cy="121" rx="8" ry="4" fill="#f5b3ff" opacity="0.85" />
        </>
      );
    case "feliz":
    case "orgullo":
      return (
        <>
          <path d="M89 109 h22 q0 14-11 14 q-11 0-11-14z" fill="#a78bfa" />
          <ellipse cx="100" cy="118.5" rx="5.5" ry="3" fill="#f5b3ff" opacity="0.85" />
        </>
      );
    case "satisfaccion":
      return <path d="M87 110 q13 13 26 0" {...TRAZO} />;
    case "sorpresa":
      return <ellipse cx="100" cy="116" rx="5" ry="6.5" fill="#a78bfa" />;
    case "curiosidad":
      return <path d="M92 114 q8 8 17 -2" {...TRAZO} />;
    case "concentracion":
      return <path d="M92 116 h16" {...TRAZO} />;
    case "duda":
      return <path d="M90 116 q5-5 10 0 t10 0" {...TRAZO} />;
    case "tristeza":
      return <path d="M92 120 q8-8 16 0" {...TRAZO} />;
    default:
      return <path d="M91 112 q9 9 18 0" {...TRAZO} />;
  }
}

function Extras({ expresion }: { expresion: Expresion }) {
  if (expresion === "duda") {
    return (
      <text x="166" y="44" fontSize="28" fontWeight="800" fill="#7c6df2" fontFamily="inherit">
        ?
      </text>
    );
  }
  if (expresion === "entusiasmo" || expresion === "motivacion") {
    return (
      <g stroke="#6d5de6" strokeWidth="3.6" strokeLinecap="round" className="buddy-destellos">
        <path d="M26 46 l-8 -9" />
        <path d="M19 60 h-12" />
        <path d="M174 46 l8 -9" />
        <path d="M181 60 h12" />
      </g>
    );
  }
  if (expresion === "orgullo") {
    return (
      <g fill="#fbbf24" className="buddy-destellos">
        <path d="M22 44 l2 4.6 4.6 2 -4.6 2 -2 4.6 -2 -4.6 -4.6 -2 4.6 -2z" />
        <path d="M180 50 l1.6 3.6 3.6 1.6 -3.6 1.6 -1.6 3.6 -1.6 -3.6 -3.6 -1.6 3.6 -1.6z" />
      </g>
    );
  }
  return null;
}

function Brazo({ lado, senalando, cuerpo, morado }: { lado: "izq" | "der"; senalando: boolean; cuerpo: string; morado: string }) {
  const x = lado === "izq" ? 62 : 138;
  const marca = senalando ? " senalando" : "";
  return (
    <g transform={`translate(${x} 162)`}>
      <g className={`buddy-brazo buddy-brazo-${lado}${marca}`}>
        <rect x="-7.5" y="0" width="15" height="26" rx="7.5" fill={cuerpo} stroke="#d8d4f0" strokeWidth="1" />
        <rect x="-7.8" y="15" width="15.6" height="5" rx="2.5" fill={morado} />
        <g transform="translate(0 22)">
          <g className={`buddy-antebrazo buddy-antebrazo-${lado}${marca}`}>
            <rect x="-7" y="0" width="14" height="19" rx="7" fill={cuerpo} stroke="#d8d4f0" strokeWidth="1" />
            <circle cx="0" cy="20" r="9.5" fill={morado} />
            <ellipse cx="-3" cy="16.5" rx="3.5" ry="2.2" fill="#fff" opacity="0.35" />
          </g>
        </g>
      </g>
    </g>
  );
}

export default function BuddyAvatar({ estado = "idle", expresion, gesto, mensaje = "", anguloSenal = null, tamano = 120, animado = true, className = "" }: PropsAvatar) {
  const base = PRESENCIA_ESTADO[estado];
  const exp = expresion ?? base.expresion;
  const gestoBase = gesto ?? base.gesto;
  const reducido = useMediaQuery("(prefers-reduced-motion: reduce)");
  const vivo = animado && !reducido;
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [parpadeo, establecerParpadeo] = useState(false);
  const [mirada, establecerMirada] = useState({ x: 0, y: 0 });
  const [micro, establecerMicro] = useState<Gesto | null>(null);
  const refSvg = useRef<SVGSVGElement>(null);
  const ges = gestoBase === "ninguno" && micro ? micro : gestoBase;

  useEffect(() => {
    if (!vivo) return;
    const temporizadores: number[] = [];
    let activo = true;
    const parpadear = () => {
      establecerParpadeo(true);
      temporizadores.push(window.setTimeout(() => activo && establecerParpadeo(false), 130));
    };
    const ciclo = () => {
      temporizadores.push(
        window.setTimeout(() => {
          if (!activo) return;
          parpadear();
          if (Math.random() < 0.18) temporizadores.push(window.setTimeout(() => activo && parpadear(), 280));
          ciclo();
        }, 2200 + Math.random() * 3600)
      );
    };
    ciclo();
    return () => {
      activo = false;
      temporizadores.forEach((t) => window.clearTimeout(t));
    };
  }, [vivo]);

  useEffect(() => {
    if (!vivo) {
      establecerMirada({ x: 0, y: 0 });
      return;
    }
    let temporizador = 0;
    let activo = true;
    const mover = () => {
      temporizador = window.setTimeout(() => {
        if (!activo) return;
        const centro = Math.random() < 0.35;
        establecerMirada(centro ? { x: 0, y: 0 } : { x: Math.round((Math.random() * 2 - 1) * 5), y: Math.round((Math.random() * 2 - 1) * 3) });
        mover();
      }, 1600 + Math.random() * 2600);
    };
    mover();
    return () => {
      activo = false;
      window.clearTimeout(temporizador);
    };
  }, [vivo]);

  useEffect(() => {
    const svg = refSvg.current;
    if (!svg) return;
    const habla = svg.querySelector<SVGGElement>(".buddy-boca-habla");
    const reposo = svg.querySelector<SVGGElement>(".buddy-boca-reposo");
    if (!habla || !reposo) return;
    const aplicar = (apertura: number) => {
      const abierta = apertura > 0.12;
      habla.style.opacity = abierta ? "1" : "0";
      reposo.style.opacity = abierta ? "0" : "1";
      habla.style.transform = `scale(${0.9 + apertura * 0.16}, ${Math.max(apertura, 0.05)})`;
    };
    const terminar = () => {
      aplicar(0);
      delete svg.dataset.habla;
    };
    if (!vivo || !mensaje.trim()) {
      terminar();
      return;
    }
    const plan = planificarHabla(mensaje);
    let indice = 0;
    let temporizador = 0;
    const avanzar = () => {
      if (indice >= plan.pasos.length) {
        terminar();
        return;
      }
      const paso = plan.pasos[indice++];
      aplicar(paso.apertura);
      temporizador = window.setTimeout(avanzar, paso.duracionMs);
    };
    const inicio = window.setTimeout(() => {
      svg.dataset.habla = "1";
      avanzar();
    }, 380);
    return () => {
      window.clearTimeout(inicio);
      window.clearTimeout(temporizador);
      terminar();
    };
  }, [mensaje, vivo]);

  useEffect(() => {
    if (!vivo || gestoBase !== "ninguno") {
      establecerMicro(null);
      return;
    }
    let activo = true;
    const temporizadores: number[] = [];
    const programar = () => {
      temporizadores.push(
        window.setTimeout(() => {
          if (!activo) return;
          const hablando = refSvg.current?.dataset.habla === "1";
          if (!hablando) {
            establecerMicro(MICROGESTOS[Math.floor(Math.random() * MICROGESTOS.length)]);
            temporizadores.push(window.setTimeout(() => activo && establecerMicro(null), 1900));
          }
          programar();
        }, 7000 + Math.random() * 7000)
      );
    };
    programar();
    return () => {
      activo = false;
      temporizadores.forEach((t) => window.clearTimeout(t));
    };
  }, [vivo, gestoBase]);

  const cuerpo = `url(#${u}-cuerpo)`;
  const morado = `url(#${u}-morado)`;
  const angulo = anguloSenal ?? 0;
  const ladoSenal: "izq" | "der" = angulo >= 0 ? "izq" : "der";
  const senalando = ges === "senalar-objetivo" && anguloSenal !== null;

  return (
    <svg
      ref={refSvg}
      className={`buddy ${vivo ? "buddy-vivo" : ""} ${parpadeo ? "parpadeo" : ""} ${className}`}
      data-gesto={ges}
      data-expresion={exp}
      viewBox="0 0 200 250"
      width={tamano}
      height={tamano * 1.25}
      role="img"
      aria-label="Cursa Buddy"
      style={{ ["--ang" as string]: `${angulo}deg` }}
    >
      <defs>
        <linearGradient id={`${u}-casco`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#f2f0fd" />
          <stop offset="1" stopColor="#d8d4f2" />
        </linearGradient>
        <linearGradient id={`${u}-cuerpo`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dedaf4" />
        </linearGradient>
        <linearGradient id={`${u}-morado`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c6df2" />
          <stop offset="1" stopColor="#4a3bc8" />
        </linearGradient>
        <linearGradient id={`${u}-pantalla`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15136a" />
          <stop offset="1" stopColor="#07062f" />
        </linearGradient>
      </defs>

      <ellipse className="buddy-sombra" cx="100" cy="246" rx="46" ry="6" fill="#6d5de6" opacity="0.2" />

      <g className="buddy-aparicion">
        <g className="buddy-cuerpo-todo">
          <g className="buddy-flota">
            <g className="buddy-piernas">
              <rect x="70" y="198" width="20" height="22" rx="9" fill={morado} />
              <rect x="110" y="198" width="20" height="22" rx="9" fill={morado} />
              <rect x="67" y="208" width="26" height="24" rx="11" fill={cuerpo} stroke="#d8d4f0" strokeWidth="1" />
              <rect x="107" y="208" width="26" height="24" rx="11" fill={cuerpo} stroke="#d8d4f0" strokeWidth="1" />
              <rect x="62" y="228" width="36" height="16" rx="8" fill={cuerpo} stroke="#d8d4f0" strokeWidth="1" />
              <rect x="102" y="228" width="36" height="16" rx="8" fill={cuerpo} stroke="#d8d4f0" strokeWidth="1" />
              <rect x="61" y="240" width="38" height="7" rx="3.5" fill={morado} />
              <rect x="101" y="240" width="38" height="7" rx="3.5" fill={morado} />
              <path className="buddy-luz" d="M68 235 h24" stroke="#7dd3fc" strokeWidth="2.6" strokeLinecap="round" />
              <path className="buddy-luz" d="M108 235 h24" stroke="#7dd3fc" strokeWidth="2.6" strokeLinecap="round" />
            </g>

            <g className="buddy-torso">
              <rect x="86" y="140" width="28" height="16" rx="7" fill="#4f41cf" />
              <rect x="64" y="148" width="72" height="62" rx="28" fill={cuerpo} stroke="#d8d4f0" strokeWidth="1.2" />
              <path d="M72 200 q28 10 56 0 v8 q-28 10-56 0z" fill={morado} />
              <g className="buddy-emblema">
                <rect x="86" y="162" width="28" height="30" rx="8" fill={morado} />
                <path className="buddy-luz" d="M100 164.5 l1.5 3 3 1.5 -3 1.5 -1.5 3 -1.5 -3 -3 -1.5 3 -1.5z" fill="#8be9ff" />
                <path d="M100 176 c-3.5-2.4-8.5-2.8-11.5-1.4 v12 c3-1.4 8-1 11.5 1.4 c3.5-2.4 8.5-2.8 11.5-1.4 v-12 c-3-1.4-8-1-11.5 1.4z" fill="#fff" opacity="0.95" />
                <path d="M100 176 v12.4" stroke="#6d5de6" strokeWidth="1.5" />
              </g>
              <circle cx="62" cy="162" r="9" fill={morado} />
              <circle cx="138" cy="162" r="9" fill={morado} />
            </g>

            <g className="buddy-cabeza">
              <ellipse cx="38" cy="98" rx="13" ry="22" fill={morado} />
              <ellipse cx="162" cy="98" rx="13" ry="22" fill={morado} />
              <path className="buddy-luz" d="M30 80 q-6 18 0 36" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path className="buddy-luz" d="M170 80 q6 18 0 36" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" fill="none" />
              <rect x="40" y="44" width="120" height="104" rx="46" fill={`url(#${u}-casco)`} stroke="#d8d4f0" strokeWidth="1.2" />
              <ellipse cx="70" cy="58" rx="20" ry="7" fill="#fff" opacity="0.7" transform="rotate(-20 70 58)" />
              <path d="M74 47 q26-9 52 0 q-3 9-9 9 h-34 q-6 0-9-9z" fill={morado} />
              <g className="buddy-antena">
                <path d="M101 47 q2-12 5-22" stroke="#6d5de6" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                <g className="buddy-estrella">
                  <path d="M108 8 l2.8 6 6 2.8 -6 2.8 -2.8 6 -2.8 -6 -6 -2.8 6 -2.8z" fill="#8be9ff" stroke="#38bdf8" strokeWidth="1.2" strokeLinejoin="round" />
                </g>
              </g>
              <rect x="50" y="56" width="100" height="82" rx="34" fill={`url(#${u}-pantalla)`} stroke="#2c2790" strokeWidth="2" />
              <path d="M64 72 q16-12 40-13" stroke="#fff" strokeOpacity="0.22" strokeWidth="4" strokeLinecap="round" fill="none" />
              <ellipse cx="68" cy="112" rx="7" ry="4.2" fill="#a78bfa" opacity="0.5" />
              <ellipse cx="132" cy="112" rx="7" ry="4.2" fill="#a78bfa" opacity="0.5" />
              <g className="buddy-ojos">
                <g className="buddy-mirada" style={{ transform: `translate(${mirada.x}px, ${mirada.y}px)` }}>
                  <g key={exp} className="buddy-ojos-exp">
                    <Ojos expresion={exp} />
                  </g>
                </g>
              </g>
              <g className="buddy-boca-reposo">
                <Boca expresion={exp} />
              </g>
              <g className="buddy-boca-habla">
                <path d="M89 109 h22 q0 14-11 14 q-11 0-11-14z" fill="#a78bfa" />
                <ellipse cx="100" cy="118.5" rx="5.5" ry="3" fill="#f5b3ff" opacity="0.85" />
              </g>
              <Extras expresion={exp} />
            </g>

            <Brazo lado="izq" senalando={senalando && ladoSenal === "izq"} cuerpo={cuerpo} morado={morado} />
            <Brazo lado="der" senalando={senalando && ladoSenal === "der"} cuerpo={cuerpo} morado={morado} />
          </g>
        </g>
      </g>
    </svg>
  );
}
