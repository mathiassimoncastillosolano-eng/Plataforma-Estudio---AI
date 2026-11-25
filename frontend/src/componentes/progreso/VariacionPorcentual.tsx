import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

interface Props {
  valor: number | null;
  sufijo?: string;
}

export default function VariacionPorcentual({ valor, sufijo }: Props) {
  if (valor === null) return <span className="dash-var is-neutra">Sin periodo previo</span>;
  const Icono = valor > 0 ? ArrowUpRight : valor < 0 ? ArrowDownRight : Minus;
  const clase = valor > 0 ? "is-sube" : valor < 0 ? "is-baja" : "is-neutra";
  const texto = `${valor > 0 ? "+" : ""}${valor}%`;
  return (
    <span className={`dash-var ${clase}`}>
      <Icono size={14} aria-hidden="true" />
      {texto}
      {sufijo ? ` ${sufijo}` : ""}
    </span>
  );
}
