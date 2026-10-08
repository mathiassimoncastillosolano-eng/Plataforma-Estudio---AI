import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import type { TemaEstudio } from "../tipos";
import * as studyService from "../servicios/servicioEstudio";
import { normalizar } from "../utilidades/conceptos";
import { useClicFuera } from "../hooks/useClicFuera";

/** Buscador global del header. Atajo "/" para enfocarlo desde cualquier pantalla. */
export default function BuscadorEncabezado() {
  const navegar = useNavigate();
  const [consulta, establecerConsulta] = useState("");
  const [abierto, establecerAbierto] = useState(false);
  const [temas, establecerTemas] = useState<TemaEstudio[] | null>(null);
  const [activo, establecerActivo] = useState(0);
  const refEntrada = useRef<HTMLInputElement>(null);
  const refEnvoltura = useRef<HTMLDivElement>(null);

  useClicFuera(refEnvoltura as React.RefObject<HTMLElement>, () => establecerAbierto(false), abierto);

  // Atajo "/" (ignorado mientras se escribe en otro campo)
  useEffect(() => {
    function alTecla(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      refEntrada.current?.focus();
    }
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  }, []);

  function manejarEnfoque() {
    establecerAbierto(true);
    if (!temas) studyService.obtenerTemasEstudio().then(establecerTemas).catch(() => establecerTemas([]));
  }

  const resultados = useMemo(() => {
    if (!temas) return [];
    const q = normalizar(consulta).trim();
    const lista = q ? temas.filter((t) => normalizar(`${t.titulo} ${t.categoria} ${t.descripcion ?? ""}`).includes(q)) : temas;
    return lista.slice(0, 6);
  }, [temas, consulta]);

  useEffect(() => establecerActivo(0), [consulta]);

  function go(tema: TemaEstudio) {
    establecerAbierto(false);
    establecerConsulta("");
    refEntrada.current?.blur();
    navegar(`/estudio/${tema.id}/resumen`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      establecerActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      establecerActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[activo]) {
      go(resultados[activo]);
    } else if (e.key === "Escape") {
      establecerAbierto(false);
      refEntrada.current?.blur();
    }
  }

  return (
    <div className="header-search-wrap" ref={refEnvoltura}>
      <div className="header-search">
        <Search size={15} />
        <input
          ref={refEntrada}
          value={consulta}
          placeholder="Buscar temas, preguntas..."
          aria-label="Buscar"
          aria-expanded={abierto}
          aria-controls="header-search-results"
          autoComplete="off"
          onChange={(e) => establecerConsulta(e.target.value)}
          onFocus={manejarEnfoque}
          onKeyDown={onKeyDown}
        />
        <kbd className="hide-mobile">/</kbd>
      </div>

      {abierto && (
        <div className="search-results" id="header-search-results" role="listbox">
          {!temas && <p className="search-empty">Buscando…</p>}
          {temas && resultados.length === 0 && <p className="search-empty">No encontramos temas para «{consulta}».</p>}
          {resultados.map((t, i) => (
            <button key={t.id} role="option" aria-selected={i === activo} className={`search-item ${i === activo ? "active" : ""}`} onMouseEnter={() => establecerActivo(i)} onClick={() => go(t)}>
              <span className="search-item-main">
                <strong>{t.titulo}</strong>
                <small>{t.categoria}</small>
              </span>
              {i === activo ? <CornerDownLeft size={14} /> : <span className="search-item-pct">{t.dominio}%</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
