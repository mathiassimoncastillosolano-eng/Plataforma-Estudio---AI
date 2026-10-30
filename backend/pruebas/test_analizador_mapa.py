"""Pruebas del analizador de la respuesta de IA del mapa conceptual (TASK-0041)."""
import json

import pytest

from app.comun.errores import IARespuestaInvalida
from app.mapas_conceptuales.analizador_respuesta import analizar_respuesta_ia
from app.mapas_conceptuales.dominio import (
    MAX_LONGITUD_DEFINICION,
    MAX_LONGITUD_ETIQUETA,
    MAX_NODOS,
    MAX_RELACIONES_CRUZADAS,
)
from pruebas.respuestas_mapa import RESPUESTA_MAPA_JSON, mapa, nodo


def _ids(resultado):
    return {n.id for n in resultado.nodos}


def _tres_nodos():
    return [nodo("r"), nodo("a", "r"), nodo("b", "r")]


# --- Caso válido ----------------------------------------------------------------------------


def test_mapa_valido_conserva_estructura_y_relaciones():
    resultado = analizar_respuesta_ia(RESPUESTA_MAPA_JSON)
    assert resultado.titulo == "Sistema circulatorio"
    assert len(resultado.nodos) == 9
    raiz = resultado.nodos[0]
    assert raiz.id == "root" and raiz.nivel == 0 and raiz.id_padre is None

    jerarquicas = [r for r in resultado.relaciones if r.tipo == "jerarquica"]
    cruzadas = [r for r in resultado.relaciones if r.tipo == "cruzada"]
    assert len(jerarquicas) == 8 and len(cruzadas) == 2
    # cada nodo no raíz tiene exactamente una relación jerárquica entrante con frase
    entrantes = {r.destino: r for r in jerarquicas}
    assert set(entrantes) == _ids(resultado) - {"root"}
    assert all(r.frase_enlace for r in resultado.relaciones)
    # la dirección se conserva: padre → hijo
    corazon = next(n for n in resultado.nodos if n.etiqueta == "Corazón")
    assert entrantes[corazon.id].origen == "root" and entrantes[corazon.id].frase_enlace == "se impulsa con el"


def test_niveles_y_ids_se_regeneran_de_forma_estable():
    resultado = analizar_respuesta_ia(RESPUESTA_MAPA_JSON)
    assert [n.nivel for n in resultado.nodos] == [0, 1, 1, 1, 2, 2, 2, 2, 2]
    assert len({n.id for n in resultado.nodos}) == len(resultado.nodos)
    assert resultado.nodos[1].id == "n1"
    # los ids originales de la IA no se filtran al resultado
    assert not ({"a", "b", "c"} & _ids(resultado))
    # las relaciones solo referencian nodos existentes
    ids = _ids(resultado)
    assert all(r.origen in ids and r.destino in ids for r in resultado.relaciones)


def test_acepta_vallas_de_codigo_markdown():
    resultado = analizar_respuesta_ia(f"```json\n{RESPUESTA_MAPA_JSON}\n```")
    assert len(resultado.nodos) == 9


def test_acepta_ids_numericos():
    nodos = [nodo(1), nodo(2, 1), nodo(3, 1)]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert len(resultado.nodos) == 3


def test_sin_titulo_usa_la_etiqueta_de_la_raiz():
    cuerpo = json.loads(mapa(_tres_nodos()))
    cuerpo.pop("titulo")
    resultado = analizar_respuesta_ia(json.dumps(cuerpo))
    assert resultado.titulo == "Concepto r"


def test_normaliza_espacios_y_saltos_de_linea():
    nodos = [nodo("r", etiqueta="  Concepto \n principal "), nodo("a", "r", definicion="Una\n\ndefinición   larga."), nodo("b", "r")]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert resultado.nodos[0].etiqueta == "Concepto principal"
    assert resultado.nodos[1].definicion == "Una definición larga."


# --- Respuestas inutilizables -----------------------------------------------------------------


