// Punto de entrada: perfil activo, navegación entre pantallas y servicio sin conexión.
import * as db from './db.js';
import * as voz from './voz.js';
import { PERFILES, cambiarNombre } from './logica/audios.js';
import { COLORES_ORIGINALES, temaDesde, cssDelTema } from './logica/colores.js';
import { mostrarInicio } from './pantallas/inicio.js';
import { mostrarCalculadora } from './pantallas/calculadora.js';
import { mostrarMultiplicando } from './pantallas/multiplicando.js';
import { mostrarDesafio } from './pantallas/desafio.js';
import { mostrarEstudio } from './pantallas/estudio.js';
import { mostrarPersonalizar } from './pantallas/personalizar.js';

const PANTALLAS = {
  inicio: mostrarInicio,
  calculadora: mostrarCalculadora,
  multiplicando: mostrarMultiplicando,
  desafio: mostrarDesafio,
  estudio: mostrarEstudio,
  personalizar: mostrarPersonalizar,
};

const contenedor = document.getElementById('app');
let limpiarPantalla = null;

export const app = {
  perfil: 'nieta1',
  estudioAbierto: false,
  colores: structuredClone(COLORES_ORIGINALES),

  // Los temas de ambas nietas quedan disponibles: el del perfil activo en toda la página
  // y cada uno en su tarjeta del inicio (clase .tema-nieta1 / .tema-nieta2).
  aplicarTema() {
    let estilo = document.getElementById('temas');
    if (!estilo) {
      estilo = document.createElement('style');
      estilo.id = 'temas';
      document.head.appendChild(estilo);
    }
    estilo.textContent = Object.keys(PERFILES)
      .map(p => cssDelTema(`[data-perfil="${p}"], .tema-${p}`, temaDesde(p, this.colores[p])))
      .join('\n');
    document.documentElement.dataset.perfil = this.perfil;
    document.querySelector('meta[name="theme-color"]').content = this.colores[this.perfil].fondo;
  },

  guardarColores(perfil, colores, { redibujar = false } = {}) {
    this.colores[perfil] = colores;
    db.guardarDato('colores', this.colores);
    this.aplicarTema();
    if (redibujar) this.dibujar();
  },

  guardarNombre(perfil, nombre, corto) {
    cambiarNombre(perfil, nombre, corto);
    const nombres = Object.fromEntries(Object.values(PERFILES).map(p => [p.id, { nombre: p.nombre, corto: p.corto }]));
    db.guardarDato('nombres', nombres);
  },

  async cambiarPerfil(perfil, { redibujar = true } = {}) {
    if (!PERFILES[perfil]) return;
    this.perfil = perfil;
    this.aplicarTema();
    db.guardarDato('perfil', perfil);
    if (redibujar) this.dibujar();
  },

  ir(ruta) {
    if (location.hash.slice(1) === ruta) this.dibujar();
    else location.hash = ruta;
  },

  dibujar() {
    let ruta = location.hash.slice(1) || 'inicio';
    if (!PANTALLAS[ruta]) ruta = 'inicio';
    if (ruta === 'estudio' && !this.estudioAbierto) ruta = 'inicio';
    if (ruta !== 'estudio') this.estudioAbierto = false;
    if (limpiarPantalla) { limpiarPantalla(); limpiarPantalla = null; }
    contenedor.innerHTML = '';
    limpiarPantalla = PANTALLAS[ruta](contenedor, this) || null;
    window.scrollTo(0, 0);
  },
};

// Botones comunes: volver, cambiar perfil
contenedor.addEventListener('click', e => {
  const ir = e.target.closest('[data-ir]');
  if (ir) { app.ir(ir.dataset.ir); return; }
  const perfil = e.target.closest('[data-perfil-boton]');
  if (perfil && perfil.dataset.perfilBoton !== app.perfil) {
    app.cambiarPerfil(perfil.dataset.perfilBoton);
    voz.decir(['hola'], app.perfil);
  }
});

// El audio del navegador solo se puede activar con un toque
document.addEventListener('pointerdown', () => voz.desbloquear(), { capture: true });
window.addEventListener('hashchange', () => app.dibujar());

async function iniciar() {
  try {
    app.perfil = await db.leerDato('perfil', 'nieta1');
    voz.estado.activa = await db.leerDato('voz-activa', true);
    const colores = await db.leerDato('colores', null);
    if (colores) for (const p of Object.keys(PERFILES)) if (colores[p]) app.colores[p] = { ...app.colores[p], ...colores[p] };
    const nombres = await db.leerDato('nombres', null);
    if (nombres) for (const p of Object.keys(PERFILES)) if (nombres[p]) cambiarNombre(p, nombres[p].nombre, nombres[p].corto);
    await voz.actualizarLista();
  } catch (e) {
    console.warn('No se pudo abrir el almacenamiento local', e);
  }
  app.aplicarTema();
  app.dibujar();
  db.pedirAlmacenamientoPersistente();

  // Funcionar sin internet (solo en https o en localhost)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
    navigator.serviceWorker.register('sw.js').catch(e => console.warn('Sin modo offline:', e));
  }
}

iniciar();
