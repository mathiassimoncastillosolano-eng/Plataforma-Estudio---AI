from functools import cache

from fastapi import Depends

from app.configuracion.ajustes import Ajustes, obtener_ajustes
from app.pruebas.sello import Sellador
from app.pruebas.servicio_prueba import CacheIdempotente, ServicioPruebas
from app.resumenes.dependencias import obtener_proveedor_ia
from app.servicios_externos.proveedor_ia import ProveedorIA


@cache  # un único sellador y una única caché de solicitudes por proceso
def _sellador(clave: str) -> Sellador:
    return Sellador(clave)


@cache
def _cache_solicitudes() -> CacheIdempotente:
    return CacheIdempotente()


def obtener_sellador(ajustes: Ajustes = Depends(obtener_ajustes)) -> Sellador:
    return _sellador(ajustes.pruebas_clave_secreta)


def obtener_servicio_pruebas(
    proveedor: ProveedorIA = Depends(obtener_proveedor_ia),
    sellador: Sellador = Depends(obtener_sellador),
    ajustes: Ajustes = Depends(obtener_ajustes),
) -> ServicioPruebas:
    return ServicioPruebas(
        proveedor,
        sellador,
        timeout_ia_segundos=ajustes.openai_timeout_pruebas_segundos,
        cache=_cache_solicitudes(),
    )
