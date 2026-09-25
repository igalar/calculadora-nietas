// Pequeñas utilidades de interfaz compartidas por las pantallas.
import { ICONOS } from './iconos.js';
import { PERFILES } from './logica/audios.js';

/** Crea elementos a partir de HTML. Devuelve el primer elemento. */
export function crear(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function escapar(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export function botonVolver(texto = 'Inicio') {
  return `<button class="volver" data-ir="inicio" aria-label="Volver al inicio">${ICONOS.anterior}${escapar(texto)}</button>`;
}

export function selectorPerfil(perfilActual) {
  const botones = Object.values(PERFILES).map(p =>
    `<button data-perfil-boton="${p.id}" aria-pressed="${p.id === perfilActual}" aria-label="Cambiar a ${escapar(p.nombre)}">${escapar(p.corto)}</button>`
  ).join('');
  return `<div class="selector-perfil" role="group" aria-label="Perfil">${botones}</div>`;
}

export function avatar(perfil) {
  return `<span class="avatar" aria-hidden="true">${escapar(PERFILES[perfil].inicial)}</span>`;
}

/** Interruptor accesible (role="switch"). */
export function interruptor(nombre, titulo, detalle, activo, icono) {
  return `<button class="interruptor" role="switch" aria-checked="${activo}" data-interruptor="${nombre}">
    <span class="icono-texto">${icono ? ICONOS[icono] : ''}<span>${escapar(titulo)}${detalle ? `<small>${escapar(detalle)}</small>` : ''}</span></span>
    <span class="perilla" aria-hidden="true"></span>
  </button>`;
}

/** Mensaje para lectores de pantalla. */
export function anunciar(texto) {
  const a = document.getElementById('anuncio');
  if (!a) return;
  a.textContent = '';
  setTimeout(() => { a.textContent = texto; }, 30);
}

/** Aplica una animación de una vez (reinicia si ya estaba). */
export function animar(elemento, clase) {
  elemento.classList.remove(clase);
  void elemento.offsetWidth;
  elemento.classList.add(clase);
}

/** Hace que una tecla física del teclado "hunda" el botón en pantalla. */
export function hundir(boton) {
  if (!boton) return;
  boton.classList.add('apretada');
  setTimeout(() => boton.classList.remove('apretada'), 110);
}

export const esperar = ms => new Promise(r => setTimeout(r, ms));
