import type { ReactNode } from "react";

interface ModalProps {
  abierto: boolean;
  alCerrar: () => void;
  titulo?: string;
  children: ReactNode;
}

export default function Modal({ abierto, alCerrar, titulo, children }: ModalProps) {
  if (!abierto) return null;

  return (
    <div className="modal-overlay" onClick={alCerrar}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        {titulo && <h3 style={{ marginBottom: 14 }}>{titulo}</h3>}
        {children}
      </div>
    </div>
  );
}
