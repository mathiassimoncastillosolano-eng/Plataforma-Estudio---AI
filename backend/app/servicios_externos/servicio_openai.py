"""Cliente de OpenAI. Es el único módulo que conoce el SDK y sus errores.

Traduce cada fallo del SDK a un error controlado de la aplicación, sin exponer
claves ni mensajes internos del proveedor.

- `generar_json`: contenido en texto (Chat Completions).
- `generar_json_desde_pdf`: el PDF original viaja como archivo (Responses API,
  entrada `input_file`), sin convertirlo antes a texto plano.
"""
import base64
import logging
import re

from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    BadRequestError,
    NotFoundError,
    OpenAI,
    OpenAIError,
    PermissionDeniedError,
    RateLimitError,
)

from app.comun.errores import (
    ErrorProveedorIA,
    IACredencialesInvalidas,
    IALimiteSolicitudes,
    IAModeloNoDisponible,
    IANoDisponible,
    IAPdfNoSoportado,
    IARespuestaInvalida,
    IATiempoAgotado,
)

logger = logging.getLogger(__name__)

# Un 400 que habla de archivos/PDF/imágenes indica que el modelo no admite ese tipo de entrada.
_MENSAJE_PDF_NO_SOPORTADO = re.compile(r"input_file|\bpdf\b|file input|unsupported.*(file|modalit)|image input|vision", re.IGNORECASE)


def _nombre_seguro(nombre: str | None) -> str:
    """Solo el nombre del archivo (sin rutas de Windows ni de Unix)."""
    return re.split(r"[\\/]", nombre or "")[-1].strip() or "documento.pdf"


class ServicioOpenAI:
    def __init__(
        self,
        *,
        api_key: str,
        modelo: str,
        timeout_segundos: float,
        max_reintentos: int,
        timeout_pdf_segundos: float = 180.0,
        cliente: OpenAI | None = None,
    ):
        self.modelo = modelo
        self._timeout_pdf = timeout_pdf_segundos
        self._cliente = cliente or OpenAI(api_key=api_key, timeout=timeout_segundos, max_retries=max_reintentos)

    def generar_json(self, *, instrucciones: str, entrada: str) -> str:
        try:
            respuesta = self._cliente.chat.completions.create(
                model=self.modelo,
                messages=[
                    {"role": "system", "content": instrucciones},
                    {"role": "user", "content": entrada},
                ],
                response_format={"type": "json_object"},
            )
        except OpenAIError as error:
            raise self._traducir_error(error) from error

        return self._extraer_contenido(respuesta)

    def generar_json_desde_pdf(self, *, instrucciones: str, entrada: str, pdf: bytes, nombre_archivo: str) -> str:
        """Envía el PDF original a la Responses API como `input_file` (base64 en línea).

        `store=False`: OpenAI no conserva la respuesta; el archivo tampoco se sube ni se guarda.
        """
        archivo = {
            "type": "input_file",
            "filename": _nombre_seguro(nombre_archivo),
            "file_data": "data:application/pdf;base64," + base64.b64encode(pdf).decode("ascii"),
        }
        try:
            respuesta = self._cliente.responses.create(
                model=self.modelo,
                instructions=instrucciones,
                input=[{"role": "user", "content": [archivo, {"type": "input_text", "text": entrada}]}],
                text={"format": {"type": "json_object"}},
                store=False,
                timeout=self._timeout_pdf,
            )
        except OpenAIError as error:
            raise self._traducir_error(error, entrada_pdf=True) from error

        return self._extraer_contenido_respuesta(respuesta)

    # --- Traducción de errores -------------------------------------------

    def _traducir_error(self, error: OpenAIError, *, entrada_pdf: bool = False) -> ErrorProveedorIA:
        if isinstance(error, APITimeoutError):  # debe ir antes que APIConnectionError (es su subclase)
            self._registrar(error)
            return IATiempoAgotado()
        if isinstance(error, APIConnectionError):
            self._registrar(error)
            return IANoDisponible()
        if isinstance(error, (AuthenticationError, PermissionDeniedError)):
            self._registrar(error)  # sin mensaje: puede incluir fragmentos de la clave
            return IACredencialesInvalidas()
        if isinstance(error, NotFoundError):
            self._registrar(error, con_mensaje=True)
            return IAModeloNoDisponible()
        if isinstance(error, RateLimitError):
            self._registrar(error)
            return IALimiteSolicitudes()
        if isinstance(error, BadRequestError):
            self._registrar(error, con_mensaje=True)
            if entrada_pdf and _MENSAJE_PDF_NO_SOPORTADO.search(getattr(error, "message", "") or ""):
                return IAPdfNoSoportado()
            return ErrorProveedorIA()
        self._registrar(error)
        return ErrorProveedorIA()

    # --- Extracción de la respuesta --------------------------------------

    @staticmethod
    def _extraer_contenido(respuesta) -> str:
        if not respuesta.choices:
            raise IARespuestaInvalida(detalle="OpenAI no devolvió ninguna opción")
        opcion = respuesta.choices[0]
        if opcion.finish_reason == "length":
            raise IARespuestaInvalida(detalle="la respuesta se cortó por límite de longitud")
        contenido = opcion.message.content
        if not contenido or not contenido.strip():
            raise IARespuestaInvalida(detalle="OpenAI devolvió una respuesta vacía")
        return contenido

    @staticmethod
    def _extraer_contenido_respuesta(respuesta) -> str:
        estado = getattr(respuesta, "status", None)
        if estado == "incomplete":
            motivo = getattr(getattr(respuesta, "incomplete_details", None), "reason", None)
            raise IARespuestaInvalida(detalle=f"la respuesta quedó incompleta ({motivo or 'sin motivo'})")
        if estado in ("failed", "cancelled"):
            raise IARespuestaInvalida(detalle=f"la respuesta terminó con estado '{estado}'")
        contenido = getattr(respuesta, "output_text", None)
        if not contenido or not contenido.strip():
            raise IARespuestaInvalida(detalle="OpenAI devolvió una respuesta vacía")
        return contenido

    @staticmethod
    def _registrar(error: Exception, *, con_mensaje: bool = False) -> None:
        estado = getattr(error, "status_code", None)
        if con_mensaje:
            logger.error("OpenAI falló: %s (estado %s): %s", type(error).__name__, estado, getattr(error, "message", ""))
        else:
            logger.error("OpenAI falló: %s (estado %s)", type(error).__name__, estado)
