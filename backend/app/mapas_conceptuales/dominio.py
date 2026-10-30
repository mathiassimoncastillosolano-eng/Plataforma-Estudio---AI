"""Modelos de dominio del mapa conceptual. No dependen de FastAPI ni de OpenAI.

El mapa es un árbol jerárquico (concepto principal → conceptos → detalles) más un
conjunto reducido de relaciones cruzadas entre ramas. Cada relación lleva una frase
de enlace, de modo que se lea como una proposición: «origen —frase→ destino».
La IA no devuelve coordenadas: la posición de los nodos la calcula el frontend.
"""
from dataclasses import dataclass, field
from typing import Literal

# --- Límites del mapa (los usan el prompt y el analizador) -----------------------------------
MAX_NODOS = 30
MIN_NODOS = 3
MAX_RELACIONES_CRUZADAS = 12
MAX_NIVEL_VISUAL = 2  # el frontend estiliza los niveles 0, 1 y 2; los más profundos se muestran como 2

MAX_LONGITUD_TITULO = 120
MAX_LONGITUD_ETIQUETA = 80
MAX_LONGITUD_FRASE = 60
MAX_LONGITUD_DEFINICION = 600
MAX_LONGITUD_ID = 64

TipoRelacion = Literal["jerarquica", "cruzada"]


@dataclass(frozen=True)
class NodoMapa:
    id: str
    etiqueta: str
    definicion: str
    nivel: int
    id_padre: str | None


@dataclass(frozen=True)
class RelacionMapa:
    id: str
    origen: str
    destino: str
    frase_enlace: str
    tipo: TipoRelacion


@dataclass(frozen=True)
class MapaConceptual:
    titulo: str
    nodos: list[NodoMapa]
    relaciones: list[RelacionMapa]


@dataclass(frozen=True)
class MetadatosMapa:
    modelo: str
    generado_en: str
    caracteres_entrada: int
    entrada: str = "texto"  # "texto" | "pdf"
    paginas: int | None = None


@dataclass(frozen=True)
class ResultadoMapa:
    mapa: MapaConceptual
    metadatos: MetadatosMapa = field(repr=False)
