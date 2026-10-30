"""Pruebas de la API HTTP del mapa conceptual con el proveedor de IA sustituido por uno falso."""
import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")
pytest.importorskip("multipart")

from fastapi.testclient import TestClient  # noqa: E402

from app.comun.errores import IATiempoAgotado  # noqa: E402
from app.configuracion.ajustes import Ajustes, obtener_ajustes  # noqa: E402
from app.main import crear_aplicacion  # noqa: E402
from app.resumenes.dependencias import obtener_proveedor_ia  # noqa: E402
from pruebas.proveedor_falso import TEXTO, ProveedorFalso  # noqa: E402
from pruebas.respuestas_mapa import RESPUESTA_MAPA_JSON  # noqa: E402
from pruebas.utilidades_pdf import LINEAS_DE_EJEMPLO, construir_pdf_con_texto  # noqa: E402

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
)


def _cliente(proveedor=None) -> TestClient:
    aplicacion = crear_aplicacion()
    aplicacion.dependency_overrides[obtener_ajustes] = lambda: AJUSTES
    if proveedor is not None:
        aplicacion.dependency_overrides[obtener_proveedor_ia] = lambda: proveedor
    return TestClient(aplicacion, raise_server_exceptions=False)


def test_mapa_desde_texto_devuelve_nodos_relaciones_y_metadatos():
    respuesta = _cliente(ProveedorFalso(respuesta=RESPUESTA_MAPA_JSON)).post(
        "/api/mapas-conceptuales", json={"texto": TEXTO, "titulo": "Circulatorio"}
    )
    cuerpo = respuesta.json()
    assert respuesta.status_code == 200 and cuerpo["exito"] is True
    datos = cuerpo["datos"]
    assert datos["mapa"]["titulo"] == "Sistema circulatorio"
    nodo = datos["mapa"]["nodos"][1]
    assert set(nodo) == {"id", "etiqueta", "definicion", "nivel", "id_padre"}
    relacion = datos["mapa"]["relaciones"][0]
    assert set(relacion) == {"id", "origen", "destino", "frase_enlace", "tipo"}
    assert {r["tipo"] for r in datos["mapa"]["relaciones"]} == {"jerarquica", "cruzada"}
    assert datos["metadatos"]["modelo"] == "modelo-de-prueba" and datos["metadatos"]["entrada"] == "texto"


def test_la_respuesta_no_incluye_coordenadas():
    respuesta = _cliente(ProveedorFalso(respuesta=RESPUESTA_MAPA_JSON)).post("/api/mapas-conceptuales", json={"texto": TEXTO})
    for nodo in respuesta.json()["datos"]["mapa"]["nodos"]:
        assert "x" not in nodo and "y" not in nodo and "posicion" not in nodo


def test_contenido_vacio_responde_422_sin_llamar_a_la_ia():
    proveedor = ProveedorFalso(respuesta=RESPUESTA_MAPA_JSON)
    respuesta = _cliente(proveedor).post("/api/mapas-conceptuales", json={"texto": "  "})
    assert respuesta.status_code == 422 and respuesta.json()["error"]["codigo"] == "CONTENIDO_VACIO"
    assert proveedor.llamadas == []


def test_cuerpo_invalido_responde_solicitud_invalida():
    respuesta = _cliente(ProveedorFalso()).post("/api/mapas-conceptuales", json={"texto": 123})
    assert respuesta.status_code == 422 and respuesta.json()["error"]["codigo"] == "SOLICITUD_INVALIDA"


def test_error_de_la_ia_usa_su_estado_http():
    respuesta = _cliente(ProveedorFalso(error=IATiempoAgotado())).post("/api/mapas-conceptuales", json={"texto": TEXTO})
    assert respuesta.status_code == 504 and respuesta.json()["error"]["codigo"] == "IA_TIEMPO_AGOTADO"


@pytest.mark.parametrize("bruto", ["no es json", '{"nodos": []}', '{"nodos": [{"id": "a", "etiqueta": "Solo uno", "definicion": "x"}]}'])
def test_respuesta_de_la_ia_inutilizable_responde_502_controlado(bruto):
    respuesta = _cliente(ProveedorFalso(respuesta=bruto)).post("/api/mapas-conceptuales", json={"texto": TEXTO})
    assert respuesta.status_code == 502 and respuesta.json()["error"]["codigo"] == "IA_RESPUESTA_INVALIDA"
    assert "no es json" not in respuesta.text  # no se filtra la respuesta cruda de la IA


def test_sin_configuracion_de_ia_responde_503():
    ajustes_sin_clave = Ajustes(**{**AJUSTES.__dict__, "openai_api_key": "", "openai_model": ""})
    aplicacion = crear_aplicacion()
    aplicacion.dependency_overrides[obtener_ajustes] = lambda: ajustes_sin_clave
    respuesta = TestClient(aplicacion).post("/api/mapas-conceptuales", json={"texto": TEXTO})
    assert respuesta.status_code == 503 and respuesta.json()["error"]["codigo"] == "IA_NO_CONFIGURADA"


def test_mapa_desde_pdf_envia_el_original_a_la_ia():
    proveedor = ProveedorFalso(respuesta=RESPUESTA_MAPA_JSON)
    pdf = construir_pdf_con_texto([LINEAS_DE_EJEMPLO])
    respuesta = _cliente(proveedor).post(
        "/api/mapas-conceptuales/pdf",
        files={"archivo": ("apuntes.pdf", pdf, "application/pdf")},
        data={"titulo": "Circulatorio"},
    )
    cuerpo = respuesta.json()
    assert respuesta.status_code == 200 and cuerpo["exito"] is True
    assert proveedor.llamadas[0]["pdf"] == pdf
    assert cuerpo["datos"]["metadatos"]["entrada"] == "pdf" and cuerpo["datos"]["metadatos"]["paginas"] == 1
    assert len(cuerpo["datos"]["mapa"]["nodos"]) == 9


def test_mapa_desde_pdf_rechaza_archivos_no_validos_sin_llamar_a_la_ia():
    proveedor = ProveedorFalso(respuesta=RESPUESTA_MAPA_JSON)
    cliente = _cliente(proveedor)
    for contenido, codigo, estado in [(b"no soy un pdf", "PDF_INVALIDO", 422), (b"%PDF-" + b"x" * (1024 * 1024 + 10), "PDF_MUY_PESADO", 413)]:
        respuesta = cliente.post("/api/mapas-conceptuales/pdf", files={"archivo": ("a.pdf", contenido, "application/pdf")})
        assert respuesta.status_code == estado and respuesta.json()["error"]["codigo"] == codigo
    assert cliente.post("/api/mapas-conceptuales/pdf").json()["error"]["codigo"] == "SOLICITUD_INVALIDA"
    assert proveedor.llamadas == []


def test_los_resumenes_siguen_funcionando_con_el_modulo_de_mapas_registrado():
    from pruebas.respuestas_ia import RESPUESTA_VALIDA_JSON

    respuesta = _cliente(ProveedorFalso(respuesta=RESPUESTA_VALIDA_JSON)).post("/api/resumenes", json={"texto": TEXTO})
    assert respuesta.status_code == 200 and respuesta.json()["datos"]["resumen_general"]["secciones"]
