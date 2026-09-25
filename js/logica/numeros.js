// Conversión de números a la secuencia de audios en español de Chile,
// y formato chileno (punto de miles, coma decimal).
import { textoDeAudio } from './audios.js';

// 1..99. "apocope" = el número va antes de "mil" o "millones" (uno → un, veintiuno → veintiún)
function decenas(n, apocope) {
  if (n < 30) {
    if (apocope && n === 1) return ['un'];
    if (apocope && n === 21) return ['veintiun'];
    return ['n' + n];
  }
  const d = Math.floor(n / 10) * 10;
  const u = n % 10;
  if (u === 0) return ['n' + d];
  return ['n' + d, 'y', apocope && u === 1 ? 'un' : 'n' + u];
}

// 1..999
function centenas(n, apocope) {
  if (n === 100) return ['n100'];
  const c = Math.floor(n / 100);
  const r = n % 100;
  const t = [];
  if (c === 1) t.push('ciento');
  else if (c > 1) t.push('n' + c * 100);
  if (r > 0) t.push(...decenas(r, apocope));
  return t;
}

// 1..999.999
function menorQueMillon(n, apocope) {
  const miles = Math.floor(n / 1000);
  const resto = n % 1000;
  const t = [];
  if (miles === 1) t.push('mil');
  else if (miles > 1) t.push(...centenas(miles, true), 'mil');
  if (resto > 0) t.push(...centenas(resto, apocope));
  return t;
}

/** Entero no negativo (hasta 999.999.999.999) → audios. */
export function enteroATokens(n) {
  if (n === 0) return ['n0'];
  const millones = Math.floor(n / 1e6);
  const resto = n % 1e6;
  const t = [];
  if (millones === 1) t.push('un', 'millon');
  else if (millones > 1) t.push(...menorQueMillon(millones, true), 'millones');
  if (resto > 0) t.push(...menorQueMillon(resto, false));
  return t;
}

// Parte decimal: hasta 3 cifras se lee como número ("coma veinticinco", "coma cero cinco");
// más largas, cifra por cifra ("coma tres tres tres tres").
function decimalesATokens(cifras) {
  if (cifras.length > 3) return [...cifras].map(c => 'n' + c);
  const t = [];
  let i = 0;
  while (i < cifras.length - 1 && cifras[i] === '0') { t.push('n0'); i++; }
  t.push(...enteroATokens(Number(cifras.slice(i))));
  return t;
}

/**
 * Número (o texto como "-12.5" o "-12,5") → lista de ids de audio.
 * Ej: "-3,25" → ['menos', 'n3', 'coma', 'n25']
 */
export function numeroATokens(valor) {
  let s = typeof valor === 'number' ? numeroACanonico(valor) : String(valor).trim().replace(',', '.');
  const t = [];
  if (s.startsWith('-')) { t.push('menos'); s = s.slice(1); }
  const [entero, decimales] = s.split('.');
  t.push(...enteroATokens(Number(entero || '0')));
  if (decimales) t.push('coma', ...decimalesATokens(decimales));
  return t;
}

/** Lista de audios → texto para leer (burbuja y voz de respaldo). */
export function tokensATexto(tokens, perfil) {
  return tokens.map(id => textoDeAudio(id, perfil)).join(' ');
}

/** Número de JavaScript → texto canónico sin exponente ("0.0000001", "-12.5"). */
export function numeroACanonico(n) {
  if (Object.is(n, -0) || n === 0) return '0';
  let s = String(n);
  if (!/e/i.test(s)) return s;
  s = n.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
  return s;
}

/** Texto canónico ("-1234567.5") → formato chileno ("-1.234.567,5"). Respeta la coma al final mientras se escribe. */
export function formatoChile(canonico) {
  let s = String(canonico);
  let signo = '';
  if (s.startsWith('-')) { signo = '-'; s = s.slice(1); }
  const [entero, decimales] = s.split('.');
  const conMiles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return signo + conMiles + (decimales !== undefined ? ',' + decimales : '');
}
