"""Genera PDFs mínimos en memoria para las pruebas (sin archivos en disco)."""
from io import BytesIO

from pypdf import PdfWriter


def construir_pdf_con_texto(paginas: list[list[str]]) -> bytes:
    """Construye un PDF válido con una página por cada lista de líneas."""
    objetos: dict[int, bytes] = {}
    ids_paginas = [4 + 2 * indice for indice in range(len(paginas))]

    objetos[1] = b"<< /Type /Catalog /Pages 2 0 R >>"
    hijos = " ".join(f"{id_pagina} 0 R" for id_pagina in ids_paginas)
    objetos[2] = f"<< /Type /Pages /Kids [{hijos}] /Count {len(paginas)} >>".encode()
    objetos[3] = b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"

    for id_pagina, lineas in zip(ids_paginas, paginas):
        flujo = "BT /F1 12 Tf 14 TL 40 760 Td " + " T* ".join(f"({linea}) Tj" for linea in lineas) + " ET"
        id_contenido = id_pagina + 1
        objetos[id_pagina] = (
            f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {id_contenido} 0 R >>"
        ).encode()
        cuerpo = flujo.encode()
        objetos[id_contenido] = b"<< /Length " + str(len(cuerpo)).encode() + b" >>\nstream\n" + cuerpo + b"\nendstream"

    salida = bytearray(b"%PDF-1.4\n")
    posiciones = {}
    for numero in sorted(objetos):
        posiciones[numero] = len(salida)
        salida += f"{numero} 0 obj\n".encode() + objetos[numero] + b"\nendobj\n"

    inicio_xref = len(salida)
    total = max(objetos) + 1
    salida += f"xref\n0 {total}\n".encode() + b"0000000000 65535 f \n"
    for numero in range(1, total):
        salida += f"{posiciones[numero]:010d} 00000 n \n".encode()
    salida += f"trailer\n<< /Size {total} /Root 1 0 R >>\nstartxref\n{inicio_xref}\n%%EOF\n".encode()
    return bytes(salida)


def construir_pdf_sin_texto() -> bytes:
    escritor = PdfWriter()
    escritor.add_blank_page(width=612, height=792)
    salida = BytesIO()
    escritor.write(salida)
    return salida.getvalue()


def construir_pdf_protegido() -> bytes:
    escritor = PdfWriter()
    escritor.add_blank_page(width=612, height=792)
    escritor.encrypt("clave-de-usuario")
    salida = BytesIO()
    escritor.write(salida)
    return salida.getvalue()


LINEAS_DE_EJEMPLO = [
    "El sistema circulatorio transporta sangre, oxigeno y nutrientes por todo el cuerpo humano.",
    "El corazon es un organo muscular que actua como bomba mediante contracciones ritmicas.",
    "Las arterias llevan la sangre desde el corazon y las venas la devuelven hacia el.",
]
