"""Pruebas de la descarga en PDF del mapa conceptual (exportador y endpoint). No llaman a la IA."""
import base64
from io import BytesIO

import pytest
from PIL import Image
from pypdf import PdfReader

from app.mapas_conceptuales.exportador_pdf import (
    ConceptoPdf,
    ImagenMapaInvalida,
    MapaSinConceptos,
    PaletaPdf,
    _numeracion,
    generar_pdf_mapa,
)

PALETA = PaletaPdf(solido="#2563eb", tinte="#e8f0ff", medio="#c9dcff", tinta="#1e40af", texto="#0e1a33", texto_suave="#55657f", borde="#dde5f2")
CONCEPTOS = [
    ConceptoPdf("Sistema nervioso", "Coordina las funciones del cuerpo.", 0),
    ConceptoPdf("Sistema nervioso central", "Encéfalo y médula espinal.", 1),
    ConceptoPdf("Encéfalo", "Procesa la información.", 2),
    ConceptoPdf("Neurona", "Célula que transmite impulsos (≈ 86 000 millones).", 3),
    ConceptoPdf("Sistema nervioso periférico", "", 1),
]


def _png(ancho: int = 400, alto: int = 200) -> bytes:
    salida = BytesIO()
    Image.new("RGB", (ancho, alto), "white").save(salida, "PNG")
    return salida.getvalue()


def _texto_paginas(pdf: bytes) -> list[str]:
    """Texto de cada página con los espacios normalizados (el número y el concepto van separados por espacios duros)."""
    return [" ".join(pagina.extract_text().split()) for pagina in PdfReader(BytesIO(pdf)).pages]


def test_pdf_tiene_mapa_horizontal_y_conceptos_en_vertical():
    pdf = generar_pdf_mapa(titulo="Sistema nervioso", origen="ia", imagen_png=_png(), conceptos=CONCEPTOS, paleta=PALETA)
    lector = PdfReader(BytesIO(pdf))
    assert len(lector.pages) == 2
    mapa, conceptos = lector.pages
    assert float(mapa.mediabox.width) > float(mapa.mediabox.height)
    assert float(conceptos.mediabox.width) < float(conceptos.mediabox.height)
    assert "/XObject" in mapa["/Resources"]  # la imagen del mapa está en la página 1


def test_pagina_de_conceptos_incluye_jerarquia_y_descripciones():
    pdf = generar_pdf_mapa(titulo="Sistema nervioso", origen="ia", imagen_png=_png(), conceptos=CONCEPTOS, paleta=PALETA)
    portada, conceptos = _texto_paginas(pdf)
    assert "Sistema nervioso" in portada and "Generado con IA" in portada and "5 conceptos" in portada
    for esperado in ("Conceptos del mapa", "1 Sistema nervioso central", "1.1 Encéfalo", "1.1.1 Neurona", "2 Sistema nervioso periférico", "Encéfalo y médula espinal.", "≈ 86 000"):
        assert esperado in conceptos


def test_numeracion_jerarquica():
    profundidades = [0, 1, 2, 2, 3, 1, 2, 1]
    assert _numeracion([ConceptoPdf("x", "", p) for p in profundidades]) == ["", "1", "1.1", "1.2", "1.2.1", "2", "2.1", "3"]


def test_muchos_conceptos_continuan_en_paginas_siguientes():
    conceptos = [ConceptoPdf("Tema", "", 0)] + [ConceptoPdf(f"Concepto {i}", "Descripción larga del concepto. " * 6, 1 if i % 4 == 0 else 2) for i in range(40)]
    pdf = generar_pdf_mapa(titulo="Tema", origen="ia", imagen_png=_png(), conceptos=conceptos, paleta=PALETA)
    textos = _texto_paginas(pdf)
    assert len(textos) >= 3
    assert all(f"Concepto {i}" in "".join(textos) for i in range(40))


