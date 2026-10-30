"""Valida y convierte la respuesta JSON de la IA en un `MapaConceptual` coherente.

Nunca se confía en lo que devuelve el modelo. La política es:
- Un elemento inválido (sin etiqueta, sin definición, sin frase de enlace, duplicado, etc.) se DESCARTA
  solo cuando es seguro hacerlo; nunca se inventa contenido para completarlo.
- La jerarquía se reconstruye desde la raíz. Lo que no se pueda alcanzar desde ella (huérfanos, ciclos,
  padres descartados) se descarta, de modo que el posicionamiento del frontend nunca recibe un grafo roto.
- Si el resultado deja de ser un mapa coherente (sin raíz, o con muy pocos nodos) se lanza `IARespuestaInvalida`
  en lugar de mostrar información engañosa.
"""
import json
import logging
import re
from collections import deque
from dataclasses import dataclass

from app.comun.errores import IARespuestaInvalida
from app.mapas_conceptuales.dominio import (
    MAX_LONGITUD_DEFINICION,
    MAX_LONGITUD_ETIQUETA,
    MAX_LONGITUD_FRASE,
    MAX_LONGITUD_ID,
    MAX_LONGITUD_TITULO,
    MAX_NIVEL_VISUAL,
    MAX_NODOS,
    MAX_RELACIONES_CRUZADAS,
    MIN_NODOS,
    MapaConceptual,
    NodoMapa,
    RelacionMapa,
)

logger = logging.getLogger(__name__)

_VALLAS_DE_CODIGO = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def _invalida(detalle: str) -> IARespuestaInvalida:
    return IARespuestaInvalida(detalle=detalle)


@dataclass
class _Candidato:
    id: str
    etiqueta: str
    definicion: str
    id_padre: str | None
    frase_enlace: str


def _cargar_objeto_json(bruto: str) -> dict:
    texto = _VALLAS_DE_CODIGO.sub("", (bruto or "").strip())
    try:
        datos = json.loads(texto)
    except json.JSONDecodeError as error:
        raise _invalida(f"la respuesta no es JSON válido ({error.msg})") from error
    if not isinstance(datos, dict):
        raise _invalida("la respuesta JSON no es un objeto")
    return datos


def _linea(valor) -> str:
    """Texto en una sola línea, sin espacios sobrantes. Vacío si no es texto."""
    return " ".join(valor.split()) if isinstance(valor, str) else ""


def _identificador(valor) -> str | None:
    """Acepta textos o enteros (la IA a veces numera); rechaza vacíos, booleanos y valores muy largos."""
    if isinstance(valor, bool) or not isinstance(valor, (str, int)):
        return None
    limpio = str(valor).strip()
    if not limpio or len(limpio) > MAX_LONGITUD_ID:
        return None
    return limpio


def _recortar_definicion(texto: str) -> str:
    if len(texto) <= MAX_LONGITUD_DEFINICION:
        return texto
    corte = texto[:MAX_LONGITUD_DEFINICION].rsplit(" ", 1)[0].rstrip(" ,;:.")
    return f"{corte}…"


def _leer_nodo(crudo) -> _Candidato | None:
    """Devuelve el nodo o None si no es utilizable. La frase de enlace se exige después, según sea o no raíz."""
    if not isinstance(crudo, dict):
        return None
    id_nodo = _identificador(crudo.get("id"))
    etiqueta = _linea(crudo.get("etiqueta"))
    definicion = _linea(crudo.get("definicion"))
    if id_nodo is None or not etiqueta or len(etiqueta) > MAX_LONGITUD_ETIQUETA or not definicion:
        return None
    return _Candidato(
        id=id_nodo,
        etiqueta=etiqueta,
        definicion=_recortar_definicion(definicion),
        id_padre=_identificador(crudo.get("id_padre")),
        frase_enlace=_linea(crudo.get("frase_enlace")),
    )


def _frase_valida(frase: str) -> bool:
    return bool(frase) and len(frase) <= MAX_LONGITUD_FRASE


