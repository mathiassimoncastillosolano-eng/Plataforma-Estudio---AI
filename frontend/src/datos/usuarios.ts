import type { Usuario } from "../tipos";

// Usuario demo. En el backend real esto vendría del endpoint /auth/me.
export const usuarioSimulado: Usuario = {
  id: "u-001",
  nombre: "Juan",
  apellido: "Pérez",
  correo: "estudiante@demo.com",
  creadoEn: "2025-11-02",
};

// Credenciales aceptadas por el login mock.
export const CREDENCIALES_DEMO = {
  correo: "estudiante@demo.com",
  contrasena: "123456",
};
