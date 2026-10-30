"""Proveedor de IA falso y texto de ejemplo compartidos por las pruebas."""
from pruebas.respuestas_ia import RESPUESTA_VALIDA_JSON

TEXTO = "El sistema circulatorio transporta sangre, oxígeno y nutrientes por todo el cuerpo humano. " * 3


class ProveedorFalso:
    """Sustituye a OpenAI: no hace llamadas reales ni consume créditos."""

    modelo = "modelo-de-prueba"

    def __init__(self, respuesta: str | None = RESPUESTA_VALIDA_JSON, error: Exception | None = None):
        self._respuesta = respuesta
        self._error = error
        self.llamadas: list[dict] = []

    def generar_json(self, *, instrucciones: str, entrada: str, timeout_segundos: float | None = None) -> str:
        self.llamadas.append({"instrucciones": instrucciones, "entrada": entrada, "timeout_segundos": timeout_segundos})
        if self._error:
            raise self._error
        return self._respuesta

    def generar_json_desde_pdf(self, *, instrucciones: str, entrada: str, pdf: bytes, nombre_archivo: str) -> str:
        self.llamadas.append({"instrucciones": instrucciones, "entrada": entrada, "pdf": pdf, "nombre_archivo": nombre_archivo})
        if self._error:
            raise self._error
        return self._respuesta