def analizar_respuesta_ia(bruto: str) -> MapaConceptual:
    datos = _cargar_objeto_json(bruto)

    crudos = datos.get("nodos")
    if not isinstance(crudos, list) or not crudos:
        raise _invalida("falta la lista 'nodos' o está vacía")

    descartados = 0

    # 1) Nodos individualmente válidos y con id único (se conserva el primero de cada id).
    candidatos: dict[str, _Candidato] = {}
    for crudo in crudos:
        candidato = _leer_nodo(crudo)
        if candidato is None or candidato.id in candidatos:
            descartados += 1
            continue
        candidatos[candidato.id] = candidato

    # 2) Nodo raíz: el que no tiene padre. Si hay varios se conserva uno (preferimos el declarado de nivel 0).
    raices = [c for c in candidatos.values() if c.id_padre is None]
    if not raices:
        raise _invalida("el mapa no tiene un nodo raíz utilizable")
    nivel_declarado = {_identificador(n.get("id")): n.get("nivel") for n in crudos if isinstance(n, dict)}
    raiz = next((r for r in raices if nivel_declarado.get(r.id) == 0), raices[0])

    # 3) Recorrido en anchura desde la raíz. Lo no alcanzable (huérfanos, ciclos, raíces extra) queda fuera,
    #    y el tope de nodos recorta por niveles, de modo que lo conservado siempre es un árbol conexo.
    hijos: dict[str, list[_Candidato]] = {}
    for candidato in candidatos.values():
        if candidato.id_padre is not None and candidato.id_padre in candidatos and candidato.id != candidato.id_padre:
            hijos.setdefault(candidato.id_padre, []).append(candidato)

    orden: list[tuple[_Candidato, int]] = []
    visitados = {raiz.id}
    cola = deque([(raiz, 0)])
    while cola:
        actual, profundidad = cola.popleft()
        orden.append((actual, profundidad))
        for hijo in hijos.get(actual.id, []):
            if hijo.id in visitados or not _frase_valida(hijo.frase_enlace):
                continue
            if len(visitados) >= MAX_NODOS:
                continue
            visitados.add(hijo.id)
            cola.append((hijo, profundidad + 1))

    descartados += len(candidatos) - len(orden)

    if len(orden) < MIN_NODOS:
        raise _invalida(f"el mapa resultante tiene {len(orden)} nodos (mínimo {MIN_NODOS})")

    # 4) Identificadores propios y estables: "root" para la raíz y n1, n2... en orden de recorrido.
    nuevo_id = {candidato.id: ("root" if indice == 0 else f"n{indice}") for indice, (candidato, _) in enumerate(orden)}

    nodos: list[NodoMapa] = []
    relaciones: list[RelacionMapa] = []
    pares_usados: set[frozenset[str]] = set()
    for indice, (candidato, profundidad) in enumerate(orden):
        id_padre = None if indice == 0 else nuevo_id[candidato.id_padre]
        nodos.append(NodoMapa(
            id=nuevo_id[candidato.id],
            etiqueta=candidato.etiqueta,
            definicion=candidato.definicion,
            nivel=min(profundidad, MAX_NIVEL_VISUAL),
            id_padre=id_padre,
        ))
        if id_padre is not None:
            relaciones.append(RelacionMapa(
                id=f"e{indice}",
                origen=id_padre,
                destino=nuevo_id[candidato.id],
                frase_enlace=candidato.frase_enlace,
                tipo="jerarquica",
            ))
            pares_usados.add(frozenset((id_padre, nuevo_id[candidato.id])))

    # 5) Relaciones cruzadas: solo entre nodos conservados, con frase, sin autoenlaces ni repeticiones.
    cruzadas_crudas = datos.get("relaciones_cruzadas")
    if isinstance(cruzadas_crudas, list):
        direcciones: set[tuple[str, str]] = set()
        for crudo in cruzadas_crudas:
            if len([r for r in relaciones if r.tipo == "cruzada"]) >= MAX_RELACIONES_CRUZADAS:
                break
            if not isinstance(crudo, dict):
                descartados += 1
                continue
            origen = nuevo_id.get(_identificador(crudo.get("origen")) or "")
            destino = nuevo_id.get(_identificador(crudo.get("destino")) or "")
            frase = _linea(crudo.get("frase_enlace"))
            par = frozenset((origen, destino)) if origen and destino else None
            if (
                origen is None
                or destino is None
                or origen == destino
                or not _frase_valida(frase)
                or (origen, destino) in direcciones
                or par in pares_usados  # ya están unidos por la jerarquía
            ):
                descartados += 1
                continue
            direcciones.add((origen, destino))
            relaciones.append(RelacionMapa(
                id=f"c{len(direcciones)}", origen=origen, destino=destino, frase_enlace=frase, tipo="cruzada",
            ))

    if descartados:
        logger.warning("Mapa conceptual: se descartaron %d elementos inválidos de la respuesta de la IA", descartados)

    titulo = _linea(datos.get("titulo"))[:MAX_LONGITUD_TITULO].strip() or nodos[0].etiqueta
    return MapaConceptual(titulo=titulo, nodos=nodos, relaciones=relaciones)
