"""Genera el PDF descargable de un resumen (esencial o general) con ReportLab.

Es un documento real (texto vectorial, marcadores de página, tablas que se parten
entre páginas), no una captura de pantalla. Usa DejaVu Serif, incluida en
`fuentes/`, para conservar tildes, símbolos matemáticos y letras griegas.
No llama a la IA: solo da formato al resumen ya generado.
"""
from datetime import datetime, timezone
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import (
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.comun.errores import ResumenVacio
from app.resumenes.dominio import ResumenEsencial, ResumenGeneral

_DIRECTORIO_FUENTES = Path(__file__).parent / "fuentes"

SERIF, SERIF_NEGRITA, SERIF_CURSIVA, SERIF_NEGRITA_CURSIVA, MONO = (
    "DejaVuSerif", "DejaVuSerif-Bold", "DejaVuSerif-Italic", "DejaVuSerif-BoldItalic", "DejaVuSansMono",
)

COLOR_TITULO = colors.HexColor("#1f2a44")
COLOR_ACENTO = colors.HexColor("#2f5d9e")
COLOR_TEXTO = colors.HexColor("#1c1c1c")
COLOR_SUAVE = colors.HexColor("#5b6472")
COLOR_FONDO_SUAVE = colors.HexColor("#eef2f8")
COLOR_LINEA = colors.HexColor("#c9d1de")

MARGEN = 2.2 * cm
ANCHO_UTIL = A4[0] - 2 * MARGEN


@lru_cache(maxsize=1)
def _registrar_fuentes() -> None:
    for nombre in (SERIF, SERIF_NEGRITA, SERIF_CURSIVA, SERIF_NEGRITA_CURSIVA, MONO):
        pdfmetrics.registerFont(TTFont(nombre, str(_DIRECTORIO_FUENTES / f"{nombre}.ttf")))
    pdfmetrics.registerFontFamily(SERIF, normal=SERIF, bold=SERIF_NEGRITA, italic=SERIF_CURSIVA, boldItalic=SERIF_NEGRITA_CURSIVA)


def _estilos() -> dict[str, ParagraphStyle]:
    base = ParagraphStyle("base", fontName=SERIF, fontSize=10.5, leading=15.5, textColor=COLOR_TEXTO, alignment=TA_LEFT)
    return {
        "cuerpo": ParagraphStyle("cuerpo", parent=base, spaceAfter=7),
        "etiqueta": ParagraphStyle("etiqueta", parent=base, fontName=SERIF_NEGRITA, fontSize=8.5, leading=11, textColor=COLOR_ACENTO, spaceAfter=4),
        "titulo": ParagraphStyle("titulo", parent=base, fontName=SERIF_NEGRITA, fontSize=22, leading=27, textColor=COLOR_TITULO, spaceAfter=6),
        "meta": ParagraphStyle("meta", parent=base, fontSize=9, leading=13, textColor=COLOR_SUAVE, spaceAfter=10),
        "h1": ParagraphStyle("h1", parent=base, fontName=SERIF_NEGRITA, fontSize=14.5, leading=19, textColor=COLOR_TITULO, spaceBefore=14, spaceAfter=7, keepWithNext=1),
        "h2": ParagraphStyle("h2", parent=base, fontName=SERIF_NEGRITA, fontSize=11.5, leading=16, textColor=COLOR_ACENTO, spaceBefore=8, spaceAfter=4, keepWithNext=1),
        "destacado": ParagraphStyle("destacado", parent=base, fontSize=11.5, leading=17.5, textColor=COLOR_TITULO),
        "formula": ParagraphStyle("formula", parent=base, fontName=MONO, fontSize=10, leading=14, textColor=COLOR_TITULO),
        "celda": ParagraphStyle("celda", parent=base, fontSize=9.5, leading=13.5),
        "celda_compacta": ParagraphStyle("celda_compacta", parent=base, fontSize=8.5, leading=12),
        "celda_cabecera": ParagraphStyle("celda_cabecera", parent=base, fontName=SERIF_NEGRITA, fontSize=9.5, leading=13, textColor=colors.white),
        "pie_tabla": ParagraphStyle("pie_tabla", parent=base, fontName=SERIF_CURSIVA, fontSize=9, leading=12.5, textColor=COLOR_SUAVE, spaceBefore=4, spaceAfter=3),
        "nota": ParagraphStyle("nota", parent=base, fontSize=9.5, leading=14, textColor=COLOR_SUAVE),
    }


# --- Utilidades de texto ------------------------------------------------------


def _texto(valor: str) -> str:
    """Escapa el texto para ReportLab y conserva los saltos de línea simples."""
    return escape(valor.strip()).replace("\n", "<br/>")


def _parrafos(valor: str, estilo: ParagraphStyle) -> list:
    return [Paragraph(_texto(bloque), estilo) for bloque in valor.replace("\r\n", "\n").split("\n\n") if bloque.strip()]


def _lista(elementos: list[str], estilos: dict[str, ParagraphStyle], *, numerada: bool) -> ListFlowable:
    items = [ListItem(Paragraph(_texto(e), estilos["cuerpo"]), leftIndent=18) for e in elementos]
    if numerada:
        return ListFlowable(items, bulletType="1", bulletFormat="%s.", bulletFontName=SERIF_NEGRITA, bulletColor=COLOR_ACENTO, leftIndent=18)
    return ListFlowable(items, bulletType="bullet", start="•", bulletFontName=SERIF, bulletColor=COLOR_ACENTO, leftIndent=18)


def _recuadro(contenido: list, *, fondo=COLOR_FONDO_SUAVE, borde=COLOR_ACENTO) -> Table:
    tabla = Table([[contenido]], colWidths=[ANCHO_UTIL])
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), fondo),
        ("LINEBEFORE", (0, 0), (0, -1), 3, borde),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return tabla


