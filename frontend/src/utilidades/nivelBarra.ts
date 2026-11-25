export type NivelBarra = "inicial" | "medio" | "alto" | "maestria";

export function nivelBarra(dominio: number): NivelBarra {
  if (dominio >= 76) return "maestria";
  if (dominio >= 51) return "alto";
  if (dominio >= 26) return "medio";
  return "inicial";
}
