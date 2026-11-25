import { useEffect, useRef, useState } from "react";
import { FileText, ListChecks, MessageCircleQuestion, Network, type LucideIcon } from "lucide-react";
import { etapaActual, progresoPercibido } from "../utilidades/progresoPercibido";
import Boton from "./Boton";

export type ModuloCarga = "resumen" | "preguntas" | "prueba" | "mapa";

interface ConfiguracionCarga {
  icono: LucideIcon;
  tono: "azul" | "naranja" | "verde" | "morado";
  titulo: string;
  etapas: string[];
}

const CONFIGURACION: Record<ModuloCarga, ConfiguracionCarga> = {
  resumen: {
    icono: FileText,
    tono: "azul",
    titulo: "Creando tu resumen",
    etapas: ["Analizando el contenido…", "Organizando los conceptos…", "Redactando el resumen general…", "Afinando el resumen esencial…"],
  },
  preguntas: {
    icono: MessageCircleQuestion,
    tono: "naranja",
    titulo: "Preparando tus preguntas",
    etapas: ["Leyendo tu resumen…", "Diseñando preguntas a tu nivel…", "Revisando respuestas y explicaciones…", "Ordenando por dificultad…"],
  },
  prueba: {
    icono: ListChecks,
    tono: "verde",
    titulo: "Preparando tu prueba",
    etapas: ["Seleccionando preguntas…", "Equilibrando la dificultad…", "Dejando todo listo…"],
  },
  mapa: {
    icono: Network,
    tono: "morado",
    titulo: "Construyendo tu mapa conceptual",
    etapas: ["Identificando los conceptos clave…", "Conectando las relaciones…", "Distribuyendo el mapa…", "Ajustando los detalles…"],
  },
};

interface PropsCargaModulo {
  modulo: ModuloCarga;
  titulo?: string;
  descripcion?: string;
  etapas?: string[];
  alCancelar?: () => void;
}

export default function CargaModulo({ modulo, titulo, descripcion, etapas, alCancelar }: PropsCargaModulo) {
  const configuracion = CONFIGURACION[modulo];
  const Icono = configuracion.icono;
  const lista = etapas ?? configuracion.etapas;
  const inicio = useRef(Date.now());
  const [transcurrido, establecerTranscurrido] = useState(0);

  useEffect(() => {
    const temporizador = window.setInterval(() => establecerTranscurrido(Date.now() - inicio.current), 250);
    return () => window.clearInterval(temporizador);
  }, []);

  const progreso = progresoPercibido(transcurrido);
  const etapa = etapaActual(transcurrido, lista.length);

  return (
    <div className="carga-modulo" data-tono={configuracion.tono} role="status" aria-live="polite" aria-busy="true">
      <div className="carga-orbita" aria-hidden="true">
        <span className="carga-anillo carga-anillo-1" />
        <span className="carga-anillo carga-anillo-2" />
        <span className="carga-punto carga-punto-1" />
        <span className="carga-punto carga-punto-2" />
        <span className="carga-nucleo">
          <Icono size={30} strokeWidth={1.9} />
        </span>
      </div>
      <h3 className="carga-titulo">{titulo ?? configuracion.titulo}</h3>
      {descripcion && <p className="carga-descripcion">{descripcion}</p>}
      <p className="carga-etapa" key={etapa}>
        {lista[etapa]}
      </p>
      <div className="carga-barra" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso estimado">
        <span style={{ width: `${progreso}%` }} />
      </div>
      <span className="carga-porcentaje mono">{progreso}%</span>
      <div className="carga-esqueleto" aria-hidden="true">
        <span style={{ width: "88%" }} />
        <span style={{ width: "72%" }} />
        <span style={{ width: "80%" }} />
      </div>
      {alCancelar && (
        <Boton variante="ghost" tamano="sm" onClick={alCancelar}>
          Cancelar
        </Boton>
      )}
    </div>
  );
}
