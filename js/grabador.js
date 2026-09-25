// Grabación con el micrófono (MediaRecorder): graba, recorta silencios, normaliza el
// volumen y entrega un WAV mono de 24 kHz listo para guardar.
import { recortarSilencio, normalizar, suavizarBordes, codificarWav } from './logica/wav.js';

const FRECUENCIA = 24000;
let flujo = null;
let grabadora = null;
let trozos = [];

export function hayMicrofono() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
}

async function obtenerFlujo() {
  if (flujo && flujo.active) return flujo;
  flujo = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
  });
  return flujo;
}

/** Pide permiso para el micrófono (se puede llamar antes de grabar para que no se pierda el inicio). */
export async function prepararMicrofono() {
  await obtenerFlujo();
}

export async function empezar() {
  const f = await obtenerFlujo();
  trozos = [];
  grabadora = new MediaRecorder(f);
  grabadora.ondataavailable = e => { if (e.data.size) trozos.push(e.data); };
  grabadora.start();
}

export function grabando() {
  return !!grabadora && grabadora.state === 'recording';
}

/** Termina la grabación y devuelve { wav: ArrayBuffer, duracion } o null si no se escuchó nada. */
export function terminar() {
  return new Promise((resolver, rechazar) => {
    if (!grabando()) return resolver(null);
    grabadora.onstop = async () => {
      try {
        const blob = new Blob(trozos, { type: grabadora.mimeType });
        resolver(await procesarGrabacion(await blob.arrayBuffer()));
      } catch (e) {
        rechazar(e);
      }
    };
    grabadora.stop();
  });
}

/** Audio grabado (cualquier formato que el navegador entienda) → { wav, duracion } o null. */
export async function procesarGrabacion(datos) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  let audio;
  try { audio = await ctx.decodeAudioData(datos); } finally { ctx.close?.(); }

  // Mezclar a mono
  const mono = new Float32Array(audio.length);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const canal = audio.getChannelData(c);
    for (let i = 0; i < canal.length; i++) mono[i] += canal[i] / audio.numberOfChannels;
  }

  let muestras = recortarSilencio(mono, audio.sampleRate);
  if (muestras.length < audio.sampleRate * 0.08) return null;   // casi nada de voz

  // Cambiar a 24 kHz
  const largo = Math.ceil(muestras.length * FRECUENCIA / audio.sampleRate);
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const offline = new Offline(1, largo, FRECUENCIA);
  const origen = offline.createBuffer(1, muestras.length, audio.sampleRate);
  origen.getChannelData(0).set(muestras);
  const fuente = offline.createBufferSource();
  fuente.buffer = origen;
  fuente.connect(offline.destination);
  fuente.start();
  const convertido = await offline.startRendering();

  muestras = suavizarBordes(normalizar(convertido.getChannelData(0)), FRECUENCIA);
  const wav = codificarWav(muestras, FRECUENCIA);
  return { wav: wav.buffer, duracion: muestras.length / FRECUENCIA };
}

/** Apaga el micrófono (al salir del estudio). */
export function liberar() {
  if (grabando()) grabadora.stop();
  if (flujo) flujo.getTracks().forEach(t => t.stop());
  flujo = null;
}
