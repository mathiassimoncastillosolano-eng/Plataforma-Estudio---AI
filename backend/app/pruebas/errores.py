"""Errores controlados del módulo de pruebas.

Siguen el mismo contrato que `app.comun.errores`: código estable, mensaje seguro para el
usuario y estado HTTP. Viven aquí para no tocar el archivo compartido.
"""
from app.comun.errores import ErrorAplicacion


class ConfiguracionPruebaInvalida(ErrorAplicacion):
    codigo = "PRUEBA_CONFIGURACION_INVALIDA"
    estado_http = 422
    mensaje_predeterminado = "La configuración de la prueba no es válida. Revísala e inténtalo de nuevo."


class DistribucionInvalida(ErrorAplicacion):
    codigo = "PRUEBA_DISTRIBUCION_INVALIDA"
    estado_http = 422
    mensaje_predeterminado = "La suma de preguntas fáciles, medias y difíciles debe ser igual al total de la prueba."


class ContenidoInsuficiente(ErrorAplicacion):
    codigo = "PRUEBA_CONTENIDO_INSUFICIENTE"
    estado_http = 422
    mensaje_predeterminado = "El resumen no tiene contenido suficiente para esta prueba."


class GeneracionIncompleta(ErrorAplicacion):
    codigo = "PRUEBA_GENERACION_INCOMPLETA"
    estado_http = 502
    mensaje_predeterminado = (
        "No logramos generar todas las preguntas solicitadas con la calidad necesaria. "
        "Inténtalo de nuevo o elige menos preguntas."
    )


class PruebaInvalida(ErrorAplicacion):
    codigo = "PRUEBA_INVALIDA"
    estado_http = 422
    mensaje_predeterminado = "No reconocemos esta prueba. Vuelve a configurarla para crear una nueva."


class PruebaExpirada(ErrorAplicacion):
    codigo = "PRUEBA_EXPIRADA"
    estado_http = 410
    mensaje_predeterminado = "Esta prueba ya no está disponible porque pasó demasiado tiempo. Crea una nueva."


class EstadoPruebaInvalido(ErrorAplicacion):
    codigo = "PRUEBA_ESTADO_INVALIDO"
    estado_http = 409
    mensaje_predeterminado = "Esa acción no está disponible en el estado actual de la prueba."


class PausaNoPermitida(ErrorAplicacion):
    codigo = "PRUEBA_PAUSA_NO_PERMITIDA"
    estado_http = 409
    mensaje_predeterminado = "Esta prueba se configuró sin pausa."
