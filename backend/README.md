# Backend — Plataforma Estudio AI

FastAPI. Único punto que se comunica con OpenAI. **Sin base de datos**: todo se
procesa en memoria por solicitud.

## Arquitectura

```text
app/
├── main.py                  Aplicación, CORS, manejo central de errores
├── configuracion/ajustes.py Única fuente de configuración (variables de entorno)
├── comun/                   Errores controlados y formato de respuestas
├── contenido/               Texto y PDF
│   ├── enrutador.py         POST /api/contenido/extraer-pdf
│   ├── servicio_contenido.py  Límites de tamaño y de texto
│   ├── extractor_pdf.py     Extracción con pypdf (en memoria)
│   └── validacion.py        Normalización y validación del texto
├── resumenes/               Módulo REAL con IA
│   ├── enrutador.py         POST /api/resumenes
│   ├── servicio_resumen.py  Caso de uso (valida → IA → analiza respuesta)
│   ├── instrucciones.py     Instrucciones educativas enviadas a la IA
│   ├── analizador_respuesta.py  Valida el JSON que devuelve el modelo
│   └── dominio.py           ResumenGeneral, ResumenEsencial, ResultadoResumen
├── servicios_externos/
│   ├── proveedor_ia.py      Contrato (Protocol) que usan los servicios
│   └── servicio_openai.py   Único módulo que conoce el SDK de OpenAI
└── preguntas/ practica/ pruebas/ mapas_conceptuales/   Reservados (hoy simulados en el frontend)
```

Flujo: `enrutador → servicio → proveedor de IA → OpenAI`. Los servicios dependen
del contrato `ProveedorIA`, no de OpenAI, por lo que se prueban con un proveedor
falso sin gastar créditos. Los módulos reservados están vacíos a propósito.

## Variables de entorno

Copia `.env.example` a `.env` (ignorado por git).

| Variable | Obligatoria | Descripción |
|---|---|---|
| `OPENAI_API_KEY` | Sí | Clave de OpenAI. Solo en el backend. |
| `OPENAI_MODEL` | Sí | Nombre exacto del modelo. No hay valor por defecto: se cambia aquí sin tocar código. |
| `OPENAI_TIMEOUT_SEGUNDOS` | No (45) | Espera máxima por llamada. |
| `OPENAI_MAX_REINTENTOS` | No (1) | Reintentos automáticos ante fallos transitorios. |
| `RESUMEN_MIN_CARACTERES` / `RESUMEN_MAX_CARACTERES` | No (100 / 20000) | Límites del contenido. Deben coincidir con `frontend/src/configuracion.ts`. |
| `PDF_MAX_BYTES` / `PDF_MAX_PAGINAS` | No (10 MB / 100) | Límites del PDF. |
| `ORIGENES_PERMITIDOS` | No | Orígenes CORS separados por comas (por defecto `http://localhost:5173`). |

Si faltan la clave o el modelo, el backend arranca igual y responde `503
IA_NO_CONFIGURADA` al pedir un resumen.

## Ejecutar y probar

```bash
uvicorn app.main:app --reload --port 8000    # desde backend/
pytest                                       # pruebas (no llaman a OpenAI)
```

Documentación interactiva: `http://localhost:8000/docs`.

## API

Todas las respuestas usan el mismo formato:

```json
{ "exito": true,  "datos": { } }
{ "exito": false, "error": { "codigo": "CONTENIDO_VACIO", "mensaje": "..." } }
```

### `POST /api/resumenes`

Solicitud: `{ "texto": "...", "titulo": "Opcional" }`. Una sola llamada a la IA
genera ambos resúmenes:

```json
{
  "exito": true,
  "datos": {
    "resumen_general":  { "titulo": "", "introduccion": "", "secciones": [{ "titulo": "", "contenido": "", "puntos": [] }], "minutos_lectura": 3 },
    "resumen_esencial": { "idea_central": "", "ideas_clave": [], "conceptos_clave": [{ "termino": "", "definicion": "" }], "minutos_lectura": 1 },
    "metadatos": { "modelo": "", "generado_en": "", "caracteres_entrada": 0 }
  }
}
```

### `POST /api/contenido/extraer-pdf`

`multipart/form-data` con el campo `archivo`. Devuelve `{ "texto", "paginas", "caracteres" }`.
El PDF se lee en memoria y no se guarda. El texto extraído se envía después a `/api/resumenes`.

### `GET /api/salud`

`{ "estado": "ok", "ia_configurada": true }` (no expone la clave).

## Errores

| Código | HTTP | Cuándo |
|---|---|---|
| `CONTENIDO_VACIO` / `CONTENIDO_MUY_CORTO` / `CONTENIDO_MUY_LARGO` / `CONTENIDO_INVALIDO` | 422 | Texto no utilizable |
| `PDF_INVALIDO` / `PDF_PROTEGIDO` / `PDF_SIN_TEXTO` | 422 | PDF dañado, con contraseña o sin texto seleccionable |
| `PDF_MUY_PESADO` | 413 | Supera `PDF_MAX_BYTES` |
| `IA_NO_CONFIGURADA` | 503 | Falta `OPENAI_API_KEY` u `OPENAI_MODEL` |
| `IA_CREDENCIALES_INVALIDAS` / `IA_MODELO_NO_DISPONIBLE` / `IA_ERROR` / `IA_RESPUESTA_INVALIDA` | 502 | Fallo del proveedor o respuesta inesperada |
| `IA_LIMITE_SOLICITUDES` | 429 | Límite de uso de OpenAI |
| `IA_TIEMPO_AGOTADO` | 504 | Timeout |
| `IA_NO_DISPONIBLE` | 503 | Sin conexión con OpenAI |
| `SOLICITUD_INVALIDA` | 422 | Cuerpo mal formado |
| `ERROR_INTERNO` | 500 | Error inesperado (el detalle solo va a los logs) |

Los mensajes nunca incluyen claves ni detalles internos; los logs tampoco
registran el contenido del usuario ni la clave.

## Añadir otro módulo con IA más adelante

Crea en su carpeta (`preguntas/`, etc.) un `enrutador.py`, un `servicio_*.py` y
su `dominio.py`, inyectando `ProveedorIA` como hace `resumenes/`, y registra el
enrutador en `main.py`. No hay que reorganizar nada más.
