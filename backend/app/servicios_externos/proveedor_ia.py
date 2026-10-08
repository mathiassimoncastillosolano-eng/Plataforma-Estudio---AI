"""Contrato que debe cumplir cualquier proveedor de IA.

Los servicios de dominio dependen de este contrato y no de OpenAI, de modo que
cambiar de proveedor (o usar uno falso en las pruebas) no afecta a la lógica.
"""
from typing import Protocol


class ProveedorIA(Protocol):
    modelo: str

    def generar_json(self, *, instrucciones: str, entrada: str) -> str:
        """Devuelve el texto bruto (se espera un objeto JSON) generado por el modelo."""
        ...
