"""Genera el PDF descargable de un mapa conceptual (MOD-05) con ReportLab.

Página 1 (horizontal): el mapa tal como lo dejó el estudiante (con sus ediciones),
dibujado por el frontend en PNG de alta resolución con la paleta clara elegida.
Página 2 (vertical): los conceptos con su descripción, organizados por jerarquía
y numerados (1, 1.1, 1.1.1…), sin frases de enlace. Si no caben, continúan en la
página siguiente. No llama a la IA: solo da formato a un mapa ya generado.

Reutiliza (solo lectura) las fuentes DejaVu de `resumenes/fuentes/` para conservar
tildes, símbolos y letras griegas.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.comun.errores import ErrorAplicacion

_DIRECTORIO_FUENTES = Path(__file__).resolve().parent.parent / "resumenes" / "fuentes"
SERIF, SERIF_NEGRITA, SERIF_CURSIVA = "DejaVuSerif", "DejaVuSerif-Bold", "DejaVuSerif-Italic"

MARGEN = 1.6 * cm
FIRMA_PNG = b"\x89PNG\r\n\x1a\n"
MESES = ("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre")


class ImagenMapaInvalida(ErrorAplicacion):
    codigo = "IMAGEN_MAPA_INVALIDA"
    estado_http = 422
    mensaje_predeterminado = "No pudimos preparar la imagen del mapa. Vuelve a intentarlo."


class MapaSinConceptos(ErrorAplicacion):
    codigo = "MAPA_SIN_CONCEPTOS"
    estado_http = 422
    mensaje_predeterminado = "El mapa no tiene conceptos para exportar."


@dataclass(frozen=True)
class PaletaPdf:
    """Variante clara de la paleta elegida por el estudiante (azul o morada), en hexadecimal."""

    solido: str
    tinte: str
    medio: str
    tinta: str
    texto: str
    texto_suave: str
    borde: str


@dataclass(frozen=True)
class ConceptoPdf:
    """Concepto en orden de lectura; `profundidad` 0 es el tema central."""

    etiqueta: str
    descripcion: str
    profundidad: int


@lru_cache(maxsize=1)
def _registrar_fuentes() -> None:
    for nombre in (SERIF, SERIF_NEGRITA, SERIF_CURSIVA):
        pdfmetrics.registerFont(TTFont(nombre, str(_DIRECTORIO_FUENTES / f"{nombre}.ttf")))
    pdfmetrics.registerFontFamily(SERIF, normal=SERIF, bold=SERIF_NEGRITA, italic=SERIF_CURSIVA, boldItalic=SERIF_NEGRITA)


def _texto(valor: str) -> str:
    return escape(valor.strip()).replace("\n", "<br/>")


def _fecha_legible(iso: str) -> str:
    try:
        fecha = datetime.fromisoformat(iso.replace("Z", "+00:00")) if iso else datetime.now(timezone.utc)
    except ValueError:
        fecha = datetime.now(timezone.utc)
    return f"{fecha.day} de {MESES[fecha.month - 1]} de {fecha.year}"


def _estilos(paleta: PaletaPdf) -> dict[str, ParagraphStyle]:
    texto = colors.HexColor(paleta.texto)
    suave = colors.HexColor(paleta.texto_suave)
    solido = colors.HexColor(paleta.solido)
    tinta = colors.HexColor(paleta.tinta)
    return {
        "etiqueta": ParagraphStyle("etiqueta", fontName=SERIF_NEGRITA, fontSize=8.5, leading=11, textColor=solido),
        "titulo": ParagraphStyle("titulo", fontName=SERIF_NEGRITA, fontSize=19, leading=23, textColor=texto, spaceBefore=2),
        "meta": ParagraphStyle("meta", fontName=SERIF, fontSize=9, leading=12, textColor=suave, spaceBefore=3),
        "intro": ParagraphStyle("intro", fontName=SERIF_CURSIVA, fontSize=9.5, leading=13, textColor=suave, spaceBefore=4),
        "raiz": ParagraphStyle("raiz", fontName=SERIF_NEGRITA, fontSize=14, leading=18, textColor=colors.white),
        "raiz_desc": ParagraphStyle("raiz_desc", fontName=SERIF, fontSize=9.5, leading=13.5, textColor=colors.white, spaceBefore=3),
        "rama": ParagraphStyle("rama", fontName=SERIF_NEGRITA, fontSize=11.5, leading=15, textColor=tinta),
        "rama_desc": ParagraphStyle("rama_desc", fontName=SERIF, fontSize=9.5, leading=13.5, textColor=texto, spaceBefore=2),
        "sub": ParagraphStyle("sub", fontName=SERIF_NEGRITA, fontSize=10, leading=13.5, textColor=texto),
        "sub_desc": ParagraphStyle("sub_desc", fontName=SERIF, fontSize=9, leading=12.8, textColor=suave, spaceBefore=1),
    }


def _validar_png(imagen_png: bytes) -> ImageReader:
    if not imagen_png.startswith(FIRMA_PNG):
        raise ImagenMapaInvalida(detalle="la imagen recibida no es un PNG")
    try:
        lector = ImageReader(BytesIO(imagen_png))
        ancho, alto = lector.getSize()
    except Exception as error:  # noqa: BLE001 — cualquier fallo al leer la imagen es una imagen inválida
        raise ImagenMapaInvalida(detalle=f"PNG ilegible: {error}") from error
    if ancho <= 0 or alto <= 0:
        raise ImagenMapaInvalida(detalle="PNG sin dimensiones")
    return lector


def _numeracion(conceptos: list[ConceptoPdf]) -> list[str]:
    """Numera en jerarquía (1, 1.1, 1.1.1…); el tema central (profundidad 0) no lleva número."""
    contadores: list[int] = []
    salida = []
    for concepto in conceptos:
        nivel = max(concepto.profundidad, 0)
        if nivel == 0:
            contadores = []
            salida.append("")
            continue
        del contadores[nivel:]
        while len(contadores) < nivel:
            contadores.append(0)
        contadores[nivel - 1] += 1
        salida.append(".".join(str(c) for c in contadores))
    return salida


def _bloque_raiz(concepto: ConceptoPdf, ancho: float, estilos, paleta: PaletaPdf) -> Table:
    contenido = [Paragraph(_texto(concepto.etiqueta), estilos["raiz"])]
    if concepto.descripcion.strip():
        contenido.append(Paragraph(_texto(concepto.descripcion), estilos["raiz_desc"]))
    tabla = Table([[contenido]], colWidths=[ancho])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor(paleta.solido)),
                ("ROUNDEDCORNERS", [8, 8, 8, 8]),
                ("LEFTPADDING", (0, 0), (-1, -1), 14),
                ("RIGHTPADDING", (0, 0), (-1, -1), 14),
                ("TOPPADDING", (0, 0), (-1, -1), 11),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
            ]
        )
    )
    return tabla


def _tarjeta_rama(filas: list[tuple[str, ConceptoPdf]], ancho: float, estilos, paleta: PaletaPdf) -> Table:
    """Una rama (concepto de primer nivel) con todos los conceptos que contiene, sangrados según su profundidad."""
    datos = []
    for indice, (numero, concepto) in enumerate(filas):
        es_cabecera = indice == 0 and concepto.profundidad <= 1
        sangria = 0 if es_cabecera else 14 * max(concepto.profundidad - 2, 0)
        nombre = f'<font color="{paleta.solido}">{numero}</font>&nbsp;&nbsp;{_texto(concepto.etiqueta)}' if numero else _texto(concepto.etiqueta)
        estilo_nombre = estilos["rama"] if es_cabecera else ParagraphStyle(f"sub{indice}", parent=estilos["sub"], leftIndent=sangria)
        celda = [Paragraph(nombre, estilo_nombre)]
        if concepto.descripcion.strip():
            estilo_desc = estilos["rama_desc"] if es_cabecera else ParagraphStyle(f"sub_desc{indice}", parent=estilos["sub_desc"], leftIndent=sangria)
            celda.append(Paragraph(_texto(concepto.descripcion), estilo_desc))
        datos.append([celda])

    tabla = Table(datos, colWidths=[ancho])
    estilo = [
        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor(paleta.medio)),
        ("LINEBEFORE", (0, 0), (0, -1), 3.5, colors.HexColor(paleta.solido)),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor(paleta.tinte)),
        ("LEFTPADDING", (0, 0), (-1, -1), 13),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    if len(datos) > 1:
        estilo.append(("LINEBELOW", (0, 1), (-1, -2), 0.4, colors.HexColor(paleta.borde)))
        estilo.append(("TOPPADDING", (0, 1), (-1, 1), 9))
    tabla.setStyle(TableStyle(estilo))
    return tabla


def _historia_conceptos(conceptos: list[ConceptoPdf], ancho: float, estilos, paleta: PaletaPdf) -> list:
    historia: list = [
        Paragraph("CONCEPTOS Y DESCRIPCIONES", estilos["etiqueta"]),
        Paragraph("Conceptos del mapa", estilos["titulo"]),
        Paragraph("Ordenados de lo general a lo particular: cada concepto aparece dentro del concepto que lo contiene.", estilos["intro"]),
        Spacer(1, 12),
    ]
    numeros = _numeracion(conceptos)
    rama: list[tuple[str, ConceptoPdf]] = []

    def cerrar_rama():
        if rama:
            tarjeta = _tarjeta_rama(list(rama), ancho, estilos, paleta)
            # Las ramas cortas no se parten entre páginas; las largas sí (fila a fila).
            historia.append(KeepTogether([tarjeta]) if len(rama) <= 6 else tarjeta)
            historia.append(Spacer(1, 9))
            rama.clear()

    for numero, concepto in zip(numeros, conceptos):
        if concepto.profundidad <= 0:
            cerrar_rama()
            historia.append(_bloque_raiz(concepto, ancho, estilos, paleta))
            historia.append(Spacer(1, 12))
        elif concepto.profundidad == 1:
            cerrar_rama()
            rama.append((numero, concepto))
        else:
            rama.append((numero, concepto))
    cerrar_rama()
    return historia


def generar_pdf_mapa(
    *,
    titulo: str,
    origen: str,
    imagen_png: bytes,
    conceptos: list[ConceptoPdf],
    paleta: PaletaPdf,
    generado_en: str = "",
) -> bytes:
    """Construye el PDF (mapa + conceptos) y devuelve sus bytes."""
    if not conceptos:
        raise MapaSinConceptos()
    lector = _validar_png(imagen_png)
    _registrar_fuentes()
    estilos = _estilos(paleta)
    titulo_limpio = titulo.strip() or "Mapa conceptual"

    pagina_mapa = landscape(A4)
    pagina_conceptos = A4
    ancho_mapa, alto_mapa = pagina_mapa[0] - 2 * MARGEN, pagina_mapa[1] - 2 * MARGEN
    ancho_conceptos = pagina_conceptos[0] - 2 * MARGEN

    def pie(lienzo, documento):
        lienzo.saveState()
        ancho_pagina = lienzo._pagesize[0]
        lienzo.setFont(SERIF, 8)
        lienzo.setFillColor(colors.HexColor(paleta.texto_suave))
        lienzo.drawString(MARGEN, MARGEN * 0.5, f"{titulo_limpio} · Mapa conceptual"[:110])
        lienzo.drawRightString(ancho_pagina - MARGEN, MARGEN * 0.5, f"Página {documento.page}")
        lienzo.setStrokeColor(colors.HexColor(paleta.borde))
        lienzo.setLineWidth(0.5)
        lienzo.line(MARGEN, MARGEN * 0.5 + 10, ancho_pagina - MARGEN, MARGEN * 0.5 + 10)
        lienzo.restoreState()

    salida = BytesIO()
    documento = BaseDocTemplate(
        salida,
        pagesize=pagina_mapa,
        title=f"{titulo_limpio} · Mapa conceptual",
        author="Plataforma Estudio AI",
        subject=titulo_limpio,
    )
    documento.addPageTemplates(
        [
            PageTemplate(id="mapa", pagesize=pagina_mapa, frames=[Frame(MARGEN, MARGEN, ancho_mapa, alto_mapa, id="f_mapa", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=pie),
            PageTemplate(
                id="conceptos",
                pagesize=pagina_conceptos,
                frames=[Frame(MARGEN, MARGEN, ancho_conceptos, pagina_conceptos[1] - 2 * MARGEN, id="f_conceptos", leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)],
                onPage=pie,
            ),
        ]
    )

    origen_legible = "Mapa de ejemplo" if origen == "ejemplo" else "Generado con IA"
    total = len(conceptos)
    encabezado = [
        Paragraph("MAPA CONCEPTUAL", estilos["etiqueta"]),
        Paragraph(_texto(titulo_limpio), estilos["titulo"]),
        Paragraph(f"{origen_legible} · {total} concepto{'s' if total != 1 else ''} · {_fecha_legible(generado_en)}", estilos["meta"]),
        Spacer(1, 10),
    ]
    alto_encabezado = sum(f.wrap(ancho_mapa, alto_mapa)[1] for f in encabezado)

    # La imagen ocupa todo el espacio libre de la página sin deformarse.
    ancho_png, alto_png = lector.getSize()
    escala = min(ancho_mapa / ancho_png, (alto_mapa - alto_encabezado - 6) / alto_png)
    imagen = Image(BytesIO(imagen_png), width=ancho_png * escala, height=alto_png * escala)
    imagen.hAlign = "CENTER"

    historia = [*encabezado, imagen, NextPageTemplate("conceptos"), PageBreak()]
    historia += _historia_conceptos(conceptos, ancho_conceptos, estilos, paleta)
    documento.build(historia)
    return salida.getvalue()
