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


def test_lee_tabla_formulas_y_notas_opcionales():
    from pruebas.respuestas_ia import RESPUESTA_COMPLETA_JSON

    general, esencial = analizar_respuesta_ia(RESPUESTA_COMPLETA_JSON)
    tabla = general.secciones[0].tabla
    assert tabla and tabla.encabezados == ["Vaso", "Función"]
    assert tabla.filas == [["Arteria", "Sale del corazón"], ["Vena", ""]]  # la fila corta se completa
    assert esencial.formulas_y_reglas[0].expresion == "GC = FC × VS"
    assert esencial.notas_de_fidelidad == ["La figura 2 está borrosa y no pudo interpretarse."]


def test_una_tabla_mal_formada_se_descarta_sin_invalidar_el_resumen():
    import json

    from pruebas.respuestas_ia import RESPUESTA_VALIDA

    datos = json.loads(json.dumps(RESPUESTA_VALIDA))
    datos["resumen_general"]["secciones"][0]["tabla"] = {"encabezados": [], "filas": "no es lista"}
    general, _ = analizar_respuesta_ia(json.dumps(datos))
    assert general.secciones[0].tabla is None


def test_los_campos_nuevos_son_opcionales():
    general, esencial = analizar_respuesta_ia(__import__("pruebas.respuestas_ia", fromlist=["x"]).RESPUESTA_VALIDA_JSON)
    assert esencial.formulas_y_reglas == [] and esencial.notas_de_fidelidad == [] and general.notas_de_fidelidad == []
