from app.adaptacion.modelo import estimar_nivel
from app.pruebas.distribucion import DIFICULTADES

PREGUNTAS_POR_PERIODO = 15
NIVEL_INICIAL = 0.57
UMBRAL_MEDIA = 0.50
UMBRAL_DIFICIL = 0.80


def estado_inicial() -> dict:
    return {"nivel": NIVEL_INICIAL, "numero_periodo": 1, "ultimo_porcentaje": None, "correctas_total": 0, "pendientes": []}


def dificultad_objetivo(nivel: float) -> str:
    if nivel >= UMBRAL_DIFICIL:
        return "dificil"
    if nivel >= UMBRAL_MEDIA:
        return "media"
    return "facil"


def registrar(estado: dict, respuestas: list[dict]) -> tuple[dict, list[dict]]:
    nivel = float(estado["nivel"])
    periodo = int(estado["numero_periodo"])
    ultimo = estado.get("ultimo_porcentaje")
    acumuladas = int(estado.get("correctas_total", 0))
    pendientes = list(estado["pendientes"]) + list(respuestas)
    cerrados = []
    while len(pendientes) >= PREGUNTAS_POR_PERIODO:
        bloque, pendientes = pendientes[:PREGUNTAS_POR_PERIODO], pendientes[PREGUNTAS_POR_PERIODO:]
        correctas = sum(1 for r in bloque if r["correcta"])
        porcentaje = round(correctas / PREGUNTAS_POR_PERIODO, 4)
        variacion = None if ultimo is None else round(porcentaje - ultimo, 4)
        cierre = {
            "numero_periodo": periodo,
            "preguntas": PREGUNTAS_POR_PERIODO,
            "correctas": correctas,
            "porcentaje_correctas": porcentaje,
            "tiempo_promedio": round(sum(r["segundos"] for r in bloque) / PREGUNTAS_POR_PERIODO, 2),
            "por_dificultad": _contar(bloque),
        }
        nuevo = round(estimar_nivel(cierre, None if ultimo is None else nivel, acumuladas, variacion), 4)
        cerrados.append({**cierre, "variacion_porcentaje": variacion, "nivel_previo": None if ultimo is None else nivel, "nivel": nuevo})
        nivel, ultimo, periodo, acumuladas = nuevo, porcentaje, periodo + 1, acumuladas + correctas
    return {"nivel": nivel, "numero_periodo": periodo, "ultimo_porcentaje": ultimo, "correctas_total": acumuladas, "pendientes": pendientes}, cerrados


def _contar(bloque: list[dict]) -> dict:
    conteo = {n: {"preguntas": 0, "correctas": 0} for n in DIFICULTADES}
    for r in bloque:
        conteo[r["dificultad"]]["preguntas"] += 1
        conteo[r["dificultad"]]["correctas"] += int(r["correcta"])
    return conteo 