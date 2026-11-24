"""API del motor adaptativo (MOD-07). Sin base de datos: el cliente guarda el estado y lo reenvía.

    POST /api/adaptacion/registrar   Suma respuestas, cierra periodos de 15 y devuelve nivel y dificultad objetivo

El nivel de cada periodo cerrado lo estima el modelo de ML de MOD-06 (`fuente: "modelo"`);
si el modelo no está disponible se usa la regla 0,75/0,25 (`fuente: "regla"`).
"""
from collections.abc import Callable

from fastapi import APIRouter, Depends

from app.adaptacion import motor
from app.adaptacion.dependencias import obtener_predictor
from app.adaptacion.esquemas import SolicitudRegistrar
from app.comun.respuestas import respuesta_exitosa

enrutador = APIRouter(prefix="/api/adaptacion", tags=["adaptacion"])


@enrutador.post("/registrar")
def registrar(solicitud: SolicitudRegistrar, predecir: Callable[[dict], float] | None = Depends(obtener_predictor)):
    estado = solicitud.estado.model_dump() if solicitud.estado else motor.estado_inicial()
    nuevo, cerrados = motor.registrar(estado, [r.model_dump() for r in solicitud.respuestas], predecir)
    return respuesta_exitosa(
        {
            "id_tema": solicitud.id_tema,
            "estado": nuevo,
            "periodos_cerrados": cerrados,
            "dificultad_objetivo": motor.dificultad_objetivo(nuevo["nivel"]),
        }
    )