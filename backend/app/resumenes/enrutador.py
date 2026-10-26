import re
import unicodedata
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from pydantic import BaseModel, Field

from app.comun.errores import ResumenVacio
from app.comun.respuestas import respuesta_exitosa
from app.configuracion.ajustes import Ajustes, obtener_ajustes
from app.resumenes import exportador_pdf
from app.resumenes.dependencias import obtener_servicio_resumen
from app.resumenes.dominio import (
    ConceptoClave,
    FormulaRegla,
    ResumenEsencial,
    ResumenGeneral,
    SeccionGeneral,
    TablaResumen,
)
from app.resumenes.servicio_resumen import ServicioResumen

enrutador = APIRouter(prefix="/api/resumenes", tags=["resumenes"])

# Tope técnico para no procesar cuerpos gigantes; el límite funcional lo valida el servicio.
LIMITE_TECNICO_CARACTERES = 500_000
LIMITE_CAMPO_DESCARGA = 60_000


class SolicitudResumen(BaseModel):
    texto: str = Field(default="", max_length=LIMITE_TECNICO_CARACTERES)
    titulo: str | None = None
    indicaciones: str | None = None


@enrutador.post("")
def generar_resumen(solicitud: SolicitudResumen, servicio: ServicioResumen = Depends(obtener_servicio_resumen)):
    """Genera el resumen esencial y el general del contenido en una sola llamada."""
    return respuesta_exitosa(servicio.generar_resumen(solicitud.texto, solicitud.titulo, solicitud.indicaciones))


@enrutador.post("/pdf")
def generar_resumen_desde_pdf(
    archivo: UploadFile = File(...),
    titulo: str | None = Form(default=None),
    indicaciones: str | None = Form(default=None),
    servicio: ServicioResumen = Depends(obtener_servicio_resumen),
    ajustes: Ajustes = Depends(obtener_ajustes),
):
    """Genera ambos resúmenes enviando el PDF ORIGINAL a la IA (texto y elementos visuales).

    El archivo se procesa en memoria y no se guarda. Se lee un byte de más para detectar,
    sin cargarlo completo, un archivo que supera el límite.
    """
    datos = archivo.file.read(ajustes.pdf_max_bytes + 1)
    return respuesta_exitosa(servicio.generar_resumen_desde_pdf(datos, archivo.filename or "documento.pdf", titulo, indicaciones))


# --- Descarga en PDF (no llama a la IA: da formato a un resumen ya generado) ---------------


def _texto(maximo: int = LIMITE_CAMPO_DESCARGA):
    return Field(default="", max_length=maximo)


class TablaEntrada(BaseModel):
    titulo: str = _texto(500)
    encabezados: list[str] = Field(default_factory=list, max_length=20)
    filas: list[list[str]] = Field(default_factory=list, max_length=500)


class SeccionEntrada(BaseModel):
    titulo: str = _texto(500)
    contenido: str = _texto()
    puntos: list[str] = Field(default_factory=list, max_length=200)
    tabla: TablaEntrada | None = None


class ConceptoEntrada(BaseModel):
    termino: str = _texto(500)
    definicion: str = _texto()


class FormulaEntrada(BaseModel):
    nombre: str = _texto(500)
    expresion: str = _texto()
    explicacion: str = _texto()


class EsencialEntrada(BaseModel):
    idea_central: str = _texto()
    ideas_clave: list[str] = Field(default_factory=list, max_length=200)
    conceptos_clave: list[ConceptoEntrada] = Field(default_factory=list, max_length=300)
    formulas_y_reglas: list[FormulaEntrada] = Field(default_factory=list, max_length=200)
    notas_de_fidelidad: list[str] = Field(default_factory=list, max_length=50)
    minutos_lectura: int = Field(default=1, ge=1, le=600)


class GeneralEntrada(BaseModel):
    titulo: str = _texto(500)
    introduccion: str = _texto()
    secciones: list[SeccionEntrada] = Field(default_factory=list, max_length=200)
    notas_de_fidelidad: list[str] = Field(default_factory=list, max_length=50)
    minutos_lectura: int = Field(default=1, ge=1, le=600)


class SolicitudDescarga(BaseModel):
    tipo: Literal["esencial", "general"]
    titulo_tema: str = Field(min_length=1, max_length=300)
    origen: str = Field(default="Generado con IA", max_length=100)
    generado_en: str = Field(default="", max_length=64)
    esencial: EsencialEntrada | None = None
    general: GeneralEntrada | None = None


def _a_dominio_esencial(e: EsencialEntrada) -> ResumenEsencial:
    return ResumenEsencial(
        idea_central=e.idea_central,
        ideas_clave=[i for i in e.ideas_clave if i.strip()],
        conceptos_clave=[ConceptoClave(c.termino, c.definicion) for c in e.conceptos_clave if c.termino.strip() and c.definicion.strip()],
        minutos_lectura=e.minutos_lectura,
        formulas_y_reglas=[FormulaRegla(f.nombre, f.expresion, f.explicacion) for f in e.formulas_y_reglas if f.expresion.strip()],
        notas_de_fidelidad=[n for n in e.notas_de_fidelidad if n.strip()],
    )


def _a_dominio_tabla(t: TablaEntrada | None) -> TablaResumen | None:
    if not t or not t.encabezados or not t.filas:
        return None
    columnas = len(t.encabezados)
    return TablaResumen(t.titulo, t.encabezados, [(fila + [""] * columnas)[:columnas] for fila in t.filas])


def _a_dominio_general(g: GeneralEntrada) -> ResumenGeneral:
    return ResumenGeneral(
        titulo=g.titulo,
        introduccion=g.introduccion,
        secciones=[
            SeccionGeneral(s.titulo, s.contenido, [p for p in s.puntos if p.strip()], _a_dominio_tabla(s.tabla))
            for s in g.secciones
            if s.titulo.strip() and s.contenido.strip()
        ],
        minutos_lectura=g.minutos_lectura,
        notas_de_fidelidad=[n for n in g.notas_de_fidelidad if n.strip()],
    )


def _nombre_archivo(tipo: str, titulo_tema: str) -> str:
    base = unicodedata.normalize("NFKD", titulo_tema).encode("ascii", "ignore").decode("ascii").lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")[:60] or "tema"
    return f"resumen-{tipo}-{base}.pdf"


@enrutador.post("/descargar-pdf")
def descargar_pdf(solicitud: SolicitudDescarga):
    """Devuelve el PDF del resumen indicado. Si el resumen está vacío responde 422 en lugar de un archivo vacío."""
    if solicitud.tipo == "esencial":
        if solicitud.esencial is None:
            raise ResumenVacio()
        contenido = exportador_pdf.generar_pdf_esencial(
            _a_dominio_esencial(solicitud.esencial), titulo_tema=solicitud.titulo_tema, origen=solicitud.origen, generado_en=solicitud.generado_en
        )
    else:
        if solicitud.general is None:
            raise ResumenVacio()
        contenido = exportador_pdf.generar_pdf_general(
            _a_dominio_general(solicitud.general), titulo_tema=solicitud.titulo_tema, origen=solicitud.origen, generado_en=solicitud.generado_en
        )

    nombre = _nombre_archivo(solicitud.tipo, solicitud.titulo_tema)
    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"', "Cache-Control": "no-store"},
    )
