"""Pruebas del cliente de OpenAI con un cliente falso: no se hace ninguna llamada real."""
from types import SimpleNamespace

import httpx
import pytest

openai = pytest.importorskip("openai")

from app.comun.errores import (  # noqa: E402
    ErrorProveedorIA,
    IACredencialesInvalidas,
    IALimiteSolicitudes,
    IAModeloNoDisponible,
    IANoDisponible,
    IAPdfNoSoportado,
    IARespuestaInvalida,
    IATiempoAgotado,
)
from app.servicios_externos.servicio_openai import ServicioOpenAI  # noqa: E402

_SOLICITUD = httpx.Request("POST", "https://api.openai.com/v1/chat/completions")


def _respuesta_http(estado: int) -> httpx.Response:
    return httpx.Response(estado, request=_SOLICITUD)


class ClienteFalso:
    def __init__(self, *, resultado=None, error: Exception | None = None):
        self.llamadas: list[dict] = []
        self._resultado, self._error = resultado, error
        self.chat = SimpleNamespace(completions=SimpleNamespace(create=self._crear))
        self.responses = SimpleNamespace(create=self._crear)

    def _crear(self, **parametros):
        self.llamadas.append(parametros)
        if self._error:
            raise self._error
        return self._resultado


def _completado(contenido: str | None, finish_reason: str = "stop"):
    opcion = SimpleNamespace(finish_reason=finish_reason, message=SimpleNamespace(content=contenido))
    return SimpleNamespace(choices=[opcion])


def _servicio(cliente: ClienteFalso) -> ServicioOpenAI:
    return ServicioOpenAI(api_key="clave-falsa", modelo="modelo-configurado", timeout_segundos=5, max_reintentos=0, cliente=cliente)


def test_envia_el_modelo_configurado_y_devuelve_el_contenido():
    cliente = ClienteFalso(resultado=_completado('{"ok": true}'))
    assert _servicio(cliente).generar_json(instrucciones="instrucciones", entrada="entrada") == '{"ok": true}'
    assert cliente.llamadas[0]["model"] == "modelo-configurado"
    assert cliente.llamadas[0]["response_format"] == {"type": "json_object"}


@pytest.mark.parametrize(
    "error, esperado",
    [
        (openai.APITimeoutError(request=_SOLICITUD), IATiempoAgotado),
        (openai.APIConnectionError(request=_SOLICITUD), IANoDisponible),
        (openai.AuthenticationError("clave inválida", response=_respuesta_http(401), body=None), IACredencialesInvalidas),
        (openai.NotFoundError("modelo inexistente", response=_respuesta_http(404), body=None), IAModeloNoDisponible),
        (openai.RateLimitError("límite", response=_respuesta_http(429), body=None), IALimiteSolicitudes),
        (openai.InternalServerError("falla", response=_respuesta_http(500), body=None), ErrorProveedorIA),
    ],
)
def test_errores_de_openai_se_traducen_a_errores_controlados(error, esperado):
    with pytest.raises(esperado) as capturado:
        _servicio(ClienteFalso(error=error)).generar_json(instrucciones="i", entrada="e")
    assert type(capturado.value) is esperado
    assert "clave" not in capturado.value.mensaje.lower() or esperado is IACredencialesInvalidas


def test_respuesta_vacia_o_cortada_es_invalida():
    for completado in [_completado(None), _completado("   "), _completado('{"a":', finish_reason="length"), SimpleNamespace(choices=[])]:
        with pytest.raises(IARespuestaInvalida):
            _servicio(ClienteFalso(resultado=completado)).generar_json(instrucciones="i", entrada="e")


# --- PDF original con la Responses API ------------------------------------------------


def _respuesta_pdf(texto: str | None, estado: str = "completed", motivo: str | None = None):
    return SimpleNamespace(status=estado, output_text=texto, incomplete_details=SimpleNamespace(reason=motivo) if motivo else None)