def _tabla_datos(encabezados: list[str], filas: list[list[str]], estilos: dict[str, ParagraphStyle], anchos: list[float] | None = None) -> Table:
    """Tabla con celdas que se ajustan al ancho, cabecera repetida en cada página y filas que no se parten."""
    compacta = len(encabezados) > 4
    estilo_celda = estilos["celda_compacta" if compacta else "celda"]
    datos = [[Paragraph(_texto(e), estilos["celda_cabecera"]) for e in encabezados]]
    datos += [[Paragraph(_texto(c), estilo_celda) for c in fila] for fila in filas]
    columnas = len(encabezados)
    tabla = Table(datos, colWidths=anchos or [ANCHO_UTIL / columnas] * columnas, repeatRows=1, splitByRow=1)
    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), COLOR_TITULO),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, COLOR_FONDO_SUAVE]),
        ("GRID", (0, 0), (-1, -1), 0.5, COLOR_LINEA),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return tabla


# --- Encabezado y pie de página ----------------------------------------------


class _LienzoNumerado(Canvas):
    """Canvas que conoce el total de páginas para escribir «Página X de Y»."""

    def __init__(self, *args, titulo_corto: str = "", **kwargs):
        super().__init__(*args, **kwargs)
        self._titulo_corto = titulo_corto
        self._estados: list[dict] = []

    def showPage(self):
        self._estados.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._estados)
        for estado in self._estados:
            self.__dict__.update(estado)
            self._decorar(total)
            super().showPage()
        super().save()

    def _decorar(self, total: int) -> None:
        self.saveState()
        self.setStrokeColor(COLOR_LINEA)
        self.setLineWidth(0.5)
        self.line(MARGEN, A4[1] - MARGEN + 12, A4[0] - MARGEN, A4[1] - MARGEN + 12)
        self.setFont(SERIF, 8)
        self.setFillColor(COLOR_SUAVE)
        self.drawString(MARGEN, A4[1] - MARGEN + 18, self._titulo_corto[:90])
        self.line(MARGEN, MARGEN - 14, A4[0] - MARGEN, MARGEN - 14)
        self.drawString(MARGEN, MARGEN - 26, "Plataforma Estudio AI")
        self.drawRightString(A4[0] - MARGEN, MARGEN - 26, f"Página {self._pageNumber} de {total}")
        self.restoreState()


# --- Construcción de los documentos -----------------------------------------


def _portada(etiqueta: str, titulo_tema: str, minutos: int, origen: str, generado_en: str, estilos) -> list:
    fecha = _fecha_legible(generado_en)
    meta = f"{minutos} min de lectura  ·  {origen}" + (f"  ·  {fecha}" if fecha else "")
    return [
        Paragraph(escape(etiqueta.upper()), estilos["etiqueta"]),
        Paragraph(_texto(titulo_tema), estilos["titulo"]),
        Paragraph(escape(meta), estilos["meta"]),
        HRFlowable(width="100%", thickness=1.2, color=COLOR_ACENTO, spaceAfter=10),
    ]


def _fecha_legible(iso: str) -> str:
    try:
        fecha = datetime.fromisoformat(iso)
    except (TypeError, ValueError):
        fecha = datetime.now(timezone.utc)
    return fecha.strftime("%d/%m/%Y")


def _notas(notas: list[str], estilos) -> list:
    if not notas:
        return []
    return [
        Paragraph("Notas de fidelidad", estilos["h1"]),
        Paragraph("Elementos del material que no pudieron interpretarse con suficiente confianza:", estilos["nota"]),
        Spacer(1, 4),
        _lista(notas, estilos, numerada=False),
    ]


