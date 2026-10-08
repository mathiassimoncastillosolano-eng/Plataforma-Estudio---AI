"""Valida y convierte la respuesta JSON de la IA en modelos de dominio.

Nunca se confía en el formato que devuelve el modelo: cada campo se comprueba
y, si la estructura no es utilizable, se lanza `IARespuestaInvalida`.
"""
import json
import re

from app.comun.errores import IARespuestaInvalida
from app.resumenes.dominio import (
    ConceptoClave,
    ResumenEsencial,
    ResumenGeneral,
    SeccionGeneral,
    calcular_minutos_lectura,
)

_VALLAS_DE_CODIGO = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def _invalida(detalle: str) -> IARespuestaInvalida:
    return IARespuestaInvalida(detalle=detalle)


def _cargar_objeto_json(bruto: str) -> dict:
    texto = _VALLAS_DE_CODIGO.sub("", (bruto or "").strip())
    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as error:
        raise _invalida(f"la respuesta no es JSON válido ({error.msg})") from error
    if not isinstance(datos, dict):
        raise _invalida("la respuesta JSON no es un objeto")
    return datos


def _objeto(datos: dict, campo: str) -> dict:
    valor = datos.get(campo)
    if not isinstance(valor, dict):
        raise _invalida(f"falta el objeto '{campo}'")
    return valor


def _texto(objeto: dict, campo: str, *, obligatorio: bool) -> str:
    valor = objeto.get(campo)
    if valor is None:
        if obligatorio:
            raise _invalida(f"falta el campo '{campo}'")
        return ""
    if not isinstance(valor, str):
        raise _invalida(f"el campo '{campo}' no es texto")
    limpio = valor.strip()
    if obligatorio and not limpio:
        raise _invalida(f"el campo '{campo}' está vacío")
    return limpio


def _lista(objeto: dict, campo: str, *, obligatoria: bool) -> list:
    valor = objeto.get(campo)
    if valor is None:
        if obligatoria:
            raise _invalida(f"falta la lista '{campo}'")
        return []
    if not isinstance(valor, list):
        raise _invalida(f"el campo '{campo}' no es una lista")
    return valor


def _lista_de_textos(objeto: dict, campo: str, *, obligatoria: bool) -> list[str]:
    textos = [elemento.strip() for elemento in _lista(objeto, campo, obligatoria=obligatoria) if isinstance(elemento, str) and elemento.strip()]
    if obligatoria and not textos:
        raise _invalida(f"la lista '{campo}' no tiene elementos válidos")
    return textos


def _leer_resumen_general(datos: dict) -> ResumenGeneral:
    secciones = []
    for elemento in _lista(datos, "secciones", obligatoria=True):
        if not isinstance(elemento, dict):
            continue
        titulo = elemento.get("titulo")
        contenido = elemento.get("contenido")
        if not (isinstance(titulo, str) and titulo.strip() and isinstance(contenido, str) and contenido.strip()):
            continue
        secciones.append(
            SeccionGeneral(
                titulo=titulo.strip(),
                contenido=contenido.strip(),
                puntos=_lista_de_textos(elemento, "puntos", obligatoria=False),
            )
        )
    if not secciones:
        raise _invalida("el resumen general no tiene secciones válidas")

    titulo = _texto(datos, "titulo", obligatorio=False)
    introduccion = _texto(datos, "introduccion", obligatorio=False)
    textos = [titulo, introduccion] + [f"{s.titulo} {s.contenido} {' '.join(s.puntos)}" for s in secciones]
    return ResumenGeneral(
        titulo=titulo,
        introduccion=introduccion,
        secciones=secciones,
        minutos_lectura=calcular_minutos_lectura(*textos),
    )


def _leer_resumen_esencial(datos: dict) -> ResumenEsencial:
    idea_central = _texto(datos, "idea_central", obligatorio=True)
    ideas_clave = _lista_de_textos(datos, "ideas_clave", obligatoria=True)

    conceptos = []
    for elemento in _lista(datos, "conceptos_clave", obligatoria=False):
        if not isinstance(elemento, dict):
            continue
        termino, definicion = elemento.get("termino"), elemento.get("definicion")
        if isinstance(termino, str) and termino.strip() and isinstance(definicion, str) and definicion.strip():
            conceptos.append(ConceptoClave(termino=termino.strip(), definicion=definicion.strip()))

    textos = [idea_central, *ideas_clave] + [f"{c.termino} {c.definicion}" for c in conceptos]
    return ResumenEsencial(
        idea_central=idea_central,
        ideas_clave=ideas_clave,
        conceptos_clave=conceptos,
        minutos_lectura=calcular_minutos_lectura(*textos),
    )


def analizar_respuesta_ia(bruto: str) -> tuple[ResumenGeneral, ResumenEsencial]:
    datos = _cargar_objeto_json(bruto)
    general = _leer_resumen_general(_objeto(datos, "resumen_general"))
    esencial = _leer_resumen_esencial(_objeto(datos, "resumen_esencial"))
    return general, esencial
