from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel, Field

from app.comun.respuestas import respuesta_exitosa
from app.configuracion.ajustes import Ajustes, obtener_ajustes
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
