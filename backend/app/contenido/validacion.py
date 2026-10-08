"""Normalización y validación del texto de estudio."""
import re

from app.comun.errores import ContenidoInvalido, ContenidoMuyCorto, ContenidoMuyLargo, ContenidoVacio

MINIMO_LETRAS = 30

_CARACTERES_DE_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_SALTOS_EXCESIVOS = re.compile(r"\n{3,}")
_ESPACIOS_FINALES = re.compile(r"[ \t]+\n")


def formatear_numero(valor: int) -> str:
    return f"{valor:,}".replace(",", ".")


def normalizar_texto(texto: str) -> str:
    """Unifica saltos de línea y elimina caracteres de control y espacios sobrantes."""
    texto = texto.replace("\r\n", "\n").replace("\r", "\n")
    texto = _CARACTERES_DE_CONTROL.sub("", texto)
    texto = _ESPACIOS_FINALES.sub("\n", texto)
    texto = _SALTOS_EXCESIVOS.sub("\n\n", texto)
    return texto.strip()


def validar_texto_estudio(texto: str, *, minimo: int, maximo: int) -> str:
    """Devuelve el texto normalizado o lanza un error controlado si no es utilizable."""
    limpio = normalizar_texto(texto or "")
    if not limpio:
        raise ContenidoVacio()
    if len(limpio) < minimo:
        raise ContenidoMuyCorto(
            f"El contenido es demasiado corto: escribe al menos {formatear_numero(minimo)} caracteres "
            f"(tienes {formatear_numero(len(limpio))})."
        )
    if len(limpio) > maximo:
        raise ContenidoMuyLargo(
            f"El contenido tiene {formatear_numero(len(limpio))} caracteres y el máximo es "
            f"{formatear_numero(maximo)}. Divídelo en partes."
        )
    if sum(1 for caracter in limpio if caracter.isalpha()) < MINIMO_LETRAS:
        raise ContenidoInvalido()
    return limpio
