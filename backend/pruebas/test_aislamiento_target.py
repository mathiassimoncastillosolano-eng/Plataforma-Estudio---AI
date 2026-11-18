import ast
from pathlib import Path

from app.adaptacion import motor

RAIZ_PRUEBAS = Path(__file__).resolve().parents[1] / "app" / "pruebas"
PERMITIDO = {"dificultad_objetivo"}


def _importaciones_de_adaptacion(ruta: Path) -> list[tuple[str, set[str]]]:
    encontradas = []
    for nodo in ast.walk(ast.parse(ruta.read_text(encoding="utf-8"))):
        if isinstance(nodo, ast.ImportFrom) and (nodo.module or "").startswith("app.adaptacion"):
            encontradas.append((nodo.module, {a.name for a in nodo.names}))
        if isinstance(nodo, ast.Import):
            encontradas.extend((a.name, set()) for a in nodo.names if a.name.startswith("app.adaptacion"))
    return encontradas


def test_el_modulo_de_pruebas_solo_lee_la_dificultad_objetivo_del_motor():
    for ruta in RAIZ_PRUEBAS.glob("*.py"):
        for modulo, nombres in _importaciones_de_adaptacion(ruta):
            assert modulo == "app.adaptacion.motor" and nombres and nombres <= PERMITIDO, f"{ruta.name} importa {modulo}: {nombres}"


def test_el_estado_solo_cambia_con_respuestas_enviadas_a_registrar():
    estado, _ = motor.registrar(motor.estado_inicial(), [{"dificultad": "media", "correcta": True, "segundos": 20.0}] * 15)
    repetido, cerrados = motor.registrar(estado, [])
    assert repetido == estado and cerrados == []
    motor.dificultad_objetivo(estado["nivel"])
    assert motor.registrar(estado, [])[0] == estado
