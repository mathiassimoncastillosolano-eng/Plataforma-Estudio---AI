import pytest

from app.comun.errores import ContenidoMuyLargo, PdfInvalido, PdfMuyPesado, PdfProtegido, PdfSinTexto
from app.contenido.extractor_pdf import extraer_texto_pdf
from app.contenido.servicio_contenido import ServicioContenido
from pruebas.utilidades_pdf import LINEAS_DE_EJEMPLO, construir_pdf_con_texto, construir_pdf_protegido, construir_pdf_sin_texto
from io import BytesIO


def _servicio(**cambios) -> ServicioContenido:
    parametros = dict(max_bytes=1024 * 1024, max_paginas=10, min_caracteres=100, max_caracteres=20_000)
    parametros.update(cambios)
    return ServicioContenido(**parametros)


def test_pdf_valido_extrae_texto_de_todas_las_paginas():
    pdf = construir_pdf_con_texto([LINEAS_DE_EJEMPLO[:2], LINEAS_DE_EJEMPLO[2:]])
    resultado = extraer_texto_pdf(pdf, max_paginas=10, max_caracteres=20_000)
    assert resultado.paginas == 2
    assert "sistema circulatorio" in resultado.texto
    assert "arterias" in resultado.texto


def test_servicio_devuelve_texto_paginas_y_caracteres():
    pdf = construir_pdf_con_texto([LINEAS_DE_EJEMPLO])
    resultado = _servicio().extraer_texto_de_pdf(BytesIO(pdf))
    assert resultado.paginas == 1
    assert resultado.caracteres == len(resultado.texto) >= 100


def test_archivo_que_no_es_pdf_es_invalido():
    with pytest.raises(PdfInvalido):
        _servicio().extraer_texto_de_pdf(BytesIO(b"esto es texto plano, no un pdf"))


def test_pdf_danado_es_invalido_y_no_rompe_el_backend():
    with pytest.raises(PdfInvalido):
        _servicio().extraer_texto_de_pdf(BytesIO(b"%PDF-1.4\n1 0 obj\n<< basura sin cerrar"))


def test_pdf_sin_texto_lanza_error_controlado():
    with pytest.raises(PdfSinTexto):
        _servicio().extraer_texto_de_pdf(BytesIO(construir_pdf_sin_texto()))


def test_pdf_protegido_con_contrasena():
    with pytest.raises(PdfProtegido):
        _servicio().extraer_texto_de_pdf(BytesIO(construir_pdf_protegido()))


def test_pdf_demasiado_pesado():
    with pytest.raises(PdfMuyPesado):
        _servicio(max_bytes=100).extraer_texto_de_pdf(BytesIO(construir_pdf_con_texto([LINEAS_DE_EJEMPLO])))


def test_pdf_con_demasiadas_paginas():
    pdf = construir_pdf_con_texto([LINEAS_DE_EJEMPLO] * 3)
    with pytest.raises(ContenidoMuyLargo):
        _servicio(max_paginas=2).extraer_texto_de_pdf(BytesIO(pdf))


def test_pdf_con_demasiado_texto():
    pdf = construir_pdf_con_texto([LINEAS_DE_EJEMPLO])
    with pytest.raises(ContenidoMuyLargo):
        _servicio(max_caracteres=150).extraer_texto_de_pdf(BytesIO(pdf))
