"""Reparto de preguntas por dificultad y puntaje. Lógica pura, sin FastAPI ni OpenAI.

Es la única fuente de verdad del backend: el frontend muestra el mismo cálculo como
vista previa (`utilidades/constructorPruebas.ts`), pero la prueba se construye y se
califica siempre con estas reglas.
"""
from app.pruebas.errores import ConfiguracionPruebaInvalida, DistribucionInvalida

DIFICULTADES = ("facil", "media", "dificil")
DIFICULTADES_PREDEFINIDAS = DIFICULTADES
DIFICULTAD_PERSONALIZADA = "personalizada"

CANTIDADES_PERMITIDAS = (5, 10, 15, 20, 25)
MAXIMO_PREGUNTAS = max(CANTIDADES_PERMITIDAS)

# Peso de cada pregunta en medios puntos (enteros, sin errores de coma flotante).
PESO_EN_MEDIOS_PUNTOS = {"facil": 1, "media": 2, "dificil": 4}

# Perfiles en porcentaje entero. Cada fila suma 100.
PERFILES = {
    "facil": {"facil": 75, "media": 20, "dificil": 5},
    "media": {"facil": 20, "media": 60, "dificil": 20},
    "dificil": {"facil": 5, "media": 20, "dificil": 75},
}

# Aproximación del contenido que sostiene una pregunta de calidad (ver `limite_por_contenido`).
CARACTERES_POR_PREGUNTA = 300


def distribucion_vacia() -> dict[str, int]:
    return {nivel: 0 for nivel in DIFICULTADES}


def calcular_distribucion(cantidad: int, dificultad: str) -> dict[str, int]:
    """Reparte `cantidad` según el perfil con el método del resto mayor.

    Aritmética entera: la suma es SIEMPRE exactamente `cantidad`. En empate de restos
    gana el nivel con mayor porcentaje en el perfil.
    """
    if dificultad not in PERFILES:
        raise ConfiguracionPruebaInvalida(detalle=f"dificultad desconocida: {dificultad!r}")
    perfil = PERFILES[dificultad]
    resultado = distribucion_vacia()
    restos: list[tuple[str, int, int]] = []
    for nivel in DIFICULTADES:
        exacto_por_100 = cantidad * perfil[nivel]
        resultado[nivel] = exacto_por_100 // 100
        restos.append((nivel, exacto_por_100 % 100, perfil[nivel]))

    faltante = cantidad - sum(resultado.values())
    restos.sort(key=lambda r: (-r[1], -r[2]))
    posicion = 0
    while faltante > 0:
        resultado[restos[posicion % len(restos)][0]] += 1
        faltante -= 1
        posicion += 1
    return resultado


def validar_personalizada(cantidad: int, valores: dict[str, int]) -> dict[str, int]:
    """Comprueba la distribución personalizada: enteros ≥ 0 cuya suma es exactamente `cantidad`."""
    resultado = distribucion_vacia()
    for nivel in DIFICULTADES:
        valor = valores.get(nivel)
        if isinstance(valor, bool) or not isinstance(valor, int) or valor < 0:
            raise DistribucionInvalida("Cada cantidad debe ser un número entero mayor o igual que cero.")
        resultado[nivel] = valor
    suma = sum(resultado.values())
    if suma != cantidad:
        raise DistribucionInvalida(
            f"La suma de preguntas fáciles, medias y difíciles es {suma}, pero la prueba tiene {cantidad} preguntas."
        )
    return resultado


def resolver_distribucion(cantidad: int, dificultad: str, personalizada: dict[str, int] | None) -> dict[str, int]:
    if dificultad == DIFICULTAD_PERSONALIZADA:
        if personalizada is None:
            raise DistribucionInvalida("Indica cuántas preguntas fáciles, medias y difíciles quieres.")
        return validar_personalizada(cantidad, personalizada)
    return calcular_distribucion(cantidad, dificultad)


def puntaje_maximo(distribucion: dict[str, int]) -> float:
    medios = sum(distribucion[nivel] * PESO_EN_MEDIOS_PUNTOS[nivel] for nivel in DIFICULTADES)
    return medios / 2


def peso(nivel: str) -> float:
    return PESO_EN_MEDIOS_PUNTOS[nivel] / 2


def limite_por_contenido(caracteres: int) -> int:
    """Preguntas que el resumen puede sostener (cota superior; la generación confirma la cifra real)."""
    return min(MAXIMO_PREGUNTAS, caracteres // CARACTERES_POR_PREGUNTA)
