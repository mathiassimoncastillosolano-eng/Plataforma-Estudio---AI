import type { ReactNode } from "react";
import PantallaInicializacion from "./PantallaInicializacion";
import { almacenBackend, useEstadoBackend } from "../almacen/almacenBackend";

/** Muestra la pantalla de inicialización hasta que el backend responda; después, la aplicación. */
export default function PuertaBackend({ children }: { children: ReactNode }) {
  const estado = useEstadoBackend();
  if (estado.fase === "listo") return <>{children}</>;
  return <PantallaInicializacion estado={estado} alReintentar={() => almacenBackend.reintentar()} />;
}
