from datetime import datetime
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor, Twips
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen.canvas import Canvas
from reportlab.platypus import KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.preguntas.esquemas import SolicitudExportarPreguntas

MARCA = "Plataforma Estudio AI"
DIRECTORIO_FUENTES = Path(__file__).resolve().parents[1] / "resumenes" / "fuentes"
SANS, SANS_NEGRITA, MONO = "DejaVuSans", "DejaVuSans-Bold", "DejaVuSansMono"

TINTA = "17163A"
PRIMARIO = "5558E8"
PRIMARIO_CLARO = "A9ABFF"
PRIMARIO_SUAVE = "EEF0FF"
TEXTO = "1E1D3A"
GRIS = "6B6A8A"
LINEA = "DDDFF0"
FONDO_OPCION = "F6F7FD"
VERDE = "12A06A"
VERDE_SUAVE = "E7F7F0"
AMBAR = "B7791F"
ROJO = "D64545"

DIFICULTADES = {
    "facil": ("Fácil", VERDE),
    "media": ("Media", AMBAR),
    "dificil": ("Difícil", ROJO),
}

NOMBRES_CANTIDAD = {
    "facil": ("fácil", "fáciles"),
    "media": ("media", "medias"),
    "dificil": ("difícil", "difíciles"),
}

MARGEN_X = 1.9 * cm
MARGEN_SUPERIOR = 2.3 * cm
MARGEN_INFERIOR = 2.1 * cm
ANCHO_UTIL = A4[0] - 2 * MARGEN_X
ALTO_BANNER_MINIMO = 4.2 * cm
ANCHO_TITULO_BANNER = A4[0] - 2 * MARGEN_X - 1.5 * cm


def _color(hexadecimal: str) -> colors.Color:
    return colors.HexColor(f"#{hexadecimal}")


def _letras(opciones: list) -> list[str]:
    ids = {o.id.lower() for o in opciones}
    if len(opciones) == 2 and ids == {"v", "f"}:
        return [o.id.upper() for o in opciones]
    return [chr(65 + i) for i in range(len(opciones))]


def _respuesta(pregunta) -> tuple[str, str]:
    letras = _letras(pregunta.opciones)
    for letra, opcion in zip(letras, pregunta.opciones):
        if opcion.id == pregunta.correcta:
            return letra, opcion.texto
    return "", pregunta.respuesta_texto


def _conteo(solicitud: SolicitudExportarPreguntas) -> str:
    total = len(solicitud.preguntas)
    partes = [f"{total} {'pregunta' if total == 1 else 'preguntas'}"]
    for clave, (singular, plural) in NOMBRES_CANTIDAD.items():
        cantidad = sum(1 for p in solicitud.preguntas if p.dificultad == clave)
        if cantidad:
            partes.append(f"{cantidad} {singular if cantidad == 1 else plural}")
    return "  ·  ".join(partes)


def _fecha() -> str:
    return datetime.now().strftime("%d/%m/%Y")


@lru_cache(maxsize=1)
def _registrar_fuentes() -> None:
    for nombre in (SANS, SANS_NEGRITA, MONO):
        pdfmetrics.registerFont(TTFont(nombre, str(DIRECTORIO_FUENTES / f"{nombre}.ttf")))
    pdfmetrics.registerFontFamily(SANS, normal=SANS, bold=SANS_NEGRITA, italic=SANS, boldItalic=SANS_NEGRITA)


