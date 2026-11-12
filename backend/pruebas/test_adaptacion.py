"""Motor adaptativo (MOD-07): periodos de 15, regla EWMA, umbrales y estudiantes simulados."""
import pytest
from fastapi.testclient import TestClient

from app.adaptacion import motor
from app.adaptacion.dependencias import obtener_predictor
from app.main import crear_aplicacion


def respuestas(n: int, correctas: int, dificultad: str = "media") -> list[dict]:
    return [{"dificultad": dificultad, "correcta": i < correctas} for i in range(n)]


def test_no_cierra_periodo_antes_de_15():
    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(14, 14))
    assert cerrados == [] and len(estado["pendientes"]) == 14 and estado["nivel"] == motor.NIVEL_INICIAL


def test_la_pregunta_15_cierra_el_periodo_con_la_regla_ewma():
    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(15, 12))
    assert len(cerrados) == 1 and estado["numero_periodo"] == 2 and estado["pendientes"] == []
    assert cerrados[0]["porcentaje_correctas"] == 0.8
    assert estado["nivel"] == pytest.approx(0.75 * motor.NIVEL_INICIAL + 0.25 * 0.8, abs=1e-4)


def test_las_respuestas_sobrantes_pasan_al_siguiente_periodo():
    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(20, 20))
    assert len(cerrados) == 1 and len(estado["pendientes"]) == 5


@pytest.mark.parametrize("nivel,esperada", [(0.0, "facil"), (0.49, "facil"), (0.5, "media"), (0.79, "media"), (0.8, "dificil"), (1.0, "dificil")])
def test_umbrales_target_a_dificultad(nivel, esperada):
    assert motor.dificultad_objetivo(nivel) == esperada


def test_estudiante_simulado_alto_sube_y_bajo_baja():
    alto = bajo = motor.estado_inicial()
    for _ in range(6):
        alto, _ = motor.registrar(alto, respuestas(15, 15))
        bajo, _ = motor.registrar(bajo, respuestas(15, 3))
    assert motor.dificultad_objetivo(alto["nivel"]) == "dificil"
    assert motor.dificultad_objetivo(bajo["nivel"]) == "facil"
    assert 0.0 <= bajo["nivel"] <= alto["nivel"] <= 1.0


def test_api_registrar_sin_estado_parte_del_nivel_inicial():
    aplicacion = crear_aplicacion()
    aplicacion.dependency_overrides[obtener_predictor] = lambda: None  # sin modelo: regla 0,75/0,25
    cliente = TestClient(aplicacion)
    r = cliente.post("/api/adaptacion/registrar", json={"id_tema": "t1", "respuestas": respuestas(15, 15)})
    datos = r.json()["datos"]
    assert r.status_code == 200 and datos["estado"]["numero_periodo"] == 2
    assert datos["dificultad_objetivo"] == "media"  # 0,57 → 0,6775 tras un periodo perfecto

def test_con_predictor_el_nivel_sale_del_modelo_y_recibe_las_variables():
    recibidas = []

    def predecir(variables):
        recibidas.append(variables)
        return 0.9

    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(30, 12), predecir)
    assert [c["fuente"] for c in cerrados] == ["modelo", "modelo"] and estado["nivel"] == 0.9
    assert estado["correctas_acumuladas"] == 12  # 12 en el periodo 1 y 0 en el periodo 2
    p1, p2 = recibidas
    assert p1["es_primer_periodo"] == 1 and p1["correctas_total_general"] == 0
    assert p2["nivel_conocimiento_previo"] == 0.9 and p2["correctas_total_general"] == 12
    assert p2["variacion_porcentaje_correctas"] == pytest.approx(0.0 - 0.8)


def test_si_el_modelo_falla_se_usa_la_regla():
    def roto(_):
        raise RuntimeError("modelo caído")

    estado, cerrados = motor.registrar(motor.estado_inicial(), respuestas(15, 12), roto)
    assert cerrados[0]["fuente"] == "regla"
    assert estado["nivel"] == pytest.approx(0.75 * motor.NIVEL_INICIAL + 0.25 * 0.8, abs=1e-4)


def test_estado_antiguo_sin_correctas_acumuladas_sigue_valido():
    cliente = TestClient(crear_aplicacion())
    estado = {"nivel": 0.6, "numero_periodo": 3, "ultimo_porcentaje": 0.5, "pendientes": []}
    r = cliente.post("/api/adaptacion/registrar", json={"id_tema": "t1", "estado": estado, "respuestas": respuestas(15, 10)})
    assert r.status_code == 200 and r.json()["datos"]["estado"]["correctas_acumuladas"] == 10
