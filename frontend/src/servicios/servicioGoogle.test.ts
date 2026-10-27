import { describe, expect, it } from "vitest";
import { ErrorAutenticacion, perfilAUsuario } from "./servicioGoogle";

const AHORA = new Date("2026-10-27T10:00:00Z");

describe("perfilAUsuario", () => {
  it("usa el identificador estable (sub) y los datos de la cuenta autenticada", () => {
    const u = perfilAUsuario({ sub: "1122", given_name: "Ana", family_name: "Ruiz Soto", email: "ana@uni.edu", picture: "https://lh3.googleusercontent.com/a" }, AHORA);
    expect(u).toEqual({ id: "1122", nombre: "Ana", apellido: "Ruiz Soto", correo: "ana@uni.edu", foto: "https://lh3.googleusercontent.com/a", creadoEn: AHORA.toISOString() });
  });

  it("dos cuentas distintas producen perfiles distintos (cambio de usuario)", () => {
    const a = perfilAUsuario({ sub: "A", name: "Ana Ruiz", email: "a@x.com" }, AHORA);
    const b = perfilAUsuario({ sub: "B", name: "Luis Paz", email: "b@x.com" }, AHORA);
    expect([b.id, b.nombre, b.apellido, b.correo]).toEqual(["B", "Luis", "Paz", "b@x.com"]);
    expect(a.id).not.toBe(b.id);
  });

  it("completa los campos opcionales ausentes con un respaldo coherente", () => {
    const u = perfilAUsuario({ sub: "9", email: "sin.nombre@x.com" }, AHORA);
    expect(u.nombre).toBe("sin.nombre");
    expect(u.apellido).toBe("");
    expect(u.foto).toBeUndefined();
  });

  it("descarta fotos que no sean https", () => {
    expect(perfilAUsuario({ sub: "9", email: "a@x.com", picture: "http://inseguro/x.png" }, AHORA).foto).toBeUndefined();
  });

  it("rechaza perfiles sin identificador o sin correo", () => {
    expect(() => perfilAUsuario({ email: "a@x.com" })).toThrow(ErrorAutenticacion);
    expect(() => perfilAUsuario({ sub: "1" })).toThrow(ErrorAutenticacion);
  });
});