def test_pdf_se_envia_original_como_input_file_con_el_modelo_configurado():
    import base64

    cliente = ClienteFalso(resultado=_respuesta_pdf('{"ok": true}'))
    pdf = b"%PDF-1.4 contenido original con tablas y graficos"
    salida = _servicio(cliente).generar_json_desde_pdf(instrucciones="instr", entrada="entrada", pdf=pdf, nombre_archivo="C:\\apuntes\\tema.pdf")

    assert salida == '{"ok": true}'
    llamada = cliente.llamadas[0]
    assert llamada["model"] == "modelo-configurado"
    assert llamada["instructions"] == "instr"
    assert llamada["store"] is False
    assert llamada["timeout"] == 180.0  # espera propia para PDFs
    assert llamada["text"] == {"format": {"type": "json_object"}}
    contenido = llamada["input"][0]["content"]
    archivo = next(c for c in contenido if c["type"] == "input_file")
    assert archivo["filename"].endswith("tema.pdf") and "\\" not in archivo["filename"] and "/" not in archivo["filename"]
    prefijo = "data:application/pdf;base64,"
    assert archivo["file_data"].startswith(prefijo)
    assert base64.b64decode(archivo["file_data"][len(prefijo):]) == pdf  # el PDF viaja sin transformarse
    assert {"type": "input_text", "text": "entrada"} in contenido


def test_pdf_respuestas_incompletas_o_vacias_son_invalidas():
    for resultado in [_respuesta_pdf(None), _respuesta_pdf("  "), _respuesta_pdf('{"a":', "incomplete", "max_output_tokens"), _respuesta_pdf("x", "failed")]:
        with pytest.raises(IARespuestaInvalida):
            _servicio(ClienteFalso(resultado=resultado)).generar_json_desde_pdf(instrucciones="i", entrada="e", pdf=b"%PDF-", nombre_archivo="a.pdf")


def test_pdf_modelo_sin_soporte_de_archivos_se_informa_con_error_especifico():
    error = openai.BadRequestError("Unsupported input type: input_file is not supported by this model", response=_respuesta_http(400), body=None)
    with pytest.raises(IAPdfNoSoportado):
        _servicio(ClienteFalso(error=error)).generar_json_desde_pdf(instrucciones="i", entrada="e", pdf=b"%PDF-", nombre_archivo="a.pdf")


def test_pdf_otro_error_400_no_se_confunde_con_falta_de_soporte():
    error = openai.BadRequestError("invalid temperature", response=_respuesta_http(400), body=None)
    with pytest.raises(ErrorProveedorIA) as capturado:
        _servicio(ClienteFalso(error=error)).generar_json_desde_pdf(instrucciones="i", entrada="e", pdf=b"%PDF-", nombre_archivo="a.pdf")
    assert type(capturado.value) is ErrorProveedorIA


def test_pdf_errores_de_openai_se_traducen():
    for error, esperado in [
        (openai.APITimeoutError(request=_SOLICITUD), IATiempoAgotado),
        (openai.AuthenticationError("x", response=_respuesta_http(401), body=None), IACredencialesInvalidas),
        (openai.NotFoundError("modelo", response=_respuesta_http(404), body=None), IAModeloNoDisponible),
        (openai.RateLimitError("x", response=_respuesta_http(429), body=None), IALimiteSolicitudes),
    ]:
        with pytest.raises(esperado):
            _servicio(ClienteFalso(error=error)).generar_json_desde_pdf(instrucciones="i", entrada="e", pdf=b"%PDF-", nombre_archivo="a.pdf")


def test_pdf_la_entrada_enviada_a_openai_contiene_la_palabra_json():
    from app.resumenes.instrucciones import construir_entrada_pdf

    cliente = ClienteFalso(resultado=_respuesta_pdf('{"ok": true}'))
    _servicio(cliente).generar_json_desde_pdf(instrucciones="i", entrada=construir_entrada_pdf("T", None), pdf=b"%PDF-", nombre_archivo="a.pdf")
    textos = [c["text"] for c in cliente.llamadas[0]["input"][0]["content"] if c["type"] == "input_text"]
    assert any("json" in t.lower() for t in textos)
