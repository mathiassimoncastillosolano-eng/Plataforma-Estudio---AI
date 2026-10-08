import type { Usuario } from "../tipos";
import { CREDENCIALES_DEMO, usuarioSimulado } from "../datos/usuarios";
import { retardoSimulado, idAleatorio } from "../utilidades/retardoSimulado";

// -----------------------------------------------------------------------
// Servicio de autenticación simulado.
// En producción, este archivo se reemplazará por llamadas a
// POST /api/auth/login, POST /api/auth/register, etc. contra Spring Security.
// La forma de las funciones (parámetros y Promesas que devuelven) se
// mantiene igual para minimizar los cambios en los componentes.
// -----------------------------------------------------------------------

const CLAVE_SESION = "estudioai.sesion";
const CLAVE_USUARIOS_REGISTRADOS = "estudioai.usuariosRegistrados";

interface CredencialesAlmacenadas {
  correo: string;
  contrasena: string;
  usuario: Usuario;
}

function leerUsuariosRegistrados(): CredencialesAlmacenadas[] {
  try {
    const bruto = localStorage.getItem(CLAVE_USUARIOS_REGISTRADOS);
    return bruto ? (JSON.parse(bruto) as CredencialesAlmacenadas[]) : [];
  } catch {
    return [];
  }
}

function escribirUsuariosRegistrados(usuarios: CredencialesAlmacenadas[]) {
  localStorage.setItem(CLAVE_USUARIOS_REGISTRADOS, JSON.stringify(usuarios));
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<Usuario> {
  const correoNormalizado = correo.trim().toLowerCase();

  if (
    correoNormalizado === CREDENCIALES_DEMO.correo &&
    contrasena === CREDENCIALES_DEMO.contrasena
  ) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(usuarioSimulado));
    return retardoSimulado(usuarioSimulado, 600);
  }

  const registrados = leerUsuariosRegistrados().find(
    (entrada) => entrada.correo.toLowerCase() === correoNormalizado
  );

  if (registrados && registrados.contrasena === contrasena) {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(registrados.usuario));
    return retardoSimulado(registrados.usuario, 600);
  }

  return Promise.reject(
    new Error("Correo o contraseña incorrectos. Prueba con la cuenta demo.")
  );
}

export async function registrar(datos: {
  nombre: string;
  apellido: string;
  correo: string;
  contrasena: string;
}): Promise<Usuario> {
  const correoNormalizado = datos.correo.trim().toLowerCase();
  const existente = leerUsuariosRegistrados();

  if (
    correoNormalizado === CREDENCIALES_DEMO.correo ||
    existente.some((entrada) => entrada.correo.toLowerCase() === correoNormalizado)
  ) {
    return Promise.reject(new Error("Ya existe una cuenta con este correo."));
  }

  const usuario: Usuario = {
    id: idAleatorio("u"),
    nombre: datos.nombre,
    apellido: datos.apellido,
    correo: datos.correo,
    creadoEn: new Date().toISOString(),
  };

  escribirUsuariosRegistrados([
    ...existente,
    { correo: datos.correo, contrasena: datos.contrasena, usuario },
  ]);
  localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario));

  return retardoSimulado(usuario, 800);
}

export function cerrarSesion(): void {
  localStorage.removeItem(CLAVE_SESION);
}

export function obtenerUsuarioActual(): Usuario | null {
  try {
    const bruto = localStorage.getItem(CLAVE_SESION);
    return bruto ? (JSON.parse(bruto) as Usuario) : null;
  } catch {
    return null;
  }
}

export function estaAutenticado(): boolean {
  return obtenerUsuarioActual() !== null;
}
