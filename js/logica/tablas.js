// Lógica de "Multiplicando": avance por multiplicación, dominio y elección de preguntas.

export const ORDEN_TABLAS = [2, 5, 10, 3, 4, 1, 6, 7, 8, 9];
export const ACIERTOS_PARA_DOMINAR = 3;

const clave = (a, b) => a + 'x' + b;

/** Estado de una multiplicación: { racha: aciertos seguidos, fallos: fallos pendientes, intentos } */
export function estado(progreso, a, b) {
  return progreso[clave(a, b)] || { racha: 0, fallos: 0, intentos: 0 };
}

export function dominada(progreso, a, b) {
  return estado(progreso, a, b).racha >= ACIERTOS_PARA_DOMINAR;
}

/** Anota una respuesta. Devuelve el progreso (el mismo objeto, modificado). */
export function registrar(progreso, a, b, correcta) {
  const e = { ...estado(progreso, a, b) };
  e.intentos++;
  if (correcta) {
    e.racha++;
    if (e.racha >= ACIERTOS_PARA_DOMINAR) e.fallos = 0;
  } else {
    e.racha = 0;
    e.fallos++;
  }
  progreso[clave(a, b)] = e;
  return progreso;
}

/** Peso para elegir: las que se fallan salen más seguido hasta dominarlas. */
export function peso(progreso, a, b) {
  const e = estado(progreso, a, b);
  if (e.racha >= ACIERTOS_PARA_DOMINAR) return 1;
  return 3 + 4 * Math.min(e.fallos, 3);
}

/** Elige una pregunta al azar (con pesos) de las tablas indicadas, sin repetir la anterior. */
export function elegirPregunta(progreso, tablas, anterior = null, azar = Math.random) {
  let candidatas = [];
  for (const a of tablas) for (let b = 1; b <= 10; b++) candidatas.push({ a, b });
  if (candidatas.length > 1 && anterior) {
    candidatas = candidatas.filter(c => !(c.a === anterior.a && c.b === anterior.b));
  }
  const pesos = candidatas.map(c => peso(progreso, c.a, c.b));
  let r = azar() * pesos.reduce((x, y) => x + y, 0);
  for (let i = 0; i < candidatas.length; i++) {
    r -= pesos[i];
    if (r < 0) return candidatas[i];
  }
  return candidatas[candidatas.length - 1];
}

export function contarDominadas(progreso) {
  let n = 0;
  for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) if (dominada(progreso, a, b)) n++;
  return n;
}
