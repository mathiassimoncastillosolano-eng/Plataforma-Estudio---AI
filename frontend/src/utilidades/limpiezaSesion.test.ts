import { beforeEach, describe, expect, it } from "vitest";
import { limpiarDatosDeUsuario } from "./limpiezaSesion";
import { establecerFuenteTema, guardarResumenes, obtenerSesion } from "../almacen/almacenSesion";
import * as auth from "../servicios/servicioAutenticacion";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("limpieza de datos al cerrar sesión", () => {
  it("borra los datos del usuario y conserva solo las preferencias de apariencia", () => {
    localStorage.setItem("estudioai.temas", "[]");
    localStorage.setItem("estudioai.estadoPreguntas.t1", "{}");
    localStorage.setItem("estudioai.configuracion", "{}");
    localStorage.setItem("estudioai.temaVisual", "dark");
    localStorage.setItem("estudioai.acento", "purple");
    localStorage.setItem("estudioai.barraLateralContraida", "1");
    sessionStorage.setItem("estudioai.ultimoResultado.t1", "{}");

    limpiarDatosDeUsuario();

    expect(Object.keys(localStorage).sort()).toEqual(["estudioai.acento", "estudioai.barraLateralContraida", "estudioai.temaVisual"]);
    expect(sessionStorage.length).toBe(0);
  });

  it("vacía el estado de estudio en memoria (fuentes, resúmenes, actividad)", () => {
    establecerFuenteTema("t1", "texto de A");
    guardarResumenes("t1", "Tema A", { general: "g", esencial: "e" } as never);
    limpiarDatosDeUsuario();
    const s = obtenerSesion();
    expect([s.fuentes, s.resumenes, s.actividad]).toEqual([{}, {}, []]);
  });

  it("cerrarSesion elimina al usuario actual y no escribe nada en el almacenamiento", () => {
    auth.cerrarSesion();
    expect(auth.obtenerUsuarioActual()).toBeNull();
    expect(localStorage.getItem("estudioai.sesion")).toBeNull();
  });
});
