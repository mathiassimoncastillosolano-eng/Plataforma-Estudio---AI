import { Link } from "react-router-dom";
import type { FilaComparativa } from "../../utilidades/panelProgreso";
import VariacionPorcentual from "./VariacionPorcentual";

interface Props {
  filas: FilaComparativa[];
}

export default function ComparativaTemas({ filas }: Props) {
  return (
    <div className="dash-tabla-envoltorio">
      <table className="dash-tabla">
        <thead>
          <tr>
            <th scope="col">Tema</th>
            <th scope="col">Dominio</th>
            <th scope="col">Respondidas</th>
            <th scope="col">Precisión</th>
            <th scope="col">Cambio</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.id}>
              <th scope="row">
                <Link to={`/estudio/${fila.id}`}>{fila.titulo}</Link>
              </th>
              <td>
                <div className="dash-mini-barra" role="img" aria-label={`Dominio ${fila.dominio}%`}>
                  <span style={{ width: `${fila.dominio}%` }} />
                </div>
                <span className="dash-celda-valor">{fila.dominio}%</span>
              </td>
              <td>{fila.respondidas}</td>
              <td>{fila.precision === null ? "—" : `${fila.precision}%`}</td>
              <td>
                <VariacionPorcentual valor={fila.variacion} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
