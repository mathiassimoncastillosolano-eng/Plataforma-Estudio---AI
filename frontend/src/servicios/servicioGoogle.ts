import type { Usuario } from "../tipos";
import { GOOGLE_CLIENT_ID } from "../configuracion";

// -----------------------------------------------------------------------
// Acceso con Google (OAuth 2.0 / OpenID Connect) con Google Identity Services.
//
// Flujo "token client" en ventana emergente: no necesita secreto de cliente ni
// redirecciones (basta registrar el ORIGEN JavaScript en Google Cloud). Con el
// token de acceso se consulta el endpoint `userinfo` de Google y el perfil se
// guarda SOLO en memoria. Nada de esto toca localStorage, sessionStorage ni cookies
// propias; el token se descarta en cuanto se obtiene el perfil.
// -----------------------------------------------------------------------

const URL_SCRIPT_GOOGLE = "https://accounts.google.com/gsi/client";
const URL_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";
const TIEMPO_CARGA_SCRIPT_MS = 12_000;
const TIEMPO_PERFIL_MS = 15_000;

export type CodigoErrorAutenticacion =
  | "CONFIGURACION" // falta VITE_GOOGLE_CLIENT_ID
  | "SCRIPT" // no se pudo cargar el script de Google (red, bloqueador…)
  | "CANCELADO" // el usuario cerró la ventana
  | "DENEGADO" // el usuario no concedió permisos
  | "POPUP_BLOQUEADO"
  | "RED" // fallo al leer el perfil
  | "PERFIL" // el perfil no trae lo mínimo (sub / correo)
  | "DESCONOCIDO";

export class ErrorAutenticacion extends Error {
  constructor(
    public readonly codigo: CodigoErrorAutenticacion,
    mensaje: string
  ) {
    super(mensaje);
    this.name = "ErrorAutenticacion";
  }
  /** Cancelar no es un fallo: la interfaz lo muestra con un tono informativo. */
  get esInformativo(): boolean {
    return this.codigo === "CANCELADO";
  }
}

// --- Tipado mínimo de la librería de Google (evita una dependencia de tipos) ---
interface RespuestaToken {
  access_token?: string;
  error?: string;
  error_description?: string;
}
interface ErrorFlujo {
  type?: "popup_closed" | "popup_failed_to_open" | "unknown";
}
interface ClienteToken {
  requestAccessToken: (opciones?: { prompt?: string }) => void;
}
declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (configuracion: {
            client_id: string;
            scope: string;
            prompt?: string;
            callback: (respuesta: RespuestaToken) => void;
            error_callback?: (error: ErrorFlujo) => void;
          }) => ClienteToken;
        };
      };
    };
  }
}

export const googleConfigurado = (): boolean => GOOGLE_CLIENT_ID.length > 0;

const libreriaLista = (): boolean => !!window.google?.accounts?.oauth2;
let promesaScript: Promise<void> | null = null;

/**
 * Carga (una sola vez) el script de Google. Debe invocarse ANTES del clic: el navegador
 * solo permite abrir la ventana emergente de forma síncrona dentro del gesto del usuario.
 */
export function cargarScriptGoogle(): Promise<void> {
  if (libreriaLista()) return Promise.resolve();
  if (promesaScript) return promesaScript;

  promesaScript = new Promise<void>((resolver, rechazar) => {
    const fallar = () => {
      promesaScript = null; // permite reintentar
      document.querySelector(`script[src="${URL_SCRIPT_GOOGLE}"]`)?.remove();
      rechazar(new ErrorAutenticacion("SCRIPT", "No pudimos cargar el servicio de Google. Revisa tu conexión o desactiva el bloqueador de contenido y vuelve a intentarlo."));
    };
    const temporizador = window.setTimeout(fallar, TIEMPO_CARGA_SCRIPT_MS);
    const script = document.createElement("script");
    script.src = URL_SCRIPT_GOOGLE;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.clearTimeout(temporizador);
      if (libreriaLista()) resolver();
      else fallar();
    };
    script.onerror = () => {
      window.clearTimeout(temporizador);
      fallar();
    };
    document.head.appendChild(script);
  });
  return promesaScript;
}

interface PerfilGoogle {
  sub?: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  email?: string;
  picture?: string;
}

