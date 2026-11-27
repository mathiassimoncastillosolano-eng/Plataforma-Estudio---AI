import type { ReactNode } from "react";
import { CheckCircle2, ListChecks, XCircle } from "lucide-react";
import { useContadorAnimado } from "../../hooks/useContadorAnimado";

interface PropsResultadoRonda {
  correctas: number;
  incorrectas: number;
}

const TAMANO = 208;
const GROSOR = 12;
const RADIO = (TAMANO - GROSOR) / 2;
const RADIO_ARCO = RADIO - 14;
const CIRCUNFERENCIA_ARCO = 2 * Math.PI * RADIO_ARCO;
const MARCAS = 48;

function tonoPara(porcentaje: number): "excelente" | "bueno" | "regular" | "bajo" {
  if (porcentaje >= 80) return "excelente";
  if (porcentaje >= 60) return "bueno";
  if (porcentaje >= 35) return "regular";
  return "bajo";
}

const MENSAJES = {
  excelente: { titulo: "¡Ronda sobresaliente!", detalle: "Dominas este bloque. Sigue con ese ritmo." },
  bueno: { titulo: "¡Buen avance!", detalle: "Vas por buen camino; un repaso más y lo consolidas." },
  regular: { titulo: "Vas tomando forma", detalle: "Refuerza lo que falló y mejorarás en la próxima ronda." },
  bajo: { titulo: "Cada intento suma", detalle: "Repasa el resumen y vuelve a intentarlo con calma." },
} as const;

function Cifra({ icono, valor, etiqueta, tono, retraso }: { icono: ReactNode; valor: number; etiqueta: string; tono: string; retraso: number }) {
  const animado = useContadorAnimado(0, valor, 1100);
  return (
    <div className="ronda-cifra" data-tono={tono} style={{ animationDelay: `${retraso}ms` }}>
      <span className="ronda-cifra-icono" aria-hidden="true">
        {icono}
      </span>
      <strong className="mono">{animado}</strong>
      <span>{etiqueta}</span>
    </div>
  );
}

export default function ResultadoRonda({ correctas, incorrectas }: PropsResultadoRonda) {
  const total = correctas + incorrectas;
  const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
  const animado = useContadorAnimado(0, porcentaje, 1700);
  const tono = tonoPara(porcentaje);
  const mensaje = MENSAJES[tono];
  const encendidas = Math.round((animado / 100) * MARCAS);

  return (
    <section className="ronda-resultado" data-tono={tono} aria-label="Resultado de la ronda">
      <div className="ronda-anillo" style={{ width: TAMANO, height: TAMANO }} role="img" aria-label={`Aciertos: ${porcentaje}%`}>
        <span className="ronda-anillo-halo" aria-hidden="true" />
        <svg width={TAMANO} height={TAMANO} viewBox={`0 0 ${TAMANO} ${TAMANO}`} aria-hidden="true">
          <defs>
            <linearGradient id="ronda-degradado" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--ronda-color-a)" />
              <stop offset="100%" stopColor="var(--ronda-color-b)" />
            </linearGradient>
          </defs>
          {Array.from({ length: MARCAS }, (_, i) => (
            <line
              key={i}
              className={i < encendidas ? "ronda-marca encendida" : "ronda-marca"}
              x1={TAMANO / 2}
              y1={3}
              x2={TAMANO / 2}
              y2={8}
              transform={`rotate(${(360 / MARCAS) * i} ${TAMANO / 2} ${TAMANO / 2})`}
            />
          ))}
          <circle className="ronda-pista" cx={TAMANO / 2} cy={TAMANO / 2} r={RADIO_ARCO} fill="none" strokeWidth={GROSOR} />
          <circle
            className="ronda-arco"
            cx={TAMANO / 2}
            cy={TAMANO / 2}
            r={RADIO_ARCO}
            fill="none"
            strokeWidth={GROSOR}
            stroke="url(#ronda-degradado)"
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA_ARCO}
            strokeDashoffset={CIRCUNFERENCIA_ARCO * (1 - animado / 100)}
            transform={`rotate(-90 ${TAMANO / 2} ${TAMANO / 2})`}
            style={{ opacity: animado > 0 ? 1 : 0 }}
          />
        </svg>
        <div className="ronda-anillo-centro">
          <strong className="mono">{animado}%</strong>
          <span>Aciertos</span>
        </div>
      </div>

      <div className="ronda-texto">
        <span className="ronda-etiqueta">Práctica completada</span>
        <h2>{mensaje.titulo}</h2>
        <p className="text-muted">{mensaje.detalle}</p>
        <div className="ronda-cifras">
          <Cifra icono={<CheckCircle2 size={16} />} valor={correctas} etiqueta="Correctas" tono="ok" retraso={250} />
          <Cifra icono={<XCircle size={16} />} valor={incorrectas} etiqueta="Incorrectas" tono="mal" retraso={380} />
          <Cifra icono={<ListChecks size={16} />} valor={total} etiqueta="Preguntas" tono="total" retraso={510} />
        </div>
      </div>
    </section>
  );
}
