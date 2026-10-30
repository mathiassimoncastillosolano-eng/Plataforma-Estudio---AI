import base64
import binascii
import re
import unicodedata
from typing import Literal

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from pydantic import BaseModel, Field

from app.comun.respuestas import respuesta_exitosa
from app.configuracion.ajustes import Ajustes, obtener_ajustes
from app.mapas_conceptuales import exportador_pdf
from app.mapas_conceptuales.dependencias import obtener_servicio_mapa
from app.mapas_conceptuales.servicio_mapa import ServicioMapaConceptual

enrutador = APIRouter(prefix="/api/mapas-conceptuales", tags=["mapas-conceptuales"])

# Tope técnico para no procesar cuerpos gigantes; el límite funcional lo valida el servicio.
LIMITE_TECNICO_CARACTERES = 500_000


class SolicitudMapa(BaseModel):
    texto: str = Field(default="", max_length=LIMITE_TECNICO_CARACTERES)
    titulo: str | None = Field(default=None, max_length=300)


@enrutador.post("")
def generar_mapa(solicitud: SolicitudMapa, servicio: ServicioMapaConceptual = Depends(obtener_servicio_mapa)):
    """Genera el mapa conceptual (nodos con definición y relaciones con frase de enlace) desde un texto."""
    return respuesta_exitosa(servicio.generar_mapa(solicitud.texto, solicitud.titulo))


@enrutador.post("/pdf")
def generar_mapa_desde_pdf(
    archivo: UploadFile = File(...),
    titulo: str | None = Form(default=None, max_length=300),
    servicio: ServicioMapaConceptual = Depends(obtener_servicio_mapa),
    ajustes: Ajustes = Depends(obtener_ajustes),
):
    """Genera el mapa enviando el PDF ORIGINAL a la IA (texto y elementos visuales).

    El archivo se procesa en memoria y no se guarda. Se lee un byte de más para detectar,
    sin cargarlo completo, un archivo que supera el límite.
    """
    datos = archivo.file.read(ajustes.pdf_max_bytes + 1)
    return respuesta_exitosa(servicio.generar_mapa_desde_pdf(datos, archivo.filename or "documento.pdf", titulo))


# --- Descarga en PDF (no llama a la IA: da formato al mapa que el estudiante está viendo) ---

# PNG del mapa en base64 (unos 25 MB como máximo una vez decodificado).
LIMITE_IMAGEN_BASE64 = 35_000_000
COLOR_HEX = r"^#[0-9a-fA-F]{6}$"


class PaletaEntrada(BaseModel):
    solido: str = Field(pattern=COLOR_HEX)
    tinte: str = Field(pattern=COLOR_HEX)
    medio: str = Field(pattern=COLOR_HEX)
    tinta: str = Field(pattern=COLOR_HEX)
    texto: str = Field(pattern=COLOR_HEX)
    texto_suave: str = Field(pattern=COLOR_HEX)
    borde: str = Field(pattern=COLOR_HEX)


class ConceptoEntrada(BaseModel):
    etiqueta: str = Field(min_length=1, max_length=300)
    descripcion: str = Field(default="", max_length=5_000)
    profundidad: int = Field(ge=0, le=30)


class SolicitudPdfMapa(BaseModel):
    titulo: str = Field(default="", max_length=300)
    origen: Literal["ia", "ejemplo"] = "ia"
    generado_en: str = Field(default="", max_length=40)
    imagen_png: str = Field(min_length=1, max_length=LIMITE_IMAGEN_BASE64)
    paleta: PaletaEntrada
    conceptos: list[ConceptoEntrada] = Field(min_length=1, max_length=300)


def _decodificar_png(valor: str) -> bytes:
    """Admite el base64 puro o con el prefijo `data:image/png;base64,` que genera el navegador."""
    datos = valor.split(",", 1)[1] if valor.startswith("data:") else valor
    try:
        return base64.b64decode(datos, validate=True)
    except (binascii.Error, ValueError) as error:
        raise exportador_pdf.ImagenMapaInvalida(detalle="base64 inválido") from error


def nombre_archivo_pdf(titulo: str) -> str:
    """`Sistema_Nervioso_Mapa_Conceptual.pdf`: sin tildes ni caracteres no válidos (mismo criterio que el frontend)."""
    sin_tildes = unicodedata.normalize("NFKD", titulo).encode("ascii", "ignore").decode("ascii")
    palabras = re.sub(r"[^A-Za-z0-9]+", " ", sin_tildes).split()
    base = "_".join(p[:1].upper() + p[1:] for p in palabras)[:60].rstrip("_")
    return f"{base or 'Tema'}_Mapa_Conceptual.pdf"


@enrutador.post("/descargar-pdf")
def descargar_pdf_mapa(solicitud: SolicitudPdfMapa):
    """Devuelve el PDF del mapa: página 1 con el mapa (PNG del frontend) y página 2 con los conceptos y su jerarquía."""
    contenido = exportador_pdf.generar_pdf_mapa(
        titulo=solicitud.titulo,
        origen=solicitud.origen,
        generado_en=solicitud.generado_en,
        imagen_png=_decodificar_png(solicitud.imagen_png),
        paleta=exportador_pdf.PaletaPdf(**solicitud.paleta.model_dump()),
        conceptos=[exportador_pdf.ConceptoPdf(c.etiqueta, c.descripcion, c.profundidad) for c in solicitud.conceptos],
    )
    return Response(
        content=contenido,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nombre_archivo_pdf(solicitud.titulo)}"', "Cache-Control": "no-store"},
    )
