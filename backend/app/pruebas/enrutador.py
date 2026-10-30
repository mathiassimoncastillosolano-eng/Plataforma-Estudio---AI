"""API de pruebas. Todas las operaciones son POST con el sello de la prueba en el cuerpo.

    POST /api/pruebas/crear        Genera la prueba con IA a partir del resumen general → sello (estado «lista»)
    POST /api/pruebas/iniciar      Empieza el reloj y entrega las preguntas
    POST /api/pruebas/estado       Recupera la prueba (tras recargar) sin cambiar nada
    POST /api/pruebas/sincronizar  Guarda respuestas y descartes; devuelve el tiempo restante del servidor
    POST /api/pruebas/pausar       Pausa blindada: congela el reloj y deja de entregar las preguntas
    POST /api/pruebas/reanudar     Reanuda y vuelve a entregar las preguntas
    POST /api/pruebas/finalizar    Califica en el servidor y devuelve resultado y revisión (idempotente)
"""
from fastapi import APIRouter, Depends

from app.comun.respuestas import respuesta_exitosa
from app.pruebas.dependencias import obtener_servicio_pruebas
from app.pruebas.esquemas import SolicitudCrear, SolicitudProgreso, SolicitudSello
from app.pruebas.servicio_prueba import ServicioPruebas

enrutador = APIRouter(prefix="/api/pruebas", tags=["pruebas"])


@enrutador.post("/crear")
def crear_prueba(solicitud: SolicitudCrear, servicio: ServicioPruebas = Depends(obtener_servicio_pruebas)):
    return respuesta_exitosa(servicio.crear(solicitud))


@enrutador.post("/iniciar")
def iniciar_prueba(solicitud: SolicitudSello, servicio: ServicioPruebas = Depends(obtener_servicio_pruebas)):
    return respuesta_exitosa(servicio.iniciar(solicitud.sello))


@enrutador.post("/estado")
def estado_prueba(solicitud: SolicitudSello, servicio: ServicioPruebas = Depends(obtener_servicio_pruebas)):
    return respuesta_exitosa(servicio.estado(solicitud.sello))


@enrutador.post("/sincronizar")
def sincronizar_prueba(solicitud: SolicitudProgreso, servicio: ServicioPruebas = Depends(obtener_servicio_pruebas)):
    return respuesta_exitosa(servicio.sincronizar(solicitud.sello, solicitud.respuestas, solicitud.descartes))


@enrutador.post("/pausar")
def pausar_prueba(solicitud: SolicitudProgreso, servicio: ServicioPruebas = Depends(obtener_servicio_pruebas)):
    return respuesta_exitosa(servicio.pausar(solicitud.sello, solicitud.respuestas, solicitud.descartes))


@enrutador.post("/reanudar")
def reanudar_prueba(solicitud: SolicitudSello, servicio: ServicioPruebas = Depends(obtener_servicio_pruebas)):
    return respuesta_exitosa(servicio.reanudar(solicitud.sello))


@enrutador.post("/finalizar")
def finalizar_prueba(solicitud: SolicitudProgreso, servicio: ServicioPruebas = Depends(obtener_servicio_pruebas)):
    return respuesta_exitosa(servicio.finalizar(solicitud.sello, solicitud.respuestas, solicitud.descartes))
