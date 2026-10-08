import { Fragment, type ReactNode } from "react";
import type { ResumenesGenerados, TipoResumen } from "../../tipos";
import { TEXTOS_TIPO_RESUMEN, etiquetaOrigen } from "./textosResumen";

export interface ElementoIndice {
  id: string;
  etiqueta: string;
}

const slug = (s: string, i: number) =>
  `s-${i}-` + s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function construirIndice(resumenes: ResumenesGenerados, tipo: TipoResumen): ElementoIndice[] {
  const elementos: ElementoIndice[] = [];
  if (tipo === "esencial") {
    const { ideaCentral, ideasClave, conceptosClave } = resumenes.esencial;
    if (ideaCentral) elementos.push({ id: "s-idea-central", etiqueta: "Idea central" });
    if (ideasClave.length) elementos.push({ id: "s-ideas", etiqueta: "Ideas clave" });
    if (conceptosClave.length) elementos.push({ id: "s-conceptos", etiqueta: "Conceptos fundamentales" });
    return elementos;
  }
  const { introduccion, secciones } = resumenes.general;
  if (introduccion) elementos.push({ id: "s-introduccion", etiqueta: "Introducción" });
  secciones.forEach((seccion, i) => elementos.push({ id: slug(seccion.titulo, i), etiqueta: seccion.titulo }));
  return elementos;
}

const escaparExpresionRegular = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Resalta la primera aparición de cada concepto clave dentro de un texto. */
function resaltar(texto: string, terminos: string[]): ReactNode {
  if (terminos.length === 0) return texto;
  const patron = new RegExp(`(${terminos.map(escaparExpresionRegular).join("|")})`, "gi");
  const vistos = new Set<string>();
  return texto.split(patron).map((parte, i) => {
    const clave = parte.toLowerCase();
    if (i % 2 === 1 && !vistos.has(clave)) {
      vistos.add(clave);
      return (
        <mark key={i} className="concept-hl">
          {parte}
        </mark>
      );
    }
    return <Fragment key={i}>{parte}</Fragment>;
  });
}

const parrafos = (texto: string) => texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

interface PropsLectorResumen {
  resumenes: ResumenesGenerados;
  tipo: TipoResumen;
  tituloTema: string;
}

export default function LectorResumen({ resumenes, tipo, tituloTema }: PropsLectorResumen) {
  const { esencial, general, metadatos } = resumenes;
  const terminos = esencial.conceptosClave.map((c) => c.termino).filter((t) => t.length > 2).sort((a, b) => b.length - a.length);
  const origen = etiquetaOrigen(metadatos.origen);
  const minutos = tipo === "esencial" ? esencial.minutosLectura : general.minutosLectura;
  const mostrarTitulo = tipo === "general" && general.titulo.trim() !== "" && general.titulo.trim().toLowerCase() !== tituloTema.trim().toLowerCase();

  return (
    <article className="reader-doc">
      <p className="reader-meta">
        <span>{TEXTOS_TIPO_RESUMEN[tipo].titulo}</span>
        <span aria-hidden="true">·</span>
        <span>{minutos} min de lectura</span>
        <span className={`origin-tag origin-${origen.tono}`}>{origen.texto}</span>
      </p>

      {tipo === "esencial" ? (
        <>
          <section id="s-idea-central">
            {parrafos(esencial.ideaCentral).map((p, i) => (
              <p key={i} className="reader-lead">
                {p}
              </p>
            ))}
          </section>

          {esencial.ideasClave.length > 0 && (
            <section id="s-ideas" className="reader-points">
              <h2>Ideas clave</h2>
              <ol>
                {esencial.ideasClave.map((idea, i) => (
                  <li key={i}>{resaltar(idea, terminos)}</li>
                ))}
              </ol>
            </section>
          )}

          {esencial.conceptosClave.length > 0 && (
            <section id="s-conceptos">
              <h2>Conceptos fundamentales</h2>
              <dl className="reader-terms">
                {esencial.conceptosClave.map((c, i) => (
                  <div key={`${c.termino}-${i}`}>
                    <dt>
                      <span className="mono">{String(i + 1).padStart(2, "0")}</span>
                      {c.termino}
                    </dt>
                    <dd>{c.definicion}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </>
      ) : (
        <>
          {mostrarTitulo && <h2 className="reader-title">{general.titulo}</h2>}

          {general.introduccion && (
            <section id="s-introduccion">
              {parrafos(general.introduccion).map((p, i) => (
                <p key={i} className="reader-lead">
                  {p}
                </p>
              ))}
            </section>
          )}

          {general.secciones.map((seccion, i) => (
            <section key={`${seccion.titulo}-${i}`} id={slug(seccion.titulo, i)}>
              <h2>{seccion.titulo}</h2>
              {parrafos(seccion.contenido).map((p, j) => (
                <p key={j}>{resaltar(p, terminos)}</p>
              ))}
              {seccion.puntos.length > 0 && (
                <ul className="reader-list">
                  {seccion.puntos.map((punto, j) => (
                    <li key={j}>{resaltar(punto, terminos)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </>
      )}
    </article>
  );
}
