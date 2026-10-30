"""Utilidades de texto del módulo de pruebas: normalización, fuente evaluable y fundamentación."""
import hashlib
import re
import unicodedata

_NO_ALFANUMERICO = re.compile(r"[^a-z0-9]+")


def normalizar(texto: str) -> str:
    """Minúsculas, sin tildes ni signos, con espacios simples. Para comparar, nunca para mostrar."""
    sin_tildes = unicodedata.normalize("NFD", texto.lower())
    sin_marcas = "".join(c for c in sin_tildes if unicodedata.category(c) != "Mn")
    return _NO_ALFANUMERICO.sub(" ", sin_marcas).strip()


def tokens(texto: str) -> list[str]:
    normal = normalizar(texto)
    return normal.split() if normal else []


def _trigramas(palabras: list[str]) -> set[tuple[str, str, str]]:
    return {tuple(palabras[i : i + 3]) for i in range(len(palabras) - 2)}  # type: ignore[misc]


class Fuente:
    """Resumen general convertido a texto evaluable, con índices para verificar la fundamentación."""

    def __init__(self, texto: str):
        self.texto = texto
        self.normal = normalizar(texto)
        self._palabras = self.normal.split()
        self._trigramas = _trigramas(self._palabras)
        self.huella = hashlib.sha256(texto.encode("utf-8")).hexdigest()[:16]

    @property
    def caracteres(self) -> int:
        return len(self.texto)

    def contiene(self, fragmento: str) -> bool:
        normal = normalizar(fragmento)
        return bool(normal) and f" {normal} " in f" {self.normal} "

    def fundamenta(self, cita: str, *, umbral: float = 0.8) -> bool:
        """¿La cita procede del resumen? Exacta (normalizada) o con ≥ `umbral` de sus trigramas presentes.

        Tolera pequeñas diferencias de puntuación o de una palabra, pero rechaza citas inventadas.
        """
        palabras = tokens(cita)
        if len(palabras) < 4:
            return False
        if self.contiene(cita):
            return True
        trigramas = _trigramas(palabras)
        if not trigramas:
            return False
        return len(trigramas & self._trigramas) / len(trigramas) >= umbral


def construir_texto_fuente(resumen) -> str:
    """Convierte el resumen general (modelo `ResumenFuente`) en el texto que recibe la IA."""
    partes: list[str] = []
    if resumen.titulo.strip():
        partes.append(f"TÍTULO: {resumen.titulo.strip()}")
    if resumen.introduccion.strip():
        partes.append(f"INTRODUCCIÓN: {resumen.introduccion.strip()}")
    for i, seccion in enumerate(resumen.secciones, start=1):
        titulo = seccion.titulo.strip()
        contenido = seccion.contenido.strip()
        if not titulo and not contenido:
            continue
        bloque = [f"SECCIÓN {i}: {titulo}".strip(), contenido]
        bloque += [f"- {p.strip()}" for p in seccion.puntos if p.strip()]
        tabla = seccion.tabla
        if tabla and tabla.encabezados and tabla.filas:
            if tabla.titulo.strip():
                bloque.append(f"Tabla: {tabla.titulo.strip()}")
            bloque.append(" | ".join(tabla.encabezados))
            bloque += [" | ".join(fila) for fila in tabla.filas]
        partes.append("\n".join(b for b in bloque if b))
    return "\n\n".join(partes)


def titulos_de_secciones(resumen) -> list[str]:
    return [s.titulo.strip() for s in resumen.secciones if s.titulo.strip() and s.contenido.strip()]
