# Modelo de nivel de conocimiento (MOD-06)

Modelo de Machine Learning que estima el nivel de conocimiento de un estudiante
(`nivel_conocimiento`, de 0 a 1) a partir de sus respuestas por periodos de 15 preguntas.

| Archivo | Qué es |
|---|---|
| `modelo_nivel_conocimiento.ipynb` | Notebook completo: auditoría del dataset, dos escenarios (A y B), comparación de modelos, optimización, evaluación y guardado. Copia del Colab original. |
| `../dataset_ml_nivel_conocimiento_125k.csv` | Dataset de entrenamiento (125 000 filas × 36 columnas). |

Colab original: <https://colab.research.google.com/drive/1RU0V03jKBxF8diJhNdJ1JAORnuvFUtbZ>
(copia tomada el 28/10/2026, última modificación del Colab: 28/10/2026 16:18 UTC).

## Artefactos del modelo (`.pkl`)

El notebook (sección 21) genera dos archivos con `joblib`, uno por escenario:

| Archivo | Escenario | Modelo | MAE test | R² test |
|---|---|---|---|---|
| `modelo_nivel_conocimiento_A_estimacion_en_corte.pkl` | A: estima el nivel al cierre del periodo, usando sus respuestas | ExtraTreesRegressor | 0,0335 | 0,886 |
| `modelo_nivel_conocimiento_B_prediccion_anticipada.pkl` | B: anticipa el nivel solo con datos de periodos anteriores | HistGradientBoostingRegressor | 0,0565 | 0,714 |

Cada `.pkl` es un diccionario con `pipeline` (preprocesamiento + modelo), `features`
(columnas de entrada, en orden), `rango_salida`, métricas, hiperparámetros, versiones de
librerías y `version_modelo` (`1.0.0`).

**Estado:** ambos `.pkl` están en esta carpeta. Generados al ejecutar el notebook completo
en Colab el 28/10/2026 a las 23:08 (Python 3.13, scikit-learn 1.6.1, pandas 2.2.3).
El del escenario A pesa unos 60 MB (172 árboles); el del B, unos 0,6 MB.

Para cargarlos hace falta **scikit-learn 1.6.1**:

```python
import joblib
artefacto = joblib.load("ml/modelo_nivel_conocimiento_B_prediccion_anticipada.pkl")
X = datos[artefacto["features"]]
nivel = artefacto["pipeline"].predict(X).clip(*artefacto["rango_salida"])
```

Solo se deben cargar `.pkl` de este repositorio: `joblib.load` ejecuta código al abrir el archivo.

## Versionado

- `version_modelo` dentro del `.pkl` sigue `MAYOR.MENOR.PARCHE`. La versión actual es `1.0.0`.
- Cambiar datos de entrenamiento, variables o tipo de modelo implica subir la versión y
  volver a ejecutar el notebook.
- Para cargar un `.pkl` hace falta la misma versión de scikit-learn con la que se guardó
  (está en `artefacto['versiones']`).
