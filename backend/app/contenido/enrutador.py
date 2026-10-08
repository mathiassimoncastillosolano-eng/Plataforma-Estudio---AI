from fastapi import APIRouter, Depends, File, UploadFile

from app.comun.respuestas import respuesta_exitosa
from app.contenido.dependencias import obtener_servicio_contenido
from app.contenido.servicio_contenido import ServicioContenido

enrutador = APIRouter(prefix="/api/contenido", tags=["contenido"])


@enrutador.post("/extraer-pdf")
def extraer_pdf(archivo: UploadFile = File(...), servicio: ServicioContenido = Depends(obtener_servicio_contenido)):
    """Extrae el texto de un PDF. El archivo se procesa en memoria y no se guarda."""
    return respuesta_exitosa(servicio.extraer_texto_de_pdf(archivo.file))
