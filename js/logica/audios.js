// Catálogo de todas las grabaciones que necesita cada nieta.
// El "id" es el nombre del archivo (id.wav) y lo que usa el resto de la app.

// El "id" nunca cambia (con él se guardan las voces y el avance); el nombre y el apodo sí.
// nieta1 es la mayor (cuentas hasta 1.000 con decimales); nieta2, la menor (hasta 100).
// Los nombres reales se escriben en cada dispositivo, en "Colores y nombre".
export const NOMBRES_ORIGINALES = {
  nieta1: { nombre: 'Nieta 1', corto: 'Nieta 1' },
  nieta2: { nombre: 'Nieta 2', corto: 'Nieta 2' },
};

export const PERFILES = {
  nieta1: { id: 'nieta1', nombre: 'Nieta 1', corto: 'Nieta 1', inicial: '1' },
  nieta2: { id: 'nieta2', nombre: 'Nieta 2', corto: 'Nieta 2', inicial: '2' },
};

/** Cambia el nombre y apodo de una nieta. Si vienen vacíos, vuelve a los originales. */
export function cambiarNombre(perfil, nombre, corto) {
  const p = PERFILES[perfil];
  if (!p) return;
  const original = NOMBRES_ORIGINALES[perfil];
  p.nombre = limpiarNombre(nombre) || original.nombre;
  // Sin nombre corto: el original, o el mismo nombre si es breve
  p.corto = limpiarNombre(corto).slice(0, 8) ||
    (p.nombre === original.nombre ? original.corto : p.nombre.length <= 8 ? p.nombre : p.nombre.slice(0, 6));
  // "Nieta 1" muestra "1" en su círculo; un nombre real, su primera letra
  const numero = p.nombre.match(/^Nieta (\d)$/);
  p.inicial = numero ? numero[1] : p.nombre.charAt(0).toLocaleUpperCase('es-CL');
}

export function limpiarNombre(texto) {
  return String(texto || '').replace(/\s+/g, ' ').trim().slice(0, 16);
}

export const GRUPOS = ['Teclas', 'Números', 'Frases'];

const UNIDADES = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIEZ_A_VEINTINUEVE = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis',
  'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés',
  'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = { 30: 'treinta', 40: 'cuarenta', 50: 'cincuenta', 60: 'sesenta', 70: 'setenta', 80: 'ochenta', 90: 'noventa' };
const CENTENAS = { 200: 'doscientos', 300: 'trescientos', 400: 'cuatrocientos', 500: 'quinientos',
  600: 'seiscientos', 700: 'setecientos', 800: 'ochocientos', 900: 'novecientos' };

function crearCatalogo() {
  const lista = [];
  const agregar = (id, texto, grupo, etiqueta) => lista.push({ id, texto, grupo, etiqueta });

  // Teclas (los dígitos también sirven para armar números)
  UNIDADES.forEach((t, i) => agregar('n' + i, t, 'Teclas', String(i)));
  agregar('coma', 'coma', 'Teclas', ',');
  agregar('mas', 'más', 'Teclas', '+');
  agregar('menos', 'menos', 'Teclas', '−');
  agregar('por', 'por', 'Teclas', '×');
  agregar('dividido', 'dividido', 'Teclas', '÷');
  agregar('igual', 'igual', 'Teclas', '=');
  agregar('raiz', 'raíz', 'Teclas', '√');
  agregar('cuadrado', 'al cuadrado', 'Teclas', 'x²');
  agregar('porciento', 'por ciento', 'Teclas', '%');
  agregar('inverso', 'uno partido por equis', 'Teclas', '1/x');
  agregar('borrar', 'borrar', 'Teclas', '⌫');
  agregar('borrar_todo', 'borrar todo', 'Teclas', 'AC');

  // Números para armar resultados
  DIEZ_A_VEINTINUEVE.forEach((t, i) => agregar('n' + (i + 10), t, 'Números', String(i + 10)));
  for (const [n, t] of Object.entries(DECENAS)) agregar('n' + n, t, 'Números', n);
  agregar('y', 'y', 'Números', 'y');
  agregar('n100', 'cien', 'Números', '100');
  agregar('ciento', 'ciento', 'Números', '101…');
  for (const [n, t] of Object.entries(CENTENAS)) agregar('n' + n, t, 'Números', n);
  agregar('mil', 'mil', 'Números', '1.000');
  agregar('millon', 'millón', 'Números', '1 millón');
  agregar('millones', 'millones', 'Números', 'millones');
  // Formas cortas: "un millón", "treinta y un mil", "veintiún mil"
  agregar('un', 'un', 'Números', 'un');
  agregar('veintiun', 'veintiún', 'Números', '21 mil');

  // Frases
  agregar('muy_bien', '¡Muy bien!', 'Frases');
  agregar('otra_vez', '¡Inténtalo otra vez!', 'Frases');
  agregar('no_se_puede', '¡Uy! Eso no se puede', 'Frases');
  agregar('estrella', '¡Ganaste una estrella!', 'Frases');
  agregar('cuanto_es', '¿Cuánto es…?', 'Frases');
  agregar('hola', 'Hola, soy {nombre}', 'Frases');
  return lista;
}

export const AUDIOS = crearCatalogo();
export const AUDIOS_POR_ID = Object.fromEntries(AUDIOS.map(a => [a.id, a]));

/** Texto que se dice para un audio (reemplaza {nombre} según el perfil). */
export function textoDeAudio(id, perfil) {
  const audio = AUDIOS_POR_ID[id];
  if (!audio) return id;
  const nombre = PERFILES[perfil] ? PERFILES[perfil].nombre : '';
  return audio.texto.replace('{nombre}', nombre);
}
