from fastapi import Depends

from app.configuracion.ajustes import Ajustes, obtener_ajustes
from app.contenido.servicio_contenido import ServicioContenido


def obtener_servicio_contenido(ajustes: Ajustes = Depends(obtener_ajustes)) -> ServicioContenido:
    return ServicioContenido(
        max_bytes=ajustes.pdf_max_bytes,
        max_paginas=ajustes.pdf_max_paginas,
        min_caracteres=ajustes.resumen_min_caracteres,
        max_caracteres=ajustes.resumen_max_caracteres,
    )
