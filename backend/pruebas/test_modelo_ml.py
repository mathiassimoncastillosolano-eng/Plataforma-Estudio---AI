"""Modelo de ML de MOD-06: variables iguales a `crear_features` del notebook y predicción con el .pkl real."""
import math

import pytest

from app.adaptacion import modelo_ml, motor

PERIODO = {"facil": {"preguntas": 7, "correctas": 6}, "media": {"preguntas": 6, "correctas": 5}, "dificil": {"preguntas": 2, "correctas": 1}}


def test_variables_del_periodo_1_como_en_el_notebook():
    v = modelo_ml.variables_modelo_a(
        numero_periodo=1, nivel_previo=0.57, correctas_previas=0, porcentaje_previo=None, por_dificultad=PERIODO, tiempo_promedio=29.28
    )
    assert math.isnan(v["nivel_conocimiento_previo"]) and math.isnan(v["variacion_porcentaje_correctas"])
    assert v["es_primer_periodo"] == 1 and v["correctas_total_ultimo_periodo"] == 12
    assert v["tasa_ponderada_act"] == pytest.approx((6 + 2 * 5 + 3 * 1) / (7 + 2 * 6 + 3 * 2))
    assert v["mezcla_dificultad_act"] == pytest.approx((7 + 2 * 6 + 3 * 2) / 15)
    assert v["eficiencia_temporal_act"] == pytest.approx(0.8 / 29.28)


def test_sin_tiempo_las_variables_de_tiempo_quedan_vacias():
    v = modelo_ml.variables_modelo_a(
        numero_periodo=2, nivel_previo=0.44, correctas_previas=12, porcentaje_previo=0.8, por_dificultad=PERIODO, tiempo_promedio=None
    )
    assert math.isnan(v["tiempo_promedio_ultimo_periodo"]) and math.isnan(v["eficiencia_temporal_act"])
    assert v["nivel_conocimiento_previo"] == 0.44 and v["variacion_porcentaje_correctas"] == pytest.approx(0.0)


def test_ruta_inexistente_devuelve_none():
    assert modelo_ml.obtener_modelo("/no/existe.pkl") is None


@pytest.fixture(scope="module")
def modelo():
    pytest.importorskip("sklearn")
    m = modelo_ml.obtener_modelo()
    if m is None:
        pytest.skip("No se pudo cargar el .pkl (¿scikit-learn distinto de 1.6.1?)")
    return m


def test_el_pkl_pide_las_mismas_variables_que_construimos(modelo):
    v = modelo_ml.variables_modelo_a(
        numero_periodo=1, nivel_previo=None, correctas_previas=0, porcentaje_previo=None, por_dificultad=PERIODO, tiempo_promedio=None
    )
    assert set(modelo.variables) == set(v)


def test_caso_real_del_dataset(modelo):
    # Fila real (periodo 2) del dataset: nivel real 0,5799.
    periodo = {"facil": {"preguntas": 6, "correctas": 6}, "media": {"preguntas": 5, "correctas": 5}, "dificil": {"preguntas": 4, "correctas": 3}}
    v = modelo_ml.variables_modelo_a(
        numero_periodo=2, nivel_previo=0.4393, correctas_previas=12, porcentaje_previo=0.8, por_dificultad=periodo, tiempo_promedio=21.26
    )
    assert modelo.predecir(v) == pytest.approx(0.5799, abs=0.05)


def test_estudiante_simulado_con_el_modelo_real(modelo):
    def bloque(correctas):
        return [{"dificultad": "media", "correcta": i < correctas, "segundos": 25.0} for i in range(15)]

    alto = bajo = motor.estado_inicial()
    for _ in range(6):
        alto, ca = motor.registrar(alto, bloque(15), modelo.predecir)
        bajo, cb = motor.registrar(bajo, bloque(3), modelo.predecir)
        assert ca[0]["fuente"] == cb[0]["fuente"] == "modelo"
    assert 0.0 <= bajo["nivel"] < alto["nivel"] <= 1.0
    assert motor.dificultad_objetivo(bajo["nivel"]) == "facil"
