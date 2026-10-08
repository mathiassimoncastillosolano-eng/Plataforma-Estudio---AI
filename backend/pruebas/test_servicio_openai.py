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
