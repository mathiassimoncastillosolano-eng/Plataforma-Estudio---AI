import copy
import json

import pytest

from app.comun.errores import IARespuestaInvalida
from app.resumenes.analizador_respuesta import analizar_respuesta_ia
from pruebas.respuestas_ia import RESPUESTA_VALIDA, RESPUESTA_VALIDA_JSON


def test_respuesta_valida_se_convierte_a_dominio():
    general, esencial = analizar_respuesta_ia(RESPUESTA_VALIDA_JSON)
    assert general.titulo == "Sistema circulatorio"
    assert [s.titulo for s in general.secciones] == ["El corazón", "Los vasos"]
    assert general.secciones[1].puntos == []
    assert general.minutos_lectura >= 1
    assert esencial.idea_central.startswith("La sangre")
    assert esencial.conceptos_clave[0].termino == "Corazón"


def test_acepta_json_envuelto_en_bloque_de_codigo():
    general, esencial = analizar_respuesta_ia(f"```json\n{RESPUESTA_VALIDA_JSON}\n```")
    assert len(general.secciones) == 2 and len(esencial.ideas_clave) == 2


def test_respuesta_que_no_es_json_es_invalida():
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia("Claro, aquí tienes tu resumen: ...")


def test_json_que_no_es_objeto_es_invalido():
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia("[1, 2, 3]")


def test_falta_el_resumen_esencial():
    datos = copy.deepcopy(RESPUESTA_VALIDA)
    del datos["resumen_esencial"]
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(json.dumps(datos))


def test_resumen_general_sin_secciones_validas():
    datos = copy.deepcopy(RESPUESTA_VALIDA)
    datos["resumen_general"]["secciones"] = [{"titulo": "", "contenido": ""}, "no es un objeto"]
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(json.dumps(datos))


def test_idea_central_vacia_es_invalida():
    datos = copy.deepcopy(RESPUESTA_VALIDA)
    datos["resumen_esencial"]["idea_central"] = "  "
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(json.dumps(datos))


def test_campos_con_tipo_incorrecto_son_invalidos():
    datos = copy.deepcopy(RESPUESTA_VALIDA)
    datos["resumen_esencial"]["ideas_clave"] = "no es una lista"
    with pytest.raises(IARespuestaInvalida):
        analizar_respuesta_ia(json.dumps(datos))


def test_conceptos_mal_formados_se_descartan_sin_fallar():
    datos = copy.deepcopy(RESPUESTA_VALIDA)
    datos["resumen_esencial"]["conceptos_clave"].append({"termino": "Sin definición"})
    _, esencial = analizar_respuesta_ia(json.dumps(datos))
    assert len(esencial.conceptos_clave) == 1
