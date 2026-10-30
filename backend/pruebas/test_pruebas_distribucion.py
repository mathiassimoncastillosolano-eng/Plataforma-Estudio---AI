import pytest

from app.pruebas.distribucion import (
    CANTIDADES_PERMITIDAS,
    PERFILES,
    calcular_distribucion,
    limite_por_contenido,
    puntaje_maximo,
    resolver_distribucion,
    validar_personalizada,
)
from app.pruebas.errores import ConfiguracionPruebaInvalida, DistribucionInvalida


@pytest.mark.parametrize("cantidad", [1, 3, 5, 7, 10, 15, 20, 25, 99])
@pytest.mark.parametrize("dificultad", list(PERFILES))
def test_la_suma_siempre_coincide_con_la_cantidad(cantidad, dificultad):
    reparto = calcular_distribucion(cantidad, dificultad)
    assert sum(reparto.values()) == cantidad
    assert all(isinstance(v, int) and v >= 0 for v in reparto.values())


@pytest.mark.parametrize(
    "cantidad,dificultad,esperado",
    [
        (20, "media", {"facil": 4, "media": 12, "dificil": 4}),
        (10, "facil", {"facil": 8, "media": 2, "dificil": 0}),
        (10, "dificil", {"facil": 0, "media": 2, "dificil": 8}),
        (5, "media", {"facil": 1, "media": 3, "dificil": 1}),
        (25, "dificil", {"facil": 1, "media": 5, "dificil": 19}),
    ],
)
def test_repartos_conocidos(cantidad, dificultad, esperado):
    assert calcular_distribucion(cantidad, dificultad) == esperado


def test_dificultad_desconocida():
    with pytest.raises(ConfiguracionPruebaInvalida):
        calcular_distribucion(10, "imposible")


def test_personalizada_valida_y_permite_ceros():
    assert validar_personalizada(20, {"facil": 5, "media": 10, "dificil": 5}) == {"facil": 5, "media": 10, "dificil": 5}
    assert validar_personalizada(10, {"facil": 0, "media": 10, "dificil": 0}) == {"facil": 0, "media": 10, "dificil": 0}


@pytest.mark.parametrize(
    "valores",
    [
        {"facil": 5, "media": 10, "dificil": 4},  # suma 19
        {"facil": 5, "media": 10, "dificil": 6},  # suma 21
        {"facil": -1, "media": 11, "dificil": 10},  # negativo
        {"facil": 5.5, "media": 9.5, "dificil": 5},  # no entero
        {"facil": True, "media": 10, "dificil": 9},  # booleano disfrazado de entero
        {"facil": 10, "media": 10},  # falta un nivel
    ],
)
def test_personalizada_incorrecta_se_rechaza(valores):
    with pytest.raises(DistribucionInvalida):
        validar_personalizada(20, valores)


def test_resolver_exige_distribucion_cuando_es_personalizada():
    with pytest.raises(DistribucionInvalida):
        resolver_distribucion(10, "personalizada", None)
    assert resolver_distribucion(10, "personalizada", {"facil": 1, "media": 2, "dificil": 7})["dificil"] == 7
    assert resolver_distribucion(10, "media", {"facil": 10, "media": 0, "dificil": 0}) == calcular_distribucion(10, "media")


def test_puntaje_maximo_pondera_por_dificultad():
    # fácil 0.5 · media 1 · difícil 2
    assert puntaje_maximo({"facil": 4, "media": 12, "dificil": 4}) == 2 + 12 + 8
    assert puntaje_maximo({"facil": 1, "media": 0, "dificil": 0}) == 0.5


def test_limite_por_contenido():
    assert limite_por_contenido(100) == 0
    assert limite_por_contenido(1500) == 5
    assert limite_por_contenido(10_000) == max(CANTIDADES_PERMITIDAS)
