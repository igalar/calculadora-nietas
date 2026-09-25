// Service worker: guarda todos los archivos de la app para que funcione sin internet.
// Si se agrega un archivo nuevo a la app, súmalo a la lista y sube la VERSION.
const VERSION = 'calculadora-nietas-v3';

const ARCHIVOS = [
  './',
  'index.html',
  'estilos.css',
  'manifest.webmanifest',
  'fuentes/fredoka.woff2',
  'fuentes/nunito.woff2',
  'iconos/icono.svg',
  'iconos/icono-192.png',
  'iconos/icono-512.png',
  'iconos/icono-maskable-512.png',
  'iconos/apple-touch-icon.png',
  'js/app.js',
  'js/ui.js',
  'js/db.js',
  'js/voz.js',
  'js/grabador.js',
  'js/iconos.js',
  'js/logica/audios.js',
  'js/logica/numeros.js',
  'js/logica/calculadora.js',
  'js/logica/tablas.js',
  'js/logica/desafio.js',
  'js/logica/zip.js',
  'js/logica/wav.js',
  'js/logica/colores.js',
  'js/pantallas/inicio.js',
  'js/pantallas/calculadora.js',
  'js/pantallas/multiplicando.js',
  'js/pantallas/desafio.js',
  'js/pantallas/estudio.js',
  'js/pantallas/personalizar.js',
];

self.addEventListener('install', evento => {
  evento.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(ARCHIVOS.map(a => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evento => {
  evento.waitUntil(
    caches.keys()
      .then(claves => Promise.all(claves.filter(c => c !== VERSION).map(c => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

// Con conexión: siempre la versión más nueva (y se guarda una copia).
// Sin conexión (o si tarda demasiado): la copia guardada.
const ESPERA_RED_MS = 4000;

async function responder(pedido) {
  const cache = await caches.open(VERSION);
  try {
    const respuesta = await Promise.race([
      fetch(pedido, { cache: 'no-store' }),
      new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('lento')), ESPERA_RED_MS)),
    ]);
    if (respuesta.ok) cache.put(pedido, respuesta.clone());
    return respuesta;
  } catch {
    const guardada = await cache.match(pedido, { ignoreSearch: true });
    if (guardada) return guardada;
    if (pedido.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  }
}

self.addEventListener('fetch', evento => {
  const pedido = evento.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== location.origin) return;
  evento.respondWith(responder(pedido));
});
