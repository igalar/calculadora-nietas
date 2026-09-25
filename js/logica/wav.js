// Procesamiento de las grabaciones: recortar silencios, normalizar volumen y guardar como WAV.

/**
 * Recorta el silencio del inicio y del final. Mide la energía en ventanas de 10 ms y
 * considera voz lo que supera el 8 % de la ventana más fuerte (o un mínimo absoluto).
 * Deja un pequeño margen para no cortar el comienzo ni el final de las palabras.
 */
export function recortarSilencio(muestras, frecuencia, { margenInicio = 0.05, margenFinal = 0.1 } = {}) {
  const ventana = Math.max(1, Math.round(frecuencia * 0.01));
  const cantidad = Math.ceil(muestras.length / ventana);
  const energia = new Float32Array(cantidad);
  let maxima = 0;
  for (let v = 0; v < cantidad; v++) {
    let suma = 0;
    const fin = Math.min(muestras.length, (v + 1) * ventana);
    for (let i = v * ventana; i < fin; i++) suma += muestras[i] * muestras[i];
    energia[v] = Math.sqrt(suma / (fin - v * ventana));
    if (energia[v] > maxima) maxima = energia[v];
  }
  const umbral = Math.max(0.01, maxima * 0.08);
  let primera = -1, ultima = -1;
  for (let v = 0; v < cantidad; v++) {
    if (energia[v] >= umbral) { if (primera < 0) primera = v; ultima = v; }
  }
  if (primera < 0) return new Float32Array(0);
  const inicio = Math.max(0, primera * ventana - Math.round(margenInicio * frecuencia));
  const fin = Math.min(muestras.length, (ultima + 1) * ventana + Math.round(margenFinal * frecuencia));
  return muestras.slice(inicio, fin);
}

/** Sube el volumen para que el punto más fuerte quede en "pico" (sin distorsionar). */
export function normalizar(muestras, pico = 0.9) {
  let max = 0;
  for (let i = 0; i < muestras.length; i++) max = Math.max(max, Math.abs(muestras[i]));
  if (max === 0) return muestras;
  const factor = Math.min(pico / max, 8);
  const salida = new Float32Array(muestras.length);
  for (let i = 0; i < muestras.length; i++) salida[i] = muestras[i] * factor;
  return salida;
}

/** Suaviza 5 ms al inicio y al final para que no se escuche un "clic" al unir palabras. */
export function suavizarBordes(muestras, frecuencia) {
  const n = Math.min(Math.round(frecuencia * 0.005), Math.floor(muestras.length / 2));
  const salida = muestras.slice();
  for (let i = 0; i < n; i++) {
    const f = i / n;
    salida[i] *= f;
    salida[salida.length - 1 - i] *= f;
  }
  return salida;
}

/** Muestras mono (-1..1) → archivo WAV PCM de 16 bits. */
export function codificarWav(muestras, frecuencia) {
  const bytes = new ArrayBuffer(44 + muestras.length * 2);
  const v = new DataView(bytes);
  const texto = (pos, s) => { for (let i = 0; i < s.length; i++) v.setUint8(pos + i, s.charCodeAt(i)); };
  texto(0, 'RIFF');
  v.setUint32(4, 36 + muestras.length * 2, true);
  texto(8, 'WAVE');
  texto(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);             // PCM
  v.setUint16(22, 1, true);             // mono
  v.setUint32(24, frecuencia, true);
  v.setUint32(28, frecuencia * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  texto(36, 'data');
  v.setUint32(40, muestras.length * 2, true);
  for (let i = 0; i < muestras.length; i++) {
    const s = Math.max(-1, Math.min(1, muestras[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return new Uint8Array(bytes);
}
