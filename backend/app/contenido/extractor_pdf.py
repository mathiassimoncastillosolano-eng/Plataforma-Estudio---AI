"""Extracción de texto desde un PDF en memoria con pypdf."""
import logging
from dataclasses import dataclass
from io import BytesIO

from pypdf import PdfReader
from pypdf.errors import DependencyError

from app.comun.errores import ContenidoMuyLargo, ErrorAplicacion, PdfInvalido, PdfProtegido
from app.contenido.validacion import formatear_numero, normalizar_texto

logger = logging.getLogger(__name__)

CABECERA_PDF = b"%PDF-"
_BYTES_A_REVISAR_CABECERA = 1024


@dataclass(frozen=True)
class TextoExtraido:
    texto: str
    paginas: int


def _abrir_lector(datos: bytes) -> PdfReader:
    if CABECERA_PDF not in datos[:_BYTES_A_REVISAR_CABECERA]:
        raise PdfInvalido(detalle="el archivo no tiene cabecera %PDF-")
    try:
        lector = PdfReader(BytesIO(datos))
        if lector.is_encrypted and not lector.decrypt(""):
            raise PdfProtegido()
        return lector
    except ErrorAplicacion:
        raise
    except DependencyError as error:
        # PDF cifrado con un algoritmo que requiere una librería adicional
        raise PdfProtegido(detalle=str(error)) from error
    except Exception as error:  # pypdf puede lanzar muchos tipos distintos con archivos dañados
        raise PdfInvalido(detalle=f"{type(error).__name__}: {error}") from error


def extraer_texto_pdf(datos: bytes, *, max_paginas: int, max_caracteres: int) -> TextoExtraido:
    """Extrae el texto de todas las páginas.

    Corta de forma temprana si el PDF supera los límites, para no gastar
    memoria ni CPU con documentos enormes.
    """
    lector = _abrir_lector(datos)
    try:
        total_paginas = len(lector.pages)
    except Exception as error:
        raise PdfInvalido(detalle=f"{type(error).__name__}: {error}") from error

    if total_paginas > max_paginas:
        raise ContenidoMuyLargo(
            f"El PDF tiene {total_paginas} páginas y el máximo permitido es {max_paginas}. Sube una parte del documento."
        )

    fragmentos: list[str] = []
    acumulado = 0
    for numero, pagina in enumerate(lector.pages, start=1):
        try:
            fragmento = (pagina.extract_text() or "").strip()
        except Exception as error:  # una página dañada no debe invalidar todo el documento
            logger.warning("No se pudo leer la página %s del PDF (%s)", numero, type(error).__name__)
            continue
        if not fragmento:
            continue
        fragmentos.append(fragmento)
        acumulado += len(fragmento)
        if acumulado > max_caracteres * 2:
            raise ContenidoMuyLargo(
                f"El PDF contiene demasiado texto (el máximo es {formatear_numero(max_caracteres)} caracteres). "
                "Sube una parte del documento."
            )

    return TextoExtraido(texto=normalizar_texto("\n\n".join(fragmentos)), paginas=total_paginas)
