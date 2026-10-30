# Cursa — Frontend de estudio asistido por IA

React + TypeScript + Vite. El módulo de **Resúmenes** está conectado al backend
FastAPI (`../backend`). Preguntas, Prueba y Mapa conceptual siguen funcionando
con datos simulados del frontend y se conectarán al backend en futuras HU.

## Cómo ejecutar

```bash
npm install
cp .env.example .env.local   # completa VITE_GOOGLE_CLIENT_ID; VITE_URL_BASE_API solo si el backend no está en http://localhost:8000
npm run dev
npm test                     # pruebas (Vitest)
npm run build                # tsc + vite build
```

Abre `http://localhost:5173`. Para generar resúmenes o leer PDFs, el backend debe
estar en marcha (ver `../backend/README.md`).

### Acceso

El acceso es **solo con Google** (sin contraseña propia ni registro manual). Antes
del login hay una pantalla de inicialización que espera a que el backend responda.
Guía de configuración: `../docs/MANUAL_CONFIGURACION.md`.

## Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_URL_BASE_API` | `http://localhost:8000` | URL del backend FastAPI (en Vercel: la URL de Render, con `https://`, sin barra final). |
| `VITE_GOOGLE_CLIENT_ID` | — (obligatoria para entrar) | ID de cliente OAuth de Google, tipo «Aplicación web». Es público; **nunca** pongas aquí un secreto de cliente. |

Todo lo que empieza por `VITE_` se publica en el navegador. **Nunca** pongas
aquí una API Key de OpenAI: el frontend solo habla con el backend.

## Stack

- React 18 + TypeScript + Vite · React Router 6
- Lucide React (iconos) · Recharts (gráficos) · React Flow (mapa conceptual)

## Estructura

```
src/
├── configuracion.ts       URL del backend, límites del contenido, timeouts
├── almacen/               almacenSesion: estado de la sesión SOLO en memoria
├── servicios/
│   ├── clienteApi.ts      Cliente HTTP: envoltorio {exito, datos|error} → ErrorApi
│   ├── servicioResumen.ts POST /api/resumenes y /api/resumenes/pdf (real), descarga en PDF + resúmenes de ejemplo
│   ├── servicioContenido.ts  POST /api/contenido/extraer-pdf (ya no lo usa el flujo de resúmenes)
│   └── …                  servicios simulados (temas, preguntas, pruebas, progreso)
├── componentes/
│   ├── resumen/           Compositor, estado de generación y lector del resumen
│   └── …                  Componentes reutilizables (Boton, Tarjeta, ListaActividad…)
├── paginas/               Pantallas (rutas cargadas bajo demanda)
├── disposiciones/         DisposicionApp (barra lateral + encabezado) y DisposicionTema
├── datos/                 Datos de ejemplo (temas, preguntas, mapas…)
├── tipos/                 Tipos compartidos (incluye el contrato del resumen)
└── estilos/               tokens · componentes · disposicion · paginas · oscuro · temas · remasterizado · sistema
```

Las rutas están en español: `/estudio/nuevo`, `/estudio/:id/resumen`, `/temas`,
`/progreso`, `/panel`…

## Flujo del contenido y del resumen

```text
Nuevo tema ── Texto ─────────────────────────────────────────┐
           └─ PDF (el archivo original queda en la sesión) ───┤
                                                              ▼
   Generar ── texto → POST /api/resumenes ─────────────────────┐
           └─ PDF   → POST /api/resumenes/pdf (PDF original) ───┤  una sola llamada a la IA
                       + indicaciones opcionales del estudiante  ▼
                                          resumen esencial + resumen general
                                                              ▼
        LectorResumen: pestañas Esencial / General (sin nuevas llamadas)
                       └─ «Descargar … (PDF)» → POST /api/resumenes/descargar-pdf
                          (da formato al resumen ya generado; no llama a la IA)
```

- **PDF directo:** el PDF no se convierte a texto en el navegador ni en el
  backend: se envía tal cual a la IA, que analiza también tablas, diagramas y
  gráficos. El mensaje del estudiante (campo «Indicaciones», opcional) se envía
  como contexto del análisis. El archivo solo vive en memoria de la sesión: al
  recargar hay que adjuntarlo de nuevo.
- **Descarga:** cada resumen tiene su propio botón y solo descarga el suyo. Si no
  hay contenido el botón se desactiva y el backend rechaza el archivo vacío.
- **Eliminar temas:** cada tarjeta (Mis estudios y Panel) tiene un botón con
  confirmación; elimina solo ese tema (por `id`) en `servicioEstudio` (hoy
  `localStorage`) y limpia su resumen/PDF de la sesión.
- **Carga real:** el estado «Analizando contenido… / Organizando conceptos… /
  Preparando tus resúmenes…» dura lo que tarda la petición (se puede cancelar).
- **Errores:** el mensaje del backend se muestra sobre el formulario (o bajo el
  PDF) y el texto escrito se conserva.
- **Origen visible:** cada resumen indica si fue *Generado con IA* o es un
  *Resumen de ejemplo* (temas demo).

## Datos y persistencia

- Contenido, resúmenes generados y actividad de la sesión viven en
  `almacen/almacenSesion.ts` (memoria). Al recargar o cerrar la pestaña, se pierden.
- La sesión de acceso (perfil de Google) vive solo en memoria
  (`servicios/servicioAutenticacion.ts`): no se persiste en ningún almacenamiento.
- Siguen en `localStorage` solo los datos de demostración: temas creados,
  preferencias de apariencia y estado de preguntas. Sus claves empiezan por
  `estudioai.`. Al cerrar sesión se borran todas salvo las de apariencia
  (`utilidades/limpiezaSesion.ts`).


## Módulo Pruebas

- Flujo: configuración → generación en el servidor → «lista» → ejecución (con pausa opcional) → entrega → resultados. Controlador: `hooks/useControlPrueba.ts`; servicio: `servicios/servicioPruebas.ts`.
- Se guarda en `localStorage` solo el sello cifrado, las respuestas, descartes, marcas y la posición (nunca las preguntas): al recargar o abrir otra pestaña se reanuda sin regenerar.
- **Alerta de tiempo** (única regla): con el cronómetro oculto solo se ve una barra; el número reaparece en rojo y con el texto «Quedan…» cuando resta `min(10 min, 25 % del tiempo)`, con mínimo 60 s (`utilidades/tiempoPrueba.ts`).
- **Descarte:** alternativas atenuadas con etiqueta e icono, reversibles y persistentes; elegir una descartada la restaura.
- **Asistido:** términos subrayados con definiciones precalculadas por el servidor (texto plano, sin llamadas en hover).
- **Anti-copia:** bloquea copiar/cortar/clic derecho/arrastrar solo dentro del área del examen. Es una barrera de conveniencia, no una garantía anti-trampa.
- Tests de lógica pura: `src/utilidades/*.test.ts` (`npm test`).
