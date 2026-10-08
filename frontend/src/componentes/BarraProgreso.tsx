interface PropsBarraProgreso {
  valor: number; // 0-100
  tono?: "blue" | "green" | "amber" | "navy";
}

export default function BarraProgreso({ valor, tono }: PropsBarraProgreso) {
  const acotado = Math.max(0, Math.min(100, valor));
  const tonoResuelto = tono ?? (acotado >= 76 ? "green" : acotado >= 51 ? "blue" : acotado >= 26 ? "amber" : "amber");
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={acotado} aria-valuemin={0} aria-valuemax={100}>
      <div className={`progress-fill tone-${tonoResuelto}`} style={{ width: `${acotado}%` }} />
    </div>
  );
}
