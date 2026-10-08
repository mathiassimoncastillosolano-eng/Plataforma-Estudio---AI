interface PropsMedidorDominio {
  valor: number; // 0-100
  tamano?: number;
  etiqueta?: string;
  strokeWidth?: number;
  className?: string;
}

function tonoPara(valor: number): "green" | "blue" | "amber" | "red" {
  if (valor >= 76) return "green";
  if (valor >= 51) return "blue";
  if (valor >= 26) return "amber";
  return "red";
}

export default function MedidorDominio({
  valor,
  tamano = 120,
  etiqueta = "Dominio",
  strokeWidth = 10,
  className = "",
}: PropsMedidorDominio) {
  const acotado = Math.max(0, Math.min(100, valor));
  const radius = (tamano - strokeWidth) / 2;
  const circunferencia = 2 * Math.PI * radius;
  const offset = circunferencia * (1 - acotado / 100);

  return (
    <div
      className={`mastery-gauge ${className}`}
      style={{ width: tamano, height: tamano }}
      role="img"
      aria-label={`${etiqueta}: ${acotado}%`}
    >
      <svg width={tamano} height={tamano} aria-hidden="true">
        <circle
          className="mastery-gauge-track"
          cx={tamano / 2}
          cy={tamano / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className={`mastery-gauge-arc tone-${tonoPara(acotado)}`}
          cx={tamano / 2}
          cy={tamano / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ ["--gauge-from" as string]: circunferencia }}
        />
      </svg>
      <div className="mastery-gauge-value">
        <strong style={{ fontSize: tamano * 0.26 }}>{acotado}%</strong>
        <span>{etiqueta}</span>
      </div>
    </div>
  );
}
