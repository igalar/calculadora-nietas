// Pruebas automáticas de la lógica. Se ejecutan abriendo pruebas/index.html en el navegador.
import { Calculadora, ajustarResultado } from '../js/logica/calculadora.js';
import { numeroATokens, tokensATexto, formatoChile, numeroACanonico } from '../js/logica/numeros.js';
import { AUDIOS, AUDIOS_POR_ID, PERFILES, cambiarNombre } from '../js/logica/audios.js';
import { registrar, dominada, elegirPregunta, peso, contarDominadas } from '../js/logica/tablas.js';
import { generarPregunta, respuestaCorrecta, cuentaEnColumnas } from '../js/logica/desafio.js';
import { PALETAS, COLORES_ORIGINALES, temaDesde, contraste, mezclar, oscurecer } from '../js/logica/colores.js';
import { crearZip, leerZip, crc32 } from '../js/logica/zip.js';
import { recortarSilencio, codificarWav, normalizar } from '../js/logica/wav.js';

const resultados = [];
async function prueba(nombre, fn) {
  try { const extra = await fn(); resultados.push({ nombre: nombre + (extra ? ` (${extra})` : ''), ok: true }); }
  catch (e) { resultados.push({ nombre, ok: false, error: e.message }); }
}
function igual(obtenido, esperado, detalle = '') {
  const a = JSON.stringify(obtenido), b = JSON.stringify(esperado);
  if (a !== b) throw new Error(`${detalle} obtenido ${a}, esperado ${b}`);
}
function verdadero(v, detalle) { if (!v) throw new Error(detalle || 'se esperaba verdadero'); }

// Presiona una secuencia de teclas separadas por espacios y devuelve la pantalla
function calcular(teclas, calc = new Calculadora()) {
  let voz = [];
  for (const t of teclas.split(' ')) voz = calc.presionar(t);
  return { pantalla: calc.pantalla, voz, calc };
}
const texto = n => tokensATexto(numeroATokens(n), 'nieta1');

// ---------- Números a palabras ----------
const casosPalabras = [
  [0, 'cero'], [1, 'uno'], [7, 'siete'], [15, 'quince'], [16, 'dieciséis'], [21, 'veintiuno'],
  [22, 'veintidós'], [29, 'veintinueve'], [30, 'treinta'], [31, 'treinta y uno'], [45, 'cuarenta y cinco'],
  [99, 'noventa y nueve'], [100, 'cien'], [101, 'ciento uno'], [110, 'ciento diez'], [121, 'ciento veintiuno'],
  [200, 'doscientos'], [555, 'quinientos cincuenta y cinco'], [999, 'novecientos noventa y nueve'],
  [1000, 'mil'], [1001, 'mil uno'], [1100, 'mil cien'], [2000, 'dos mil'], [21000, 'veintiún mil'],
  [31000, 'treinta y un mil'], [100000, 'cien mil'], [101000, 'ciento un mil'], [121121, 'ciento veintiún mil ciento veintiuno'],
  [999999, 'novecientos noventa y nueve mil novecientos noventa y nueve'],
  [1000000, 'un millón'], [1000001, 'un millón uno'], [2000000, 'dos millones'], [21000000, 'veintiún millones'],
  [1234567, 'un millón doscientos treinta y cuatro mil quinientos sesenta y siete'],
  [1000000000, 'mil millones'], [2500000000, 'dos mil quinientos millones'],
  [999999999999, 'novecientos noventa y nueve mil novecientos noventa y nueve millones novecientos noventa y nueve mil novecientos noventa y nueve'],
  ['-5', 'menos cinco'], ['0.5', 'cero coma cinco'], ['3.25', 'tres coma veinticinco'], ['0.05', 'cero coma cero cinco'],
  ['12,5', 'doce coma cinco'], ['-0.75', 'menos cero coma setenta y cinco'], ['1.125', 'uno coma ciento veinticinco'],
  ['0.3333', 'cero coma tres tres tres tres'], ['2.001', 'dos coma cero cero uno'],
];
for (const [n, esperado] of casosPalabras) {
  await prueba(`palabras: ${n} → ${esperado}`, () => igual(texto(n), esperado));
}
await prueba('palabras: todos los audios usados existen en el catálogo', () => {
  for (let n = 0; n <= 2000; n++) for (const id of numeroATokens(n)) verdadero(AUDIOS_POR_ID[id], `falta audio ${id} para ${n}`);
  for (const n of [1e6, 21e6, 1e9, 123456789012, '-3.25']) for (const id of numeroATokens(n)) verdadero(AUDIOS_POR_ID[id], `falta ${id}`);
});
await prueba('palabras: tokens exactos de 31', () => igual(numeroATokens(31), ['n30', 'y', 'n1']));
await prueba('palabras: frase con nombre del perfil', () => igual(tokensATexto(['hola'], 'nieta2'), 'Hola, soy Nieta 2'));
await prueba('catálogo: 71 audios con ids únicos', () => {
  igual(AUDIOS.length, 71);
  igual(new Set(AUDIOS.map(a => a.id)).size, 71);
  igual(AUDIOS.filter(a => a.grupo === 'Teclas').length, 22);
});