def _estilos() -> dict[str, ParagraphStyle]:
    base = ParagraphStyle("base", fontName=SANS, fontSize=9.6, leading=14, textColor=_color(TEXTO), alignment=TA_LEFT)
    return {
        "base": base,
        "enunciado": ParagraphStyle("enunciado", parent=base, fontName=SANS_NEGRITA, fontSize=10.8, leading=15.5, spaceAfter=0),
        "numero": ParagraphStyle("numero", parent=base, fontName=SANS_NEGRITA, fontSize=8, leading=10, textColor=_color(PRIMARIO)),
        "dificultad": ParagraphStyle("dificultad", parent=base, fontName=SANS_NEGRITA, fontSize=7.8, leading=10, alignment=TA_RIGHT),
        "letra": ParagraphStyle("letra", parent=base, fontName=SANS_NEGRITA, fontSize=9.4, leading=12, alignment=TA_CENTER, textColor=_color(PRIMARIO)),
        "letra_ok": ParagraphStyle("letra_ok", parent=base, fontName=SANS_NEGRITA, fontSize=9.4, leading=12, alignment=TA_CENTER, textColor=colors.white),
        "opcion": ParagraphStyle("opcion", parent=base, fontSize=9.6, leading=13.5),
        "opcion_ok": ParagraphStyle("opcion_ok", parent=base, fontName=SANS_NEGRITA, fontSize=9.6, leading=13.5, textColor=_color("0B6B47")),
        "marca_ok": ParagraphStyle("marca_ok", parent=base, fontName=SANS_NEGRITA, fontSize=11, leading=13, alignment=TA_CENTER, textColor=_color(VERDE)),
        "etiqueta": ParagraphStyle("etiqueta", parent=base, fontName=SANS_NEGRITA, fontSize=7.4, leading=10, textColor=_color(PRIMARIO), spaceAfter=2),
        "explicacion": ParagraphStyle("explicacion", parent=base, fontSize=9.2, leading=13.6, textColor=_color("3A3960")),
        "titulo_seccion": ParagraphStyle("titulo_seccion", parent=base, fontName=SANS_NEGRITA, fontSize=19, leading=24, textColor=_color(TINTA), spaceAfter=3),
        "subtitulo_seccion": ParagraphStyle("subtitulo_seccion", parent=base, fontSize=9.4, leading=14, textColor=_color(GRIS), spaceAfter=12),
        "cabecera_tabla": ParagraphStyle("cabecera_tabla", parent=base, fontName=SANS_NEGRITA, fontSize=8.4, leading=11, textColor=colors.white),
        "celda": ParagraphStyle("celda", parent=base, fontSize=9, leading=13),
        "celda_negrita": ParagraphStyle("celda_negrita", parent=base, fontName=SANS_NEGRITA, fontSize=9, leading=13, textColor=_color(TINTA)),
        "clave": ParagraphStyle("clave", parent=base, fontName=SANS_NEGRITA, fontSize=8.6, leading=11, alignment=TA_CENTER, textColor=_color(TINTA)),
        "subtitulo_clave": ParagraphStyle("subtitulo_clave", parent=base, fontName=SANS_NEGRITA, fontSize=7.8, leading=10, textColor=_color(GRIS), spaceBefore=2, spaceAfter=6),
    }


def _texto(valor: str) -> str:
    return escape(valor.strip()).replace("\n", "<br/>")


def _bloques_banner(titulo: str, conteo: str, fecha: str) -> tuple[list[tuple[Paragraph, float, float]], float]:
    etiqueta = Paragraph("BANCO DE PREGUNTAS", ParagraphStyle("e", fontName=SANS_NEGRITA, fontSize=8.4, leading=11, textColor=_color(PRIMARIO_CLARO)))
    principal = Paragraph(_texto(titulo), ParagraphStyle("t", fontName=SANS_NEGRITA, fontSize=22, leading=27, textColor=colors.white))
    if principal.wrap(ANCHO_TITULO_BANNER, A4[1])[1] > 2 * 27:
        principal = Paragraph(_texto(titulo), ParagraphStyle("t", fontName=SANS_NEGRITA, fontSize=17, leading=22, textColor=colors.white))
    meta = Paragraph(escape(f"{conteo}   ·   {fecha}"), ParagraphStyle("m", fontName=SANS, fontSize=9, leading=13, textColor=_color("C9CBF5")))
    bloques = []
    total = 1.5 * cm
    for parrafo, separacion in ((etiqueta, 0.15 * cm), (principal, 0.3 * cm), (meta, 0)):
        _, alto = parrafo.wrap(ANCHO_TITULO_BANNER, A4[1])
        bloques.append((parrafo, alto, separacion))
        total += alto + separacion
    return bloques, max(ALTO_BANNER_MINIMO, total + 0.8 * cm)


