import math

import pytest
from fastapi.testclient import TestClient

from app.adaptacion import modelo, motor
from app.main import crear_aplicacion


def respuestas(n: int, correctas: int, dificultad: str = "media", segundos: float = 20.0) -> list[dict]:
    return [{"dificultad": dificultad, "correcta": i < correctas, "segundos": segundos} for i in range(n)]


def test_no_cierra_periodo_antes_de_15():
    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(14, 14))
    assert cerrados == [] and len(estado["pendientes"]) == 14 and estado["nivel"] == motor.NIVEL_INICIAL


def test_la_pregunta_15_cierra_el_periodo_y_el_nivel_lo_estima_el_modelo(monkeypatch):
    llamadas = []

    def falso(periodo, nivel_previo, correctas_previas, variacion):
        llamadas.append((periodo, nivel_previo, correctas_previas, variacion))
        return 0.4321

    monkeypatch.setattr(motor, "estimar_nivel", falso)
    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(15, 12))
    assert estado["nivel"] == 0.4321 and estado["numero_periodo"] == 2 and estado["correctas_total"] == 12
    assert cerrados[0]["porcentaje_correctas"] == 0.8 and cerrados[0]["tiempo_promedio"] == 20.0
    assert llamadas[0][1:] == (None, 0, None)
    motor.registrar(estado, respuestas(15, 9))
    assert llamadas[1][1:] == (0.4321, 12, round(0.6 - 0.8, 4))


def test_las_respuestas_sobrantes_pasan_al_siguiente_periodo():
    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(20, 20))
    assert len(cerrados) == 1 and len(estado["pendientes"]) == 5


@pytest.mark.parametrize("nivel,esperada", [(0.0, "facil"), (0.49, "facil"), (0.5, "media"), (0.79, "media"), (0.8, "dificil"), (1.0, "dificil")])
def test_umbrales_target_a_dificultad(nivel, esperada):
    assert motor.dificultad_objetivo(nivel) == esperada


def test_el_modelo_devuelve_un_nivel_en_rango_para_el_primer_periodo():
    periodo = {
        "numero_periodo": 1,
        "preguntas": 15,
        "correctas": 14,
        "porcentaje_correctas": 0.9333,
        "tiempo_promedio": 21.26,
        "por_dificultad": {"facil": {"preguntas": 6, "correctas": 6}, "media": {"preguntas": 5, "correctas": 4}, "dificil": {"preguntas": 4, "correctas": 4}},
    }
    nivel = modelo.estimar_nivel(periodo, None, 0, None)
    assert 0.0 <= nivel <= 1.0 and not math.isnan(nivel)


def test_estudiante_simulado_alto_queda_por_encima_del_bajo():
    alto = bajo = motor.estado_inicial()
    for _ in range(6):
        alto, _ = motor.registrar(alto, respuestas(15, 15, segundos=10))
        bajo, _ = motor.registrar(bajo, respuestas(15, 3, segundos=60))
    assert 0.0 <= bajo["nivel"] < alto["nivel"] <= 1.0
    assert motor.dificultad_objetivo(alto["nivel"]) != "facil"
    assert motor.dificultad_objetivo(bajo["nivel"]) == "facil"


def test_api_registrar_sin_estado_devuelve_nivel_del_modelo():
    cliente = TestClient(crear_aplicacion())
    r = cliente.post("/api/adaptacion/registrar", json={"id_tema": "t1", "respuestas": respuestas(15, 15)})
    datos = r.json()["datos"]
    assert r.status_code == 200 and datos["estado"]["numero_periodo"] == 2 and datos["estado"]["correctas_total"] == 15
    assert 0.0 <= datos["estado"]["nivel"] <= 1.0
    assert datos["dificultad_objetivo"] == motor.dificultad_objetivo(datos["estado"]["nivel"])


def test_api_rechaza_respuestas_sin_segundos():
    cliente = TestClient(crear_aplicacion())
    r = cliente.post("/api/adaptacion/registrar", json={"id_tema": "t1", "respuestas": [{"dificultad": "media", "correcta": True}]})
    assert r.status_code == 422
