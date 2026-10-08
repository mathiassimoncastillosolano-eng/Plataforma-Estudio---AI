import pytest

from app.comun.errores import ContenidoInvalido, ContenidoMuyCorto, ContenidoMuyLargo, ContenidoVacio
from app.contenido.validacion import normalizar_texto, validar_texto_estudio

TEXTO_VALIDO = "El sistema circulatorio transporta sangre, oxígeno y nutrientes por todo el cuerpo. " * 3


def test_texto_valido_se_devuelve_normalizado():
    resultado = validar_texto_estudio(f"  {TEXTO_VALIDO}  \r\n", minimo=100, maximo=20_000)
    assert resultado == TEXTO_VALIDO.strip()


def test_texto_vacio_o_solo_espacios_lanza_contenido_vacio():
    for texto in ["", "   \n\t ", None]:
        with pytest.raises(ContenidoVacio):
            validar_texto_estudio(texto, minimo=100, maximo=20_000)


def test_texto_demasiado_corto():
    with pytest.raises(ContenidoMuyCorto) as error:
        validar_texto_estudio("Texto breve pero con letras suficientes para la prueba", minimo=100, maximo=20_000)
    assert "100" in error.value.mensaje


def test_texto_demasiado_largo():
    with pytest.raises(ContenidoMuyLargo):
        validar_texto_estudio("a" * 101, minimo=10, maximo=100)


def test_texto_sin_letras_es_invalido():
    with pytest.raises(ContenidoInvalido):
        validar_texto_estudio("1234567890 " * 20, minimo=100, maximo=20_000)


def test_normalizar_elimina_caracteres_de_control_y_saltos_excesivos():
    assert normalizar_texto("uno\x00\x07\n\n\n\n\ndos  \ntres") == "uno\n\ndos\ntres"
