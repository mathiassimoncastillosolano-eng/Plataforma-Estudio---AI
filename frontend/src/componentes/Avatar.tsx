import { iniciales } from "../utilidades/formato";

interface AvatarProps {
  nombre: string;
  apellido: string;
  tamano?: number;
}

export default function Avatar({ nombre, apellido, tamano = 36 }: AvatarProps) {
  return (
    <div className="avatar" style={{ width: tamano, height: tamano, fontSize: tamano * 0.36 }}>
      {iniciales(nombre, apellido)}
    </div>
  );
}
