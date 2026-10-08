import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import { idAleatorio } from "../utilidades/retardoSimulado";

interface ElementoAviso {
  id: string;
  mensaje: string;
}

interface ValorContextoAviso {
  mostrarAviso: (mensaje: string) => void;
}

const ContextoAviso = createContext<ValorContextoAviso | undefined>(undefined);

export function ProveedorAviso({ children }: { children: ReactNode }) {
  const [avisos, establecerAvisos] = useState<ElementoAviso[]>([]);

  const mostrarAviso = useCallback((mensaje: string) => {
    const id = idAleatorio("toast");
    establecerAvisos((previo) => [...previo, { id, mensaje }]);
    setTimeout(() => {
      establecerAvisos((previo) => previo.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ContextoAviso.Provider value={{ mostrarAviso }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {avisos.map((t) => (
          <div className="toast" key={t.id} role="status">
            <span className="toast-icon">
              <CheckCircle2 size={17} />
            </span>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ContextoAviso.Provider>
  );
}

export function useAviso(): ValorContextoAviso {
  const ctx = useContext(ContextoAviso);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
