import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { MODULOS_ESTUDIO, type IdModulo } from "../../datos/modulosEstudio";
import { useBloqueoModulos } from "../../hooks/useBloqueoModulos";
import { useClicFuera } from "../../hooks/useClicFuera";

const DURACION_CIERRE_MS = 300;
const POSICIONES: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

const CHISPAS: ReadonlyArray<readonly [number, number, number]> = [
  [20, 0.43, 0],
  [78, 0.37, 1.1],
  [135, 0.45, 0.4],
  [196, 0.39, 1.8],
  [248, 0.44, 0.8],
  [312, 0.36, 1.4],
];

function IconoNuevePuntos() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
      {[3, 10, 17].flatMap((x) => [3, 10, 17].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.9" />))}
    </svg>
  );
}

export default function SelectorModulos({ idTema, actual }: { idTema: string; actual: IdModulo }) {
  const [montado, establecerMontado] = useState(false);
  const [visible, establecerVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const temporizador = useRef<number>();
  const { bloqueado, mensaje } = useBloqueoModulos(idTema);
  const moduloActual = MODULOS_ESTUDIO.find((m) => m.id === actual);
  const IconoActual = moduloActual?.icono;

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  function abrir() {
    window.clearTimeout(temporizador.current);
    establecerMontado(true);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => establecerVisible(true)));
  }

  function cerrar() {
    establecerVisible(false);
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => establecerMontado(false), DURACION_CIERRE_MS);
  }

  useClicFuera(ref as RefObject<HTMLElement>, cerrar, visible);

  return (
    <div className="mod-switch" ref={ref}>
      <button type="button" className="mod-switch-btn" aria-haspopup="menu" aria-expanded={visible} aria-label="Cambiar de módulo" title="Cambiar de módulo" onClick={() => (visible ? cerrar() : abrir())}>
        <IconoNuevePuntos />
      </button>
      {montado && (
        <div className="mod-circulo" data-visible={visible} role="menu" aria-label="Módulos del tema">
          <span className="mod-circulo-halo" aria-hidden="true" />
          <span className="mod-circulo-aro" aria-hidden="true" />
          <span className="mod-circulo-aro mod-circulo-aro-interno" aria-hidden="true" />
          <span className="mod-chispas" aria-hidden="true">
            {CHISPAS.map(([angulo, radio, retraso]) => (
              <i key={angulo} style={{ "--a": `${angulo}deg`, "--q": radio, "--t": `${retraso}s` } as CSSProperties} />
            ))}
          </span>
          <div className="mod-centro" aria-hidden="true">
            {IconoActual && <IconoActual size={22} strokeWidth={1.9} />}
            <span>Estás en</span>
            <strong>{moduloActual?.etiqueta}</strong>
          </div>
          <div className="mod-orbita">
            {MODULOS_ESTUDIO.map(({ id, ruta, etiqueta, icono: Icono, tono }, i) => {
              const [x, y] = POSICIONES[i % POSICIONES.length];
              const estilo = { "--x": x, "--y": y, "--i": i } as CSSProperties;
              const contenido = (
                <span className="mod-nodo-giro">
                  <span className="mod-nodo-icono" aria-hidden="true">
                    {bloqueado(id) ? <Lock size={20} strokeWidth={1.9} /> : <Icono size={22} strokeWidth={1.9} />}
                  </span>
                  <span className="mod-nodo-nombre">{etiqueta}</span>
                </span>
              );
              if (bloqueado(id)) {
                return (
                  <span key={id} role="menuitem" aria-disabled="true" title={mensaje} className="mod-nodo is-bloqueado" data-tono={tono} style={estilo}>
                    {contenido}
                  </span>
                );
              }
              return (
                <Link key={id} role="menuitem" to={`/estudio/${idTema}/${ruta}`} className="mod-nodo" data-tono={tono} style={estilo} aria-current={id === actual ? "page" : undefined} onClick={cerrar}>
                  {contenido}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
