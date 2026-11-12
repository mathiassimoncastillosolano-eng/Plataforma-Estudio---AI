"""Dependencias FastAPI del motor adaptativo (los tests las sustituyen)."""
from collections.abc import Callable

from fastapi import Depends

from app.adaptacion.modelo_ml import obtener_modelo
from app.configuracion.ajustes import Ajustes, obtener_ajustes


def obtener_predictor(ajustes: Ajustes = Depends(obtener_ajustes)) -> Callable[[dict], float] | None:
    """Función de predicción del modelo de MOD-06, o None si no está disponible (se usa la regla)."""
    modelo = obtener_modelo(ajustes.modelo_nivel_ruta)
    return modelo.predecir if modelo else None
