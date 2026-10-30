"""Valida la respuesta JSON de la IA y la convierte en preguntas utilizables.

Nunca se confía en el modelo: cada pregunta se comprueba (estructura, alternativas, respuesta
única, pistas, fundamentación en el resumen, duplicados) y las que no cumplen se descartan con
un motivo. Esas descartadas nunca llegan al estudiante; el servicio pide las que falten.
"""
import json
import re
import unicodedata
from dataclasses import dataclass, field

from app.comun.errores import IARespuestaInvalida
from app.pruebas.distribucion import DIFICULTADES
from app.pruebas.texto import Fuente, normalizar, tokens

_VALLAS = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)
_OPCION_PROHIBIDA = re.compile(r"\b(todas|ninguna|ambas|cualquiera)\b.{0,12}\b(anteriores|opciones|alternativas|dichas)\b|\bambas son (correctas|ciertas)\b", re.IGNORECASE)
_SINONIMOS_DIFICULTAD = {"facil": "facil", "fácil": "facil", "media": "media", "medio": "media", "dificil": "dificil", "difícil": "dificil"}

NUM_OPCIONES = 4
MAX_TERMINOS = 4
LONG_MIN_ENUNCIADO, LONG_MAX_ENUNCIADO = 15, 700
LONG_MAX_OPCION = 300
LONG_MAX_EXPLICACION = 900
LONG_MAX_DEFINICION = 200


@dataclass
class PreguntaGenerada:
    dificultad: str
    enunciado: str
    opciones: list[str]
    indice_correcta: int
    explicacion: str
    fundamento: str
    conceptos: list[str] = field(default_factory=list)
    # {"inicio": int, "fin": int, "definicion": str} — posiciones dentro de `enunciado`.
    terminos: list[dict] = field(default_factory=list)


def _cargar(bruto: str) -> list:
    texto = _VALLAS.sub("", (bruto or "").strip())
    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as error:
        raise IARespuestaInvalida(detalle=f"la respuesta de preguntas no es JSON válido ({error.msg})") from error
    lista = datos.get("preguntas") if isinstance(datos, dict) else datos
    if not isinstance(lista, list) or not lista:
        raise IARespuestaInvalida(detalle="la respuesta no contiene una lista 'preguntas'")
    return lista


def _texto(valor, maximo: int) -> str | None:
    if not isinstance(valor, str):
        return None
    limpio = re.sub(r"\s+", " ", valor).strip()
    return limpio if limpio and len(limpio) <= maximo else None


_PALABRAS_DE_RELLENO = frozenset(
    "para como cual cuales cuales esta este esto estos estas entre sobre desde hacia donde cuando tiene tienen puede pueden segun dentro "
    "siguiente siguientes opcion opciones afirmacion afirmaciones describe describir correcta correcto correctamente mejor ocurre indica "
    "relacion corresponde considera cierto cierta verdadera que son ser".split()
)
UMBRAL_ENUNCIADO = 0.85  # enunciados casi idénticos
UMBRAL_ENUNCIADO_Y_RESPUESTA = 0.7  # misma idea: enunciado + respuesta correcta muy parecidos


def _contenido(texto: str) -> set[str]:
    """Palabras con significado (se descartan las de relleno que comparten casi todos los enunciados)."""
    return {t for t in tokens(texto) if len(t) >= 4 and t not in _PALABRAS_DE_RELLENO}


def _similitud(a: set[str], b: set[str]) -> float:
    return len(a & b) / len(a | b) if a and b else 0.0


def es_duplicada(pregunta: "PreguntaGenerada", existentes: list["PreguntaGenerada"]) -> bool:
    """¿Repite la idea de alguna pregunta ya aceptada?

    Dos enunciados distintos de un mismo tema comparten mucho vocabulario de relleno («¿Qué opción describe…?»),
    así que se comparan solo las palabras con significado y, además, la respuesta correcta: la misma idea
    reformulada repite enunciado Y respuesta.
    """
    enunciado = _contenido(pregunta.enunciado)
    mixto = enunciado | _contenido(pregunta.opciones[pregunta.indice_correcta])
    for otra in existentes:
        if normalizar(otra.enunciado) == normalizar(pregunta.enunciado):
            return True
        otro_enunciado = _contenido(otra.enunciado)
        if _similitud(enunciado, otro_enunciado) >= UMBRAL_ENUNCIADO:
            return True
        if _similitud(mixto, otro_enunciado | _contenido(otra.opciones[otra.indice_correcta])) >= UMBRAL_ENUNCIADO_Y_RESPUESTA:
            return True
    return False


def _sin_tildes(texto: str) -> str:
    """Minúsculas y sin tildes, conservando la longitud para que las posiciones sirvan sobre el original."""
    plano = "".join(
        (base if len(base := "".join(c for c in unicodedata.normalize("NFD", ch) if unicodedata.category(c) != "Mn")) == 1 else ch)
        for ch in texto
    )
    return plano.lower() if len(plano.lower()) == len(plano) else plano


def _buscar_termino(texto: str, enunciado: str) -> tuple[int, int] | None:
    """Posición del término en el enunciado, sin distinguir mayúsculas ni tildes y como palabra completa."""
    coincidencia = re.search(rf"(?<!\w){re.escape(_sin_tildes(texto))}(?!\w)", _sin_tildes(enunciado))
    return coincidencia.span() if coincidencia else None


