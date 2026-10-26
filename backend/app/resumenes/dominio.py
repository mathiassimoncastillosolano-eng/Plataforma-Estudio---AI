"""Modelos de dominio del resumen. No dependen de FastAPI ni de OpenAI."""
from dataclasses import dataclass, field

PALABRAS_POR_MINUTO = 200


def calcular_minutos_lectura(*textos: str) -> int:
    palabras = sum(len(texto.split()) for texto in textos)
    return max(1, round(palabras / PALABRAS_POR_MINUTO))


@dataclass(frozen=True)
class TablaResumen:
    titulo: str
    encabezados: list[str]
    filas: list[list[str]]


@dataclass(frozen=True)
class SeccionGeneral:
    titulo: str
    contenido: str
    puntos: list[str] = field(default_factory=list)
    tabla: TablaResumen | None = None


@dataclass(frozen=True)
class ResumenGeneral:
    titulo: str
    introduccion: str
    secciones: list[SeccionGeneral]
    minutos_lectura: int
    notas_de_fidelidad: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class ConceptoClave:
    termino: str
    definicion: str


@dataclass(frozen=True)
class FormulaRegla:
    nombre: str
    expresion: str
    explicacion: str = ""


@dataclass(frozen=True)
class ResumenEsencial:
    idea_central: str
    ideas_clave: list[str]
    conceptos_clave: list[ConceptoClave]
    minutos_lectura: int
    formulas_y_reglas: list[FormulaRegla] = field(default_factory=list)
    notas_de_fidelidad: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class MetadatosResumen:
    modelo: str
    generado_en: str
    caracteres_entrada: int
    entrada: str = "texto"  # "texto" | "pdf"
    paginas: int | None = None


@dataclass(frozen=True)
class ResultadoResumen:
    resumen_general: ResumenGeneral
    resumen_esencial: ResumenEsencial
    metadatos: MetadatosResumen
