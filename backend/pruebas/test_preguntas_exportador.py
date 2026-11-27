"""Exportación de preguntas a PDF y Word, y su endpoint."""
import io

import pytest

pytest.importorskip("reportlab")
pytest.importorskip("docx")

from docx import Document  # noqa: E402

from app.preguntas import exportador  # noqa: E402
from app.preguntas.esquemas import SolicitudExportarPreguntas  # noqa: E402


def _solicitud(formato: str, respuestas: str, cantidad: int = 3) -> SolicitudExportarPreguntas:
    preguntas = [
        {
            "enunciado": f"¿Cuál es la afirmación {n} sobre ondas y energía?",
            "dificultad": ("facil", "media", "dificil")[n % 3],
            "opciones": [{"id": i, "texto": f"Opción {i} de la pregunta {n} con ñ y ≤"} for i in "abcd"],
            "correcta": "b",
            "explicacion": f"Explicación única {n}.",
        }
        for n in range(1, cantidad + 1)
    ]
    return SolicitudExportarPreguntas.model_validate({"titulo_tema": "Ondas", "formato": formato, "respuestas": respuestas, "preguntas": preguntas})


def _texto_docx(contenido: bytes) -> str:
    documento = Document(io.BytesIO(contenido))
    celdas = [c.text for t in documento.tables for f in t.rows for c in f.cells]
    return "\n".join([p.text for p in documento.paragraphs] + celdas)


@pytest.mark.parametrize("respuestas", ["junto", "final"])
def test_pdf_es_un_pdf_valido(respuestas):
    contenido = exportador.generar_pdf(_solicitud("pdf", respuestas))
    assert contenido.startswith(b"%PDF")
    assert len(contenido) > 2000


@pytest.mark.parametrize("respuestas", ["junto", "final"])
def test_word_numera_las_preguntas_y_conserva_las_explicaciones(respuestas):
    texto = _texto_docx(exportador.generar_docx(_solicitud("docx", respuestas)))
    for n in (1, 2, 3):
        assert f"Pregunta {n}" in texto or f"PREGUNTA {n}" in texto
        assert f"Explicación única {n}." in texto


def test_word_no_repite_un_bloque_de_respuesta_aparte():
    texto = _texto_docx(exportador.generar_docx(_solicitud("docx", "junto")))
    assert "Respuesta correcta" not in texto


def test_endpoint_devuelve_el_archivo_con_su_nombre():
    pytest.importorskip("fastapi")
    pytest.importorskip("httpx")
    from fastapi.testclient import TestClient

    from app.main import crear_aplicacion

    cliente = TestClient(crear_aplicacion(), raise_server_exceptions=False)
    cuerpo = _solicitud("docx", "final").model_dump()
    respuesta = cliente.post("/api/preguntas/exportar", json=cuerpo)
    assert respuesta.status_code == 200
    assert respuesta.headers["content-type"].startswith("application/vnd.openxmlformats")
    assert "attachment" in respuesta.headers["content-disposition"]
    assert respuesta.headers["content-disposition"].endswith('.docx"')


def test_endpoint_rechaza_una_lista_vacia():
    pytest.importorskip("fastapi")
    pytest.importorskip("httpx")
    from fastapi.testclient import TestClient

    from app.main import crear_aplicacion

    cliente = TestClient(crear_aplicacion(), raise_server_exceptions=False)
    respuesta = cliente.post("/api/preguntas/exportar", json={"titulo_tema": "X", "formato": "pdf", "respuestas": "junto", "preguntas": []})
    assert respuesta.status_code == 422
