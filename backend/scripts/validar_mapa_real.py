"""Validación manual del mapa conceptual con material real y OpenAI real (TASK-0043).

Requiere `backend/.env` con OPENAI_API_KEY y OPENAI_MODEL. Consume créditos de OpenAI.

Uso (desde backend/):
    python scripts/validar_mapa_real.py ruta/al/material.txt  --titulo "Mi tema"
    python scripts/validar_mapa_real.py ruta/al/material.pdf  --titulo "Mi tema" --salida mapa.json

Imprime las métricas de estructura y TODAS las proposiciones «origen —frase→ destino» para que
una persona revise la fidelidad contra el material original. La fidelidad no se puede comprobar
automáticamente: este script solo prepara la revisión; no marca nada como validado.
"""
import argparse
import json
import sys
import time
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.configuracion.ajustes import obtener_ajustes  # noqa: E402
from app.mapas_conceptuales.dominio import MAX_NODOS  # noqa: E402
from app.mapas_conceptuales.servicio_mapa import ServicioMapaConceptual  # noqa: E402
from app.servicios_externos.servicio_openai import ServicioOpenAI  # noqa: E402


def construir_servicio() -> ServicioMapaConceptual:
    ajustes = obtener_ajustes()
    if not ajustes.ia_configurada:
        sys.exit("Falta configurar OPENAI_API_KEY y OPENAI_MODEL en backend/.env")
    proveedor = ServicioOpenAI(
        api_key=ajustes.openai_api_key,
        modelo=ajustes.openai_model,
        timeout_segundos=ajustes.openai_timeout_segundos,
        max_reintentos=ajustes.openai_max_reintentos,
        timeout_pdf_segundos=ajustes.openai_timeout_pdf_segundos,
    )
    return ServicioMapaConceptual(
        proveedor,
        minimo_caracteres=ajustes.resumen_min_caracteres,
        maximo_caracteres=ajustes.resumen_max_caracteres,
        pdf_max_bytes=ajustes.pdf_max_bytes,
        pdf_max_paginas=ajustes.pdf_max_paginas,
    )


def generar(servicio: ServicioMapaConceptual, ruta: Path, titulo: str | None):
    if ruta.suffix.lower() == ".pdf":
        return servicio.generar_mapa_desde_pdf(ruta.read_bytes(), ruta.name, titulo)
    return servicio.generar_mapa(ruta.read_text(encoding="utf-8"), titulo)


def informe(resultado) -> str:
    mapa = resultado.mapa
    nombre = {n.id: n.etiqueta for n in mapa.nodos}
    niveles = Counter(n.nivel for n in mapa.nodos)
    jerarquicas = [r for r in mapa.relaciones if r.tipo == "jerarquica"]
    cruzadas = [r for r in mapa.relaciones if r.tipo == "cruzada"]
    palabras = [len(r.frase_enlace.split()) for r in mapa.relaciones]
    definiciones = [len(n.definicion) for n in mapa.nodos]
    lineas = [
        f"Título: {mapa.titulo}",
        f"Modelo: {resultado.metadatos.modelo} · entrada: {resultado.metadatos.entrada}",
        f"Nodos: {len(mapa.nodos)} (límite {MAX_NODOS}) · por nivel: {dict(sorted(niveles.items()))}",
        f"Relaciones: {len(jerarquicas)} jerárquicas + {len(cruzadas)} cruzadas",
        f"Frases de enlace: {min(palabras)}–{max(palabras)} palabras (media {sum(palabras) / len(palabras):.1f})",
        f"Definiciones: {min(definiciones)}–{max(definiciones)} caracteres (media {sum(definiciones) / len(definiciones):.0f})",
        "",
        "PROPOSICIONES (revisar contra el material: ¿las respalda?)",
    ]
    for r in mapa.relaciones:
        marca = "↔" if r.tipo == "cruzada" else " "
        lineas.append(f"  {marca} {nombre[r.origen]}  —{r.frase_enlace}→  {nombre[r.destino]}")
    lineas += ["", "DEFINICIONES (revisar contra el material)"]
    lineas += [f"  · {n.etiqueta}: {n.definicion}" for n in mapa.nodos]
    return "\n".join(lineas)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("material", type=Path, help="archivo .txt (UTF-8) o .pdf")
    parser.add_argument("--titulo", default=None)
    parser.add_argument("--salida", type=Path, default=None, help="guarda el mapa completo en este JSON")
    argumentos = parser.parse_args()

    inicio = time.perf_counter()
    resultado = generar(construir_servicio(), argumentos.material, argumentos.titulo)
    print(informe(resultado))
    print(f"\nTiempo de generación: {time.perf_counter() - inicio:.1f} s")
    if argumentos.salida:
        from dataclasses import asdict

        argumentos.salida.write_text(json.dumps(asdict(resultado), ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Mapa guardado en {argumentos.salida}")


if __name__ == "__main__":
    main()