class _Lienzo(Canvas):
    def __init__(self, *args, titulo: str = "", conteo: str = "", fecha: str = "", **kwargs):
        super().__init__(*args, **kwargs)
        self._titulo = titulo
        self._bloques, self._alto_banner = _bloques_banner(titulo, conteo, fecha)
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
        ancho, alto = A4
        self.saveState()
        if self._pageNumber == 1:
            self._banner(ancho, alto)
        else:
            self.setFillColor(_color(PRIMARIO))
            self.rect(0, alto - 0.35 * cm, ancho, 0.35 * cm, stroke=0, fill=1)
            self.setFont(SANS_NEGRITA, 7.6)
            self.setFillColor(_color(GRIS))
            self.drawString(MARGEN_X, alto - 1.35 * cm, "BANCO DE PREGUNTAS")
            self.setFont(SANS, 7.6)
            self.drawRightString(ancho - MARGEN_X, alto - 1.35 * cm, self._titulo[:80])
            self.setStrokeColor(_color(LINEA))
            self.setLineWidth(0.6)
            self.line(MARGEN_X, alto - 1.6 * cm, ancho - MARGEN_X, alto - 1.6 * cm)
        self.setStrokeColor(_color(LINEA))
        self.setLineWidth(0.6)
        self.line(MARGEN_X, MARGEN_INFERIOR - 0.45 * cm, ancho - MARGEN_X, MARGEN_INFERIOR - 0.45 * cm)
        self.setFont(SANS_NEGRITA, 7.6)
        self.setFillColor(_color(PRIMARIO))
        self.drawString(MARGEN_X, MARGEN_INFERIOR - 0.95 * cm, MARCA)
        self.setFont(SANS, 7.6)
        self.setFillColor(_color(GRIS))
        self.drawRightString(ancho - MARGEN_X, MARGEN_INFERIOR - 0.95 * cm, f"Página {self._pageNumber} de {total}")
        self.restoreState()

    def _banner(self, ancho: float, alto: float) -> None:
        base = alto - self._alto_banner
        self.setFillColor(_color(TINTA))
        self.rect(0, base, ancho, self._alto_banner, stroke=0, fill=1)
        self.saveState()
        recorte = self.beginPath()
        recorte.rect(0, base, ancho, self._alto_banner)
        self.clipPath(recorte, stroke=0, fill=0)
        self.setFillColor(_color("2A2A6B"))
        self.circle(ancho - 1.2 * cm, alto - 0.6 * cm, 4.6 * cm, stroke=0, fill=1)
        self.setFillColor(_color("3A3BA8"))
        self.circle(ancho - 0.2 * cm, base + 0.2 * cm, 2.4 * cm, stroke=0, fill=1)
        self.restoreState()
        self.setFillColor(_color(PRIMARIO))
        self.rect(0, base, ancho, 0.16 * cm, stroke=0, fill=1)
        y = alto - 1.5 * cm
        for parrafo, altura, separacion in self._bloques:
            y -= altura
            parrafo.drawOn(self, MARGEN_X, y)
            y -= separacion


def _tabla_redondeada(datos, anchos, estilo: list, radio: float = 7) -> Table:
    tabla = Table(datos, colWidths=anchos)
    tabla.setStyle(TableStyle([("ROUNDEDCORNERS", [radio] * 4), *estilo]))
    return tabla


def _opcion_pdf(letra: str, texto: str, correcta: bool, estilos, ancho: float) -> Table:
    if correcta:
        fila = [[Paragraph(letra, estilos["letra_ok"]), Paragraph(_texto(texto), estilos["opcion_ok"]), Paragraph("✓", estilos["marca_ok"])]]
        anchos = [0.95 * cm, ancho - 0.95 * cm - 0.95 * cm, 0.95 * cm]
        estilo = [
            ("BACKGROUND", (0, 0), (-1, -1), _color(VERDE_SUAVE)),
            ("BACKGROUND", (0, 0), (0, 0), _color(VERDE)),
            ("BOX", (0, 0), (-1, -1), 0.9, _color(VERDE)),
        ]
    else:
        fila = [[Paragraph(letra, estilos["letra"]), Paragraph(_texto(texto), estilos["opcion"])]]
        anchos = [0.95 * cm, ancho - 0.95 * cm]
        estilo = [
            ("BACKGROUND", (0, 0), (-1, -1), _color(FONDO_OPCION)),
            ("BACKGROUND", (0, 0), (0, 0), _color(PRIMARIO_SUAVE)),
            ("BOX", (0, 0), (-1, -1), 0.7, _color(LINEA)),
        ]
    estilo += [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (0, 0), 0),
        ("RIGHTPADDING", (0, 0), (0, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 9),
        ("RIGHTPADDING", (1, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    return _tabla_redondeada(fila, anchos, estilo, 6)


def _tarjeta_pdf(numero: int, pregunta, con_respuesta: bool, estilos) -> KeepTogether:
    interior = ANCHO_UTIL - 0.9 * cm
    nombre, tono = DIFICULTADES[pregunta.dificultad]
    cabecera = Table(
        [[Paragraph(f"PREGUNTA {numero}", estilos["numero"]), Paragraph(f'<font color="#{tono}">●</font>  <font color="#{tono}">{nombre.upper()}</font>', estilos["dificultad"])]],
        colWidths=[interior * 0.6, interior * 0.4],
    )
    cabecera.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    contenido: list = [cabecera, Spacer(1, 7), Paragraph(_texto(pregunta.enunciado), estilos["enunciado"]), Spacer(1, 9)]
    letras = _letras(pregunta.opciones)
    for letra, opcion in zip(letras, pregunta.opciones):
        contenido += [_opcion_pdf(letra, opcion.texto, con_respuesta and opcion.id == pregunta.correcta, estilos, interior), Spacer(1, 4)]
    if not pregunta.opciones and con_respuesta and pregunta.respuesta_texto:
        contenido.append(_bloque_explicacion("RESPUESTA", pregunta.respuesta_texto, estilos, interior))
        contenido.append(Spacer(1, 4))
    if con_respuesta and pregunta.explicacion.strip():
        contenido += [Spacer(1, 3), _bloque_explicacion("EXPLICACIÓN", pregunta.explicacion, estilos, interior)]
    tarjeta = Table([[contenido]], colWidths=[ANCHO_UTIL])
    tarjeta.setStyle(
        TableStyle(
            [
                ("ROUNDEDCORNERS", [10, 10, 10, 10]),
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.9, _color(LINEA)),
                ("LEFTPADDING", (0, 0), (-1, -1), 0.45 * cm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0.45 * cm),
                ("TOPPADDING", (0, 0), (-1, -1), 0.35 * cm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0.2 * cm),
            ]
        )
    )
    return KeepTogether([tarjeta, Spacer(1, 0.45 * cm)])


def _bloque_explicacion(etiqueta: str, texto: str, estilos, ancho: float) -> Table:
    celda = [Paragraph(etiqueta, estilos["etiqueta"]), Paragraph(_texto(texto), estilos["explicacion"])]
    tabla = Table([[celda]], colWidths=[ancho])
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), _color(PRIMARIO_SUAVE)),
                ("LINEBEFORE", (0, 0), (0, -1), 3, _color(PRIMARIO)),
                ("LEFTPADDING", (0, 0), (-1, -1), 11),
                ("RIGHTPADDING", (0, 0), (-1, -1), 11),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    return tabla


