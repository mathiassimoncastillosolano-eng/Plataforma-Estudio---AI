import { describe, expect, it } from "vitest";
import { nivelBarra } from "./nivelBarra";

describe("nivel de la barra de dominio", () => {
  it("clasifica en los límites de cada tramo", () => {
    expect(nivelBarra(0)).toBe("inicial");
    expect(nivelBarra(25)).toBe("inicial");
    expect(nivelBarra(26)).toBe("medio");
    expect(nivelBarra(50)).toBe("medio");
    expect(nivelBarra(51)).toBe("alto");
    expect(nivelBarra(75)).toBe("alto");
    expect(nivelBarra(76)).toBe("maestria");
    expect(nivelBarra(100)).toBe("maestria");
  });
});
