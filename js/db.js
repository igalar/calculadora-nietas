// Almacenamiento local con IndexedDB: grabaciones y datos (progreso, estrellas, ajustes).
// Nada sale del dispositivo.

const NOMBRE = 'calculadora-nietas';
let conexion = null;

function abrir() {
  if (conexion) return conexion;
  conexion = new Promise((resolver, rechazar) => {
    const pedido = indexedDB.open(NOMBRE, 1);
    pedido.onupgradeneeded = () => {
      const db = pedido.result;
      if (!db.objectStoreNames.contains('audios')) db.createObjectStore('audios');
      if (!db.objectStoreNames.contains('datos')) db.createObjectStore('datos');
    };
    pedido.onsuccess = () => resolver(pedido.result);
    pedido.onerror = () => rechazar(pedido.error);
  });
  return conexion;
}

async function operar(almacen, modo, fn) {
  const db = await abrir();
  return new Promise((resolver, rechazar) => {
    const tx = db.transaction(almacen, modo);
    const pedido = fn(tx.objectStore(almacen));
    tx.oncomplete = () => resolver(pedido ? pedido.result : undefined);
    tx.onerror = () => rechazar(tx.error);
    tx.onabort = () => rechazar(tx.error);
  });
}

const claveAudio = (perfil, id) => perfil + '/' + id;

// ----- Grabaciones (se guardan como ArrayBuffer con el WAV) -----

export function guardarAudio(perfil, id, datos) {
  return operar('audios', 'readwrite', s => s.put({ datos, fecha: Date.now() }, claveAudio(perfil, id)));
}

export async function leerAudio(perfil, id) {
  const r = await operar('audios', 'readonly', s => s.get(claveAudio(perfil, id)));
  return r ? r.datos : null;
}

export function borrarAudio(perfil, id) {
  return operar('audios', 'readwrite', s => s.delete(claveAudio(perfil, id)));
}

/** Lista de claves "perfil/id" de todas las grabaciones guardadas. */
export async function listarAudios() {
  return (await operar('audios', 'readonly', s => s.getAllKeys())) || [];
}

// ----- Datos (progreso, estrellas, ajustes) -----

export async function leerDato(clave, porDefecto = null) {
  const v = await operar('datos', 'readonly', s => s.get(clave));
  return v === undefined ? porDefecto : v;
}

export function guardarDato(clave, valor) {
  return operar('datos', 'readwrite', s => s.put(valor, clave));
}

/** Pide al navegador que no borre los datos si falta espacio. */
export async function pedirAlmacenamientoPersistente() {
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch { /* opcional */ }
}
