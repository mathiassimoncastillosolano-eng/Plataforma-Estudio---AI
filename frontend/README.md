# Cursa — Frontend de estudio asistido por IA

React + TypeScript + Vite. El módulo de **Resúmenes** está conectado al backend
FastAPI (`../backend`). Preguntas, Prueba y Mapa conceptual siguen funcionando
con datos simulados del frontend y se conectarán al backend en futuras HU.

## Cómo ejecutar

```bash
npm install
cp .env.example .env   # opcional: solo si el backend no está en http://localhost:8000
npm run dev
```

Abre `http://localhost:5173`. Para generar resúmenes o leer PDFs, el backend debe
estar en marcha (ver `../backend/README.md`).

### Cuenta de acceso (demo)

```
correo:      estudiante@demo.com
contraseña:  123456
```

## Variables de entorno

| Variable | Por defecto | Descripción |
|---|---|---|
| `VITE_URL_BASE_API` | `http://localhost:8000` | URL del backend FastAPI. |

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
- Siguen en `localStorage` solo los datos de demostración: sesión de acceso,
  temas creados, preferencias de apariencia y estado de preguntas. Sus claves
  empiezan por `estudioai.`.
