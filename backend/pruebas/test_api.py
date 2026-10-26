"""Pruebas de la API HTTP con el proveedor de IA sustituido por uno falso."""
import pytest

pytest.importorskip("fastapi")
pytest.importorskip("httpx")
pytest.importorskip("multipart")

from fastapi.testclient import TestClient  # noqa: E402

from app.comun.errores import IATiempoAgotado  # noqa: E402
from app.configuracion.ajustes import Ajustes, obtener_ajustes  # noqa: E402
from app.main import crear_aplicacion  # noqa: E402
from app.resumenes.dependencias import obtener_proveedor_ia  # noqa: E402
from pruebas.respuestas_ia import RESPUESTA_COMPLETA_JSON  # noqa: E402
from pruebas.proveedor_falso import TEXTO, ProveedorFalso  # noqa: E402
from pruebas.utilidades_pdf import LINEAS_DE_EJEMPLO, construir_pdf_con_texto, construir_pdf_sin_texto  # noqa: E402

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


def test_resumen_devuelve_ambos_resumenes():
    respuesta = _cliente(ProveedorFalso()).post("/api/resumenes", json={"texto": TEXTO, "titulo": "Circulatorio"})
    cuerpo = respuesta.json()
    assert respuesta.status_code == 200 and cuerpo["exito"] is True
    assert cuerpo["datos"]["resumen_general"]["secciones"]
    assert cuerpo["datos"]["resumen_esencial"]["ideas_clave"]
    assert cuerpo["datos"]["metadatos"]["modelo"] == "modelo-de-prueba"


def test_resumen_con_contenido_vacio_responde_422():
    respuesta = _cliente(ProveedorFalso()).post("/api/resumenes", json={"texto": "  "})
    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["codigo"] == "CONTENIDO_VACIO"


def test_resumen_sin_cuerpo_valido_responde_solicitud_invalida():
    respuesta = _cliente(ProveedorFalso()).post("/api/resumenes", json={"texto": 123})
    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["codigo"] == "SOLICITUD_INVALIDA"


def test_error_de_la_ia_usa_su_estado_http_y_no_filtra_detalles():
    respuesta = _cliente(ProveedorFalso(error=IATiempoAgotado())).post("/api/resumenes", json={"texto": TEXTO})
    assert respuesta.status_code == 504
    assert respuesta.json()["error"]["codigo"] == "IA_TIEMPO_AGOTADO"


def test_respuesta_inesperada_de_la_ia_responde_502():
    respuesta = _cliente(ProveedorFalso(respuesta="no es json")).post("/api/resumenes", json={"texto": TEXTO})
    assert respuesta.status_code == 502
    assert respuesta.json()["error"]["codigo"] == "IA_RESPUESTA_INVALIDA"


def test_sin_configuracion_de_ia_responde_503():
    ajustes_sin_clave = Ajustes(**{**AJUSTES.__dict__, "openai_api_key": "", "openai_model": ""})
    aplicacion = crear_aplicacion()
    aplicacion.dependency_overrides[obtener_ajustes] = lambda: ajustes_sin_clave
    respuesta = TestClient(aplicacion).post("/api/resumenes", json={"texto": TEXTO})
    assert respuesta.status_code == 503
    assert respuesta.json()["error"]["codigo"] == "IA_NO_CONFIGURADA"


def test_extraer_pdf_valido():
    pdf = construir_pdf_con_texto([LINEAS_DE_EJEMPLO])
    respuesta = _cliente().post("/api/contenido/extraer-pdf", files={"archivo": ("apuntes.pdf", pdf, "application/pdf")})
    datos = respuesta.json()["datos"]
    assert respuesta.status_code == 200
    assert "sistema circulatorio" in datos["texto"] and datos["paginas"] == 1


def test_extraer_pdf_invalido_o_sin_texto_responde_422():
    cliente = _cliente()
    for contenido, codigo in [(b"no soy un pdf", "PDF_INVALIDO"), (construir_pdf_sin_texto(), "PDF_SIN_TEXTO")]:
        respuesta = cliente.post("/api/contenido/extraer-pdf", files={"archivo": ("a.pdf", contenido, "application/pdf")})
        assert respuesta.status_code == 422
        assert respuesta.json()["error"]["codigo"] == codigo


def test_ruta_inexistente_usa_el_formato_de_error_comun():
    respuesta = _cliente().get("/api/no-existe")
    assert respuesta.status_code == 404 and respuesta.json()["exito"] is False


# --- PDF original y descargas -------------------------------------------------------------


