# Cursa — Frontend de estudio asistido por IA

Frontend completo (sin backend) de una plataforma de estudio que usa IA para
transformar un PDF o un texto en resúmenes, preguntas, exámenes y mapas
conceptuales. Todo el contenido de IA está **simulado con datos mock** para
que el proyecto se pueda conectar después a un backend real (Spring Boot +
PostgreSQL) vía REST sin rediseñar la interfaz.

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

### Cuenta de acceso (demo)

```
correo:      estudiante@demo.com
contraseña:  123456
```

También puedes crear una cuenta nueva desde `/register`; se guarda en
`localStorage` (no hay backend real).

## Stack

- React 18 + TypeScript + Vite
- React Router 6
- Lucide React (iconos)
- Recharts (gráficos de progreso)
- React Flow (mapa conceptual interactivo)

## Estructura

```
src/
├── components/   Componentes reutilizables (Button, Card, QuestionCard, ...)
├── pages/        Pantallas de la aplicación
├── layouts/      AppLayout (sidebar+header) y TopicLayout (tabs de un tema)
├── data/         Datos mock (usuarios, temas, resúmenes, preguntas, ...)
├── services/      Capa de servicios mock (authService, studyService,
│                  aiService, examService, progressService). Cada función
│                  devuelve una Promise, lista para reemplazarse por
│                  llamadas fetch/axios reales.
├── types/        Interfaces TypeScript compartidas
├── hooks/        useAuth, useMediaQuery
└── styles/       tokens.css, layout.css, components.css, pages.css
```

## Reemplazar los mocks por un backend real

Cada archivo en `services/` documenta, en un comentario, el endpoint REST
que debería llamar en producción (por ejemplo `POST /api/auth/login`,
`GET /api/topics/:id`, `POST /api/ai/summary`). La firma de cada función
(parámetros y tipo de retorno `Promise<T>`) ya coincide con lo que se
necesitaría al integrar Axios o `fetch`, por lo que los componentes no
deberían cambiar al hacer la migración.

La API Key de cualquier proveedor de IA **nunca** debe vivir en este
frontend; en el diseño final viaja únicamente por el backend.

## Funcionalidades incluidas

- Login / registro mock con sesión persistida en `localStorage`.
- Dashboard con estadísticas y temas recientes.
- Flujo de creación de tema (nombre → PDF o texto → procesamiento simulado).
- Resumen esencial y resumen completo por tema.
- Preguntas de práctica con retroalimentación inmediata y actualización del
  indicador de dominio.
- Examen cronometrado con navegación libre entre preguntas y resultados con
  revisión de respuestas.
- Mapa conceptual interactivo (arrastrar, conectar, crear, editar y
  eliminar nodos) con React Flow.
- Página de progreso con gráficos de evolución del dominio, preguntas por
  semana y exámenes recientes.
- Perfil y configuración.
- Estados de carga, vacío y error en las pantallas principales.
- Diseño responsive (desktop, tablet y móvil).
