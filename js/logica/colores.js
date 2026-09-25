// Colores de cada nieta: ellas eligen 3 (fondo, teclas y botón principal)
// y el resto del tema (sombras, letras, bordes) se calcula a partir de esos.

export const PALETAS = {
  fondo: [
    ['#FFF0F4', 'rosa'], ['#EEF6FC', 'celeste'], ['#F3EEFC', 'lila'], ['#EEFAF2', 'menta'],
    ['#FFF4E8', 'durazno'], ['#FFFBE6', 'vainilla'], ['#EAF8F8', 'agua'], ['#FDF0EC', 'coral'],
    ['#F4F4F7', 'perla'], ['#FFFFFF', 'blanco'],
  ],
  teclas: [
    ['#FAC9D8', 'rosa'], ['#C9E4F8', 'celeste'], ['#DCCEF5', 'lila'], ['#C6EBD3', 'menta'],
    ['#FFD9B3', 'durazno'], ['#FFEEA8', 'amarillo'], ['#BFEAEA', 'agua'], ['#F8C8BC', 'coral'],
    ['#E0E0E8', 'gris'], ['#D8EDB8', 'lima'],
  ],
  acento: [
    ['#EE86A9', 'rosa'], ['#86C8F0', 'celeste'], ['#B39DEB', 'lila'], ['#7FD3A0', 'menta'],
    ['#FFAE6B', 'naranjo'], ['#F5CF4A', 'amarillo'], ['#5FCFCF', 'turquesa'], ['#F28B82', 'coral'],
    ['#A7B4C8', 'gris azulado'], ['#A8D86E', 'lima'],
  ],
};

export const COLORES_ORIGINALES = {
  nieta1: { fondo: '#FFF0F4', teclas: '#FAC9D8', acento: '#EE86A9' },
  nieta2: { fondo: '#EEF6FC', teclas: '#C9E4F8', acento: '#86C8F0' },
};

// Temas originales, exactamente como se diseñaron
const TEMAS_ORIGINALES = {
  nieta1: {
    fondo: '#FFF0F4', texto: '#5E1A2E', texto2: '#86455A', fn: '#FBDDE6', op: '#FAC9D8', acento: '#EE86A9',
    'sombra-acento': '#C25580', 'sombra-blanca': '#F1C6D4', 'sombra-fn': '#EDB9CA', 'sombra-op': '#E3A2B8',
    borde: '#F4CFDB', tarjeta: '#FFFFFF', suave: '#FFF7F9',
  },
  nieta2: {
    fondo: '#EEF6FC', texto: '#14284B', texto2: '#40597D', fn: '#DCEBF7', op: '#C9E4F8', acento: '#86C8F0',
    'sombra-acento': '#4E9DD0', 'sombra-blanca': '#C9DDEE', 'sombra-fn': '#B5D0E7', 'sombra-op': '#9FC7E6',
    borde: '#CFE2F2', tarjeta: '#FFFFFF', suave: '#F6FAFE',
  },
};

// ---------- Utilidades de color ----------

export function hexARgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbAHex([r, g, b]) {
  return '#' + [r, g, b].map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function rgbAHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

function hslARgb([h, s, l]) {
  const f = n => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  };
  return [f(0), f(8), f(4)];
}

/** Mezcla dos colores: t = 0 → a, t = 1 → b */
export function mezclar(a, b, t) {
  const x = hexARgb(a), y = hexARgb(b);
  return rgbAHex(x.map((v, i) => v + (y[i] - v) * t));
}

/** Mismo tono, más oscuro (cantidad 0..1 de la luminosidad) */
export function oscurecer(hex, cantidad) {
  const [h, s, l] = rgbAHsl(hexARgb(hex));
  return rgbAHex(hslARgb([h, Math.min(1, s * 1.05), Math.max(0, l - cantidad)]));
}

function conLuz(hex, luz, saturacion) {
  const [h, s] = rgbAHsl(hexARgb(hex));
  return rgbAHex(hslARgb([h, Math.min(s, saturacion), luz]));
}

/** Contraste WCAG entre dos colores (1 a 21). */
export function contraste(a, b) {
  const lum = hex => {
    const [r, g, bl] = hexARgb(hex).map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// ---------- Tema completo ----------

/** A partir de los 3 colores elegidos, arma todas las variables del tema. */
export function temaDesde(perfil, colores) {
  const original = COLORES_ORIGINALES[perfil];
  if (original && colores.fondo === original.fondo && colores.teclas === original.teclas && colores.acento === original.acento) {
    return { ...TEMAS_ORIGINALES[perfil] };
  }
  const { fondo, teclas, acento } = colores;
  // Letras: el tono del botón principal, muy oscuro (se lee bien sobre cualquier color claro)
  const texto = conLuz(acento, 0.2, 0.6);
  const texto2 = conLuz(acento, 0.34, 0.35);
  const fn = mezclar(teclas, '#FFFFFF', 0.45);
  return {
    fondo,
    texto,
    texto2,
    fn,
    op: teclas,
    acento,
    'sombra-acento': oscurecer(acento, 0.2),
    'sombra-blanca': mezclar(teclas, '#FFFFFF', 0.25),
    'sombra-fn': oscurecer(fn, 0.08),
    'sombra-op': oscurecer(teclas, 0.12),
    borde: mezclar(teclas, fondo, 0.4),
    tarjeta: '#FFFFFF',
    suave: mezclar(fondo, '#FFFFFF', 0.5),
  };
}

/** Texto CSS con las variables del tema, para un selector dado. */
export function cssDelTema(selector, tema) {
  return `${selector} {\n${Object.entries(tema).map(([k, v]) => `  --${k}: ${v};`).join('\n')}\n}`;
}
