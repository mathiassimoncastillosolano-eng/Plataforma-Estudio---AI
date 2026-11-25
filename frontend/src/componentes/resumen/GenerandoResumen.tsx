import CargaModulo from "../CargaModulo";

export default function GenerandoResumen({ alCancelar }: { alCancelar: () => void }) {
  return <CargaModulo modulo="resumen" descripcion="Generamos el resumen general y el esencial. Mientras tanto, preparamos tu mapa conceptual." alCancelar={alCancelar} />;
}
