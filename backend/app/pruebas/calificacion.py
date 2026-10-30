"""Calificación en el servidor: compara con la clave guardada en el sello, nunca con lo que diga el navegador."""
from app.pruebas.distribucion import DIFICULTADES, PESO_EN_MEDIOS_PUNTOS, peso, puntaje_maximo

MAX_CONCEPTOS_DEBILES = 3


def calificar(estado: dict, *, tiempo_agotado: bool, duracion_segundos: float) -> dict:
    """Devuelve `{resultado, revision}` a partir de las respuestas ya guardadas en `estado`."""
    respuestas: dict[str, str] = estado["respuestas"]
    por_nivel = {n: {"total": 0, "correctas": 0, "omitidas": 0, "obtenidos": 0.0, "max": 0.0, "porcentaje": 0} for n in DIFICULTADES}
    medios_obtenidos = 0
    correctas = omitidas = 0
    conceptos: dict[str, dict[str, int]] = {}
    revision: list[dict] = []

    for pregunta in estado["preguntas"]:
        nivel = pregunta["dificultad"]
        medios = PESO_EN_MEDIOS_PUNTOS[nivel]
        elegida = respuestas.get(pregunta["id"])
        omitida = elegida is None
        acierto = (not omitida) and elegida == pregunta["correcta"]

        bloque = por_nivel[nivel]
        bloque["total"] += 1
        bloque["max"] += medios / 2
        if omitida:
            omitidas += 1
            bloque["omitidas"] += 1
        if acierto:
            correctas += 1
            bloque["correctas"] += 1
            bloque["obtenidos"] += medios / 2
            medios_obtenidos += medios

        for concepto in pregunta.get("conceptos", []):
            cuenta = conceptos.setdefault(concepto, {"falladas": 0, "total": 0})
            cuenta["total"] += 1
            if not acierto:
                cuenta["falladas"] += 1

        revision.append(
            {
                "id": pregunta["id"],
                "enunciado": pregunta["enunciado"],
                "dificultad": nivel,
                "puntos": peso(nivel),
                "opciones": pregunta["opciones"],
                "id_seleccionada": elegida,
                "id_correcta": pregunta["correcta"],
                "ids_descartadas": estado["descartes"].get(pregunta["id"], []),
                "estado": "omitida" if omitida else ("correcta" if acierto else "incorrecta"),
                "explicacion": pregunta["explicacion"],
                "fundamento": pregunta["fundamento"],
                "conceptos": pregunta.get("conceptos", []),
            }
        )

    for bloque in por_nivel.values():
        bloque["porcentaje"] = round(bloque["obtenidos"] / bloque["max"] * 100) if bloque["max"] else 0

    total = len(estado["preguntas"])
    maximo = puntaje_maximo(estado["config"]["distribucion"])
    puntaje = medios_obtenidos / 2

    debiles = sorted(
        ({"termino": t, **c} for t, c in conceptos.items() if c["falladas"] > 0),
        key=lambda c: (-(c["falladas"] / c["total"]), -c["falladas"], c["termino"]),
    )[:MAX_CONCEPTOS_DEBILES]

    resultado = {
        "id_prueba": estado["id"],
        "id_tema": estado["id_tema"],
        "total_preguntas": total,
        "correctas": correctas,
        "incorrectas": total - correctas - omitidas,
        "omitidas": omitidas,
        "puntaje": puntaje,
        "puntaje_maximo": maximo,
        "porcentaje": round(puntaje / maximo * 100) if maximo else 0,
        "duracion_segundos": round(duracion_segundos),
        "tiempo_agotado": tiempo_agotado,
        "por_dificultad": por_nivel,
        "conceptos_debiles": debiles,
        "configuracion": {
            "cantidad_preguntas": total,
            "dificultad": estado["config"]["dificultad"],
            "distribucion": estado["config"]["distribucion"],
            "limite_segundos": estado["config"]["limite_segundos"],
            "modo_asistido": estado["config"]["modo_asistido"],
            "pausa_blindada": estado["config"]["pausa_blindada"],
        },
    }
    return {"resultado": resultado, "revision": revision}
