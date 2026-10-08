"""Formato único de respuestas HTTP.

    éxito → {"exito": true,  "datos": {...}}
    error → {"exito": false, "error": {"codigo": "...", "mensaje": "..."}}
"""
from typing import Any

from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse


def respuesta_exitosa(datos: Any, estado_http: int = 200) -> JSONResponse:
    return JSONResponse(status_code=estado_http, content={"exito": True, "datos": jsonable_encoder(datos)})


def respuesta_error(codigo: str, mensaje: str, estado_http: int) -> JSONResponse:
    return JSONResponse(
        status_code=estado_http,
        content={"exito": False, "error": {"codigo": codigo, "mensaje": mensaje}},
    )
