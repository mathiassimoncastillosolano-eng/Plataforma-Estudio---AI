"""Estado de una prueba y su reloj. Lógica pura: el tiempo siempre es el del servidor.

Estados: lista → en_curso ⇄ pausada → finalizada.

El tiempo transcurrido se calcula con tres marcas del servidor (inicio, pausa en curso y pausa
acumulada), nunca con un contador del navegador. Cambiar la hora del equipo no da tiempo extra.
"""
from app.pruebas.errores import EstadoPruebaInvalido, PausaNoPermitida, PruebaExpirada

VERSION = 1
GRACIA_ENTREGA_SEGUNDOS = 5.0  # latencia tolerada al entregar justo cuando se agota el tiempo
CADUCIDAD_SEGUNDOS = 12 * 3600  # un sello más viejo que esto ya no se acepta

LISTA, EN_CURSO, PAUSADA, FINALIZADA = "lista", "en_curso", "pausada", "finalizada"
MAXIMO_OPCIONES_DESCARTADAS = 3  # de 4 alternativas, al menos una siempre queda sin descartar


def nuevo_estado(*, id_prueba: str, ahora: float, id_tema: str, titulo_tema: str, huella: str, modelo: str, configuracion: dict, preguntas: list[dict]) -> dict:
    return {
        "v": VERSION,
        "id": id_prueba,
        "creada_en": ahora,
        "id_tema": id_tema,
        "titulo_tema": titulo_tema,
        "huella_resumen": huella,
        "modelo": modelo,
        "config": configuracion,
        "preguntas": preguntas,
        "estado": LISTA,
        "iniciada_en": None,
        "pausada_desde": None,
        "pausa_acumulada": 0.0,
        "finalizada_en": None,
        "tiempo_agotado": False,
        "duracion_segundos": None,
        "respuestas": {},
        "descartes": {},
        "revision": 0,
    }


def comprobar_vigencia(estado: dict, ahora: float) -> None:
    if ahora - float(estado["creada_en"]) > CADUCIDAD_SEGUNDOS:
        raise PruebaExpirada()


# --- Reloj ---------------------------------------------------------------------------------


def transcurrido(estado: dict, ahora: float) -> float:
    inicio = estado["iniciada_en"]
    if inicio is None:
        return 0.0
    if estado["estado"] == FINALIZADA and estado["finalizada_en"] is not None:
        fin = estado["finalizada_en"]
    elif estado["estado"] == PAUSADA and estado["pausada_desde"] is not None:
        fin = estado["pausada_desde"]
    else:
        fin = ahora
    return max(0.0, fin - inicio - estado["pausa_acumulada"])


def limite(estado: dict) -> int | None:
    return estado["config"]["limite_segundos"]


def restante(estado: dict, ahora: float) -> float | None:
    tope = limite(estado)
    return None if tope is None else max(0.0, tope - transcurrido(estado, ahora))


def esta_vencida(estado: dict, ahora: float) -> bool:
    tope = limite(estado)
    return tope is not None and transcurrido(estado, ahora) >= tope


def dentro_de_gracia(estado: dict, ahora: float) -> bool:
    """¿Se puede aceptar todavía lo que envía el estudiante? Sin límite, siempre; con límite, hasta la gracia."""
    tope = limite(estado)
    return tope is None or transcurrido(estado, ahora) <= tope + GRACIA_ENTREGA_SEGUNDOS


def descripcion_tiempo(estado: dict, ahora: float) -> dict:
    return {
        "estado": estado["estado"],
        "limite_segundos": limite(estado),
        "restante_segundos": None if limite(estado) is None else round(restante(estado, ahora) or 0.0, 3),
        "transcurrido_segundos": round(transcurrido(estado, ahora), 3),
        "vencida": esta_vencida(estado, ahora),
    }


# --- Transiciones --------------------------------------------------------------------------


def _exigir(estado: dict, *permitidos: str) -> None:
    if estado["estado"] not in permitidos:
        raise EstadoPruebaInvalido(detalle=f"estado {estado['estado']!r}, se esperaba {permitidos}")


def iniciar(estado: dict, ahora: float) -> None:
    """lista → en_curso. Idempotente si ya está en curso (p. ej. un reintento de red)."""
    if estado["estado"] == EN_CURSO:
        return
    _exigir(estado, LISTA)
    estado["estado"] = EN_CURSO
    estado["iniciada_en"] = ahora


def pausar(estado: dict, ahora: float) -> None:
    if not estado["config"]["pausa_blindada"]:
        raise PausaNoPermitida()
    if estado["estado"] == PAUSADA:
        return
    _exigir(estado, EN_CURSO)
    if esta_vencida(estado, ahora):
        raise EstadoPruebaInvalido("El tiempo de la prueba ya se agotó.", detalle="pausa con tiempo vencido")
    estado["estado"] = PAUSADA
    estado["pausada_desde"] = ahora


def reanudar(estado: dict, ahora: float) -> None:
    if estado["estado"] == EN_CURSO:
        return
    _exigir(estado, PAUSADA)
    estado["pausa_acumulada"] += max(0.0, ahora - estado["pausada_desde"])
    estado["pausada_desde"] = None
    estado["estado"] = EN_CURSO


def finalizar(estado: dict, ahora: float) -> None:
    _exigir(estado, EN_CURSO, PAUSADA)
    if estado["estado"] == PAUSADA:
        ahora = estado["pausada_desde"]  # la pausa no cuenta ni siquiera al entregar
    estado["finalizada_en"] = ahora
    estado["estado"] = FINALIZADA


# --- Respuestas ----------------------------------------------------------------------------


def aplicar_progreso(estado: dict, respuestas: dict[str, str], descartes: dict[str, list[str]]) -> None:
    """Sustituye las respuestas y descartes guardados por los recibidos, filtrando todo lo desconocido."""
    por_pregunta = {p["id"]: {o["id"] for o in p["opciones"]} for p in estado["preguntas"]}
    limpias: dict[str, str] = {}
    for id_pregunta, id_opcion in respuestas.items():
        if id_opcion in por_pregunta.get(id_pregunta, ()):
            limpias[id_pregunta] = id_opcion
    tachadas: dict[str, list[str]] = {}
    for id_pregunta, ids in descartes.items():
        validos = por_pregunta.get(id_pregunta)
        if not validos:
            continue
        unicos = [i for i in dict.fromkeys(ids) if i in validos and limpias.get(id_pregunta) != i]
        if unicos:
            tachadas[id_pregunta] = unicos[:MAXIMO_OPCIONES_DESCARTADAS]
    estado["respuestas"] = limpias
    estado["descartes"] = tachadas
    estado["revision"] += 1
