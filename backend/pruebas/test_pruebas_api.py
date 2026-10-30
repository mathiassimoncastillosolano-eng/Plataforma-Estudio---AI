"""API HTTP de pruebas con el proveedor de IA sustituido por uno falso."""
import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")

from fastapi.testclient import TestClient  # noqa: E402

from app.comun.errores import IATiempoAgotado  # noqa: E402
from app.configuracion.ajustes import Ajustes, obtener_ajustes  # noqa: E402
from app.main import crear_aplicacion  # noqa: E402
from app.resumenes.dependencias import obtener_proveedor_ia  # noqa: E402
from pruebas.ia_pruebas_falsa import IAGeneradora, resumen_de_ejemplo  # noqa: E402

AJUSTES = Ajustes(
    openai_api_key="clave-falsa",
    openai_model="modelo-de-prueba",
    openai_timeout_segundos=5,
    openai_max_reintentos=0,
    resumen_min_caracteres=100,
    resumen_max_caracteres=20_000,
    pdf_max_bytes=1024 * 1024,
    pdf_max_paginas=10,
    origenes_permitidos=("http://localhost:5173",),
    pruebas_clave_secreta="clave-de-la-api-de-pruebas",
)


def _cliente(proveedor) -> TestClient:
    aplicacion = crear_aplicacion()
    aplicacion.dependency_overrides[obtener_ajustes] = lambda: AJUSTES
    aplicacion.dependency_overrides[obtener_proveedor_ia] = lambda: proveedor
    return TestClient(aplicacion, raise_server_exceptions=False)


def _cuerpo_crear(id_solicitud: str, **config) -> dict:
    return {
        "id_solicitud": id_solicitud,
        "id_tema": "tema-1",
        "titulo_tema": "Ondas",
        "resumen": resumen_de_ejemplo().model_dump(),
        "configuracion": {"cantidad_preguntas": 5, "dificultad": "media", "limite_minutos": 10, "pausa_blindada": True, **config},
    }


def test_flujo_completo_crear_iniciar_pausar_reanudar_finalizar():
    cliente = _cliente(IAGeneradora())
    creada = cliente.post("/api/pruebas/crear", json=_cuerpo_crear("api-flujo-0001")).json()
    assert creada["exito"] is True and creada["datos"]["prueba"]["total"] == 5

    iniciada = cliente.post("/api/pruebas/iniciar", json={"sello": creada["datos"]["sello"]}).json()["datos"]
    assert len(iniciada["prueba"]["preguntas"]) == 5

    pausada = cliente.post("/api/pruebas/pausar", json={"sello": iniciada["sello"], "respuestas": {}, "descartes": {}}).json()["datos"]
    assert pausada["prueba"]["preguntas"] is None and pausada["prueba"]["estado"] == "pausada"

    reanudada = cliente.post("/api/pruebas/reanudar", json={"sello": pausada["sello"]}).json()["datos"]
    assert len(reanudada["prueba"]["preguntas"]) == 5

    final = cliente.post("/api/pruebas/finalizar", json={"sello": reanudada["sello"], "respuestas": {}, "descartes": {}}).json()["datos"]
    assert final["resultado"]["omitidas"] == 5 and len(final["revision"]) == 5


def test_distribucion_personalizada_incorrecta_responde_422_con_codigo_estable():
    cuerpo = _cuerpo_crear("api-dist-0001", dificultad="personalizada", distribucion_personalizada={"facil": 1, "media": 1, "dificil": 1})
    respuesta = _cliente(IAGeneradora()).post("/api/pruebas/crear", json=cuerpo)
    assert respuesta.status_code == 422 and respuesta.json()["error"]["codigo"] == "PRUEBA_DISTRIBUCION_INVALIDA"


def test_sello_falso_responde_422():
    respuesta = _cliente(IAGeneradora()).post("/api/pruebas/iniciar", json={"sello": "x" * 40})
    assert respuesta.status_code == 422 and respuesta.json()["error"]["codigo"] == "PRUEBA_INVALIDA"


def test_error_de_openai_usa_su_estado_y_no_filtra_detalles():
    respuesta = _cliente(IAGeneradora(error=IATiempoAgotado())).post("/api/pruebas/crear", json=_cuerpo_crear("api-error-0001"))
    assert respuesta.status_code == 504 and respuesta.json()["error"]["codigo"] == "IA_TIEMPO_AGOTADO"


def test_cuerpo_mal_formado_responde_solicitud_invalida():
    respuesta = _cliente(IAGeneradora()).post("/api/pruebas/crear", json={"id_solicitud": "corto"})
    assert respuesta.status_code == 422 and respuesta.json()["error"]["codigo"] == "SOLICITUD_INVALIDA"
