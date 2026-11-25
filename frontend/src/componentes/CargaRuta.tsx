import { useLocation } from "react-router-dom";
import { moduloDesdeSegmento } from "../datos/modulosEstudio";
import CargaModulo, { type ModuloCarga } from "./CargaModulo";

const TIPO_CARGA: Record<string, ModuloCarga> = { resumen: "resumen", preguntas: "preguntas", prueba: "prueba", "mapa-mental": "mapa" };

export default function CargaRuta() {
  const { pathname } = useLocation();
  const [raiz, id, segmento] = pathname.split("/").slice(1);
  const modulo = moduloDesdeSegmento(segmento);
  const tipo: ModuloCarga = modulo ? (TIPO_CARGA[modulo.id] ?? "pagina") : raiz === "estudio" && id && id !== "nuevo" ? "tema" : "pagina";
  return <CargaModulo modulo={tipo} />;
}
