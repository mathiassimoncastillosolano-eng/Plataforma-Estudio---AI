"""Caso de uso: generar el resumen general y el esencial con una sola llamada a la IA."""
import logging
from datetime import datetime, timezone

from app.contenido.validacion import validar_texto_estudio
from app.resumenes.analizador_respuesta import analizar_respuesta_ia
from app.resumenes.dominio import MetadatosResumen, ResultadoResumen
from app.resumenes.instrucciones import INSTRUCCIONES_SISTEMA, construir_entrada
from app.servicios_externos.proveedor_ia import ProveedorIA

logger = logging.getLogger(__name__)


class ServicioResumen:
    def __init__(self, proveedor: ProveedorIA, *, minimo_caracteres: int, maximo_caracteres: int):
        self._proveedor = proveedor
        self._minimo = minimo_caracteres
        self._maximo = maximo_caracteres

    def generar_resumen(self, texto: str, titulo: str | None = None) -> ResultadoResumen:
        texto_validado = validar_texto_estudio(texto, minimo=self._minimo, maximo=self._maximo)

        bruto = self._proveedor.generar_json(
            instrucciones=INSTRUCCIONES_SISTEMA,
            entrada=construir_entrada(texto_validado, titulo),
        )
        try:
            resumen_general, resumen_esencial = analizar_respuesta_ia(bruto)
        except Exception as error:
            # El contenido del usuario y de la IA no se registran: solo el motivo técnico.
            logger.error("Respuesta de la IA inválida: %s", getattr(error, "detalle", type(error).__name__))
            raise

        return ResultadoResumen(
            resumen_general=resumen_general,
            resumen_esencial=resumen_esencial,
            metadatos=MetadatosResumen(
                modelo=self._proveedor.modelo,
                generado_en=datetime.now(timezone.utc).isoformat(),
                caracteres_entrada=len(texto_validado),
            ),
        )