def _hoja_respuestas_pdf(solicitud: SolicitudExportarPreguntas, estilos) -> list:
    historia: list = [
        PageBreak(),
        Paragraph("Hoja de respuestas", estilos["titulo_seccion"]),
        Paragraph("Todas las respuestas con su explicación, en el mismo orden de las preguntas.", estilos["subtitulo_seccion"]),
        Paragraph("CLAVE RÁPIDA", estilos["subtitulo_clave"]),
    ]
    celdas = [Paragraph(f'{i}<font color="#{PRIMARIO}">  ›  </font>{_respuesta(p)[0] or "—"}', estilos["clave"]) for i, p in enumerate(solicitud.preguntas, 1)]
    columnas = 6
    while len(celdas) % columnas:
        celdas.append(Paragraph("", estilos["clave"]))
    filas = [celdas[i : i + columnas] for i in range(0, len(celdas), columnas)]
    clave = Table(filas, colWidths=[ANCHO_UTIL / columnas] * columnas)
    clave.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.6, _color(LINEA)),
                ("BACKGROUND", (0, 0), (-1, -1), _color(FONDO_OPCION)),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    historia += [clave, Spacer(1, 0.7 * cm), Paragraph("DETALLE", estilos["subtitulo_clave"])]
    cabecera = [Paragraph(t, estilos["cabecera_tabla"]) for t in ("PREGUNTA", "RESPUESTA", "EXPLICACIÓN")]
    datos = [cabecera]
    for i, p in enumerate(solicitud.preguntas, 1):
        letra, texto = _respuesta(p)
        respuesta = f"<b>{letra}</b>  {_texto(texto)}" if letra else _texto(texto)
        datos.append([Paragraph(f"Pregunta {i}", estilos["celda_negrita"]), Paragraph(respuesta, estilos["celda"]), Paragraph(_texto(p.explicacion), estilos["celda"])])
    anchos = [3.1 * cm, 5.2 * cm, ANCHO_UTIL - 8.3 * cm]
    tabla = Table(datos, colWidths=anchos, repeatRows=1, splitByRow=1)
    tabla.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), _color(TINTA)),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, _color(FONDO_OPCION)]),
                ("LINEBELOW", (0, 1), (-1, -1), 0.5, _color(LINEA)),
                ("BOX", (0, 0), (-1, -1), 0.7, _color(LINEA)),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    historia.append(tabla)
    return historia


