import json

import pytest

from app.comun.errores import IARespuestaInvalida
from app.pruebas.analizador import analizar_preguntas
from app.pruebas.texto import Fuente, construir_texto_fuente
from pruebas.ia_pruebas_falsa import resumen_de_ejemplo

FUENTE = Fuente(construir_texto_fuente(resumen_de_ejemplo()))


def valida(**cambios) -> dict:
    base = {
        "dificultad": "media",
        "enunciado": "¿Qué opción describe correctamente el concepto «cresta» dentro del estudio de las ondas?",
        "opciones": ["El punto más alto que alcanza una onda", "El punto más bajo que alcanza una onda", "El tiempo de una oscilación", "La energía por unidad de área"],
        "indice_correcta": 0,
        "explicacion": "La cresta es el punto más alto de la onda.",
        "fundamento": "En el estudio de las ondas, cresta es el punto más alto que alcanza una onda",
        "conceptos": ["cresta"],
        "terminos": [{"texto": "cresta", "definicion": "Punto más alto de una onda."}],
    }
    base.update(cambios)
    return base


def analizar(*preguntas, asistido=True, existentes=None):
    return analizar_preguntas(json.dumps({"preguntas": list(preguntas)}), FUENTE, modo_asistido=asistido, existentes=existentes)


def test_acepta_una_pregunta_valida_y_calcula_posiciones_del_termino():
    validas, descartes = analizar(valida())
    assert descartes == [] and len(validas) == 1
    p = validas[0]
    assert p.enunciado[p.terminos[0]["inicio"] : p.terminos[0]["fin"]].lower() == "cresta"
    assert p.dificultad == "media" and p.conceptos == ["cresta"]


def test_acepta_sinonimos_con_tilde_de_dificultad():
    validas, _ = analizar(valida(dificultad="Fácil"), valida(dificultad="difícil", enunciado="Un experimento muestra una cresta muy marcada sobre el agua: ¿qué magnitud se está observando?"))
    assert [p.dificultad for p in validas] == ["facil", "dificil"]


@pytest.mark.parametrize(
    "cambios,motivo",
    [
        ({"opciones": ["a", "b", "c"]}, "exactamente 4"),
        ({"opciones": ["Igual", "igual", "Otra distinta", "Y otra más"]}, "repetidas"),
        ({"opciones": ["El punto más alto de una onda", "El punto bajo", "Todas las anteriores", "El tiempo"]}, "todas"),
        ({"indice_correcta": 4}, "índice"),
        ({"indice_correcta": True}, "índice"),
        ({"dificultad": "experta"}, "dificultad"),
        ({"enunciado": "¿Qué?"}, "enunciado"),
        ({"explicacion": ""}, "explicación"),
        ({"fundamento": "Una frase inventada que no figura en ninguna parte del resumen entregado"}, "fundamento"),
        ({"fundamento": ""}, "fundamento"),
        ({"enunciado": "Sabiendo que el punto más alto que alcanza una onda se llama de cierta manera, ¿cuál es?"}, "contiene la respuesta"),
    ],
)
def test_descarta_preguntas_mal_formadas(cambios, motivo):
    validas, descartes = analizar(valida(**cambios))
    assert validas == []
    assert len(descartes) == 1 and motivo in descartes[0]


def test_la_fundamentacion_tolera_pequenas_diferencias_pero_no_inventos():
    casi_literal = "En el estudio de las ondas cresta es el punto más alto que alcanza la onda"  # sin coma y 'la' por 'una'
    assert analizar(valida(fundamento=casi_literal))[0]
    assert not analizar(valida(fundamento="La cresta es una elevación del terreno donde crece la hierba verde"))[0]


def test_descarta_duplicadas_dentro_de_la_respuesta_y_frente_a_existentes():
    validas, descartes = analizar(valida(), valida())
    assert len(validas) == 1 and descartes == ["duplicada"]
    nuevas, descartes = analizar(valida(), existentes=validas)
    assert nuevas == [] and descartes == ["duplicada"]


def test_terminos_que_no_estan_en_el_enunciado_o_delatan_la_respuesta_se_descartan():
    p = valida(
        terminos=[
            {"texto": "cresta", "definicion": "Punto de la onda."},
            {"texto": "volcán", "definicion": "No está en el enunciado."},
            {"texto": "ondas", "definicion": "Es el punto más alto que alcanza una onda."},  # delata la correcta
            {"texto": "correctamente", "definicion": "Esta palabra no figura en el resumen, así que no hay fuente fiable."},
        ]
    )
    validas, _ = analizar(p)
    assert [validas[0].enunciado[t["inicio"] : t["fin"]] for t in validas[0].terminos] == ["cresta"]


def test_sin_modo_asistido_no_se_guardan_terminos():
    validas, _ = analizar(valida(), asistido=False)
    assert validas[0].terminos == []


@pytest.mark.parametrize("bruto", ["no es json", "[]", json.dumps({"preguntas": []}), json.dumps({"otra": 1}), "42"])
def test_respuesta_sin_lista_utilizable_lanza_error(bruto):
    with pytest.raises(IARespuestaInvalida):
        analizar_preguntas(bruto, FUENTE, modo_asistido=False)


def test_acepta_bloque_de_codigo_markdown():
    bruto = "```json\n" + json.dumps({"preguntas": [valida()]}) + "\n```"
    assert len(analizar_preguntas(bruto, FUENTE, modo_asistido=False)[0]) == 1


def test_terminos_toleran_tildes_mayusculas_y_plurales():
    from app.pruebas.analizador import _terminos
    from app.pruebas.texto import Fuente

    fuente = Fuente("La difracción es la desviación de una onda. Las ondas transportan energía.")
    enunciado = "¿Qué describe la DIFRACCION de las ondas?"
    crudos = [
        {"texto": "difracción", "definicion": "Desviación de una onda al rodear un obstáculo."},
        {"texto": "ondas", "definicion": "Perturbaciones que transportan energía."},
        {"texto": "onda estacionaria", "definicion": "No está en el enunciado."},
    ]
    terminos = _terminos(crudos, enunciado, "Otra cosa distinta", fuente)
    assert [enunciado[t["inicio"]:t["fin"]] for t in terminos] == ["DIFRACCION", "ondas"]