def _historia_esencial(resumen: ResumenEsencial, titulo_tema: str, origen: str, generado_en: str, estilos) -> list:
    historia = _portada("Resumen esencial", titulo_tema, resumen.minutos_lectura, origen, generado_en, estilos)

    historia.append(Paragraph("Idea central", estilos["h1"]))
    historia.append(_recuadro(_parrafos(resumen.idea_central, estilos["destacado"])))

    if resumen.ideas_clave:
        historia += [Paragraph("Ideas clave", estilos["h1"]), _lista(resumen.ideas_clave, estilos, numerada=True)]

    if resumen.conceptos_clave:
        historia.append(Paragraph("Conceptos fundamentales", estilos["h1"]))
        historia.append(_tabla_datos(
            ["Concepto", "Definición"],
            [[c.termino, c.definicion] for c in resumen.conceptos_clave],
            estilos,
            anchos=[ANCHO_UTIL * 0.30, ANCHO_UTIL * 0.70],
        ))

    if resumen.formulas_y_reglas:
        titulo_seccion = Paragraph("Fórmulas y reglas", estilos["h1"])
        for indice, formula in enumerate(resumen.formulas_y_reglas):
            bloque = [titulo_seccion] if indice == 0 else []  # el título nunca queda solo al final de una página
            if formula.nombre:
                bloque.append(Paragraph(_texto(formula.nombre), estilos["h2"]))
            bloque.append(_recuadro([Paragraph(_texto(formula.expresion), estilos["formula"])], borde=COLOR_LINEA))
            if formula.explicacion:
                bloque += [Spacer(1, 5), *_parrafos(formula.explicacion, estilos["cuerpo"])]
            historia.append(KeepTogether(bloque))
            historia.append(Spacer(1, 4))

    historia += _notas(resumen.notas_de_fidelidad, estilos)
    return historia


def _historia_general(resumen: ResumenGeneral, titulo_tema: str, origen: str, generado_en: str, estilos) -> list:
    historia = _portada("Resumen general", titulo_tema, resumen.minutos_lectura, origen, generado_en, estilos)

    if resumen.titulo and resumen.titulo.strip().lower() != titulo_tema.strip().lower():
        historia.append(Paragraph(_texto(resumen.titulo), estilos["h1"]))
    if resumen.introduccion:
        historia.append(Paragraph("Introducción", estilos["h1"]))
        historia += _parrafos(resumen.introduccion, estilos["cuerpo"])

    for seccion in resumen.secciones:
        historia.append(Paragraph(_texto(seccion.titulo), estilos["h1"]))
        historia += _parrafos(seccion.contenido, estilos["cuerpo"])
        if seccion.puntos:
            historia.append(_lista(seccion.puntos, estilos, numerada=False))
        if seccion.tabla:
            historia.append(Spacer(1, 6))
            if seccion.tabla.titulo:
                historia.append(Paragraph(_texto(seccion.tabla.titulo), estilos["h2"]))
            historia.append(_tabla_datos(seccion.tabla.encabezados, seccion.tabla.filas, estilos))
            historia.append(Spacer(1, 6))

    historia += _notas(resumen.notas_de_fidelidad, estilos)
    return historia


def _hay_contenido_esencial(resumen: ResumenEsencial | None) -> bool:
    return bool(resumen and (resumen.idea_central.strip() or resumen.ideas_clave or resumen.conceptos_clave))


def _hay_contenido_general(resumen: ResumenGeneral | None) -> bool:
    return bool(resumen and any(s.titulo.strip() and s.contenido.strip() for s in resumen.secciones))


def generar_pdf_esencial(resumen: ResumenEsencial, *, titulo_tema: str, origen: str, generado_en: str = "") -> bytes:
    if not _hay_contenido_esencial(resumen):
        raise ResumenVacio()
    estilos = _estilos_listos()
    return _construir(_historia_esencial(resumen, titulo_tema, origen, generado_en, estilos), f"{titulo_tema} · Resumen esencial", titulo_tema)


def generar_pdf_general(resumen: ResumenGeneral, *, titulo_tema: str, origen: str, generado_en: str = "") -> bytes:
    if not _hay_contenido_general(resumen):
        raise ResumenVacio()
    estilos = _estilos_listos()
    return _construir(_historia_general(resumen, titulo_tema, origen, generado_en, estilos), f"{titulo_tema} · Resumen general", titulo_tema)


def _estilos_listos() -> dict[str, ParagraphStyle]:
    _registrar_fuentes()
    return _estilos()


def _construir(historia: list, titulo_corto: str, titulo_documento: str) -> bytes:
    salida = BytesIO()
    documento = SimpleDocTemplate(
        salida,
        pagesize=A4,
        leftMargin=MARGEN,
        rightMargin=MARGEN,
        topMargin=MARGEN,
        bottomMargin=MARGEN,
        title=titulo_corto,
        author="Plataforma Estudio AI",
        subject=titulo_documento,
    )
    documento.build(historia, canvasmaker=lambda *a, **k: _LienzoNumerado(*a, titulo_corto=titulo_corto, **k))
    return salida.getvalue()
