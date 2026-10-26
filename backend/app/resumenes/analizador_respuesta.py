"""Valida y convierte la respuesta JSON de la IA en modelos de dominio.

Nunca se confía en el formato que devuelve el modelo: cada campo se comprueba
y, si la estructura no es utilizable, se lanza `IARespuestaInvalida`.
"""
import json
import re

from app.comun.errores import IARespuestaInvalida
from app.resumenes.dominio import (
    ConceptoClave,
    FormulaRegla,
    ResumenEsencial,
    ResumenGeneral,
    SeccionGeneral,
    TablaResumen,
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


def _leer_tabla(valor) -> TablaResumen | None:
    """La tabla es opcional: si viene mal formada se descarta sin invalidar todo el resumen."""
    if not isinstance(valor, dict):
        return None
    try:
        encabezados = _lista_de_textos(valor, "encabezados", obligatoria=False)
        filas_brutas = _lista(valor, "filas", obligatoria=False)
    except IARespuestaInvalida:
        return None
    filas = []
    for fila in filas_brutas:
        if not isinstance(fila, list):
            continue
        celdas = ["" if celda is None else str(celda).strip() for celda in fila]
        if any(celdas):
            filas.append(celdas)
    if not encabezados or not filas:
        return None
    columnas = len(encabezados)
    filas = [(fila + [""] * columnas)[:columnas] for fila in filas]  # cada fila con tantas celdas como encabezados
    titulo = valor.get("titulo")
    return TablaResumen(titulo=titulo.strip() if isinstance(titulo, str) else "", encabezados=encabezados, filas=filas)


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
                tabla=_leer_tabla(elemento.get("tabla")),
            )
        )
    if not secciones:
        raise _invalida("el resumen general no tiene secciones válidas")

    titulo = _texto(datos, "titulo", obligatorio=False)
    introduccion = _texto(datos, "introduccion", obligatorio=False)
    notas = _lista_de_textos(datos, "notas_de_fidelidad", obligatoria=False)
    textos = [titulo, introduccion] + [f"{s.titulo} {s.contenido} {' '.join(s.puntos)}" for s in secciones]
    textos += [" ".join(fila_celda for fila in s.tabla.filas for fila_celda in fila) for s in secciones if s.tabla]
    return ResumenGeneral(
        titulo=titulo,
        introduccion=introduccion,
        secciones=secciones,
        minutos_lectura=calcular_minutos_lectura(*textos),
        notas_de_fidelidad=notas,
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

    formulas = []
    for elemento in _lista(datos, "formulas_y_reglas", obligatoria=False):
        if not isinstance(elemento, dict):
            continue
        nombre, expresion, explicacion = elemento.get("nombre"), elemento.get("expresion"), elemento.get("explicacion")
        if isinstance(expresion, str) and expresion.strip():
            formulas.append(
                FormulaRegla(
                    nombre=nombre.strip() if isinstance(nombre, str) else "",
                    expresion=expresion.strip(),
                    explicacion=explicacion.strip() if isinstance(explicacion, str) else "",
                )
            )

    notas = _lista_de_textos(datos, "notas_de_fidelidad", obligatoria=False)
    textos = [idea_central, *ideas_clave] + [f"{c.termino} {c.definicion}" for c in conceptos]
    textos += [f"{f.nombre} {f.expresion} {f.explicacion}" for f in formulas]
    return ResumenEsencial(
        idea_central=idea_central,
        ideas_clave=ideas_clave,
        conceptos_clave=conceptos,
        minutos_lectura=calcular_minutos_lectura(*textos),
        formulas_y_reglas=formulas,
        notas_de_fidelidad=notas,
    )


def analizar_respuesta_ia(bruto: str) -> tuple[ResumenGeneral, ResumenEsencial]:
    datos = _cargar_objeto_json(bruto)
    general = _leer_resumen_general(_objeto(datos, "resumen_general"))
    esencial = _leer_resumen_esencial(_objeto(datos, "resumen_esencial"))
    return general, esencial
