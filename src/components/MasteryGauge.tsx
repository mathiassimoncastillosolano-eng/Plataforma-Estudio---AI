interface MasteryGaugeProps {
  value: number; // 0-100
  size?: number;
  label?: string;
  strokeWidth?: number;
  className?: string;
}

function toneFor(value: number): "green" | "blue" | "amber" | "red" {
  if (value >= 76) return "green";
  if (value >= 51) return "blue";
  if (value >= 26) return "amber";
  return "red";
}

export default function MasteryGauge({
  value,
  size = 120,
  label = "Dominio",
  strokeWidth = 10,
  className = "",
}: MasteryGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={`mastery-gauge ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped}%`}
    >
      <svg width={size} height={size} aria-hidden="true">
        <circle
          className="mastery-gauge-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        <circle
          className={`mastery-gauge-arc tone-${toneFor(clamped)}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ ["--gauge-from" as string]: circumference }}
        />
      </svg>
      <div className="mastery-gauge-value">
        <strong style={{ fontSize: size * 0.26 }}>{clamped}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
