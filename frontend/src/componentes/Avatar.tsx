import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { iniciales } from "../utilidades/formato";

interface AvatarProps {
  nombre: string;
  apellido: string;
  /** Foto de perfil de Google; si falta o no carga, se usan las iniciales. */
  foto?: string;
  tamano?: number;
}

export default function Avatar({ nombre, apellido, foto, tamano = 36 }: AvatarProps) {
  const [fotoFallida, establecerFotoFallida] = useState(false);
  useEffect(() => establecerFotoFallida(false), [foto]);

  const texto = iniciales(nombre, apellido);
  return (
    <div className="avatar" style={{ width: tamano, height: tamano, fontSize: tamano * 0.36, overflow: "hidden" }}>
      {foto && !fotoFallida ? (
        <img src={foto} alt="" referrerPolicy="no-referrer" width={tamano} height={tamano} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => establecerFotoFallida(true)} />
      ) : texto ? (
        texto
      ) : (
        <User size={tamano * 0.5} aria-hidden="true" />
      )}
    </div>
  );
}