@pytest.mark.parametrize("bruto", ["", "no es json", "[]", '"texto"', "{}", '{"nodos": []}', '{"nodos": "x"}'])
def test_respuestas_mal_formadas_lanzan_error_controlado(bruto):
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(bruto)


def test_sin_raiz_lanza_error():
    nodos = [nodo("a", "b"), nodo("b", "a"), nodo("c", "a")]
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(mapa(nodos))


def test_si_la_raiz_no_tiene_definicion_no_hay_mapa():
    nodos = [nodo("r", definicion=""), nodo("a", "r"), nodo("b", "r")]
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(mapa(nodos))


def test_mapa_demasiado_pequeno_lanza_error():
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(mapa([nodo("r"), nodo("a", "r")]))


# --- Descarte de elementos inválidos ------------------------------------------------------------


def test_descarta_nodos_sin_etiqueta_o_definicion_y_su_subarbol():
    nodos = _tres_nodos() + [
        nodo("x", "r", etiqueta="  "),
        nodo("x1", "x"),  # hijo del descartado: queda huérfano
        nodo("y", "r", definicion=""),
        nodo("z", "r"),
    ]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert [n.etiqueta for n in resultado.nodos] == ["Concepto r", "Concepto a", "Concepto b", "Concepto z"]


def test_descarta_nodo_sin_frase_de_enlace_y_su_subarbol():
    nodos = _tres_nodos() + [nodo("x", "r", frase=""), nodo("x1", "x")]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert _ids(resultado) == {"root", "n1", "n2"}


def test_descarta_etiquetas_y_frases_demasiado_largas():
    nodos = _tres_nodos() + [nodo("x", "r", etiqueta="e" * (MAX_LONGITUD_ETIQUETA + 1)), nodo("y", "r", frase="f" * 200)]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert len(resultado.nodos) == 3


def test_ids_duplicados_conservan_el_primero():
    nodos = _tres_nodos() + [nodo("a", "r", etiqueta="Duplicado")]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert len(resultado.nodos) == 3
    assert "Duplicado" not in [n.etiqueta for n in resultado.nodos]


def test_padre_inexistente_deja_al_nodo_fuera():
    resultado = analizar_respuesta_ia(mapa(_tres_nodos() + [nodo("x", "no-existe")]))
    assert len(resultado.nodos) == 3


def test_ciclos_y_autoreferencias_no_bloquean_ni_entran_al_mapa():
    nodos = _tres_nodos() + [nodo("c1", "c2"), nodo("c2", "c1"), nodo("auto", "auto")]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert len(resultado.nodos) == 3


def test_varias_raices_conserva_la_de_nivel_cero():
    nodos = [
        nodo("falsa", None, nivel=1),
        nodo("f1", "falsa"),
        nodo("real", None, nivel=0),
        nodo("a", "real"),
        nodo("b", "real"),
    ]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert resultado.nodos[0].etiqueta == "Concepto real"
    assert len(resultado.nodos) == 3


def test_definicion_muy_larga_se_recorta_con_puntos_suspensivos():
    larga = "palabra " * 200
    resultado = analizar_respuesta_ia(mapa([nodo("r", definicion=larga), nodo("a", "r"), nodo("b", "r")]))
    definicion = resultado.nodos[0].definicion
    assert definicion.endswith("…") and len(definicion) <= MAX_LONGITUD_DEFINICION + 1


# --- Límites y profundidad ----------------------------------------------------------------------


def test_respeta_el_maximo_de_nodos_y_deja_un_arbol_conexo():
    nodos = [nodo("r")] + [nodo(f"h{i}", "r") for i in range(60)]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert len(resultado.nodos) == MAX_NODOS
    ids = _ids(resultado)
    assert all(n.id_padre in ids for n in resultado.nodos if n.id_padre)
    assert len([r for r in resultado.relaciones if r.tipo == "jerarquica"]) == MAX_NODOS - 1