/** Convierte el perfil de Google en el usuario de la aplicación (puro: se prueba sin red). */
export function perfilAUsuario(perfil: PerfilGoogle, ahora: Date = new Date()): Usuario {
  const sub = perfil.sub?.trim();
  const correo = perfil.email?.trim();
  if (!sub || !correo) {
    throw new ErrorAutenticacion("PERFIL", "Google no entregó los datos básicos de tu cuenta (identificador y correo). Inténtalo con otra cuenta.");
  }

  const partes = (perfil.name ?? "").trim().split(/\s+/).filter(Boolean);
  const nombre = perfil.given_name?.trim() || partes[0] || correo.split("@")[0];
  const apellido = perfil.family_name?.trim() || (perfil.given_name ? "" : partes.slice(1).join(" "));
  const foto = perfil.picture && /^https:\/\//i.test(perfil.picture) ? perfil.picture : undefined;

  return { id: sub, nombre, apellido, correo, foto, creadoEn: ahora.toISOString() };
}

async function leerPerfil(tokenAcceso: string): Promise<PerfilGoogle> {
  const controlador = new AbortController();
  const temporizador = window.setTimeout(() => controlador.abort(), TIEMPO_PERFIL_MS);
  try {
    const respuesta = await fetch(URL_USERINFO, { headers: { Authorization: `Bearer ${tokenAcceso}` }, signal: controlador.signal, cache: "no-store" });
    if (!respuesta.ok) throw new Error(String(respuesta.status));
    return (await respuesta.json()) as PerfilGoogle;
  } catch {
    throw new ErrorAutenticacion("RED", "Iniciaste sesión en Google, pero no pudimos leer tu perfil. Comprueba tu conexión e inténtalo de nuevo.");
  } finally {
    window.clearTimeout(temporizador);
  }
}

/**
 * Abre el selector de cuentas de Google y devuelve el usuario autenticado.
 * Hay que llamarla directamente desde el manejador del clic (sin `await` previo).
 * `prompt: select_account` obliga a elegir cuenta cada vez, así cambiar de usuario
 * es posible aunque Google recuerde otra sesión en el navegador.
 */
export function iniciarFlujoGoogle(): Promise<Usuario> {
  return new Promise<Usuario>((resolver, rechazar) => {
    if (!googleConfigurado()) {
      rechazar(new ErrorAutenticacion("CONFIGURACION", "El acceso con Google aún no está configurado (falta VITE_GOOGLE_CLIENT_ID)."));
      return;
    }
    const oauth2 = window.google?.accounts?.oauth2;
    if (!oauth2) {
      rechazar(new ErrorAutenticacion("SCRIPT", "El servicio de Google todavía no está listo. Espera un momento e inténtalo de nuevo."));
      return;
    }

    try {
      const cliente = oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "openid email profile",
        prompt: "select_account",
        callback: (respuesta) => {
          if (respuesta.error || !respuesta.access_token) {
            const denegado = respuesta.error === "access_denied";
            rechazar(
              denegado
                ? new ErrorAutenticacion("DENEGADO", "No se concedieron los permisos necesarios. Necesitamos tu nombre y correo para identificarte.")
                : new ErrorAutenticacion(
                    "CONFIGURACION",
                    respuesta.error === "invalid_request" || respuesta.error === "redirect_uri_mismatch"
                      ? "Google rechazó la solicitud. Revisa que este dominio esté registrado como origen JavaScript autorizado."
                      : "Google no pudo completar el inicio de sesión. Inténtalo de nuevo."
                  )
            );
            return;
          }
          leerPerfil(respuesta.access_token)
            .then((perfil) => resolver(perfilAUsuario(perfil)))
            .catch(rechazar);
        },
        error_callback: (error) => {
          if (error.type === "popup_closed") rechazar(new ErrorAutenticacion("CANCELADO", "Cerraste la ventana de Google antes de terminar. Cuando quieras, vuelve a intentarlo."));
          else if (error.type === "popup_failed_to_open") rechazar(new ErrorAutenticacion("POPUP_BLOQUEADO", "Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo otra vez."));
          else rechazar(new ErrorAutenticacion("DESCONOCIDO", "No pudimos completar el inicio de sesión con Google. Inténtalo de nuevo."));
        },
      });
      cliente.requestAccessToken({ prompt: "select_account" });
    } catch {
      rechazar(new ErrorAutenticacion("DESCONOCIDO", "No pudimos iniciar el acceso con Google. Recarga la página e inténtalo de nuevo."));
    }
  });
}
