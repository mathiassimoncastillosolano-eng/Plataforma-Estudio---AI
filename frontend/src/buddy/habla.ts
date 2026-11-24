export interface PasoHabla {
  apertura: number;
  duracionMs: number;
}

export interface PlanHabla {
  pasos: PasoHabla[];
  duracionMs: number;
  silabas: number;
}

const APERTURA_VOCAL: Record<string, number> = { a: 1, o: 0.8, e: 0.64, u: 0.5, i: 0.4 };
const SILABA_ABIERTA_MS = 92;
const SILABA_CERRADA_MS = 48;
const ENTRE_PALABRAS_MS = 72;
const PAUSA_COMA_MS = 240;
const PAUSA_FINAL_MS = 440;
const FUERTES = "aeoáéó";
const VOCALES = "aeiouáéíóúü";

function base(vocal: string): string {
  return vocal.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function nucleos(palabra: string): string[] {
  const salida: string[] = [];
  const grupos = palabra.toLowerCase().match(new RegExp(`[${VOCALES}]+`, "g")) ?? [];
  for (const grupo of grupos) {
    let actual = grupo[0];
    for (let i = 1; i < grupo.length; i++) {
      const previa = grupo[i - 1];
      const hiato = FUERTES.includes(previa) && FUERTES.includes(grupo[i]);
      if (hiato) {
        salida.push(actual);
        actual = grupo[i];
      } else if (FUERTES.includes(grupo[i])) actual = grupo[i];
    }
    salida.push(actual);
  }
  return salida;
}

function silabasDe(palabra: string): string[] {
  if (palabra === "%") return ["o", "i", "e"];
  const limpia = palabra.replace(/[^\p{L}\p{N}]/gu, "");
  if (!limpia) return [];
  const sonidos = nucleos(limpia);
  if (sonidos.length > 0) return sonidos.map(base);
  const numero = /\d/.test(limpia) ? Math.max(1, Math.ceil(limpia.length / 2)) : 1;
  return Array.from({ length: numero }, (_, i) => (i % 2 === 0 ? "e" : "o"));
}

function pausaTrasPalabra(palabra: string): number {
  if (/[.!?…]+["»)]*$/u.test(palabra)) return PAUSA_FINAL_MS;
  if (/[,;:—–]+["»)]*$/u.test(palabra)) return PAUSA_COMA_MS;
  return 0;
}

export function planificarHabla(texto: string): PlanHabla {
  const palabras = texto.split(/\s+/).filter((p) => /[\p{L}\p{N}%]/u.test(p));
  const pasos: PasoHabla[] = [];
  let silabas = 0;

  palabras.forEach((palabra, indice) => {
    const sonidos = silabasDe(palabra);
    sonidos.forEach((vocal, posicion) => {
      const ultima = posicion === sonidos.length - 1;
      const apertura = (APERTURA_VOCAL[vocal] ?? 0.6) * (ultima && sonidos.length > 1 ? 0.88 : 1);
      pasos.push({ apertura: Math.round(apertura * 100) / 100, duracionMs: SILABA_ABIERTA_MS });
      silabas++;
      if (!ultima) pasos.push({ apertura: 0.14, duracionMs: SILABA_CERRADA_MS });
    });
    const pausa = pausaTrasPalabra(palabra);
    const final = indice === palabras.length - 1;
    if (!final) pasos.push({ apertura: 0, duracionMs: pausa > 0 ? pausa : ENTRE_PALABRAS_MS });
  });

  pasos.push({ apertura: 0, duracionMs: 0 });
  const duracionMs = pasos.reduce((total, p) => total + p.duracionMs, 0);
  return { pasos, duracionMs, silabas };
}