def test_el_recorte_por_tope_prefiere_los_niveles_superiores():
    nodos = [nodo("r")] + [nodo(f"h{i}", "r") for i in range(10)] + [nodo(f"n{i}", f"h{i % 10}") for i in range(40)]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert len(resultado.nodos) == MAX_NODOS
    assert sum(1 for n in resultado.nodos if n.nivel == 1) == 10


def test_profundidad_mayor_a_dos_se_conserva_con_nivel_visual_dos():
    nodos = [nodo("r"), nodo("a", "r"), nodo("b", "a"), nodo("c", "b"), nodo("d", "c")]
    resultado = analizar_respuesta_ia(mapa(nodos))
    assert [n.nivel for n in resultado.nodos] == [0, 1, 2, 2, 2]


# --- Relaciones cruzadas -------------------------------------------------------------------------


def _con_cruzadas(cruzadas):
    nodos = [nodo("r"), nodo("a", "r"), nodo("b", "r"), nodo("a1", "a"), nodo("b1", "b")]
    return analizar_respuesta_ia(mapa(nodos, cruzadas))


def _solo_cruzadas(resultado):
    return [r for r in resultado.relaciones if r.tipo == "cruzada"]


def test_relacion_cruzada_valida_se_conserva_con_su_direccion():
    resultado = _con_cruzadas([{"origen": "a1", "destino": "b1", "frase_enlace": "depende de"}])
    (cruzada,) = _solo_cruzadas(resultado)
    por_etiqueta = {n.etiqueta: n.id for n in resultado.nodos}
    assert cruzada.origen == por_etiqueta["Concepto a1"] and cruzada.destino == por_etiqueta["Concepto b1"]
    assert cruzada.frase_enlace == "depende de"


@pytest.mark.parametrize(
    "cruzada",
    [
        {"origen": "a1", "destino": "inexistente", "frase_enlace": "x"},
        {"origen": "a1", "destino": "a1", "frase_enlace": "x"},
        {"origen": "a1", "destino": "b1", "frase_enlace": ""},
        {"origen": "a1", "destino": "b1"},
        {"origen": "a", "destino": "a1", "frase_enlace": "ya unidos"},  # par padre-hijo
        {"origen": "a1", "destino": "a", "frase_enlace": "ya unidos"},
        {"destino": "b1", "frase_enlace": "x"},
        "no es un objeto",
    ],
)
def test_descarta_relaciones_cruzadas_invalidas(cruzada):
    assert _solo_cruzadas(_con_cruzadas([cruzada])) == []


def test_descarta_relaciones_cruzadas_duplicadas_en_la_misma_direccion():
    cruzadas = [
        {"origen": "a1", "destino": "b1", "frase_enlace": "depende de"},
        {"origen": "a1", "destino": "b1", "frase_enlace": "otra frase"},
    ]
    assert len(_solo_cruzadas(_con_cruzadas(cruzadas))) == 1


def test_relaciones_cruzadas_ausentes_o_con_formato_erroneo_no_invalidan_el_mapa():
    nodos = _tres_nodos()
    assert _solo_cruzadas(analizar_respuesta_ia(mapa(nodos))) == []
    assert _solo_cruzadas(analizar_respuesta_ia(mapa(nodos, "texto"))) == []


def test_limita_el_numero_de_relaciones_cruzadas():
    nodos = [nodo("r")] + [nodo(f"a{i}", "r") for i in range(8)] + [nodo(f"b{i}", "a0") for i in range(8)]
    cruzadas = [{"origen": f"a{i}", "destino": f"b{j}", "frase_enlace": "afecta a"} for i in range(1, 8) for j in range(8)]
    resultado = analizar_respuesta_ia(mapa(nodos, cruzadas))
    assert len(_solo_cruzadas(resultado)) == MAX_RELACIONES_CRUZADAS
    assert len({r.id for r in resultado.relaciones}) == len(resultado.relaciones)  # ids únicos
