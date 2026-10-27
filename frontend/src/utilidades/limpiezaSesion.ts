import { reiniciarSesionEstudio } from "../almacen/almacenSesion";

// Datos que dependen de la persona que usa la app (temas creados, estado de preguntas,
// configuración de pruebas, resultados…). Se borran al cerrar sesión y antes de iniciar
// otra, para que la cuenta B nunca vea restos de la cuenta A.
//
// Las preferencias de APARIENCIA (tema claro/oscuro, color de acento, barra lateral) no
// son datos de la persona y se conservan.
const PREFIJO_DATOS = "estudioai.";
const CLAVES_CONSERVADAS = new Set(["estudioai.temaVisual", "estudioai.acento", "estudioai.barraLateralContraida"]);

function borrarClaves(almacen: Storage | undefined) {
  if (!almacen) return;
  try {
    const claves: string[] = [];
    for (let i = 0; i < almacen.length; i += 1) {
      const clave = almacen.key(i);
      if (clave && clave.startsWith(PREFIJO_DATOS) && !CLAVES_CONSERVADAS.has(clave)) claves.push(clave);
    }
    claves.forEach((clave) => almacen.removeItem(clave));
  } catch {
    /* almacenamiento no disponible: no hay nada que limpiar */
  }
}

export function limpiarDatosDeUsuario(): void {
  reiniciarSesionEstudio();
  borrarClaves(typeof localStorage === "undefined" ? undefined : localStorage);
  borrarClaves(typeof sessionStorage === "undefined" ? undefined : sessionStorage);
}
