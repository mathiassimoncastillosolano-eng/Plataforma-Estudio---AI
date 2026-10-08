/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del backend FastAPI. Nunca pongas aquí claves de IA. */
  readonly VITE_URL_BASE_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
