import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Plus, Search } from "lucide-react";
import type { TemaEstudio } from "../tipos";
import * as studyService from "../servicios/servicioEstudio";
import { normalizar } from "../utilidades/conceptos";
import { useClicFuera } from "../hooks/useClicFuera";
import { EsqueletoTexto } from "./Esqueleto";

const PESTANAS = ["resumen", "preguntas", "prueba", "mapa-mental"];

let cache: TemaEstudio[] | null = null;

/**
 * Título del tema como selector interactivo (popover tipo command menu):
 * buscar, cambiar de tema conservando la pestaña, volver a Mis estudios.
 */
export default function SelectorTema({ actual }: { actual: TemaEstudio }) {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [abierto, establecerAbierto] = useState(false);
  const [temas, establecerTemas] = useState<TemaEstudio[] | null>(cache);
  const [consulta, establecerConsulta] = useState("");
  const [activo, establecerActivo] = useState(0);
  const refEnvoltura = useRef<HTMLDivElement>(null);
  const refEntrada = useRef<HTMLInputElement>(null);
  const refLista = useRef<HTMLDivElement>(null);

  useClicFuera(refEnvoltura as React.RefObject<HTMLElement>, () => establecerAbierto(false), abierto);

  useEffect(() => {
    if (!abierto) return;
    establecerConsulta("");
    refEntrada.current?.focus();
    studyService
      .obtenerTemasEstudio()
      .then((lista) => {
        cache = lista;
        establecerTemas(lista);
      })
      .catch(() => establecerTemas((previo) => previo ?? []));
  }, [abierto]);

  const filtrados = useMemo(() => {
    if (!temas) return [];
    const q = normalizar(consulta).trim();
    return q ? temas.filter((t) => normalizar(`${t.titulo} ${t.categoria}`).includes(q)) : temas;
  }, [temas, consulta]);

  useEffect(() => establecerActivo(0), [consulta, abierto]);

  // Mantiene visible el ítem activo al navegar con el teclado
  useEffect(() => {
    refLista.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [activo]);

  function seleccionar(tema: TemaEstudio) {
    establecerAbierto(false);
    if (tema.id === actual.id) return;
    const segmento = pathname.split("/")[3];
    navegar(`/estudio/${tema.id}/${PESTANAS.includes(segmento) ? segmento : "resumen"}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      establecerActivo((i) => Math.min(i + 1, filtrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      establecerActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtrados[activo]) {
      e.preventDefault();
      seleccionar(filtrados[activo]);
    } else if (e.key === "Escape") {
      establecerAbierto(false);
    }
  }

  return (
    <div className="topic-selector" ref={refEnvoltura}>
      <button className="topic-title-btn" onClick={() => establecerAbierto((o) => !o)} aria-haspopup="listbox" aria-expanded={abierto} title="Cambiar de tema">
        <h1>{actual.titulo}</h1>
        <span className="topic-title-chevron">
          <ChevronDown size={18} />
        </span>
      </button>

      {abierto && (
        <>
          <div className="sheet-backdrop" onClick={() => establecerAbierto(false)} />
          <div className="cmd-panel" role="dialog" aria-label="Cambiar de tema">
            <div className="cmd-search">
              <Search size={16} />
              <input ref={refEntrada} value={consulta} onChange={(e) => establecerConsulta(e.target.value)} onKeyDown={onKeyDown} placeholder="Buscar un tema…" aria-label="Buscar tema" autoComplete="off" />
              <kbd>esc</kbd>
            </div>

            <div className="cmd-list" ref={refLista} role="listbox" aria-label="Temas disponibles">
              {!temas && (
                <div className="cmd-loading">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="cmd-skeleton">
                      <EsqueletoTexto width="60%" height={13} />
                      <EsqueletoTexto width="30%" height={10} />
                    </div>
                  ))}
                </div>
              )}
              {temas && filtrados.length === 0 && <p className="cmd-empty">No hay temas que coincidan con «{consulta}».</p>}
              {filtrados.map((t, i) => {
                const esActual = t.id === actual.id;
                return (
                  <button key={t.id} role="option" aria-selected={esActual} data-active={i === activo} className={`cmd-item ${i === activo ? "active" : ""} ${esActual ? "current" : ""}`} onMouseEnter={() => establecerActivo(i)} onClick={() => seleccionar(t)}>
                    <span className="cmd-item-main">
                      <strong>{t.titulo}</strong>
                      <small>
                        {t.categoria} · {t.ultimoEstudioEn}
                      </small>
                    </span>
                    <span className="cmd-item-side">
                      <span className="cmd-pct">{t.dominio}%</span>
                      {esActual && (
                        <span className="cmd-check" aria-label="Tema actual">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="cmd-footer">
              <button onClick={() => navegar("/temas")}>
                <ArrowLeft size={14} />
                Mis estudios
              </button>
              <button onClick={() => navegar("/estudio/nuevo")}>
                <Plus size={14} />
                Nuevo tema
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