// ---------- Formato chileno ----------
await prueba('formato: miles con punto y decimales con coma', () => {
  igual(formatoChile('1234567.89'), '1.234.567,89');
  igual(formatoChile('-1000'), '-1.000');
  igual(formatoChile('999'), '999');
  igual(formatoChile('12.'), '12,');
  igual(formatoChile('0.5'), '0,5');
});
await prueba('formato: canónico sin exponente', () => {
  igual(numeroACanonico(1e-7), '0.0000001');
  igual(numeroACanonico(-0), '0');
  igual(numeroACanonico(12.5), '12.5');
});

// ---------- Calculadora ----------
const casosCalculadora = [
  ['3 × 2 =', '6'], ['1 2 + 7 - 4 =', '15'], ['0 , 1 + 0 , 2 =', '0,3'], ['0 , 3 - 0 , 1 =', '0,2'],
  ['1 , 1 × 1 , 1 =', '1,21'], ['1 ÷ 3 =', '0,33333333333'], ['2 ÷ 3 =', '0,66666666667'],
  ['1 0 ÷ 4 =', '2,5'], ['7 + × 2 =', '14'], ['2 + 3 = × 4 =', '20'], ['1 2 + 3 × 2 =', '30'],
  ['2 0 0 + 1 0 % =', '220'], ['2 0 0 × 1 0 % =', '20'], ['5 0 %', '0,5'], ['9 raiz', '3'], ['2 raiz', '1,41421356237'],
  ['5 x2', '25'], ['4 inv', '0,25'], ['5 × =', '25'], ['3 - 8 =', '-5'],
  ['1 , 5 , 5', '1,55'], ['1 2 3 borrar', '12'], ['7 × 5 = borrar', '3'], ['7 × 5 = borrar 8', '38'],
  ['3 - 8 = borrar', '0'], ['1 2 + 3 4 borrar =', '15'], ['9 borrar borrar', '0'],
  ['1 2 3 4 5 6 7 8 9 0 1 2 3 4', '123.456.789.012'], ['9 9 9 9 9 9 9 9 9 9 9 9 × 1 0 =', '¡Uy! Es muy grande'],
  ['5 ÷ 0 =', '¡Uy! Eso no se puede'], ['0 inv', '¡Uy! Eso no se puede'], ['3 - 8 = raiz', '¡Uy! Eso no se puede'],
  ['5 ÷ 0 = 8', '8'], ['5 ÷ 0 = ac', '0'], [', 5', '0,5'], ['1 0 0 0 0 0 0', '1.000.000'],
  ['1 ÷ 8 =', '0,125'], ['0 , 1 × 3 =', '0,3'],
];
for (const [teclas, esperado] of casosCalculadora) {
  await prueba(`calculadora: ${teclas} → ${esperado}`, () => igual(calcular(teclas).pantalla, esperado));
}
await prueba('calculadora: la voz dice "igual" y el resultado', () => {
  igual(calcular('7 × 5 =').voz, ['igual', 'n30', 'y', 'n5']);
});
await prueba('calculadora: la voz dice cada tecla', () => {
  const c = new Calculadora();
  igual(c.presionar('7'), ['n7']);
  igual(c.presionar(','), ['coma']);
  igual(c.presionar('+'), ['mas']);
  igual(c.presionar('-'), ['menos']);
  igual(c.presionar('×'), ['por']);
  igual(c.presionar('÷'), ['dividido']);
  igual(c.presionar('borrar'), ['borrar']);
  igual(c.presionar('ac'), ['borrar_todo']);
});
await prueba('calculadora: error dice "no se puede"', () => igual(calcular('5 ÷ 0 =').voz, ['no_se_puede']));
await prueba('calculadora: expresión pequeña', () => {
  const c = new Calculadora();
  calcular('1 2 ×', c);
  igual(c.expresion, '12 ×');
  calcular('3 =', c);
  igual(c.expresion, '12 × 3 =');
});
await prueba('calculadora: máximo 12 dígitos al escribir', () => {
  const { calc } = calcular('1 1 1 1 1 1 1 1 1 1 1 1 1 1');
  igual(calc.actual.length, 12);
});
await prueba('calculadora: ajustarResultado', () => {
  igual(ajustarResultado(0.1 + 0.2), '0.3');
  igual(ajustarResultado(-0.0000000000001), '0');
  igual(ajustarResultado(123456789012), '123456789012');
});