def generar_pdf(solicitud: SolicitudExportarPreguntas) -> bytes:
    _registrar_fuentes()
    estilos = _estilos()
    junto = solicitud.respuestas == "junto"
    conteo = _conteo(solicitud)
    fecha = _fecha()
    _, alto_banner = _bloques_banner(solicitud.titulo_tema, conteo, fecha)
    historia: list = [Spacer(1, alto_banner - MARGEN_SUPERIOR + 0.5 * cm)]
    for numero, pregunta in enumerate(solicitud.preguntas, 1):
        historia.append(_tarjeta_pdf(numero, pregunta, junto, estilos))
    if not junto:
        historia += _hoja_respuestas_pdf(solicitud, estilos)
    salida = BytesIO()
    documento = SimpleDocTemplate(
        salida,
        pagesize=A4,
        leftMargin=MARGEN_X,
        rightMargin=MARGEN_X,
        topMargin=MARGEN_SUPERIOR,
        bottomMargin=MARGEN_INFERIOR,
        title=f"{solicitud.titulo_tema} · Banco de preguntas",
        author=MARCA,
        subject=solicitud.titulo_tema,
    )
    documento.build(historia, canvasmaker=lambda *a, **k: _Lienzo(*a, titulo=solicitud.titulo_tema, conteo=conteo, fecha=fecha, **k))
    return salida.getvalue()


def _rgb(hexadecimal: str) -> RGBColor:
    return RGBColor.from_string(hexadecimal)


def _sombrear(celda, hexadecimal: str) -> None:
    propiedades = celda._tc.get_or_add_tcPr()
    for previo in propiedades.findall(qn("w:shd")):
        propiedades.remove(previo)
    sombra = OxmlElement("w:shd")
    sombra.set(qn("w:val"), "clear")
    sombra.set(qn("w:color"), "auto")
    sombra.set(qn("w:fill"), hexadecimal)
    propiedades.append(sombra)


def _bordes_celda(celda, **lados: tuple[str, int, str]) -> None:
    propiedades = celda._tc.get_or_add_tcPr()
    bordes = propiedades.find(qn("w:tcBorders"))
    if bordes is None:
        bordes = OxmlElement("w:tcBorders")
        propiedades.append(bordes)
    for lado in ("top", "left", "bottom", "right"):
        valor, grosor, color = lados.get(lado, ("nil", 0, "auto"))
        borde = OxmlElement(f"w:{lado}")
        borde.set(qn("w:val"), valor)
        borde.set(qn("w:sz"), str(grosor))
        borde.set(qn("w:space"), "0")
        borde.set(qn("w:color"), color)
        bordes.append(borde)


def _margenes_celda(celda, superior=0, inferior=0, izquierdo=0, derecho=0) -> None:
    propiedades = celda._tc.get_or_add_tcPr()
    margenes = OxmlElement("w:tcMar")
    for lado, valor in (("top", superior), ("left", izquierdo), ("bottom", inferior), ("right", derecho)):
        nodo = OxmlElement(f"w:{lado}")
        nodo.set(qn("w:w"), str(valor))
        nodo.set(qn("w:type"), "dxa")
        margenes.append(nodo)
    propiedades.append(margenes)


def _ancho_celda(celda, centimetros: float) -> None:
    celda.width = Cm(centimetros)


def _fijar_tabla(tabla, anchos: list[float]) -> None:
    tabla.autofit = False
    tabla.alignment = WD_TABLE_ALIGNMENT.CENTER
    propiedades = tabla._tbl.tblPr
    diseno = OxmlElement("w:tblLayout")
    diseno.set(qn("w:type"), "fixed")
    propiedades.append(diseno)
    for fila in tabla.rows:
        for celda, ancho in zip(fila.cells, anchos):
            _ancho_celda(celda, ancho)
    cuadricula = tabla._tbl.tblGrid
    for columna, ancho in zip(cuadricula.findall(qn("w:gridCol")), anchos):
        columna.set(qn("w:w"), str(int(ancho / 2.54 * 1440)))


def _no_partir(fila) -> None:
    propiedades = fila._tr.get_or_add_trPr()
    propiedades.append(OxmlElement("w:cantSplit"))


def _repetir_cabecera(fila) -> None:
    fila._tr.get_or_add_trPr().append(OxmlElement("w:tblHeader"))


def _espaciado(parrafo, antes=0, despues=0, interlineado: float | None = None, junto_al_siguiente=False) -> None:
    formato = parrafo.paragraph_format
    formato.space_before = Pt(antes)
    formato.space_after = Pt(despues)
    if interlineado:
        formato.line_spacing = interlineado
    formato.keep_with_next = junto_al_siguiente
    formato.keep_together = True


def _texto_docx(parrafo, texto: str, *, tamano=10, negrita=False, color=TEXTO, espaciado: float | None = None):
    corrida = parrafo.add_run(texto)
    corrida.font.name = "Calibri"
    corrida._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    corrida.font.size = Pt(tamano)
    corrida.font.bold = negrita
    corrida.font.color.rgb = _rgb(color)
    if espaciado:
        corrida._element.rPr.append(_nodo_espaciado(espaciado))
    return corrida


