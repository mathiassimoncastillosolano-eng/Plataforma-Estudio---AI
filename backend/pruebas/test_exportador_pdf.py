"""Pruebas del PDF descargable: contenido completo, caracteres especiales y paginación."""
from io import BytesIO

import pytest

pytest.importorskip("reportlab")

from pypdf import PdfReader  # noqa: E402

from app.comun.errores import ResumenVacio  # noqa: E402
from app.resumenes import exportador_pdf as exportador  # noqa: E402
from app.resumenes.dominio import (  # noqa: E402
    ConceptoClave,
    FormulaRegla,
    ResumenEsencial,
    ResumenGeneral,
    SeccionGeneral,
    TablaResumen,
)


def _leer(pdf: bytes) -> tuple[int, str]:
    lector = PdfReader(BytesIO(pdf))
    return len(lector.pages), "\n".join(pagina.extract_text() for pagina in lector.pages)


def test_esencial_incluye_todo_su_contenido_y_conserva_simbolos_y_texto_especial():
    resumen = ResumenEsencial(
        idea_central="Idea con <etiqueta> & ampersand",
        ideas_clave=["Primera idea", "Segunda idea"],
        conceptos_clave=[ConceptoClave("Corazón", "Órgano muscular")],
        minutos_lectura=1,
        formulas_y_reglas=[FormulaRegla("Gasto cardíaco", "GC = FC × VS", "Litros por minuto")],
        notas_de_fidelidad=["Figura 2 ilegible"],
    )
    paginas, texto = _leer(exportador.generar_pdf_esencial(resumen, titulo_tema="Circulatorio", origen="Generado con IA"))
    for esperado in ["RESUMEN ESENCIAL", "Circulatorio", "<etiqueta> & ampersand", "Primera idea", "Segunda idea", "Corazón", "GC = FC × VS", "Figura 2 ilegible", "Página 1 de 1"]:
        assert esperado in texto
    assert paginas == 1


def test_general_con_tabla_larga_se_reparte_en_paginas_numeradas_sin_perder_filas():
    tabla = TablaResumen("Datos", ["Clave", "Valor"], [[f"fila-{i}", f"valor-{i}"] for i in range(120)])
    resumen = ResumenGeneral(
        "Título", "Introducción", [SeccionGeneral("Sección", "Contenido", ["Punto A"], tabla)] + [SeccionGeneral(f"S{i}", "texto " * 200) for i in range(4)], 4
    )
    paginas, texto = _leer(exportador.generar_pdf_general(resumen, titulo_tema="Tema", origen="Generado con IA"))
    assert paginas > 1
    assert "fila-0" in texto and "fila-119" in texto and "valor-119" in texto
    assert f"Página {paginas} de {paginas}" in texto
    assert texto.count("Clave") >= 2  # la cabecera de la tabla se repite en cada página


def test_resumenes_vacios_no_generan_archivo():
    with pytest.raises(ResumenVacio):
        exportador.generar_pdf_esencial(ResumenEsencial("", [], [], 1), titulo_tema="T", origen="x")
    with pytest.raises(ResumenVacio):
        exportador.generar_pdf_general(ResumenGeneral("", "", [], 1), titulo_tema="T", origen="x")
