"""Caso de uso: convertir un PDF subido en texto de estudio."""
from dataclasses import dataclass
from typing import BinaryIO

from app.comun.errores import ContenidoMuyLargo, PdfMuyPesado, PdfSinTexto
from app.contenido.extractor_pdf import extraer_texto_pdf
from app.contenido.validacion import formatear_numero


@dataclass(frozen=True)
class ContenidoPdf:
    texto: str
    paginas: int
    caracteres: int


class ServicioContenido:
    def __init__(self, *, max_bytes: int, max_paginas: int, min_caracteres: int, max_caracteres: int):
        self._max_bytes = max_bytes
        self._max_paginas = max_paginas
        self._min_caracteres = min_caracteres
        self._max_caracteres = max_caracteres

    def extraer_texto_de_pdf(self, flujo: BinaryIO) -> ContenidoPdf:
        # Se lee un byte de más para detectar archivos que superan el límite sin cargarlos completos.
        datos = flujo.read(self._max_bytes + 1)
        if len(datos) > self._max_bytes:
            raise PdfMuyPesado(f"El PDF supera el tamaño máximo de {self._max_bytes // (1024 * 1024)} MB.")

        extraido = extraer_texto_pdf(datos, max_paginas=self._max_paginas, max_caracteres=self._max_caracteres)

        if len(extraido.texto) < self._min_caracteres:
            raise PdfSinTexto()
        if len(extraido.texto) > self._max_caracteres:
            raise ContenidoMuyLargo(
                f"El PDF contiene {formatear_numero(len(extraido.texto))} caracteres de texto y el máximo es "
                f"{formatear_numero(self._max_caracteres)}. Sube una parte del documento."
            )
        return ContenidoPdf(texto=extraido.texto, paginas=extraido.paginas, caracteres=len(extraido.texto))