def _en_resumen(texto: str, fuente: Fuente) -> bool:
    """El término (o su singular/plural) aparece en el resumen: sin fuente no hay definición fiable."""
    if fuente.contiene(texto):
        return True
    palabras = texto.split()
    if not palabras:
        return False
    ultima = normalizar(palabras[-1])
    variantes = {ultima[:-2] if ultima.endswith("es") else ultima, ultima[:-1] if ultima.endswith("s") else ultima, ultima + "s", ultima + "es"}
    base = " ".join(palabras[:-1])
    return any(fuente.contiene(f"{base} {v}".strip()) for v in variantes if len(v) >= 3)


def _terminos(crudos, enunciado: str, correcta: str, fuente: Fuente) -> list[dict]:
    """Términos de ayuda válidos: están en el enunciado, no delatan la respuesta y salen del resumen."""
    if not isinstance(crudos, list):
        return []
    correcta_norm = normalizar(correcta)
    resultado: list[dict] = []
    for crudo in crudos:
        if not isinstance(crudo, dict):
            continue
        texto = _texto(crudo.get("texto"), 80)
        definicion = _texto(crudo.get("definicion"), LONG_MAX_DEFINICION)
        if not texto or not definicion or len(texto) < 3:
            continue
        posicion = _buscar_termino(texto, enunciado)
        if posicion is None:
            continue
        inicio, fin = posicion
        if any(inicio < t["fin"] and fin > t["inicio"] for t in resultado):
            continue
        texto_norm = normalizar(texto)
        # La ayuda no puede resolver la pregunta ni ser la respuesta misma.
        if texto_norm == correcta_norm or (len(correcta_norm) >= 5 and correcta_norm in normalizar(definicion)):
            continue
        if not _en_resumen(texto, fuente):
            continue
        resultado.append({"inicio": inicio, "fin": fin, "definicion": definicion})
        if len(resultado) == MAX_TERMINOS:
            break
    return sorted(resultado, key=lambda t: t["inicio"])


def _validar_pregunta(crudo, fuente: Fuente, modo_asistido: bool) -> PreguntaGenerada:
    """Devuelve la pregunta válida o lanza ValueError con el motivo del descarte."""
    if not isinstance(crudo, dict):
        raise ValueError("no es un objeto")

    dificultad = _SINONIMOS_DIFICULTAD.get(str(crudo.get("dificultad", "")).strip().lower())
    if dificultad not in DIFICULTADES:
        raise ValueError("dificultad inválida")

    enunciado = _texto(crudo.get("enunciado"), LONG_MAX_ENUNCIADO)
    if not enunciado or len(enunciado) < LONG_MIN_ENUNCIADO:
        raise ValueError("enunciado ausente o fuera de rango")

    opciones_crudas = crudo.get("opciones")
    if not isinstance(opciones_crudas, list) or len(opciones_crudas) != NUM_OPCIONES:
        raise ValueError(f"no tiene exactamente {NUM_OPCIONES} alternativas")
    opciones = [_texto(o, LONG_MAX_OPCION) for o in opciones_crudas]
    if any(o is None for o in opciones):
        raise ValueError("alternativa vacía o demasiado larga")
    normales = [normalizar(o) for o in opciones]  # type: ignore[arg-type]
    if len(set(normales)) != NUM_OPCIONES or "" in normales:
        raise ValueError("alternativas repetidas")
    if any(_OPCION_PROHIBIDA.search(o) for o in opciones):  # type: ignore[arg-type]
        raise ValueError("usa 'todas/ninguna de las anteriores'")

    indice = crudo.get("indice_correcta")
    if isinstance(indice, bool) or not isinstance(indice, int) or not 0 <= indice < NUM_OPCIONES:
        raise ValueError("índice de respuesta correcta inválido")
    correcta = opciones[indice]  # type: ignore[index]

    # Pista involuntaria: el enunciado ya contiene la respuesta.
    correcta_norm = normales[indice]
    if len(correcta_norm) >= 6 and f" {correcta_norm} " in f" {normalizar(enunciado)} ":
        raise ValueError("el enunciado contiene la respuesta")

    explicacion = _texto(crudo.get("explicacion"), LONG_MAX_EXPLICACION)
    if not explicacion or len(explicacion) < 10:
        raise ValueError("falta la explicación")

    fundamento = _texto(crudo.get("fundamento"), 1200)
    if not fundamento or not fuente.fundamenta(fundamento):
        raise ValueError("el fundamento no procede del resumen")

    conceptos_crudos = crudo.get("conceptos")
    conceptos: list[str] = []
    if isinstance(conceptos_crudos, list):
        for c in conceptos_crudos:
            limpio = _texto(c, 80)
            if limpio and limpio not in conceptos:
                conceptos.append(limpio)
    conceptos = conceptos[:3]

    terminos = _terminos(crudo.get("terminos"), enunciado, correcta, fuente) if modo_asistido else []  # type: ignore[arg-type]
    return PreguntaGenerada(dificultad, enunciado, opciones, indice, explicacion, fundamento, conceptos, terminos)  # type: ignore[arg-type]


def analizar_preguntas(
    bruto: str,
    fuente: Fuente,
    *,
    modo_asistido: bool,
    existentes: list[PreguntaGenerada] | None = None,
) -> tuple[list[PreguntaGenerada], list[str]]:
    """Devuelve (preguntas válidas, motivos de descarte). Lanza IARespuestaInvalida si no hay lista utilizable."""
    aceptadas: list[PreguntaGenerada] = list(existentes or [])
    validas: list[PreguntaGenerada] = []
    descartes: list[str] = []
    for crudo in _cargar(bruto):
        try:
            pregunta = _validar_pregunta(crudo, fuente, modo_asistido)
        except ValueError as motivo:
            descartes.append(str(motivo))
            continue
        if es_duplicada(pregunta, aceptadas):
            descartes.append("duplicada")
            continue
        aceptadas.append(pregunta)
        validas.append(pregunta)
    return validas, descartes
