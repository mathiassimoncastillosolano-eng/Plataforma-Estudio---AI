# Plataforma Estudio AI

```text
Frontend (React + Vite)  ──HTTP──►  Backend (FastAPI)  ──►  OpenAI API
      frontend/                        backend/
```

| Funcionalidad | Estado |
|---|---|
| Resumen general + resumen esencial | **OpenAI real** (una sola llamada devuelve ambos) |
| Lectura de PDF (extracción de texto) | **Real**, en el backend, sin guardar el archivo |
| Preguntas · Práctica · Pruebas · Mapa conceptual | **Simulado** en el frontend (no usa OpenAI) |

## Sin base de datos: los datos son temporales

No existe base de datos ni persistencia en el servidor. El backend procesa cada
solicitud en memoria y no guarda nada (ni texto, ni PDFs, ni resúmenes). El
frontend mantiene la sesión de estudio en memoria: al recargar o cerrar la
pestaña se pierde. Esto es una decisión de diseño, no un error.

> Los datos de demostración del frontend (cuenta de acceso, temas creados,
> preferencias de apariencia) sí usan `localStorage` del navegador, como en la
> versión anterior; no tiene relación con el backend.

## Puesta en marcha

Terminal 1 — backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements-dev.txt
copy .env.example .env            # macOS/Linux: cp .env.example .env
# Edita .env y completa OPENAI_API_KEY y OPENAI_MODEL
uvicorn app.main:app --reload --port 8000
```

Terminal 2 — frontend:

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173` (cuenta demo: `estudiante@demo.com` / `123456`).

## Documentación

- [`backend/README.md`](backend/README.md): arquitectura, variables de entorno, contrato de la API, errores y pruebas.
- [`frontend/README.md`](frontend/README.md): estructura, flujo del resumen y del PDF.

## Seguridad

`OPENAI_API_KEY` vive solo en `backend/.env` (ignorado por git; el repositorio
incluye `backend/.env.example` sin secretos). El frontend nunca la recibe ni
llama a OpenAI: solo habla con el backend.
