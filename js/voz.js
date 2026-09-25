// Reproducción de la voz: usa las grabaciones de cada nieta y, si falta alguna,
// la voz del sistema (speechSynthesis) en español de Chile como respaldo.
import { leerAudio, listarAudios } from './db.js';
import { tokensATexto } from './logica/numeros.js';

const SEPARACION = 0.02;      // segundos entre palabras grabadas
let contexto = null;
const cache = new Map();      // "perfil/id" → AudioBuffer
let grabadas = new Set();     // "perfil/id" que existen
let turno = 0;                // cada nueva frase interrumpe la anterior
let fuentesActivas = [];
let vozSistema = null;

export const estado = { activa: true };

function obtenerContexto() {
  if (!contexto) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    contexto = new Ctx();
  }
  return contexto;
}

/** Hay que llamarlo desde un toque del usuario (requisito de iOS/Android). */
export function desbloquear() {
  const ctx = obtenerContexto();
  if (ctx.state === 'suspended') ctx.resume();
}

export async function actualizarLista() {
  grabadas = new Set(await listarAudios());
}

export function estaGrabado(perfil, id) {
  return grabadas.has(perfil + '/' + id);
}

export function contarGrabados(perfil, ids) {
  return ids.filter(id => estaGrabado(perfil, id)).length;
}

/** Olvida la versión guardada en memoria de un audio (después de regrabarlo). */
export function olvidar(perfil, id) {
  cache.delete(perfil + '/' + id);
}

async function buffer(perfil, id) {
  const clave = perfil + '/' + id;
  if (cache.has(clave)) return cache.get(clave);
  if (!grabadas.has(clave)) return null;
  const datos = await leerAudio(perfil, id);
  if (!datos) return null;
  try {
    const b = await obtenerContexto().decodeAudioData(datos.slice(0));
    cache.set(clave, b);
    return b;
  } catch {
    return null;
  }
}

// ----- Voz del sistema (respaldo) -----

function elegirVozSistema() {
  if (!('speechSynthesis' in window)) return null;
  const voces = speechSynthesis.getVoices();
  const buscar = f => voces.find(v => f(v.lang.replace('_', '-').toLowerCase()));
  return buscar(l => l === 'es-cl') || buscar(l => l === 'es-es') || buscar(l => l.startsWith('es')) || null;
}
if ('speechSynthesis' in window) {
  vozSistema = elegirVozSistema();
  speechSynthesis.addEventListener?.('voiceschanged', () => { vozSistema = elegirVozSistema(); });
}

function hablarSistema(texto, perfil, miTurno) {
  return new Promise(resolver => {
    if (!('speechSynthesis' in window) || miTurno !== turno) return resolver();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = vozSistema ? vozSistema.lang : 'es-CL';
    if (vozSistema) u.voice = vozSistema;
    u.rate = 1.05;
    u.pitch = perfil === 'nieta2' ? 1.5 : 1.3;   // voz aguda, un poco distinta para cada una
    const listo = () => { clearTimeout(seguro); resolver(); };
    const seguro = setTimeout(listo, 1500 + texto.length * 120);
    u.onend = listo;
    u.onerror = listo;
    speechSynthesis.speak(u);
  });
}

// ----- Reproducción -----

export function callar() {
  turno++;
  for (const f of fuentesActivas) { try { f.stop(); } catch { /* ya terminó */ } }
  fuentesActivas = [];
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function reproducirSeguidos(buffers, miTurno) {
  return new Promise(resolver => {
    if (miTurno !== turno) return resolver();
    const ctx = obtenerContexto();
    let t = ctx.currentTime + 0.03;
    let ultima = null;
    for (const b of buffers) {
      const f = ctx.createBufferSource();
      f.buffer = b;
      f.connect(ctx.destination);
      f.start(t);
      fuentesActivas.push(f);
      t += b.duration + SEPARACION;
      ultima = f;
    }
    const fin = t - ctx.currentTime;
    const seguro = setTimeout(resolver, fin * 1000 + 300);
    ultima.onended = () => { clearTimeout(seguro); resolver(); };
  });
}

/**
 * Dice una lista de audios con la voz del perfil. Las palabras grabadas se encadenan sin
 * pausas; las que faltan se dicen con la voz del sistema. Una frase nueva corta la anterior.
 * Devuelve true si la frase se dijo completa. Con "forzar" suena aunque la voz esté apagada.
 */
export async function decir(tokens, perfil, { forzar = false } = {}) {
  if (!tokens.length || (!estado.activa && !forzar)) return false;
  callar();
  const miTurno = turno;
  desbloquear();
  const buffers = await Promise.all(tokens.map(id => buffer(perfil, id)));
  if (miTurno !== turno) return false;

  // Agrupar en tramos: grabados seguidos / faltantes seguidos
  let i = 0;
  while (i < tokens.length) {
    const grabado = !!buffers[i];
    let j = i;
    while (j < tokens.length && !!buffers[j] === grabado) j++;
    if (grabado) await reproducirSeguidos(buffers.slice(i, j), miTurno);
    else await hablarSistema(tokensATexto(tokens.slice(i, j), perfil), perfil, miTurno);
    if (miTurno !== turno) return false;
    i = j;
  }
  return true;
}

/** Reproduce un WAV suelto (para escuchar una grabación recién hecha). */
export async function reproducirDatos(datos) {
  callar();
  const miTurno = turno;
  desbloquear();
  const b = await obtenerContexto().decodeAudioData(datos.slice(0));
  await reproducirSeguidos([b], miTurno);
}
