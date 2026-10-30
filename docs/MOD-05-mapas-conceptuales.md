# MOD-05 · Mapas conceptuales con IA

**Estado:** implementado y probado con un proveedor de IA **simulado**. **No validado con OpenAI real ni con material real** (TASK-0043 pendiente; ver §8).

## 1. Qué hace

- Genera un mapa conceptual desde la **fuente original** del tema (texto o PDF), sin necesitar un resumen previo.
- La IA devuelve **estructura**: nodos (etiqueta, definición, nivel), relaciones con **frase de enlace** (se lee «origen —frase→ destino») (solo entre cada concepto y su concepto superior: ya no se piden ni se dibujan relaciones entre ramas distintas). **No devuelve coordenadas**.
- El frontend calcula las posiciones de forma determinista (`utilidades/distribucionMapa.ts`) y reutiliza el componente React Flow existente.
- Pulsar un nodo muestra su definición en el panel de detalle ya existente.
- Los temas demo conservan su mapa de ejemplo (y el mapa de respaldo) con la etiqueta «Mapa de ejemplo».

## 2. Flujo en la interfaz

1. Si el tema tiene fuente en la sesión (texto pegado o PDF adjunto) → la pestaña muestra «Generar mapa conceptual». **No se llama a la IA al entrar** (evita gasto accidental).
2. Carga con botón «Cancelar» → mapa («Generado con IA») o error con «Intentar nuevamente».
3. El mapa se guarda en memoria (`almacenSesion.mapas`) junto con una huella de la fuente: al volver a la pestaña no se vuelve a llamar a la IA; si la fuente cambia, el mapa guardado deja de valer.
4. «Regenerar» pide confirmación (se pierden las ediciones manuales) y vuelve a llamar a la IA.
5. Las ediciones del estudiante (nombre, descripción y frase de enlace de cada concepto, nodos y subconceptos nuevos, posiciones) se guardan en memoria con el mapa y sobreviven al cambio de pestaña; «Regenerar» las descarta.
6. Sin fuente en la sesión (temas demo, o fuente perdida al recargar) se mantiene el comportamiento anterior.

## 3. Archivos

**Creados — backend:** `backend/app/mapas_conceptuales/{dominio,instrucciones,analizador_respuesta,servicio_mapa,dependencias,enrutador}.py`; pruebas `backend/pruebas/{respuestas_mapa,test_analizador_mapa,test_servicio_mapa,test_api_mapa}.py`; `backend/scripts/validar_mapa_real.py`.
**Creados — frontend:** `src/servicios/servicioMapaConceptual.ts`, `src/utilidades/distribucionMapa.ts`.
**Modificados (cambio mínimo):** `backend/app/main.py` (+2 líneas: import y `include_router`), `backend/app/mapas_conceptuales/__init__.py` (docstring), `src/paginas/PaginaMapaMental.tsx`, `src/componentes/MapaConceptual.tsx`, `src/tipos/index.ts` (2 campos opcionales), `src/almacen/almacenSesion.ts` (campo `mapas`, `guardarMapa`, limpieza en `eliminarDatosTema`), y los tres README.

## 4. Validaciones del JSON de la IA (`analizador_respuesta.py`)

Ids únicos (se conserva el primero); un solo nodo raíz; jerarquía reconstruida desde la raíz (huérfanos, ciclos y autorreferencias quedan fuera); etiqueta, definición y frase de enlace obligatorias y no vacías (el nodo sin ellas se descarta con su subárbol); límites de longitud; máx. 30 nodos (recorte por niveles, siempre un árbol conexo); máx. 12 relaciones cruzadas, sin autoenlaces, duplicados ni pares ya unidos por la jerarquía; extremos inexistentes descartados. **No se inventa contenido.** Si no queda raíz o quedan menos de 3 nodos → `502 IA_RESPUESTA_INVALIDA`. Los ids se regeneran (`root`, `n1`…): los de la IA no llegan al cliente. El frontend vuelve a comprobar lo imprescindible antes de dibujar.

## 5. Pruebas ejecutadas (resultados reales)

| Prueba | Resultado |
|---|---|
| Backend, suite completa (`pytest`) | **135 passed** (71 previas + 64 nuevas) |
| Backend, nuevas: analizador / servicio / API | 39 / 12 / 12 passed |
| Frontend `tsc -b` y `vite build` | sin errores |
| E2E en Chromium (Playwright) contra el backend real con **IA simulada** | **21/21** (flujos) y **47/47** (2.ª entrega: centrado, minimapa, nodos manuales, conexiones y regresiones). Flujos: temas demo intactos, generar desde texto y PDF, carga/cancelar/error de proveedor/respuesta inválida, caché, regenerar, panel de detalle, contraer rama sin arrastrar relaciones cruzadas, renombrar |

