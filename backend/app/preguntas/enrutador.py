"""API de preguntas de práctica (MOD-03).

    POST /api/preguntas/generar   Genera preguntas con IA desde el resumen general → preguntas validadas con su corrección
    POST /api/preguntas/exportar  Da formato (PDF o Word) a las preguntas ya generadas, sin llamar a la IA
"""
import re
import unicodedata

from fastapi import APIRouter, Depends, Response

from app.comun.respuestas import respuesta_exitosa
from app.preguntas.dependencias import obtener_servicio_preguntas
from app.preguntas import exportador
from app.preguntas.esquemas import SolicitudExportarPreguntas, SolicitudGenerarPreguntas
from app.preguntas.servicio_preguntas import ServicioPreguntas

enrutador = APIRouter(prefix="/api/preguntas", tags=["preguntas"])


@enrutador.post("/generar")
def generar_preguntas(solicitud: SolicitudGenerarPreguntas, servicio: ServicioPreguntas = Depends(obtener_servicio_preguntas)):
    return respuesta_exitosa(servicio.generar(solicitud))


TIPOS_ARCHIVO = {
    "pdf": "application/pdf",
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _nombre_archivo(titulo_tema: str, formato: str) -> str:
    base = unicodedata.normalize("NFKD", titulo_tema).encode("ascii", "ignore").decode("ascii").lower()
    base = re.sub(r"[^a-z0-9]+", "-", base).strip("-")[:60] or "tema"
    return f"preguntas-{base}.{formato}"


@enrutador.post("/exportar")
def exportar_preguntas(solicitud: SolicitudExportarPreguntas):
    generar = exportador.generar_pdf if solicitud.formato == "pdf" else exportador.generar_docx
    nombre = _nombre_archivo(solicitud.titulo_tema, solicitud.formato)
    return Response(
        content=generar(solicitud),
        media_type=TIPOS_ARCHIVO[solicitud.formato],
        headers={"Content-Disposition": f'attachment; filename="{nombre}"', "Cache-Control": "no-store"},
    )
