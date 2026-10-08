from functools import cache

from fastapi import Depends

from app.comun.errores import IANoConfigurada
from app.configuracion.ajustes import Ajustes, obtener_ajustes
from app.resumenes.servicio_resumen import ServicioResumen
from app.servicios_externos.proveedor_ia import ProveedorIA
from app.servicios_externos.servicio_openai import ServicioOpenAI


@cache  # un único cliente HTTP reutilizado entre solicitudes
def _crear_servicio_openai() -> ServicioOpenAI:
    ajustes = obtener_ajustes()
    return ServicioOpenAI(
        api_key=ajustes.openai_api_key,
        modelo=ajustes.openai_model,
        timeout_segundos=ajustes.openai_timeout_segundos,
        max_reintentos=ajustes.openai_max_reintentos,
    )


def obtener_proveedor_ia(ajustes: Ajustes = Depends(obtener_ajustes)) -> ProveedorIA:
    if not ajustes.ia_configurada:
        raise IANoConfigurada(detalle="faltan OPENAI_API_KEY u OPENAI_MODEL")
    return _crear_servicio_openai()


def obtener_servicio_resumen(
    proveedor: ProveedorIA = Depends(obtener_proveedor_ia),
    ajustes: Ajustes = Depends(obtener_ajustes),
) -> ServicioResumen:
    return ServicioResumen(
        proveedor,
        minimo_caracteres=ajustes.resumen_min_caracteres,
        maximo_caracteres=ajustes.resumen_max_caracteres,
    )
