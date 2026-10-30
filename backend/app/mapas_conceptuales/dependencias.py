from fastapi import Depends

from app.configuracion.ajustes import Ajustes, obtener_ajustes
from app.mapas_conceptuales.servicio_mapa import ServicioMapaConceptual
from app.resumenes.dependencias import obtener_proveedor_ia
from app.servicios_externos.proveedor_ia import ProveedorIA


def obtener_servicio_mapa(
    proveedor: ProveedorIA = Depends(obtener_proveedor_ia),
    ajustes: Ajustes = Depends(obtener_ajustes),
) -> ServicioMapaConceptual:
    # El proveedor de IA (y su validación de configuración) es el mismo que usan los resúmenes.
    return ServicioMapaConceptual(
        proveedor,
        minimo_caracteres=ajustes.resumen_min_caracteres,
        maximo_caracteres=ajustes.resumen_max_caracteres,
        pdf_max_bytes=ajustes.pdf_max_bytes,
        pdf_max_paginas=ajustes.pdf_max_paginas,
    )
