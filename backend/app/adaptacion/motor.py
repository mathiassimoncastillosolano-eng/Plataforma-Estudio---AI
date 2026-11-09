"""Motor adaptativo (MOD-07): nivel del estudiante por tema y dificultad objetivo. Lógica pura, sin FastAPI ni OpenAI.

Al cerrar cada periodo de 15 el nivel nuevo sale del modelo de ML de MOD-06 (`modelo_ml.py`) si
se le pasa `predecir`. Sin modelo se usa la regla observada en el dataset (notebook §8, IAML-028):
    nivel_t = 0,75 · nivel_(t−1) + 0,25 · porcentaje_correctas_t
"""
from collections.abc import Callable

from app.adaptacion.modelo_ml import variables_modelo_a
from app.pruebas.distribucion import DIFICULTADES

PREGUNTAS_POR_PERIODO = 15
PESO_NIVEL_PREVIO = 0.75
NIVEL_INICIAL = 0.57  # media de nivel_conocimiento en el periodo 1 del dataset
# Umbrales target → dificultad (TASK-0076). El límite inferior es inclusivo.
UMBRAL_MEDIA = 0.50
UMBRAL_DIFICIL = 0.80


def estado_inicial() -> dict:
    return {"nivel": NIVEL_INICIAL, "numero_periodo": 1, "ultimo_porcentaje": None, "correctas_acumuladas": 0, "pendientes": []}


def dificultad_objetivo(nivel: float) -> str:
    if nivel >= UMBRAL_DIFICIL:
        return "dificil"
    if nivel >= UMBRAL_MEDIA:
        return "media"
    return "facil"


def actualizar_nivel(nivel_previo: float, porcentaje_correctas: float) -> float:
    nuevo = PESO_NIVEL_PREVIO * nivel_previo + (1 - PESO_NIVEL_PREVIO) * porcentaje_correctas
    return round(min(1.0, max(0.0, nuevo)), 4)


def registrar(
    estado: dict, respuestas: list[dict], predecir: Callable[[dict], float] | None = None
) -> tuple[dict, list[dict]]:
    """Suma respuestas `{dificultad, correcta, segundos?}` y cierra un periodo cada 15.

    `predecir` recibe las variables del modelo A y devuelve el nivel (0 a 1). Si es None o falla,
    se usa la regla 0,75/0,25. Devuelve (estado nuevo, periodos cerrados).
    """
    nivel = float(estado["nivel"])
    periodo = int(estado["numero_periodo"])
    ultimo = estado.get("ultimo_porcentaje")
    acumuladas = int(estado.get("correctas_acumuladas", 0))
    pendientes = list(estado["pendientes"]) + list(respuestas)
    cerrados = []
    while len(pendientes) >= PREGUNTAS_POR_PERIODO:
        bloque, pendientes = pendientes[:PREGUNTAS_POR_PERIODO], pendientes[PREGUNTAS_POR_PERIODO:]
        correctas = sum(1 for r in bloque if r["correcta"])
        porcentaje = round(correctas / PREGUNTAS_POR_PERIODO, 4)
        conteo = _contar(bloque)
        nuevo, fuente = actualizar_nivel(nivel, porcentaje), "regla"
        if predecir is not None:
            variables = variables_modelo_a(
                numero_periodo=periodo,
                nivel_previo=nivel,
                correctas_previas=acumuladas,
                porcentaje_previo=ultimo,
                por_dificultad=conteo,
                tiempo_promedio=_tiempo_promedio(bloque),
            )
            try:
                nuevo, fuente = predecir(variables), "modelo"
            except Exception:  # el modelo nunca debe tumbar el registro: se queda la regla
                pass
        cerrados.append(
            {
                "numero_periodo": periodo,
                "porcentaje_correctas": porcentaje,
                "variacion_porcentaje": None if ultimo is None else round(porcentaje - ultimo, 4),
                "por_dificultad": conteo,
                "nivel_previo": nivel,
                "nivel": nuevo,
                "fuente": fuente,
            }
        )
        nivel, ultimo, periodo, acumuladas = nuevo, porcentaje, periodo + 1, acumuladas + correctas
    estado_nuevo = {
        "nivel": nivel,
        "numero_periodo": periodo,
        "ultimo_porcentaje": ultimo,
        "correctas_acumuladas": acumuladas,
        "pendientes": pendientes,
    }
    return estado_nuevo, cerrados


def _tiempo_promedio(bloque: list[dict]) -> float | None:
    """Segundos medios por pregunta; None si alguna respuesta no trae tiempo (el modelo lo imputa)."""
    tiempos = [r.get("segundos") for r in bloque]
    if any(t is None for t in tiempos):
        return None
    return sum(tiempos) / len(tiempos)


def _contar(bloque: list[dict]) -> dict:
    conteo = {n: {"preguntas": 0, "correctas": 0} for n in DIFICULTADES}
    for r in bloque:
        conteo[r["dificultad"]]["preguntas"] += 1
        conteo[r["dificultad"]]["correctas"] += int(r["correcta"])
    return conteo 