def _nodo_espaciado(puntos: float):
    nodo = OxmlElement("w:spacing")
    nodo.set(qn("w:val"), str(int(puntos * 20)))
    return nodo


def _campo(parrafo, instruccion: str, **formato) -> None:
    for tipo in ("begin", "instruccion", "separate", "resultado", "end"):
        corrida = _texto_docx(parrafo, "", **formato)
        if tipo in ("begin", "separate", "end"):
            nodo = OxmlElement("w:fldChar")
            nodo.set(qn("w:fldCharType"), tipo)
        elif tipo == "instruccion":
            nodo = OxmlElement("w:instrText")
            nodo.set(qn("xml:space"), "preserve")
            nodo.text = f" {instruccion} "
        else:
            nodo = OxmlElement("w:t")
            nodo.text = "1"
        corrida._element.append(nodo)


def _tabulador_derecho(parrafo, ancho) -> None:
    tabuladores = parrafo.paragraph_format.tab_stops
    for posicion in (Twips(4680), Twips(9360)):
        tabuladores.add_tab_stop(posicion, WD_TAB_ALIGNMENT.CLEAR)
    tabuladores.add_tab_stop(ancho, WD_TAB_ALIGNMENT.RIGHT)


def _pie_y_cabecera(documento, titulo: str) -> None:
    seccion = documento.sections[0]
    seccion.different_first_page_header_footer = True
    ancho = seccion.page_width - seccion.left_margin - seccion.right_margin
    cabecera = seccion.header.paragraphs[0]
    _tabulador_derecho(cabecera, ancho)
    _texto_docx(cabecera, "BANCO DE PREGUNTAS", tamano=7.5, negrita=True, color=GRIS, espaciado=1)
    _texto_docx(cabecera, "\t" + titulo[:80], tamano=7.5, color=GRIS)
    _borde_parrafo(cabecera, "bottom", LINEA, 6, 4)
    for pie in (seccion.footer, seccion.first_page_footer):
        parrafo = pie.paragraphs[0]
        _tabulador_derecho(parrafo, ancho)
        _borde_parrafo(parrafo, "top", LINEA, 6, 6)
        _texto_docx(parrafo, MARCA, tamano=7.5, negrita=True, color=PRIMARIO)
        _texto_docx(parrafo, "\tPágina ", tamano=7.5, color=GRIS)
        _campo(parrafo, "PAGE", tamano=7.5, color=GRIS)
        _texto_docx(parrafo, " de ", tamano=7.5, color=GRIS)
        _campo(parrafo, "NUMPAGES", tamano=7.5, color=GRIS)


def _borde_parrafo(parrafo, lado: str, color: str, grosor: int, espacio: int) -> None:
    propiedades = parrafo._p.get_or_add_pPr()
    bordes = propiedades.find(qn("w:pBdr"))
    if bordes is None:
        bordes = OxmlElement("w:pBdr")
        propiedades.append(bordes)
    borde = OxmlElement(f"w:{lado}")
    borde.set(qn("w:val"), "single")
    borde.set(qn("w:sz"), str(grosor))
    borde.set(qn("w:space"), str(espacio))
    borde.set(qn("w:color"), color)
    bordes.append(borde)


def _banner_docx(documento, solicitud: SolicitudExportarPreguntas) -> None:
    ancho = 17.2
    tabla = documento.add_table(rows=1, cols=1)
    _fijar_tabla(tabla, [ancho])
    celda = tabla.cell(0, 0)
    _sombrear(celda, TINTA)
    _bordes_celda(celda, left=("single", 48, PRIMARIO))
    _margenes_celda(celda, 340, 340, 440, 360)
    primero = celda.paragraphs[0]
    _espaciado(primero, 0, 4)
    _texto_docx(primero, "BANCO DE PREGUNTAS", tamano=8.5, negrita=True, color=PRIMARIO_CLARO, espaciado=2)
    titulo = celda.add_paragraph()
    _espaciado(titulo, 0, 8, 1.05)
    _texto_docx(titulo, solicitud.titulo_tema, tamano=24, negrita=True, color="FFFFFF")
    meta = celda.add_paragraph()
    _espaciado(meta, 0, 0)
    _texto_docx(meta, f"{_conteo(solicitud)}   ·   {_fecha()}", tamano=9.5, color="C9CBF5")
    _no_partir(tabla.rows[0])
    separador = documento.add_paragraph()
    _espaciado(separador, 0, 6)