Medición de legibilidad sobre el DOM renderizado (3 mapas **sintéticos** con formato de IA; capturas en `docs/evidencias-mod05/`):

| Mapa | Nodos / frases | Solape nodo–nodo | Solape frase–frase | Solape frase–nodo | Aristas que cruzan nodos |
|---|---|---|---|---|---|
| Normal | 12 / 11 | 0 | 0 | 0 | 0 |
| Estrés: textos largos (el simulador envía 8 relaciones entre ramas, que se descartan) | 25 / 24 | 0 | 0 | 0 | 0 |
| Más ancho posible (7 ramas × 3 hojas) | 29 / 28 | 0 | 0 | 0 | 0 |

## 6. Cómo ejecutarlo

```bash
cd backend && pip install -r requirements-dev.txt && pytest          # pruebas (sin OpenAI)
cd backend && uvicorn app.main:app --reload --port 8000              # requiere backend/.env con OPENAI_API_KEY y OPENAI_MODEL
cd frontend && npm install && npm run dev                            # http://localhost:5173 · cuenta demo del proyecto
```

## 7. Limitaciones conocidas

- **Escala:** un mapa de ~25–30 nodos «ajustado a pantalla» queda pequeño (≈0,4×); es legible con zoom (rueda/pellizco) y minimapa. El prompt pide 10–20 nodos para mitigarlo; el límite duro es 30.
- Al añadir un nodo en un mapa generado con IA se reordena todo el mapa con el algoritmo de distribución (queda ordenado y sin solapes), por lo que se pierden las posiciones que el estudiante hubiera movido a mano.
- El mapa vive en memoria: se pierde al recargar (igual que los resúmenes). En temas con PDF hay que volver a adjuntarlo (desde la pestaña Resumen).
- Un tema creado por el usuario cuya fuente se perdió al recargar muestra el mapa de respaldo («Mapa de ejemplo»), como antes.
- Tiempo de espera del backend para texto: `OPENAI_TIMEOUT_SEGUNDOS` (45 s por defecto); un mapa suele tardar lo mismo que un resumen.
- Un mapa con PDF vuelve a enviar el documento a la IA (consumo adicional al del resumen).

## 8. Pendiente manual (TASK-0043)

No se pudo probar con OpenAI real (sin clave ni salida de red en el entorno de desarrollo). Falta:

1. Ejecutar `python scripts/validar_mapa_real.py <material> --titulo "..."` con 3–5 materiales reales (texto y PDF, de distinta longitud y materia).
2. Revisar a mano, contra el material, que cada proposición «origen —frase→ destino» y cada definición esté respaldada (**fidelidad**), y que no haya relaciones arbitrarias.
3. Abrir los mapas en la interfaz y comprobar legibilidad y solapamientos con la salida real del modelo; ajustar `instrucciones.py` si hace falta.
4. Verificar que el modelo configurado acepta PDF (igual que para resúmenes).

## 9. Propuesta de estados del backlog (solo según evidencias)

| Tarea | Propuesta | Evidencia / reserva |
|---|---|---|
| TASK-0040 Endpoint | **Completada con reserva** | Endpoints de texto y PDF probados con proveedor falso; sin llamada real a OpenAI. |
| TASK-0041 Prompt y esquema | **Completada con reserva** | Esquema, límites y analizador cubiertos por 39 pruebas; la calidad del prompt con el modelo real no está validada. |
| TASK-0042 Integración | **Completada** | E2E en navegador 21/21 con backend real e IA simulada; distribución determinista medida. |
| TASK-0043 Validación | **En progreso** | Solapamientos medidos en 3 mapas sintéticos; falta fidelidad y legibilidad con material real (§8). |
| MOD-05 | De «Simulado / Sin validar» a **«Implementado / Pendiente de validar con IA real»** | |

## 10. Ajustes de la 2.ª entrega y errores preexistentes

Ver `Reporte-MOD05-entrega2.md`. Los dos errores de `MapaConceptual.tsx` detectados en la 1.ª entrega ya están **corregidos** porque bloqueaban estos ajustes:

1. `nodosVista` usaba la clave `datos` en lugar de `data`: los botones +/− de cada nodo no aparecían y el atenuado por foco no se aplicaba.
2. `agregarNodo` usaba el tipo `"concept"` en lugar de `"concepto"`: «Nuevo concepto» creaba un nodo vacío con estilo por defecto.

Siguen sin tocar (preexistentes, fuera de alcance): en el mapa demo del tema 1 los nodos «Células sanguíneas» y «Arterias» se solapan por las coordenadas de `datos/mapasMentales.ts`; y «Eliminar» borra solo el nodo seleccionado, dejando sus subconceptos sin conexión.