// ---------- Tablas ----------
await prueba('tablas: se domina con 3 aciertos seguidos', () => {
  const p = {};
  registrar(p, 3, 4, true); registrar(p, 3, 4, true);
  igual(dominada(p, 3, 4), false);
  registrar(p, 3, 4, true);
  igual(dominada(p, 3, 4), true);
  igual(contarDominadas(p), 1);
});
await prueba('tablas: un fallo reinicia la racha', () => {
  const p = {};
  registrar(p, 7, 8, true); registrar(p, 7, 8, true); registrar(p, 7, 8, false); registrar(p, 7, 8, true);
  igual(dominada(p, 7, 8), false);
});
await prueba('tablas: las falladas pesan más', () => {
  const p = {};
  registrar(p, 6, 7, false); registrar(p, 6, 7, false);
  verdadero(peso(p, 6, 7) > peso(p, 6, 8), 'la fallada debería pesar más');
  registrar(p, 6, 7, true); registrar(p, 6, 7, true); registrar(p, 6, 7, true);
  igual(peso(p, 6, 7), 1);
});
await prueba('tablas: salen más seguido las falladas', () => {
  const p = {};
  for (let i = 0; i < 3; i++) registrar(p, 7, 8, false);
  let veces = 0;
  for (let i = 0; i < 2000; i++) { const q = elegirPregunta(p, [7]); if (q.b === 8) veces++; }
  verdadero(veces > 2000 / 10 * 2, `7×8 salió ${veces} veces de 2000`);
});
await prueba('tablas: solo de las tablas elegidas y sin repetir la anterior', () => {
  let anterior = null;
  for (let i = 0; i < 500; i++) {
    const q = elegirPregunta({}, [2, 5], anterior);
    verdadero(q.a === 2 || q.a === 5, 'tabla no elegida');
    verdadero(!anterior || q.a !== anterior.a || q.b !== anterior.b, 'repitió la anterior');
    anterior = q;
  }
});

// ---------- Desafío ----------
await prueba('desafío: la menor hasta 100, sin negativos ni decimales', () => {
  for (let i = 0; i < 2000; i++) {
    const q = generarPregunta('nieta2');
    const r = Number(q.resultado);
    verdadero(r >= 0 && r <= 100 && Number.isInteger(r), `resultado ${q.resultado}`);
    verdadero(Number(q.a) > 0 && Number(q.b) > 0, 'operandos positivos');
    verdadero(Number(q.op === '+' ? Number(q.a) + Number(q.b) : Number(q.a) - Number(q.b)) === r, 'cuenta correcta');
  }
});
await prueba('desafío: la mayor hasta 1.000 y a veces con decimales exactos', () => {
  let decimales = 0;
  for (let i = 0; i < 2000; i++) {
    const q = generarPregunta('nieta1');
    const r = Number(q.resultado);
    verdadero(r >= 0 && r <= 1000, `resultado ${q.resultado}`);
    if (q.resultado.includes('.')) decimales++;
    const cuenta = q.op === '+' ? Number(q.a) + Number(q.b) : Number(q.a) - Number(q.b);
    verdadero(Math.abs(cuenta - r) < 1e-9, `cuenta ${q.a} ${q.op} ${q.b} = ${q.resultado}`);
    for (const x of [q.a, q.b, q.resultado]) verdadero(!/\.\d{2,}/.test(x), `máximo un decimal: ${x}`);
  }
  verdadero(decimales > 100, `solo ${decimales} con decimales`);
});
await prueba('desafío: acepta coma o punto', () => {
  verdadero(respuestaCorrecta('12,5', '12.5'));
  verdadero(respuestaCorrecta('12.5', '12.5'));
  verdadero(!respuestaCorrecta('12', '12.5'));
  verdadero(!respuestaCorrecta('', '0'));
});

