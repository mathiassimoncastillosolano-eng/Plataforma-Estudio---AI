"""Errores controlados de la aplicación.

Cada error define su código estable (para que el frontend pueda reaccionar),
un mensaje seguro para el usuario y el estado HTTP que le corresponde.
El `detalle` es solo para los logs: nunca se envía al cliente.
"""


class ErrorAplicacion(Exception):
    codigo = "ERROR_INTERNO"
    estado_http = 500
    mensaje_predeterminado = "Ocurrió un error inesperado. Inténtalo de nuevo."

    def __init__(self, mensaje: str | None = None, *, detalle: str | None = None):
        self.mensaje = mensaje or self.mensaje_predeterminado
        self.detalle = detalle
        super().__init__(self.mensaje)


# --- Contenido de estudio -------------------------------------------------


class ContenidoVacio(ErrorAplicacion):
    codigo = "CONTENIDO_VACIO"
    estado_http = 422
    mensaje_predeterminado = "Escribe o pega el contenido que quieres estudiar."


class ContenidoMuyCorto(ErrorAplicacion):
    codigo = "CONTENIDO_MUY_CORTO"
    estado_http = 422
    mensaje_predeterminado = "El contenido es demasiado corto para generar un resumen."


class ContenidoMuyLargo(ErrorAplicacion):
    codigo = "CONTENIDO_MUY_LARGO"
    estado_http = 422
    mensaje_predeterminado = "El contenido supera el máximo permitido. Divídelo en partes."


class ContenidoInvalido(ErrorAplicacion):
    codigo = "CONTENIDO_INVALIDO"
    estado_http = 422
    mensaje_predeterminado = "El contenido no parece texto legible. Revisa que sea el material correcto."


# --- PDF ------------------------------------------------------------------


class PdfInvalido(ErrorAplicacion):
    codigo = "PDF_INVALIDO"
    estado_http = 422
    mensaje_predeterminado = "No pudimos leer el archivo. Comprueba que sea un PDF válido y no esté dañado."


class PdfProtegido(ErrorAplicacion):
    codigo = "PDF_PROTEGIDO"
    estado_http = 422
    mensaje_predeterminado = "El PDF está protegido con contraseña. Sube una versión sin protección."


class PdfSinTexto(ErrorAplicacion):
    codigo = "PDF_SIN_TEXTO"
    estado_http = 422
    mensaje_predeterminado = (
        "El PDF no contiene texto seleccionable (puede ser un documento escaneado). "
        "Sube un PDF con texto o pega el contenido manualmente."
    )


class PdfMuyPesado(ErrorAplicacion):
    codigo = "PDF_MUY_PESADO"
    estado_http = 413
    mensaje_predeterminado = "El PDF pesa demasiado. Sube un archivo más pequeño."


# --- Proveedor de IA ------------------------------------------------------


class ErrorProveedorIA(ErrorAplicacion):
    codigo = "IA_ERROR"
    estado_http = 502
    mensaje_predeterminado = "El servicio de IA no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos."


class IANoConfigurada(ErrorProveedorIA):
    codigo = "IA_NO_CONFIGURADA"
    estado_http = 503
    mensaje_predeterminado = "El servicio de IA no está configurado todavía. Contacta al administrador."


class IACredencialesInvalidas(ErrorProveedorIA):
    codigo = "IA_CREDENCIALES_INVALIDAS"
    estado_http = 502
    mensaje_predeterminado = "El servicio de IA no está configurado correctamente. Contacta al administrador."


class IAModeloNoDisponible(ErrorProveedorIA):
    codigo = "IA_MODELO_NO_DISPONIBLE"
    estado_http = 502
    mensaje_predeterminado = "El modelo de IA configurado no está disponible. Contacta al administrador."


class IALimiteSolicitudes(ErrorProveedorIA):
    codigo = "IA_LIMITE_SOLICITUDES"
    estado_http = 429
    mensaje_predeterminado = "El servicio de IA recibió demasiadas solicitudes. Espera un momento e inténtalo de nuevo."


class IATiempoAgotado(ErrorProveedorIA):
    codigo = "IA_TIEMPO_AGOTADO"
    estado_http = 504
    mensaje_predeterminado = "El servicio de IA tardó demasiado en responder. Inténtalo de nuevo."


class IANoDisponible(ErrorProveedorIA):
    codigo = "IA_NO_DISPONIBLE"
    estado_http = 503
    mensaje_predeterminado = "No pudimos conectar con el servicio de IA. Inténtalo de nuevo en unos minutos."


class IARespuestaInvalida(ErrorProveedorIA):
    codigo = "IA_RESPUESTA_INVALIDA"
    estado_http = 502
    mensaje_predeterminado = "La IA devolvió una respuesta inesperada. Inténtalo de nuevo."
