"""Contrato que debe cumplir cualquier proveedor de IA.

Los servicios de dominio dependen de este contrato y no de OpenAI, de modo que
cambiar de proveedor (o usar uno falso en las pruebas) no afecta a la lógica.
"""
from typing import Protocol


class ProveedorIA(Protocol):
    modelo: str

    def generar_json(self, *, instrucciones: str, entrada: str, timeout_segundos: float | None = None) -> str:
        """Devuelve el texto bruto (se espera un objeto JSON) generado por el modelo.

        `timeout_segundos` (opcional) sustituye el tiempo de espera predeterminado en esa llamada.
        """
        ...

    def generar_json_desde_pdf(self, *, instrucciones: str, entrada: str, pdf: bytes, nombre_archivo: str) -> str:
        """Igual que `generar_json`, pero el modelo analiza el PDF original (texto y elementos visuales)."""
        ...
