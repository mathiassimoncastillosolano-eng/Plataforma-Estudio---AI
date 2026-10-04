interface MasteryGaugeProps {
  value: number; // 0-100
  size?: number;
  label?: string;
  strokeWidth?: number;
}

export default function MasteryGauge({ value, size = 120, label = "Dominio", strokeWidth = 10 }: MasteryGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const color = clamped >= 76 ? "#22c55e" : clamped >= 51 ? "#2563eb" : clamped >= 26 ? "#f59e0b" : "#ef4444";

  return (
    <div className="mastery-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#eef2f7"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="mastery-gauge-value">
        <strong style={{ fontSize: size * 0.24 }}>{clamped}%</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
