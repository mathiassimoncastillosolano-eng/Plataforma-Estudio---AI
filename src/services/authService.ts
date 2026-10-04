import type { User } from "../types";
import { DEMO_CREDENTIALS, mockUser } from "../data/users";
import { mockDelay, randomId } from "../utils/mockDelay";

// -----------------------------------------------------------------------
// Servicio de autenticación simulado.
// En producción, este archivo se reemplazará por llamadas a
// POST /api/auth/login, POST /api/auth/register, etc. contra Spring Security.
// La forma de las funciones (parámetros y Promesas que devuelven) se
// mantiene igual para minimizar los cambios en los componentes.
// -----------------------------------------------------------------------

const SESSION_KEY = "cursa.session";
const REGISTERED_USERS_KEY = "cursa.registeredUsers";

interface StoredCredentials {
  email: string;
  password: string;
  user: User;
}

function readRegisteredUsers(): StoredCredentials[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredCredentials[]) : [];
  } catch {
    return [];
  }
}

function writeRegisteredUsers(users: StoredCredentials[]) {
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
}

export async function login(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  if (
    normalizedEmail === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  ) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(mockUser));
    return mockDelay(mockUser, 600);
  }

  const registered = readRegisteredUsers().find(
    (entry) => entry.email.toLowerCase() === normalizedEmail
  );

  if (registered && registered.password === password) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(registered.user));
    return mockDelay(registered.user, 600);
  }

  return Promise.reject(
    new Error("Correo o contraseña incorrectos. Prueba con la cuenta demo.")
  );
}

export async function register(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<User> {
  const normalizedEmail = data.email.trim().toLowerCase();
  const existing = readRegisteredUsers();

  if (
    normalizedEmail === DEMO_CREDENTIALS.email ||
    existing.some((entry) => entry.email.toLowerCase() === normalizedEmail)
  ) {
    return Promise.reject(new Error("Ya existe una cuenta con este correo."));
  }

  const user: User = {
    id: randomId("u"),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    createdAt: new Date().toISOString(),
  };

  writeRegisteredUsers([
    ...existing,
    { email: data.email, password: data.password, user },
  ]);
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));

  return mockDelay(user, 800);
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
