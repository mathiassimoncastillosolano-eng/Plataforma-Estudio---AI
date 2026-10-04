interface ProgressBarProps {
  value: number; // 0-100
  tone?: "blue" | "green" | "amber" | "navy";
}

export default function ProgressBar({ value, tone }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const resolvedTone = tone ?? (clamped >= 76 ? "green" : clamped >= 51 ? "blue" : clamped >= 26 ? "amber" : "amber");
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill tone-${resolvedTone}`} style={{ width: `${clamped}%` }} />
    </div>
  );
}
