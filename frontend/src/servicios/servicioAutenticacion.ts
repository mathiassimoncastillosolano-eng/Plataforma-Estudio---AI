import type { Usuario } from "../tipos";
import { iniciarFlujoGoogle } from "./servicioGoogle";
import { limpiarDatosDeUsuario } from "../utilidades/limpiezaSesion";

// -----------------------------------------------------------------------
// Sesión de la aplicación: el usuario autenticado vive SOLO en memoria.
// No hay base de datos, ni localStorage / sessionStorage / cookies propias:
// al recargar o cerrar la pestaña hay que volver a identificarse con Google.
//
// Cerrar sesión aquí NO cierra la sesión global de Google en el navegador
// (eso no está en manos de la aplicación); solo olvida el perfil y los datos
// de estudio de este usuario. El siguiente acceso vuelve a mostrar el selector
// de cuentas, de modo que se puede entrar con otra distinta.
// -----------------------------------------------------------------------

let usuarioActual: Usuario | null = null;

export function iniciarSesionConGoogle(): Promise<Usuario> {
  // Se devuelve la promesa tal cual: la ventana emergente debe abrirse dentro del gesto del clic.
  return iniciarFlujoGoogle().then((usuario) => {
    limpiarDatosDeUsuario(); // nunca heredar datos de una sesión anterior
    usuarioActual = usuario;
    return usuario;
  });
}

export function cerrarSesion(): void {
  usuarioActual = null;
  limpiarDatosDeUsuario();
}

export function obtenerUsuarioActual(): Usuario | null {
  return usuarioActual;
}
