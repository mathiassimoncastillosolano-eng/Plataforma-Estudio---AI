"""Caso de uso: generar un mapa conceptual a partir de la fuente original del usuario.

Dos entradas posibles: texto, o el PDF original (que se envía a la IA sin convertirlo a texto).
No depende de que exista un resumen previo.
"""
import logging
from datetime import datetime, timezone

from app.comun.errores import PdfInvalido, PdfMuyPesado
from app.contenido.extractor_pdf import validar_pdf
from app.contenido.validacion import validar_texto_estudio
from app.mapas_conceptuales.analizador_respuesta import analizar_respuesta_ia
from app.mapas_conceptuales.dominio import MapaConceptual, MetadatosMapa, ResultadoMapa
from app.mapas_conceptuales.instrucciones import (
    INSTRUCCIONES_SISTEMA,
    INSTRUCCIONES_SISTEMA_PDF,
    construir_entrada,
    construir_entrada_pdf,
)
from app.servicios_externos.proveedor_ia import ProveedorIA

logger = logging.getLogger(__name__)

_PDF_MAX_BYTES_PREDETERMINADO = 10 * 1024 * 1024
_PDF_MAX_PAGINAS_PREDETERMINADO = 100


class ServicioMapaConceptual:
    def __init__(
        self,
        proveedor: ProveedorIA,
        *,
        minimo_caracteres: int,
        maximo_caracteres: int,
        pdf_max_bytes: int = _PDF_MAX_BYTES_PREDETERMINADO,
        pdf_max_paginas: int = _PDF_MAX_PAGINAS_PREDETERMINADO,
    ):
        self._proveedor = proveedor
        self._minimo = minimo_caracteres
        self._maximo = maximo_caracteres
        self._pdf_max_bytes = pdf_max_bytes
        self._pdf_max_paginas = pdf_max_paginas

    def generar_mapa(self, texto: str, titulo: str | None = None) -> ResultadoMapa:
        texto_validado = validar_texto_estudio(texto, minimo=self._minimo, maximo=self._maximo)

        bruto = self._proveedor.generar_json(
            instrucciones=INSTRUCCIONES_SISTEMA,
            entrada=construir_entrada(texto_validado, titulo),
        )
        return ResultadoMapa(
            mapa=self._analizar(bruto),
            metadatos=MetadatosMapa(
                modelo=self._proveedor.modelo,
                generado_en=_ahora(),
                caracteres_entrada=len(texto_validado),
            ),
        )

    def generar_mapa_desde_pdf(self, pdf: bytes, nombre_archivo: str, titulo: str | None = None) -> ResultadoMapa:
        """Valida el PDF (sin extraer su texto) y lo envía original a la IA."""
        if len(pdf) > self._pdf_max_bytes:
            raise PdfMuyPesado(f"El PDF supera el tamaño máximo de {self._pdf_max_bytes // (1024 * 1024)} MB.")
        if not pdf:
            raise PdfInvalido(detalle="el archivo está vacío")
        paginas = validar_pdf(pdf, max_paginas=self._pdf_max_paginas)

        bruto = self._proveedor.generar_json_desde_pdf(
            instrucciones=INSTRUCCIONES_SISTEMA_PDF,
            entrada=construir_entrada_pdf(titulo),
            pdf=pdf,
            nombre_archivo=nombre_archivo,
        )
        return ResultadoMapa(
            mapa=self._analizar(bruto),
            metadatos=MetadatosMapa(
                modelo=self._proveedor.modelo,
                generado_en=_ahora(),
                caracteres_entrada=0,
                entrada="pdf",
                paginas=paginas,
            ),
        )

    @staticmethod
    def _analizar(bruto: str) -> MapaConceptual:
        try:
            return analizar_respuesta_ia(bruto)
        except Exception as error:
            # El contenido del usuario y de la IA no se registran: solo el motivo técnico.
            logger.error("Respuesta de la IA inválida (mapa conceptual): %s", getattr(error, "detalle", type(error).__name__))
            raise


def _ahora() -> str:
    return datetime.now(timezone.utc).isoformat()
