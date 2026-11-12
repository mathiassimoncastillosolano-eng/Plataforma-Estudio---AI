"""Modelo de Machine Learning del nivel de conocimiento (MOD-06) usado por el motor adaptativo.

Carga `ml/modelo_nivel_conocimiento_A_estimacion_en_corte.pkl` (escenario A del notebook,
ExtraTrees, MAE 0,0335) y estima el nivel al cerrar un periodo de 15 preguntas.

- `variables_modelo_a()` es lógica pura (sin scikit-learn): reproduce para un periodo las
  variables que el modelo A espera, con las mismas fórmulas que `crear_features` del notebook.
- `obtener_modelo()` carga el .pkl una sola vez. Si falta el archivo o scikit-learn, devuelve
  None y el motor sigue con la regla 0,75/0,25 (nunca rompe la API).

Requiere scikit-learn==1.6.1 (la versión con la que se entrenó; con otra el .pkl puede no abrir).
Solo se cargan .pkl de este repositorio: `joblib.load` ejecuta código al abrir el archivo.
"""
from __future__ import annotations

import logging
import math
from functools import lru_cache
from pathlib import Path

logger = logging.getLogger(__name__)

RUTA_PREDETERMINADA = Path(__file__).resolve().parents[3] / "ml" / "modelo_nivel_conocimiento_A_estimacion_en_corte.pkl"
PREGUNTAS_POR_PERIODO = 15
_EPS = 1e-9  # mismo épsilon que el notebook
_PESOS = {"facil": 1, "media": 2, "dificil": 3}  # ponderación del notebook (no la de calificación de pruebas)


def variables_modelo_a(
    *,
    numero_periodo: int,
    nivel_previo: float | None,
    correctas_previas: int,
    porcentaje_previo: float | None,
    por_dificultad: dict,
    tiempo_promedio: float | None,
) -> dict:
    """Las 10 variables del modelo A para el periodo que se acaba de cerrar.

    `por_dificultad`: {"facil": {"preguntas", "correctas"}, ...} del periodo actual.
    `correctas_previas`: aciertos acumulados ANTES de este periodo (correctas_total_general).
    `porcentaje_previo`: % del periodo anterior (None en el periodo 1).
    `tiempo_promedio`: segundos medios por pregunta en el periodo; None si no se midió.
    Los valores faltantes van como NaN: el pipeline los imputa igual que en el entrenamiento.
    """
    nan = math.nan
    preguntas = sum(por_dificultad[n]["preguntas"] for n in _PESOS)
    correctas = sum(por_dificultad[n]["correctas"] for n in _PESOS)
    porcentaje = correctas / preguntas if preguntas else nan
    pond_preg = sum(_PESOS[n] * por_dificultad[n]["preguntas"] for n in _PESOS)
    pond_corr = sum(_PESOS[n] * por_dificultad[n]["correctas"] for n in _PESOS)
    primero = numero_periodo == 1
    tiempo = nan if tiempo_promedio is None else float(tiempo_promedio)
    return {
        "nivel_conocimiento_previo": nan if primero or nivel_previo is None else float(nivel_previo),
        "correctas_total_ultimo_periodo": correctas,
        "eficiencia_temporal_act": porcentaje / (tiempo + _EPS),
        "correctas_total_general": correctas_previas,
        "numero_periodo": numero_periodo,
        "tasa_ponderada_act": pond_corr / pond_preg if pond_preg else nan,
        "mezcla_dificultad_act": pond_preg / float(PREGUNTAS_POR_PERIODO),
        "variacion_porcentaje_correctas": nan if primero or porcentaje_previo is None else porcentaje - porcentaje_previo,
        "tiempo_promedio_ultimo_periodo": tiempo,
        "es_primer_periodo": int(primero),
    }


class ModeloNivel:
    """Envuelve el artefacto del notebook: pipeline + lista ordenada de variables + rango de salida."""

    def __init__(self, artefacto: dict):
        self._pipeline = artefacto["pipeline"]
        self.variables: list[str] = list(artefacto["features"])
        self.rango: tuple[float, float] = tuple(artefacto["rango_salida"])
        self.version: str = artefacto.get("version_modelo", "?")

    @classmethod
    def cargar(cls, ruta: Path) -> "ModeloNivel":
        import joblib

        return cls(joblib.load(ruta))

    def predecir(self, variables: dict) -> float:
        import pandas as pd

        faltantes = [c for c in self.variables if c not in variables]
        if faltantes:
            raise ValueError(f"Faltan variables para el modelo: {faltantes}")
        fila = pd.DataFrame([{c: variables[c] for c in self.variables}], columns=self.variables)
        bajo, alto = self.rango
        valor = float(self._pipeline.predict(fila)[0])
        return round(min(alto, max(bajo, valor)), 4)


@lru_cache
def obtener_modelo(ruta: str = "") -> ModeloNivel | None:
    """Carga el modelo una vez por proceso. None si no se puede (el motor usa entonces la regla)."""
    destino = Path(ruta) if ruta else RUTA_PREDETERMINADA
    try:
        modelo = ModeloNivel.cargar(destino)
    except Exception as error:  # archivo ausente, scikit-learn no instalado o de otra versión
        logger.warning("Modelo de nivel no disponible (%s): %s. Se usa la regla 0,75/0,25.", destino, error)
        return None
    logger.info("Modelo de nivel %s cargado desde %s", modelo.version, destino)
    return modelo
