from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.comun.respuestas import respuesta_exitosa
from app.resumenes.dependencias import obtener_servicio_resumen
from app.resumenes.servicio_resumen import ServicioResumen

enrutador = APIRouter(prefix="/api/resumenes", tags=["resumenes"])

# Tope técnico para no procesar cuerpos gigantes; el límite funcional lo valida el servicio.
LIMITE_TECNICO_CARACTERES = 500_000


class SolicitudResumen(BaseModel):
    texto: str = Field(default="", max_length=LIMITE_TECNICO_CARACTERES)
    titulo: str | None = None


@enrutador.post("")
def generar_resumen(solicitud: SolicitudResumen, servicio: ServicioResumen = Depends(obtener_servicio_resumen)):
    """Genera el resumen general y el esencial del contenido en una sola llamada."""
    return respuesta_exitosa(servicio.generar_resumen(solicitud.texto, solicitud.titulo))
