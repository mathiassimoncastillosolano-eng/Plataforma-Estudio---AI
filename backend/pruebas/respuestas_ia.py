"""Respuestas de ejemplo de la IA reutilizadas por varias pruebas."""
import json

RESPUESTA_VALIDA = {
    "resumen_general": {
        "titulo": "Sistema circulatorio",
        "introduccion": "El sistema circulatorio transporta sangre por el cuerpo.",
        "secciones": [
            {"titulo": "El corazón", "contenido": "Actúa como bomba muscular.", "puntos": ["Cuatro cavidades", "Dos circuitos"]},
            {"titulo": "Los vasos", "contenido": "Arterias, venas y capilares."},
        ],
    },
    "resumen_esencial": {
        "idea_central": "La sangre circula impulsada por el corazón.",
        "ideas_clave": ["El corazón bombea la sangre", "Las arterias salen del corazón"],
        "conceptos_clave": [{"termino": "Corazón", "definicion": "Órgano muscular que bombea la sangre."}],
    },
}

RESPUESTA_VALIDA_JSON = json.dumps(RESPUESTA_VALIDA, ensure_ascii=False)

# Respuesta con los campos ampliados: tabla, fórmulas y notas de fidelidad.
RESPUESTA_COMPLETA = {
    "resumen_esencial": {
        **RESPUESTA_VALIDA["resumen_esencial"],
        "formulas_y_reglas": [{"nombre": "Gasto cardíaco", "expresion": "GC = FC × VS", "explicacion": "Litros por minuto"}],
        "notas_de_fidelidad": ["La figura 2 está borrosa y no pudo interpretarse."],
    },
    "resumen_general": {
        **RESPUESTA_VALIDA["resumen_general"],
        "secciones": [
            {
                "titulo": "Los vasos",
                "contenido": "Arterias, venas y capilares.",
                "puntos": [],
                "tabla": {"titulo": "Vasos", "encabezados": ["Vaso", "Función"], "filas": [["Arteria", "Sale del corazón"], ["Vena"]]},
            }
        ],
        "notas_de_fidelidad": [],
    },
}

RESPUESTA_COMPLETA_JSON = json.dumps(RESPUESTA_COMPLETA, ensure_ascii=False)
