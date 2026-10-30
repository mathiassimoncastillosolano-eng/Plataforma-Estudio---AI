# MOD-05 · Reporte de la 2.ª entrega (ajustes puntuales)

Base: `Plataforma-Estudio---AI_MOD05.zip` (idéntico, por hash, a la 1.ª entrega). Solo se modificaron archivos de MOD-05 y su documentación; **ningún archivo ajeno cambió** (verificado por SHA-256 contra el ZIP recibido).

## 1. Archivos modificados

| Archivo | Para qué |
|---|---|
| `frontend/src/componentes/MapaConceptual.tsx` | Puntos 2, 3 y 4 (minimapa, nodos manuales, conexiones) |
| `frontend/src/estilos/remasterizado.css` | Puntos 1, 2 y 3 (centrado, tamaño del minimapa, campos del panel) |
| `frontend/src/paginas/PaginaMapaMental.tsx` | Punto 3 (guardar las ediciones: 1 línea) |
| `frontend/src/utilidades/distribucionMapa.ts` | Punto 3 (acepta tamaños reales de nodo; opcional) |
| `frontend/src/servicios/servicioMapaConceptual.ts`, `frontend/src/tipos/index.ts` | Punto 4 (descartar relaciones entre ramas) |
| `backend/app/mapas_conceptuales/instrucciones.py` | Punto 4 (el prompt ya no pide relaciones entre ramas) |
| `backend/pruebas/test_servicio_mapa.py` | +1 prueba del prompt |
| `docs/MOD-05-mapas-conceptuales.md`, `backend/README.md`, `docs/evidencias-mod05/*`, `docs/Reporte-MOD05-entrega2.md` | Documentación y capturas |

## 2. Cambios por punto (causa → corrección)

**1. Pantalla inicial centrada.** *Causa:* `.page-content.canvas .topic-body` es un contenedor flex en fila y el bloque de estado no ocupaba el ancho, así que quedaba pegado a la izquierda. *Corrección:* regla `.topic-body > .state-block { flex: 1 }` (acotada al lienzo). Centra también la pantalla de carga y la de error.

**2. Minimapa.** *Causa:* el componente dibuja su SVG con `style.width/height` (por defecto 200×150) y el CSS forzaba la caja a 150×100 con `!important`; el SVG desbordaba y solo 8 de 12 nodos quedaban dentro (7 tras mover). *Corrección:* se pasa `style={{ width: 150, height: 100 }}` al `MiniMap` y se quita el tamaño duplicado del CSS (una sola fuente de verdad). Además, la zona fuera de la vista se sombrea (antes era transparente) para ver dónde estás.

**3. Crear y seguir editando nodos.** *Causas:* (a) `agregarNodo` usaba el tipo `"concept"` (no registrado; el correcto es `"concepto"`), por lo que el nodo salía vacío; (b) `nodosVista` asignaba `datos` en lugar de `data`, por lo que nunca aparecían los botones contraer/expandir (ni el doble clic) en ningún nodo; (c) el panel no permitía editar la descripción y mostraba «consulta el resumen»; (d) las ediciones se perdían al cambiar de pestaña; (e) el nodo nuevo se colocaba con un desplazamiento fijo, pudiendo tapar a otros. *Corrección:*
- El concepto escrito se ve en el nodo; el cursor queda en su nombre al crearlo. La descripción es un campo editable (sin mensajes de «consultar el material»); en los mapas de IA también se edita la frase de enlace con el concepto superior.
- Se pueden añadir subconceptos a cualquier nodo (también a los nuevos) y los nodos nuevos tienen contraer/expandir (botón −/+N, doble clic y panel). Añadir a una rama contraída la expande.
- Al añadir en un mapa de IA, se reordena el mapa con el mismo algoritmo que lo generó (cada concepto en su rama, sin solapes). En los mapas de ejemplo se busca un hueco libre.
- Nombre, descripción, frase, nodos y posiciones se guardan en la sesión (se conservan al cambiar de pestaña; «Regenerar» los descarta).

**4. Conexiones simplificadas.** *Causa:* el prompt pedía relaciones entre ramas y el lienzo las dibujaba como curvas/arcos largos. *Corrección:* el prompt deja de pedirlas; el frontend descarta las que lleguen (`cruzada`) y se eliminó el código de curvas, arcos y anclajes laterales. Quedan las conexiones de cada rama (concepto superior → concepto) con trazo recto, flecha y frase de enlace.

## 3. Pruebas y resultados

| Prueba | Resultado |
|---|---|
| Backend `pytest` (suite completa) | **135 passed** (134 previas + 1 nueva) |
| Frontend `tsc -b` y `vite build` | sin errores |
| E2E en navegador, 2.ª entrega (backend real + IA simulada) | **47/47**: centrado (desvío 0 px), minimapa (SVG = caja 150×100, 12/12 nodos dentro, posición/tamaño = mapa real, ventana visible = vista real tras mover, ampliar, «Ajustar» y arrastrar un nodo), nodos manuales (texto visible, descripción, frase, subconceptos, sin solapes, contraer/expandir por botón, doble clic y panel, persistencia al cambiar de pestaña, eliminar), 11 conexiones sin trazos punteados |
| E2E de regresión del módulo | **21/21**: temas demo intactos, texto y PDF, cancelar, errores del proveedor, caché, regenerar |
| Medición de solapes (3 mapas: 12, 25 y 29 nodos) | 0 solapes nodo–nodo, frase–frase y frase–nodo; 0 aristas cruzando nodos |

## 4. Efectos a tener en cuenta
- Corregir `datos`→`data` activa funciones que ya estaban diseñadas pero no funcionaban: botones −/+N en nodos con ramas, doble clic para contraer/expandir (lo que dice la ayuda del mapa) y el atenuado de nodos no relacionados al pasar el ratón (antes solo se atenuaban las líneas). También ocurre en los mapas de ejemplo.
- En mapas de IA, añadir un nodo recoloca el mapa y descarta las posiciones movidas a mano.
- Pendientes preexistentes que no toqué: en el mapa demo del tema 1 «Células sanguíneas» y «Arterias» se solapan por sus coordenadas en `datos/mapasMentales.ts`; y «Eliminar» borra solo el nodo seleccionado, dejando sus subconceptos sin conexión.
- Sigue pendiente la validación con OpenAI real y material real (TASK-0043).