def test_resumen_desde_pdf_envia_el_original_a_la_ia():
    proveedor = ProveedorFalso(respuesta=RESPUESTA_COMPLETA_JSON)
    pdf = construir_pdf_con_texto([LINEAS_DE_EJEMPLO])
    respuesta = _cliente(proveedor).post(
        "/api/resumenes/pdf",
        files={"archivo": ("apuntes.pdf", pdf, "application/pdf")},
        data={"titulo": "Circulatorio", "indicaciones": "Para el examen final"},
    )
    cuerpo = respuesta.json()
    assert respuesta.status_code == 200 and cuerpo["exito"] is True
    assert proveedor.llamadas[0]["pdf"] == pdf
    assert "Para el examen final" in proveedor.llamadas[0]["entrada"]
    datos = cuerpo["datos"]
    assert datos["metadatos"]["entrada"] == "pdf" and datos["metadatos"]["paginas"] == 1
    assert datos["resumen_esencial"]["formulas_y_reglas"][0]["expresion"] == "GC = FC × VS"
    assert datos["resumen_general"]["secciones"][0]["tabla"]["encabezados"] == ["Vaso", "Función"]


def test_resumen_desde_pdf_rechaza_archivos_no_validos_sin_llamar_a_la_ia():
    proveedor = ProveedorFalso()
    cliente = _cliente(proveedor)
    for contenido, codigo, estado in [(b"no soy un pdf", "PDF_INVALIDO", 422), (b"%PDF-" + b"x" * (1024 * 1024 + 10), "PDF_MUY_PESADO", 413)]:
        respuesta = cliente.post("/api/resumenes/pdf", files={"archivo": ("a.pdf", contenido, "application/pdf")})
        assert respuesta.status_code == estado and respuesta.json()["error"]["codigo"] == codigo
    assert cliente.post("/api/resumenes/pdf").json()["error"]["codigo"] == "SOLICITUD_INVALIDA"
    assert proveedor.llamadas == []


def _cuerpo_descarga(tipo: str, **extra) -> dict:
    esencial = {"idea_central": "La sangre circula.", "ideas_clave": ["El corazón bombea"], "conceptos_clave": [{"termino": "Corazón", "definicion": "Órgano muscular"}]}
    general = {"titulo": "Circulatorio", "introduccion": "Intro", "secciones": [{"titulo": "El corazón", "contenido": "Actúa como bomba."}]}
    return {"tipo": tipo, "titulo_tema": "Sistema circulatorio", "esencial": esencial, "general": general, **extra}


def test_descarga_de_cada_resumen_devuelve_un_pdf_independiente_sin_llamar_a_la_ia():
    from io import BytesIO

    from pypdf import PdfReader

    proveedor = ProveedorFalso()
    cliente = _cliente(proveedor)
    textos = {}
    for tipo in ("esencial", "general"):
        respuesta = cliente.post("/api/resumenes/descargar-pdf", json=_cuerpo_descarga(tipo))
        assert respuesta.status_code == 200 and respuesta.headers["content-type"] == "application/pdf"
        assert f"resumen-{tipo}-sistema-circulatorio.pdf" in respuesta.headers["content-disposition"]
        assert respuesta.content.startswith(b"%PDF-")
        textos[tipo] = "\n".join(p.extract_text() for p in PdfReader(BytesIO(respuesta.content)).pages)
    assert "RESUMEN ESENCIAL" in textos["esencial"] and "Conceptos fundamentales" in textos["esencial"] and "Actúa como bomba" not in textos["esencial"]
    assert "RESUMEN GENERAL" in textos["general"] and "Actúa como bomba" in textos["general"] and "Conceptos fundamentales" not in textos["general"]
    assert proveedor.llamadas == []


def test_descarga_sin_contenido_responde_422_y_no_un_archivo_vacio():
    cliente = _cliente()
    vacios = [
        {"tipo": "esencial", "titulo_tema": "T"},
        {"tipo": "general", "titulo_tema": "T", "general": {"titulo": "", "introduccion": "", "secciones": []}},
        {"tipo": "esencial", "titulo_tema": "T", "esencial": {"idea_central": "  ", "ideas_clave": [], "conceptos_clave": []}},
    ]
    for cuerpo in vacios:
        respuesta = cliente.post("/api/resumenes/descargar-pdf", json=cuerpo)
        assert respuesta.status_code == 422 and respuesta.json()["error"]["codigo"] == "RESUMEN_VACIO"
        assert "application/pdf" not in respuesta.headers["content-type"]


def test_descarga_con_tipo_desconocido_o_sin_titulo_es_solicitud_invalida():
    cliente = _cliente()
    for cuerpo in [{"tipo": "otro", "titulo_tema": "T"}, {"tipo": "esencial", "titulo_tema": ""}]:
        assert cliente.post("/api/resumenes/descargar-pdf", json=cuerpo).json()["error"]["codigo"] == "SOLICITUD_INVALIDA"
