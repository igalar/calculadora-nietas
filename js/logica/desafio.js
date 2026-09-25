// Lógica del "Desafío": sumas y restas según la edad.
import { numeroACanonico } from './numeros.js';

export const ACIERTOS_POR_ESTRELLA = 5;

const entre = (min, max, azar) => min + Math.floor(azar() * (max - min + 1));

/**
 * Genera una pregunta. Nieta 2 (la menor): resultados hasta 100. Nieta 1 (la mayor):
 * hasta 1.000 y a veces con un decimal. Nunca da resultados negativos.
 * Devuelve { a, b, op: '+' | '-', resultado } con números como texto canónico ("12.5").
 */
export function generarPregunta(perfil, azar = Math.random) {
  const mayor = perfil === 'nieta1';
  const conDecimal = mayor && azar() < 0.25;
  const escala = conDecimal ? 10 : 1;            // se trabaja en décimas para no tener errores de redondeo
  const maximo = (mayor ? 1000 : 100) * escala;
  const minimo = conDecimal ? 11 : 2;
  const op = azar() < 0.5 ? '+' : '-';
  let a, b, r;
  if (op === '+') {
    r = entre(minimo, maximo, azar);
    a = entre(1, r - 1, azar);
    b = r - a;
  } else {
    a = entre(minimo, maximo, azar);
    b = entre(1, a - 1, azar);
    r = a - b;
  }
  const texto = n => numeroACanonico(n / escala);
  return { a: texto(a), b: texto(b), op, resultado: texto(r) };
}

/**
 * Ordena la cuenta "como en el cuaderno": cada cifra en su columna, alineadas por la
 * derecha y por la coma. a y b son textos canónicos ("12.5"); respuesta es lo que escribe
 * la niña ("16,2"). Devuelve { filas: [a, b, respuesta], enteras } donde cada fila es una
 * lista de celdas ('' = vacía, ',' = coma) del mismo largo y "enteras" es cuántas columnas
 * van antes de la coma.
 */
export function cuentaEnColumnas(a, b, respuesta = '', resultado = '') {
  const partes = s => {
    const [entero, decimal] = String(s).replace(',', '.').split('.');
    return { entero: entero || '', decimal: decimal ?? null };
  };
  const pa = partes(a), pb = partes(b), pr = partes(respuesta);
  const enteras = Math.max(pa.entero.length, pb.entero.length, pr.entero.length, 1);
  const hayDecimales = [pa, pb, pr, partes(resultado)].some(p => p.decimal !== null);
  const decimales = hayDecimales
    ? Math.max(1, ...[pa, pb, pr].map(p => (p.decimal || '').length))
    : 0;

  const fila = p => {
    const celdas = [...p.entero.padStart(enteras, ' ')].map(c => (c === ' ' ? '' : c));
    if (decimales) {
      celdas.push(p.decimal !== null ? ',' : '');
      const d = [...(p.decimal || '')];
      for (let i = 0; i < decimales; i++) celdas.push(d[i] || '');
    }
    return celdas;
  };
  return { filas: [fila(pa), fila(pb), fila(pr)], enteras };
}

/** Compara la respuesta escrita (con coma o punto) con el resultado. */
export function respuestaCorrecta(respuesta, resultado) {
  const n = Number(String(respuesta).replace(',', '.'));
  return respuesta !== '' && Number.isFinite(n) && Math.abs(n - Number(resultado)) < 1e-9;
}
