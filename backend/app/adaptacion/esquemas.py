from typing import Literal

from pydantic import BaseModel, Field


class RespuestaRegistrada(BaseModel):
    dificultad: Literal["facil", "media", "dificil"]
    correcta: bool
    # Segundos que tardó en responder. Opcional: sin tiempo el modelo de ML lo imputa.
    segundos: float | None = Field(default=None, ge=0, le=600)
    segundos: float = Field(ge=0, le=300)


class EstadoAdaptativo(BaseModel):
    nivel: float = Field(ge=0, le=1)
    numero_periodo: int = Field(ge=1, le=10_000)
    ultimo_porcentaje: float | None = Field(default=None, ge=0, le=1)
    correctas_acumuladas: int = Field(default=0, ge=0)  # aciertos de periodos ya cerrados (variable del modelo)
    correctas_total: int = Field(default=0, ge=0, le=1_000_000)
    pendientes: list[RespuestaRegistrada] = Field(default_factory=list, max_length=14)


class SolicitudRegistrar(BaseModel):
    id_tema: str = Field(min_length=1, max_length=100)
    estado: EstadoAdaptativo | None = None
    respuestas: list[RespuestaRegistrada] = Field(default_factory=list, max_length=100)