import type { User } from "../types";

// Usuario demo. En el backend real esto vendría del endpoint /auth/me.
export const mockUser: User = {
  id: "u-001",
  firstName: "Juan",
  lastName: "Pérez",
  email: "estudiante@demo.com",
  createdAt: "2025-11-02",
};

// Credenciales aceptadas por el login mock.
export const DEMO_CREDENTIALS = {
  email: "estudiante@demo.com",
  password: "123456",
};