// ---------- Zip ----------
await prueba('zip: crc32 conocido', () => igual(crc32(new TextEncoder().encode('123456789')), 0xCBF43926));
await prueba('zip: crear y leer de vuelta', async () => {
  const a = new Uint8Array([1, 2, 3, 4, 5]);
  const b = new TextEncoder().encode('Hola, soy Nieta 1');
  const zip = crearZip([{ nombre: 'nieta1/n7.wav', datos: a }, { nombre: 'leeme.txt', datos: b }]);
  const leidos = await leerZip(zip);
  igual(leidos.map(x => x.nombre), ['nieta1/n7.wav', 'leeme.txt']);
  igual([...leidos[0].datos], [1, 2, 3, 4, 5]);
  igual(new TextDecoder().decode(leidos[1].datos), 'Hola, soy Nieta 1');
});
await prueba('zip: lee archivos comprimidos con deflate', async () => {
  // zip creado aparte con compresión (contiene "hola.txt" = "hola hola hola hola")
  const original = new TextEncoder().encode('hola hola hola hola');
  const flujo = new Blob([original]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const comprimido = new Uint8Array(await new Response(flujo).arrayBuffer());
  const zip = crearZip([{ nombre: 'hola.txt', datos: comprimido }]);
  // marcar como deflate en cabecera local (offset 8) y central
  const v = new DataView(zip.buffer);
  v.setUint16(8, 8, true);
  const central = 30 + 8 + comprimido.length;
  v.setUint16(central + 10, 8, true);
  const leidos = await leerZip(zip);
  igual(new TextDecoder().decode(leidos[0].datos), 'hola hola hola hola');
});
await prueba('zip: rechaza archivos que no son zip', async () => {
  let fallo = false;
  try { await leerZip(new Uint8Array(100)); } catch { fallo = true; }
  verdadero(fallo);
});

// ---------- WAV ----------
await prueba('wav: recorta silencio al inicio y al final', () => {
  const f = 8000;
  const m = new Float32Array(f * 3);           // 3 s: 1 s silencio, 1 s voz, 1 s silencio
  for (let i = f; i < 2 * f; i++) m[i] = 0.5 * Math.sin(i / 5);
  for (let i = 0; i < m.length; i++) m[i] += (Math.random() - 0.5) * 0.002; // ruido de fondo
  const r = recortarSilencio(m, f);
  verdadero(r.length > f && r.length < f * 1.3, `duración ${r.length / f} s`);
});
await prueba('wav: grabación en silencio queda vacía', () => igual(recortarSilencio(new Float32Array(8000), 8000).length, 0));
await prueba('wav: normalizar sube el volumen', () => {
  const r = normalizar(new Float32Array([0.1, -0.2, 0.05]));
  verdadero(Math.abs(Math.max(...r.map(Math.abs)) - 0.9) < 1e-6);
});
await prueba('wav: cabecera correcta', () => {
  const w = codificarWav(new Float32Array(100), 24000);
  igual(w.length, 244);
  igual(new TextDecoder().decode(w.subarray(0, 4)), 'RIFF');
  igual(new DataView(w.buffer).getUint32(24, true), 24000);
});

// ---------- Colores ----------
await prueba('colores: los originales dan exactamente el diseño pedido', () => {
  const f = temaDesde('nieta1', COLORES_ORIGINALES.nieta1);
  igual([f.fondo, f.texto, f.texto2, f.fn, f.op, f.acento, f['sombra-acento']],
    ['#FFF0F4', '#5E1A2E', '#86455A', '#FBDDE6', '#FAC9D8', '#EE86A9', '#C25580']);
  const a = temaDesde('nieta2', COLORES_ORIGINALES.nieta2);
  igual([a.fondo, a.texto, a.texto2, a.fn, a.op, a.acento, a['sombra-acento']],
    ['#EEF6FC', '#14284B', '#40597D', '#DCEBF7', '#C9E4F8', '#86C8F0', '#4E9DD0']);
});
await prueba('colores: todas las combinaciones se leen bien (contraste ≥ 4,5)', () => {
  let peor = 99, caso = '';
  for (const [fondo] of PALETAS.fondo) for (const [teclas] of PALETAS.teclas) for (const [acento] of PALETAS.acento) {
    const t = temaDesde('nieta1', { fondo, teclas, acento });
    for (const [nombre, sobre, color] of [
      ['texto/fondo', t.fondo, t.texto], ['texto/teclas', t.op, t.texto], ['texto/funciones', t.fn, t.texto],
      ['texto/botón', t.acento, t.texto], ['texto/blanco', '#FFFFFF', t.texto], ['secundario/fondo', t.fondo, t.texto2],
      ['secundario/blanco', '#FFFFFF', t.texto2],
    ]) {
      const c = contraste(sobre, color);
      if (c < peor) { peor = c; caso = `${nombre} con fondo ${fondo}, teclas ${teclas}, botón ${acento}`; }
    }
  }
  verdadero(peor >= 4.5, `contraste ${peor.toFixed(2)} en ${caso}`);
  return `peor contraste ${peor.toFixed(2)}`;
});
await prueba('colores: utilidades', () => {
  igual(mezclar('#000000', '#FFFFFF', 0.5), '#808080');
  igual(Math.round(contraste('#000000', '#FFFFFF')), 21);
  verdadero(contraste(oscurecer('#EE86A9', 0.2), '#FFFFFF') > contraste('#EE86A9', '#FFFFFF'), 'oscurecer no oscureció');
});

// ---------- Nombres ----------
await prueba('nombres: cambiar nombre, apodo e inicial', () => {
  cambiarNombre('nieta2', '  ana   maría ', 'Anita');
  igual([PERFILES.nieta2.nombre, PERFILES.nieta2.corto, PERFILES.nieta2.inicial], ['ana maría', 'Anita', 'A']);
  igual(tokensATexto(['hola'], 'nieta2'), 'Hola, soy ana maría');
  cambiarNombre('nieta2', 'Ñeca', '');
  igual([PERFILES.nieta2.corto, PERFILES.nieta2.inicial], ['Ñeca', 'Ñ']);
  cambiarNombre('nieta2', '', '');
  igual([PERFILES.nieta2.nombre, PERFILES.nieta2.corto, PERFILES.nieta2.inicial], ['Nieta 2', 'Nieta 2', '2']);
  cambiarNombre('nieta1', 'Maximiliana', '');
  igual([PERFILES.nieta1.corto, PERFILES.nieta1.inicial], ['Maximi', 'M']);
  cambiarNombre('nieta1', '', '');
});

// ---------- Cuenta en columnas ----------
await prueba('columnas: enteros alineados a la derecha', () => {
  const { filas, enteras } = cuentaEnColumnas('74', '142', '');
  igual(filas, [['', '7', '4'], ['1', '4', '2'], ['', '', '']]);
  igual(enteras, 3);
});
await prueba('columnas: la respuesta ocupa sus columnas', () => {
  igual(cuentaEnColumnas('74', '142', '216').filas[2], ['2', '1', '6']);
  igual(cuentaEnColumnas('95', '8', '103').filas, [['', '9', '5'], ['', '', '8'], ['1', '0', '3']]);
});
await prueba('columnas: decimales alineados por la coma', () => {
  const { filas, enteras } = cuentaEnColumnas('12.5', '3.7', '16,2', '16.2');
  igual(filas, [['1', '2', ',', '5'], ['', '3', ',', '7'], ['1', '6', ',', '2']]);
  igual(enteras, 2);
});
await prueba('columnas: número sin decimales en cuenta con decimales', () => {
  const { filas } = cuentaEnColumnas('12.5', '3', '', '15.5');
  igual(filas, [['1', '2', ',', '5'], ['', '3', '', ''], ['', '', '', '']]);
});
await prueba('columnas: respuesta a medio escribir', () => {
  igual(cuentaEnColumnas('12.5', '3.7', '16', '16.2').filas[2], ['1', '6', '', '']);
  igual(cuentaEnColumnas('12.5', '3.7', '16,', '16.2').filas[2], ['1', '6', ',', '']);
});

// ---------- Mostrar resultados ----------
const fallidas = resultados.filter(r => !r.ok);
const resumen = document.getElementById('resumen');
resumen.textContent = fallidas.length === 0
  ? `✔ Todas las pruebas pasaron (${resultados.length})`
  : `✘ ${fallidas.length} de ${resultados.length} pruebas fallaron`;
resumen.className = fallidas.length ? 'mal' : 'bien';
resumen.dataset.total = resultados.length;
resumen.dataset.fallidas = fallidas.length;
const lista = document.getElementById('lista');
for (const r of [...fallidas, ...resultados.filter(r => r.ok)]) {
  const li = document.createElement('li');
  li.className = r.ok ? 'bien' : 'mal';
  li.textContent = (r.ok ? '✔ ' : '✘ ') + r.nombre + (r.error ? ' — ' + r.error : '');
  lista.appendChild(li);
}
