from functools import lru_cache
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

RUTA_MODELO = Path(__file__).resolve().parents[3] / "ml" / "modelo_nivel_conocimiento_A_estimacion_en_corte.pkl"
EPSILON = 1e-9
PESOS = {"facil": 1, "media": 2, "dificil": 3}


@lru_cache(maxsize=1)
def _cargar() -> dict:
    return joblib.load(RUTA_MODELO)


def estimar_nivel(periodo: dict, nivel_previo: float | None, correctas_previas: int, variacion: float | None) -> float:
    artefacto = _cargar()
    conteo = periodo["por_dificultad"]
    preguntas = sum(PESOS[d] * conteo[d]["preguntas"] for d in PESOS)
    correctas = sum(PESOS[d] * conteo[d]["correctas"] for d in PESOS)
    atributos = {
        "nivel_conocimiento_previo": np.nan if nivel_previo is None else nivel_previo,
        "correctas_total_ultimo_periodo": periodo["correctas"],
        "eficiencia_temporal_act": periodo["porcentaje_correctas"] / (periodo["tiempo_promedio"] + EPSILON),
        "correctas_total_general": correctas_previas,
        "numero_periodo": periodo["numero_periodo"],
        "tasa_ponderada_act": correctas / preguntas if preguntas else np.nan,
        "mezcla_dificultad_act": preguntas / periodo["preguntas"],
        "variacion_porcentaje_correctas": np.nan if variacion is None else variacion,
        "tiempo_promedio_ultimo_periodo": periodo["tiempo_promedio"],
        "es_primer_periodo": int(periodo["numero_periodo"] == 1),
    }
    entrada = pd.DataFrame([atributos], columns=artefacto["features"])
    minimo, maximo = artefacto["rango_salida"]
    return float(np.clip(artefacto["pipeline"].predict(entrada)[0], minimo, maximo))
