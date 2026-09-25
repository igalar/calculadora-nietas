// Crear y leer archivos .zip sin librerías externas.
// Se guardan sin comprimir (los audios casi no se comprimen); al leer se aceptan también
// archivos comprimidos con "deflate", por si el zip se armó con otro programa.

const TABLA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(datos) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < datos.length; i++) c = TABLA_CRC[(c ^ datos[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function fechaDos(fecha) {
  const hora = (fecha.getHours() << 11) | (fecha.getMinutes() << 5) | Math.floor(fecha.getSeconds() / 2);
  const dia = ((fecha.getFullYear() - 1980) << 9) | ((fecha.getMonth() + 1) << 5) | fecha.getDate();
  return { hora, dia };
}

/** archivos: [{ nombre: 'nieta1/n7.wav', datos: Uint8Array }] → Uint8Array con el .zip */
export function crearZip(archivos, fecha = new Date()) {
  const codificador = new TextEncoder();
  const { hora, dia } = fechaDos(fecha);
  const locales = [];
  const centrales = [];
  let desplazamiento = 0;

  for (const archivo of archivos) {
    const nombre = codificador.encode(archivo.nombre);
    const datos = archivo.datos;
    const crc = crc32(datos);

    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);   // nombres en UTF-8
    local.setUint16(8, 0, true);        // sin comprimir
    local.setUint16(10, hora, true);
    local.setUint16(12, dia, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, datos.length, true);
    local.setUint32(22, datos.length, true);
    local.setUint16(26, nombre.length, true);
    local.setUint16(28, 0, true);
    locales.push(new Uint8Array(local.buffer), nombre, datos);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014b50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, hora, true);
    central.setUint16(14, dia, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, datos.length, true);
    central.setUint32(24, datos.length, true);
    central.setUint16(28, nombre.length, true);
    central.setUint32(42, desplazamiento, true);
    centrales.push(new Uint8Array(central.buffer), nombre);

    desplazamiento += 30 + nombre.length + datos.length;
  }

  const largoCentral = centrales.reduce((s, p) => s + p.length, 0);
  const fin = new DataView(new ArrayBuffer(22));
  fin.setUint32(0, 0x06054b50, true);
  fin.setUint16(8, archivos.length, true);
  fin.setUint16(10, archivos.length, true);
  fin.setUint32(12, largoCentral, true);
  fin.setUint32(16, desplazamiento, true);

  const partes = [...locales, ...centrales, new Uint8Array(fin.buffer)];
  const total = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let i = 0;
  for (const p of partes) { total.set(p, i); i += p.length; }
  return total;
}

async function descomprimir(datos) {
  const flujo = new Blob([datos]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(flujo).arrayBuffer());
}

/** Uint8Array con un .zip → [{ nombre, datos: Uint8Array }] (solo archivos, no carpetas) */
export async function leerZip(zip) {
  const vista = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  // Buscar el registro final desde atrás
  let fin = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 22 - 65535); i--) {
    if (vista.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error('El archivo no es un .zip válido');

  const cantidad = vista.getUint16(fin + 10, true);
  let p = vista.getUint32(fin + 16, true);
  const decodificador = new TextDecoder();
  const archivos = [];

  for (let n = 0; n < cantidad; n++) {
    if (vista.getUint32(p, true) !== 0x02014b50) throw new Error('El .zip está dañado');
    const metodo = vista.getUint16(p + 10, true);
    const comprimido = vista.getUint32(p + 20, true);
    const largoNombre = vista.getUint16(p + 28, true);
    const largoExtra = vista.getUint16(p + 30, true);
    const largoComentario = vista.getUint16(p + 32, true);
    const local = vista.getUint32(p + 42, true);
    const nombre = decodificador.decode(zip.subarray(p + 46, p + 46 + largoNombre));
    p += 46 + largoNombre + largoExtra + largoComentario;
    if (nombre.endsWith('/')) continue;

    const inicio = local + 30 + vista.getUint16(local + 26, true) + vista.getUint16(local + 28, true);
    const crudos = zip.slice(inicio, inicio + comprimido);
    let datos;
    if (metodo === 0) datos = crudos;
    else if (metodo === 8) datos = await descomprimir(crudos);
    else continue; // método no soportado: se omite
    archivos.push({ nombre, datos });
  }
  return archivos;
}
