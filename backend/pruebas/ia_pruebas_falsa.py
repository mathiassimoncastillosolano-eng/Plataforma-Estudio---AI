"""IA falsa para las pruebas del módulo de pruebas: genera preguntas realmente fundamentadas en el resumen."""
import json
import re
import threading

from app.pruebas.esquemas import ResumenFuente

CONCEPTOS = [
    ("cresta", "el punto más alto que alcanza una onda"),
    ("valle", "el punto más bajo que alcanza una onda"),
    ("longitud de onda", "la distancia entre dos crestas consecutivas"),
    ("frecuencia", "el número de oscilaciones completas por segundo"),
    ("periodo", "el tiempo que tarda en completarse una oscilación"),
    ("amplitud", "la separación máxima respecto a la posición de equilibrio"),
    ("onda transversal", "aquella cuya vibración es perpendicular a su propagación"),
    ("onda longitudinal", "aquella cuya vibración es paralela a su propagación"),
    ("interferencia", "la superposición de dos ondas que se encuentran en un punto"),
    ("difracción", "la desviación de una onda al rodear un obstáculo o una abertura"),
    ("refracción", "el cambio de dirección de una onda al cambiar de medio"),
    ("reflexión", "el rebote de una onda al chocar con una superficie"),
    ("resonancia", "el aumento de amplitud cuando se excita a la frecuencia natural"),
    ("efecto Doppler", "la variación de frecuencia por el movimiento relativo entre fuente y observador"),
    ("onda estacionaria", "la que resulta de superponer dos ondas idénticas que viajan en sentidos opuestos"),
    ("nodo", "el punto de una onda estacionaria donde la amplitud es nula"),
    ("antinodo", "el punto de una onda estacionaria donde la amplitud es máxima"),
    ("velocidad de propagación", "el producto de la longitud de onda por la frecuencia"),
    ("intensidad", "la energía que transporta la onda por unidad de área y de tiempo"),
    ("timbre", "la cualidad que distingue dos sonidos de igual tono e intensidad"),
    ("tono", "la cualidad del sonido determinada por su frecuencia"),
    ("eco", "el sonido reflejado que llega al oyente con retraso perceptible"),
    ("onda electromagnética", "la que se propaga sin necesidad de un medio material"),
    ("espectro visible", "la franja de longitudes de onda que percibe el ojo humano"),
    ("polarización", "la restricción de la vibración de una onda a un único plano"),
    ("dispersión", "la separación de una onda en sus componentes según la frecuencia"),
    ("atenuación", "la pérdida progresiva de energía de una onda al propagarse"),
    ("pulso", "una perturbación breve que viaja por un medio"),
    ("frente de onda", "el lugar geométrico de los puntos que vibran en fase"),
    ("principio de Huygens", "la idea de que cada punto de un frente de onda actúa como fuente secundaria"),
]


def _oracion(nombre: str, definicion: str) -> str:
    return f"En el estudio de las ondas, {nombre} es {definicion}."


def resumen_de_ejemplo(n_conceptos: int = 30) -> ResumenFuente:
    """Resumen general con `n_conceptos` secciones (cada una con una oración definitoria y un par de puntos)."""
    secciones = []
    for nombre, definicion in CONCEPTOS[:n_conceptos]:
        secciones.append(
            {
                "titulo": nombre.capitalize(),
                "contenido": f"{_oracion(nombre, definicion)} Conviene distinguirlo con cuidado de los demás conceptos del tema.",
                "puntos": [f"Idea para recordar sobre {nombre}: se relaciona con el comportamiento general de las ondas."],
            }
        )
    return ResumenFuente.model_validate(
        {"titulo": "Ondas", "introduccion": "Las ondas transportan energía sin transportar materia a través de un medio.", "secciones": secciones}
    )


def _pregunta(i: int, dificultad: str, asistido: bool) -> dict:
    nombre, definicion = CONCEPTOS[i % len(CONCEPTOS)]
    otros = [c[1] for k, c in enumerate(CONCEPTOS) if k != i % len(CONCEPTOS)][:3]
    # Varias plantillas, como haría un modelo real: los enunciados de un mismo tema no son clones.
    plantillas = {
        "facil": [
            "¿Qué opción describe correctamente el concepto «{n}» dentro del estudio de las ondas?",
            "En física, ¿a qué se refiere el término «{n}» cuando se habla de ondas?",
            "¿Cuál de estas definiciones corresponde a «{n}»?",
        ],
        "media": [
            "Al analizar un fenómeno ondulatorio, ¿cómo se interpreta «{n}»?",
            "¿Qué significado tiene «{n}» para entender cómo se comportan las ondas?",
            "Si un texto menciona «{n}», ¿a qué idea se está aludiendo?",
        ],
        "dificil": [
            "Un estudiante observa un fenómeno y necesita identificar cuál de estas afirmaciones define «{n}» en un experimento con ondas. ¿Cuál es?",
            "En un laboratorio se discute la noción de «{n}»; ¿qué enunciado la caracteriza sin confundirla con otras magnitudes?",
            "Ante una situación donde aparece «{n}», ¿qué afirmación permite razonar correctamente sobre ella?",
        ],
    }[dificultad]
    enunciado = plantillas[i % len(plantillas)].format(n=nombre)
    pregunta = {
        "dificultad": dificultad,
        "enunciado": enunciado,
        "opciones": [definicion.capitalize(), *[o.capitalize() for o in otros]],
        "indice_correcta": 0,  # el servicio baraja: así se comprueba que no dependa del orden de la IA
        "explicacion": f"{nombre.capitalize()} es {definicion}, según lo que establece el tema.",
        "fundamento": _oracion(nombre, definicion).rstrip("."),
        "conceptos": [nombre],
    }
    if asistido:
        pregunta["terminos"] = [
            {"texto": nombre, "definicion": f"Término del tema de ondas ({nombre})."},
            {"texto": "ondas", "definicion": "Perturbaciones que transportan energía a través de un medio."},
        ]
    return pregunta


class IAGeneradora:
    """Lee las cantidades pedidas en el mensaje y devuelve exactamente esas preguntas, sin repetir conceptos."""

    modelo = "modelo-de-prueba"

    def __init__(self, *, fallos_iniciales: int = 0, error: Exception | None = None, de_menos: int = 0, mala_calidad: bool = False):
        self.llamadas: list[dict] = []
        self._fallos = fallos_iniciales
        self._error = error
        self._de_menos = de_menos
        self._mala_calidad = mala_calidad
        self._siguiente = 0
        self._candado = threading.Lock()

    def generar_json(self, *, instrucciones: str, entrada: str, timeout_segundos: float | None = None) -> str:
        with self._candado:
            self.llamadas.append({"instrucciones": instrucciones, "entrada": entrada, "timeout_segundos": timeout_segundos})
            if self._error:
                raise self._error
            if self._fallos > 0:
                self._fallos -= 1
                return "esto no es JSON"
            pedidas = json.loads(re.search(r"estas preguntas: (\{.*?\})", entrada).group(1))
            asistido = "terminos" in instrucciones
            preguntas = []
            for nivel in ("facil", "media", "dificil"):
                for _ in range(pedidas[nivel]):
                    p = _pregunta(self._siguiente, nivel, asistido)
                    if self._mala_calidad:
                        p["fundamento"] = "Una frase que no aparece en ninguna parte del resumen entregado"
                    preguntas.append(p)
                    self._siguiente += 1
            if self._de_menos:  # solo la primera llamada se queda corta
                preguntas = preguntas[: -self._de_menos]
                self._de_menos = 0
            return json.dumps({"preguntas": preguntas}, ensure_ascii=False)
