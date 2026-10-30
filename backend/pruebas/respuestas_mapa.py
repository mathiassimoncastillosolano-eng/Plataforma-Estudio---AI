"""Respuestas de IA de ejemplo para las pruebas del mapa conceptual."""
import json

MAPA_VALIDO = {
    "titulo": "Sistema circulatorio",
    "nodos": [
        {"id": "a", "etiqueta": "Sistema circulatorio", "definicion": "Conjunto de órganos que transporta sangre por el cuerpo.", "nivel": 0, "id_padre": None, "frase_enlace": None},
        {"id": "b", "etiqueta": "Corazón", "definicion": "Órgano muscular que bombea la sangre.", "nivel": 1, "id_padre": "a", "frase_enlace": "se impulsa con el"},
        {"id": "c", "etiqueta": "Vasos sanguíneos", "definicion": "Conductos por los que circula la sangre.", "nivel": 1, "id_padre": "a", "frase_enlace": "se distribuye por"},
        {"id": "d", "etiqueta": "Sangre", "definicion": "Tejido líquido que transporta oxígeno y nutrientes.", "nivel": 1, "id_padre": "a", "frase_enlace": "transporta"},
        {"id": "e", "etiqueta": "Aurículas", "definicion": "Cavidades superiores que reciben la sangre.", "nivel": 2, "id_padre": "b", "frase_enlace": "recibe sangre en las"},
        {"id": "f", "etiqueta": "Ventrículos", "definicion": "Cavidades inferiores que expulsan la sangre.", "nivel": 2, "id_padre": "b", "frase_enlace": "expulsa sangre desde los"},
        {"id": "g", "etiqueta": "Arterias", "definicion": "Vasos que alejan la sangre del corazón.", "nivel": 2, "id_padre": "c", "frase_enlace": "incluyen las"},
        {"id": "h", "etiqueta": "Venas", "definicion": "Vasos que devuelven la sangre al corazón.", "nivel": 2, "id_padre": "c", "frase_enlace": "incluyen las"},
        {"id": "i", "etiqueta": "Glóbulos rojos", "definicion": "Células que llevan oxígeno mediante la hemoglobina.", "nivel": 2, "id_padre": "d", "frase_enlace": "contiene"},
    ],
    "relaciones_cruzadas": [
        {"origen": "f", "destino": "g", "frase_enlace": "impulsa la sangre hacia las"},
        {"origen": "h", "destino": "e", "frase_enlace": "devuelve sangre a las"},
    ],
}

RESPUESTA_MAPA_JSON = json.dumps(MAPA_VALIDO, ensure_ascii=False)


def nodo(id_nodo, id_padre=None, *, etiqueta=None, definicion="Definición según el material.", frase="se relaciona con", **extra):
    """Construye un nodo crudo como lo devolvería la IA."""
    crudo = {
        "id": id_nodo,
        "etiqueta": etiqueta if etiqueta is not None else f"Concepto {id_nodo}",
        "definicion": definicion,
        "id_padre": id_padre,
        "frase_enlace": None if id_padre is None else frase,
    }
    crudo.update(extra)
    return crudo


def mapa(nodos, cruzadas=None, titulo="Mapa de prueba") -> str:
    cuerpo = {"titulo": titulo, "nodos": nodos}
    if cruzadas is not None:
        cuerpo["relaciones_cruzadas"] = cruzadas
    return json.dumps(cuerpo, ensure_ascii=False)
