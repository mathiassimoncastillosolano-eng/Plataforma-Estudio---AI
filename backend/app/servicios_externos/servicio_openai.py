"""Cliente de OpenAI. Es el único módulo que conoce el SDK y sus errores.

Traduce cada fallo del SDK a un error controlado de la aplicación, sin exponer
claves ni mensajes internos del proveedor.
"""
import logging

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
    IARespuestaInvalida,
    IATiempoAgotado,
)

logger = logging.getLogger(__name__)


class ServicioOpenAI:
    def __init__(
        self,
        *,
        api_key: str,
        modelo: str,
        timeout_segundos: float,
        max_reintentos: int,
        cliente: OpenAI | None = None,
    ):
        self.modelo = modelo
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
        except APITimeoutError as error:  # debe ir antes que APIConnectionError (es su subclase)
            self._registrar(error)
            raise IATiempoAgotado() from error
        except APIConnectionError as error:
            self._registrar(error)
            raise IANoDisponible() from error
        except (AuthenticationError, PermissionDeniedError) as error:
            self._registrar(error)  # sin mensaje: puede incluir fragmentos de la clave
            raise IACredencialesInvalidas() from error
        except NotFoundError as error:
            self._registrar(error, con_mensaje=True)
            raise IAModeloNoDisponible() from error
        except RateLimitError as error:
            self._registrar(error)
            raise IALimiteSolicitudes() from error
        except (BadRequestError, APIStatusError, OpenAIError) as error:
            self._registrar(error, con_mensaje=isinstance(error, BadRequestError))
            raise ErrorProveedorIA() from error

        return self._extraer_contenido(respuesta)

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
    def _registrar(error: Exception, *, con_mensaje: bool = False) -> None:
        estado = getattr(error, "status_code", None)
        if con_mensaje:
            logger.error("OpenAI falló: %s (estado %s): %s", type(error).__name__, estado, getattr(error, "message", ""))
        else:
            logger.error("OpenAI falló: %s (estado %s)", type(error).__name__, estado)