def _tarjeta_docx(documento, numero: int, pregunta, con_respuesta: bool) -> None:
    nombre, tono = DIFICULTADES[pregunta.dificultad]
    seccion = documento.sections[0]
    ancho = seccion.page_width - seccion.left_margin - seccion.right_margin
    cabecera = documento.add_paragraph()
    _espaciado(cabecera, 10, 3, junto_al_siguiente=True)
    _tabulador_derecho(cabecera, ancho)
    _texto_docx(cabecera, f"PREGUNTA {numero}", tamano=8.5, negrita=True, color=PRIMARIO, espaciado=1.5)
    _texto_docx(cabecera, "\t● ", tamano=8.5, negrita=True, color=tono)
    _texto_docx(cabecera, nombre.upper(), tamano=8.5, negrita=True, color=tono, espaciado=1)
    _borde_parrafo(cabecera, "top", PRIMARIO_SUAVE, 12, 6)
    enunciado = documento.add_paragraph()
    _espaciado(enunciado, 0, 6, 1.1, junto_al_siguiente=True)
    _texto_docx(enunciado, pregunta.enunciado, tamano=12, negrita=True, color=TINTA)

    if pregunta.opciones:
        letras = _letras(pregunta.opciones)
        tabla = documento.add_table(rows=len(pregunta.opciones), cols=2)
        _fijar_tabla(tabla, [1.1, 16.1])
        for indice, (letra, opcion) in enumerate(zip(letras, pregunta.opciones)):
            correcta = con_respuesta and opcion.id == pregunta.correcta
            fila = tabla.rows[indice]
            _no_partir(fila)
            for celda in fila.cells:
                _bordes_celda(celda, top=("single", 24, "FFFFFF"), bottom=("single", 24, "FFFFFF"), left=("single", 24, "FFFFFF"), right=("single", 24, "FFFFFF"))
                _margenes_celda(celda, 90, 90, 140, 140)
            _sombrear(fila.cells[0], VERDE if correcta else PRIMARIO_SUAVE)
            _sombrear(fila.cells[1], VERDE_SUAVE if correcta else FONDO_OPCION)
            fila.cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            _texto_docx(fila.cells[0].paragraphs[0], letra, tamano=10.5, negrita=True, color="FFFFFF" if correcta else PRIMARIO)
            texto = fila.cells[1].paragraphs[0]
            _texto_docx(texto, opcion.texto, tamano=10.5, negrita=correcta, color="0B6B47" if correcta else TEXTO)
            if correcta:
                _texto_docx(texto, "   ✓", tamano=11, negrita=True, color=VERDE)
            for celda in fila.cells:
                _espaciado(celda.paragraphs[0], 0, 0, 1.1, junto_al_siguiente=indice < len(pregunta.opciones) - 1 or con_respuesta)
    if con_respuesta and (pregunta.explicacion.strip() or (not pregunta.opciones and pregunta.respuesta_texto)):
        espacio = documento.add_paragraph()
        _espaciado(espacio, 0, 2, junto_al_siguiente=True)
        bloques = []
        if not pregunta.opciones and pregunta.respuesta_texto:
            bloques.append(("RESPUESTA", pregunta.respuesta_texto))
        if pregunta.explicacion.strip():
            bloques.append(("EXPLICACIÓN", pregunta.explicacion))
        tabla = documento.add_table(rows=1, cols=1)
        _fijar_tabla(tabla, [17.2])
        celda = tabla.cell(0, 0)
        _sombrear(celda, PRIMARIO_SUAVE)
        _bordes_celda(celda, left=("single", 36, PRIMARIO))
        _margenes_celda(celda, 130, 130, 220, 200)
        _no_partir(tabla.rows[0])
        primera = True
        for etiqueta, contenido in bloques:
            titulo = celda.paragraphs[0] if primera else celda.add_paragraph()
            primera = False
            _espaciado(titulo, 0, 2, junto_al_siguiente=True)
            _texto_docx(titulo, etiqueta, tamano=8, negrita=True, color=PRIMARIO, espaciado=1.5)
            cuerpo = celda.add_paragraph()
            _espaciado(cuerpo, 0, 3, 1.15)
            _texto_docx(cuerpo, contenido, tamano=10, color="3A3960")
    cierre = documento.add_paragraph()
    _espaciado(cierre, 0, 4)


