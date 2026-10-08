import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Usuario } from "../tipos";
import * as authService from "../servicios/servicioAutenticacion";

interface ValorContextoAutenticacion {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<Usuario>;
  registrar: (datos: { nombre: string; apellido: string; correo: string; contrasena: string }) => Promise<Usuario>;
  cerrarSesion: () => void;
}

const ContextoAutenticacion = createContext<ValorContextoAutenticacion | undefined>(undefined);

export function ProveedorAutenticacion({ children }: { children: ReactNode }) {
  const [usuario, establecerUsuario] = useState<Usuario | null>(() => authService.obtenerUsuarioActual());

  const iniciarSesion = useCallback(async (correo: string, contrasena: string) => {
    const usuarioAutenticado = await authService.iniciarSesion(correo, contrasena);
    establecerUsuario(usuarioAutenticado);
    return usuarioAutenticado;
  }, []);

  const registrar = useCallback(
    async (datos: { nombre: string; apellido: string; correo: string; contrasena: string }) => {
      const usuarioNuevo = await authService.registrar(datos);
      establecerUsuario(usuarioNuevo);
      return usuarioNuevo;
    },
    []
  );

  const cerrarSesion = useCallback(() => {
    authService.cerrarSesion();
    establecerUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ usuario, estaAutenticado: usuario !== null, iniciarSesion, registrar, cerrarSesion }),
    [usuario, iniciarSesion, registrar, cerrarSesion]
  );

  return <ContextoAutenticacion.Provider value={valor}>{children}</ContextoAutenticacion.Provider>;
}

export function useAutenticacion(): ValorContextoAutenticacion {
  const ctx = useContext(ContextoAutenticacion);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
}
