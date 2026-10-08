import type { ReactNode } from "react";

interface PropsInsignia {
  tono?: "blue" | "green" | "amber" | "red" | "neutral";
  children: ReactNode;
}

export default function Insignia({ tono = "neutral", children }: PropsInsignia) {
  return <span className={`badge badge-${tono}`}>{children}</span>;
}