def _hoja_respuestas_docx(documento, solicitud: SolicitudExportarPreguntas) -> None:
    documento.add_page_break()
    titulo = documento.add_paragraph()
    _espaciado(titulo, 0, 2, junto_al_siguiente=True)
    _texto_docx(titulo, "Hoja de respuestas", tamano=22, negrita=True, color=TINTA)
    subtitulo = documento.add_paragraph()
    _espaciado(subtitulo, 0, 10, junto_al_siguiente=True)
    _texto_docx(subtitulo, "Todas las respuestas con su explicación, en el mismo orden de las preguntas.", tamano=10, color=GRIS)

    etiqueta = documento.add_paragraph()
    _espaciado(etiqueta, 0, 4, junto_al_siguiente=True)
    _texto_docx(etiqueta, "CLAVE RÁPIDA", tamano=8, negrita=True, color=GRIS, espaciado=1.5)
    columnas = 6
    total = len(solicitud.preguntas)
    filas = (total + columnas - 1) // columnas
    clave = documento.add_table(rows=filas, cols=columnas)
    _fijar_tabla(clave, [17.2 / columnas] * columnas)
    for indice in range(filas * columnas):
        celda = clave.cell(indice // columnas, indice % columnas)
        _sombrear(celda, FONDO_OPCION)
        _bordes_celda(celda, top=("single", 8, LINEA), bottom=("single", 8, LINEA), left=("single", 8, LINEA), right=("single", 8, LINEA))
        _margenes_celda(celda, 80, 80, 60, 60)
        parrafo = celda.paragraphs[0]
        parrafo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        _espaciado(parrafo, 0, 0)
        if indice < total:
            _texto_docx(parrafo, f"{indice + 1}", tamano=9.5, negrita=True, color=TINTA)
            _texto_docx(parrafo, "  ›  ", tamano=9.5, negrita=True, color=PRIMARIO)
            _texto_docx(parrafo, _respuesta(solicitud.preguntas[indice])[0] or "—", tamano=9.5, negrita=True, color=TINTA)
    for fila in clave.rows:
        _no_partir(fila)

    detalle = documento.add_paragraph()
    _espaciado(detalle, 14, 4, junto_al_siguiente=True)
    _texto_docx(detalle, "DETALLE", tamano=8, negrita=True, color=GRIS, espaciado=1.5)
    tabla = documento.add_table(rows=1 + total, cols=3)
    _fijar_tabla(tabla, [2.6, 5.4, 9.2])
    for celda, texto in zip(tabla.rows[0].cells, ("PREGUNTA", "RESPUESTA", "EXPLICACIÓN")):
        _sombrear(celda, TINTA)
        _margenes_celda(celda, 110, 110, 140, 140)
        _espaciado(celda.paragraphs[0], 0, 0)
        _texto_docx(celda.paragraphs[0], texto, tamano=8.5, negrita=True, color="FFFFFF", espaciado=1)
    _repetir_cabecera(tabla.rows[0])
    _no_partir(tabla.rows[0])
    for indice, pregunta in enumerate(solicitud.preguntas, 1):
        fila = tabla.rows[indice]
        _no_partir(fila)
        letra, texto = _respuesta(pregunta)
        for celda in fila.cells:
            _sombrear(celda, "FFFFFF" if indice % 2 else FONDO_OPCION)
            _bordes_celda(celda, bottom=("single", 6, LINEA))
            _margenes_celda(celda, 110, 110, 140, 140)
            _espaciado(celda.paragraphs[0], 0, 0, 1.12)
        _texto_docx(fila.cells[0].paragraphs[0], f"Pregunta {indice}", tamano=10, negrita=True, color=TINTA)
        if letra:
            _texto_docx(fila.cells[1].paragraphs[0], f"{letra}  ", tamano=10, negrita=True, color=VERDE)
        _texto_docx(fila.cells[1].paragraphs[0], texto, tamano=10, color=TEXTO)
        _texto_docx(fila.cells[2].paragraphs[0], pregunta.explicacion, tamano=10, color="3A3960")


def generar_docx(solicitud: SolicitudExportarPreguntas) -> bytes:
    documento = Document()
    seccion = documento.sections[0]
    seccion.page_width, seccion.page_height = Cm(21), Cm(29.7)
    seccion.left_margin = seccion.right_margin = Cm(1.9)
    seccion.top_margin, seccion.bottom_margin = Cm(2.0), Cm(1.9)
    seccion.header_distance = seccion.footer_distance = Cm(0.9)
    estilo = documento.styles["Normal"]
    estilo.font.name = "Calibri"
    estilo.font.size = Pt(10)
    estilo.element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    propiedades = documento.core_properties
    propiedades.title = f"{solicitud.titulo_tema} · Banco de preguntas"
    propiedades.author = MARCA
    propiedades.subject = solicitud.titulo_tema
    _pie_y_cabecera(documento, solicitud.titulo_tema)
    _banner_docx(documento, solicitud)
    junto = solicitud.respuestas == "junto"
    for numero, pregunta in enumerate(solicitud.preguntas, 1):
        _tarjeta_docx(documento, numero, pregunta, junto)
    if not junto:
        _hoja_respuestas_docx(documento, solicitud)
    salida = BytesIO()
    documento.save(salida)
    return salida.getvalue()