def test_imagen_que_no_es_png_se_rechaza():
    with pytest.raises(ImagenMapaInvalida):
        generar_pdf_mapa(titulo="T", origen="ia", imagen_png=b"no es una imagen", conceptos=CONCEPTOS, paleta=PALETA)
    with pytest.raises(ImagenMapaInvalida):
        generar_pdf_mapa(titulo="T", origen="ia", imagen_png=b"\x89PNG\r\n\x1a\nroto", conceptos=CONCEPTOS, paleta=PALETA)


def test_mapa_sin_conceptos_se_rechaza():
    with pytest.raises(MapaSinConceptos):
        generar_pdf_mapa(titulo="T", origen="ia", imagen_png=_png(), conceptos=[], paleta=PALETA)


# --- Endpoint -----------------------------------------------------------------------------

fastapi = pytest.importorskip("fastapi")
pytest.importorskip("httpx")

from fastapi.testclient import TestClient  # noqa: E402

from app.main import crear_aplicacion  # noqa: E402
from app.mapas_conceptuales.enrutador import nombre_archivo_pdf  # noqa: E402

RUTA = "/api/mapas-conceptuales/descargar-pdf"


def _solicitud(**cambios):
    cuerpo = {
        "titulo": "Sistema nervioso",
        "origen": "ia",
        "imagen_png": base64.b64encode(_png()).decode(),
        "paleta": {"solido": "#4f46e5", "tinte": "#eef0ff", "medio": "#d9ddff", "tinta": "#3a33b8", "texto": "#1a1938", "texto_suave": "#5f5e82", "borde": "#e3e1f0"},
        "conceptos": [{"etiqueta": c.etiqueta, "descripcion": c.descripcion, "profundidad": c.profundidad} for c in CONCEPTOS],
    }
    cuerpo.update(cambios)
    return cuerpo


def _cliente() -> TestClient:
    return TestClient(crear_aplicacion(), raise_server_exceptions=False)


def test_endpoint_devuelve_pdf_con_nombre_descriptivo():
    respuesta = _cliente().post(RUTA, json=_solicitud(titulo="Sistema nervioso: ¿cómo funciona?"))
    assert respuesta.status_code == 200
    assert respuesta.headers["content-type"] == "application/pdf"
    assert 'filename="Sistema_Nervioso_Como_Funciona_Mapa_Conceptual.pdf"' in respuesta.headers["content-disposition"]
    assert respuesta.headers["cache-control"] == "no-store"
    assert len(PdfReader(BytesIO(respuesta.content)).pages) == 2


def test_endpoint_admite_data_url_del_navegador():
    data_url = "data:image/png;base64," + base64.b64encode(_png()).decode()
    assert _cliente().post(RUTA, json=_solicitud(imagen_png=data_url)).status_code == 200


def test_endpoint_rechaza_imagen_invalida_con_mensaje_claro():
    respuesta = _cliente().post(RUTA, json=_solicitud(imagen_png="esto no es base64!!"))
    assert respuesta.status_code == 422
    assert respuesta.json()["error"]["codigo"] == "IMAGEN_MAPA_INVALIDA"


@pytest.mark.parametrize(
    "cambios",
    [
        {"conceptos": []},
        {"paleta": {"solido": "red", "tinte": "#eef0ff", "medio": "#d9ddff", "tinta": "#3a33b8", "texto": "#1a1938", "texto_suave": "#5f5e82", "borde": "#e3e1f0"}},
        {"origen": "otro"},
    ],
)
def test_endpoint_valida_la_solicitud(cambios):
    respuesta = _cliente().post(RUTA, json=_solicitud(**cambios))
    assert respuesta.status_code == 422
    assert respuesta.json()["exito"] is False


@pytest.mark.parametrize(
    ("titulo", "esperado"),
    [
        ("Sistema nervioso", "Sistema_Nervioso_Mapa_Conceptual.pdf"),
        ("  La célula / núcleo  ", "La_Celula_Nucleo_Mapa_Conceptual.pdf"),
        ("¿?¡!", "Tema_Mapa_Conceptual.pdf"),
        ("", "Tema_Mapa_Conceptual.pdf"),
    ],
)
def test_nombre_de_archivo_saneado(titulo, esperado):
    assert nombre_archivo_pdf(titulo) == esperado
