import { BookOpen, ClipboardCheck, FilePlus2, HelpCircle, Share2 } from "lucide-react";
import type { TipoActividad } from "../datos/actividades";

export interface ItemListaActividad {
  id: string;
  tipo: TipoActividad;
  tituloTema: string;
  descripcion: string;
  tiempo: string;
}

const ICONOS: Record<TipoActividad, typeof BookOpen> = {
  resumen: BookOpen,
  preguntas: HelpCircle,
  prueba: ClipboardCheck,
  mapaMental: Share2,
  "tema-creado": FilePlus2,
};

/** Línea de tiempo de actividad (sin tarjeta). */
export default function ListaActividad({ elementos }: { elementos: ItemListaActividad[] }) {
  return (
    <div className="activity-list stagger">
      {elementos.map((a) => {
        const Icono = ICONOS[a.tipo];
        return (
          <div className="activity-item" key={a.id}>
            <div className="activity-icon">
              <Icono size={16} aria-hidden="true" />
            </div>
            <div>
              <p className="activity-title">
                <strong>{a.tituloTema}</strong> — {a.descripcion}
              </p>
              <p className="activity-time">{a.tiempo}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
