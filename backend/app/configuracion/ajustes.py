"""Única fuente de configuración del backend.

Todo se lee de variables de entorno (o del archivo `backend/.env` en
desarrollo). Ningún otro módulo debe leer `os.environ` directamente ni
escribir el nombre del modelo o la clave.
"""
import os
from dataclasses import dataclass, field
from functools import lru_cache
from pathlib import Path

RUTA_ENV = Path(__file__).resolve().parents[2] / ".env"


@dataclass(frozen=True)
class Ajustes:
    openai_api_key: str = field(repr=False)  # repr=False: la clave nunca debe aparecer en logs
    openai_model: str
    openai_timeout_segundos: float
    openai_max_reintentos: int
    resumen_min_caracteres: int
    resumen_max_caracteres: int
    pdf_max_bytes: int
    pdf_max_paginas: int
    origenes_permitidos: tuple[str, ...]

    @property
    def ia_configurada(self) -> bool:
        return bool(self.openai_api_key and self.openai_model)


def _leer_numero(nombre: str, defecto: float, tipo: type) -> float | int:
    bruto = os.environ.get(nombre, "").strip()
    if not bruto:
        return defecto
    try:
        valor = tipo(bruto)
    except ValueError as error:
        raise ValueError(f"La variable de entorno {nombre} debe ser un número válido (recibido: {bruto!r}).") from error
    if valor <= 0:
        raise ValueError(f"La variable de entorno {nombre} debe ser mayor que cero.")
    return valor


def cargar_ajustes() -> Ajustes:
    from dotenv import load_dotenv

    load_dotenv(RUTA_ENV)  # no sobrescribe variables ya definidas en el entorno

    origenes = tuple(
        origen.strip().rstrip("/")
        for origen in os.environ.get("ORIGENES_PERMITIDOS", "http://localhost:5173").split(",")
        if origen.strip()
    )
    return Ajustes(
        openai_api_key=os.environ.get("OPENAI_API_KEY", "").strip(),
        openai_model=os.environ.get("OPENAI_MODEL", "").strip(),
        openai_timeout_segundos=_leer_numero("OPENAI_TIMEOUT_SEGUNDOS", 45.0, float),
        openai_max_reintentos=int(_leer_numero("OPENAI_MAX_REINTENTOS", 1, int)),
        resumen_min_caracteres=int(_leer_numero("RESUMEN_MIN_CARACTERES", 100, int)),
        resumen_max_caracteres=int(_leer_numero("RESUMEN_MAX_CARACTERES", 20_000, int)),
        pdf_max_bytes=int(_leer_numero("PDF_MAX_BYTES", 10 * 1024 * 1024, int)),
        pdf_max_paginas=int(_leer_numero("PDF_MAX_PAGINAS", 100, int)),
        origenes_permitidos=origenes,
    )


@lru_cache
def obtener_ajustes() -> Ajustes:
    return cargar_ajustes()
