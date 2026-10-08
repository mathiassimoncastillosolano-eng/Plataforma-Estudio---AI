import type { MetadatosResumen, TipoResumen } from "../../tipos";

export const TEXTOS_TIPO_RESUMEN: Record<TipoResumen, { etiqueta: string; titulo: string; descripcion: string }> = {
  esencial: {
    etiqueta: "Esencial",
    titulo: "Resumen esencial",
    descripcion: "Lo fundamental, corto y directo. Ideal para repasar rápido.",
  },
  general: {
    etiqueta: "General",
    titulo: "Resumen general",
    descripcion: "Desarrollado por secciones, con todos los conceptos importantes del material.",
  },
};

/** Etiqueta honesta del origen del resumen. `tono` coincide con las clases CSS `origin-*`. */
export function etiquetaOrigen(origen: MetadatosResumen["origen"]): { texto: string; tono: "ai" | "sample" } {
  return origen === "ejemplo" ? { texto: "Resumen de ejemplo", tono: "sample" } : { texto: "Generado con IA", tono: "ai" };
}
