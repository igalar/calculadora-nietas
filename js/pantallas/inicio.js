// Pantalla 1: ¿Quién va a calcular hoy?
import { ICONOS } from '../iconos.js';
import { PERFILES } from '../logica/audios.js';
import { crear, escapar } from '../ui.js';
import * as voz from '../voz.js';

const SEGUNDOS_TATA = 3;

export function mostrarInicio(contenedor, app) {
  const tarjeta = p => `
    <button class="tecla tarjeta-perfil tema-${p.id}" data-elegir="${p.id}" aria-label="${escapar(p.nombre)}: abrir su calculadora">
      <span class="avatar" aria-hidden="true">${escapar(p.inicial)}</span>
      <span><span class="nombre">${escapar(p.nombre)}</span><span class="detalle">Con la voz de ${escapar(p.nombre)}</span></span>
    </button>`;

  const pantalla = crear(`
    <section class="pantalla inicio">
      <p class="saludo">¡Hola!</p>
      <h1>¿Quién va a calcular hoy?</h1>
      ${Object.values(PERFILES).map(tarjeta).join('')}
      <div class="accesos">
        <button class="tecla acceso" data-ir="desafio">
          ${ICONOS.estrella}<strong>Desafío</strong><span>Sumas y restas con estrellas</span>
        </button>
        <button class="tecla acceso" data-ir="multiplicando">
          ${ICONOS.por}<strong>Multiplicando</strong><span>Aprende las tablas jugando</span>
        </button>
      </div>
      <button class="tecla boton boton-colores" data-ir="personalizar">${ICONOS.paleta}Colores y nombre de ${escapar(PERFILES[app.perfil].nombre)}</button>
      <div class="espaciador"></div>
      <button class="boton-tata" aria-label="Para el Tata: grabar voces. Mantén apretado ${SEGUNDOS_TATA} segundos.">
        <span class="relleno" aria-hidden="true"></span>${ICONOS.microfono} Para el Tata: grabar voces
      </button>
      <p class="pista" id="pista-tata" aria-live="polite"></p>
    </section>`);
  contenedor.appendChild(pantalla);

  pantalla.addEventListener('click', e => {
    const b = e.target.closest('[data-elegir]');
    if (!b) return;
    const perfil = b.dataset.elegir;
    app.cambiarPerfil(perfil, { redibujar: false });
    voz.decir(['hola'], perfil);
    app.ir('calculadora');
  });

  // Botón del Tata: hay que mantenerlo apretado para que las niñas no entren por error
  const tata = pantalla.querySelector('.boton-tata');
  const pista = pantalla.querySelector('#pista-tata');
  let temporizador = null;
  const empezar = e => {
    if (e.type === 'keydown' && ((e.key !== 'Enter' && e.key !== ' ') || e.repeat)) return;
    e.preventDefault();
    tata.classList.add('cargando');
    pista.textContent = 'Sigue apretando…';
    temporizador = setTimeout(() => {
      temporizador = null;
      app.estudioAbierto = true;
      app.ir('estudio');
    }, SEGUNDOS_TATA * 1000);
  };
  const cancelar = () => {
    if (!temporizador) return;
    clearTimeout(temporizador);
    temporizador = null;
    tata.classList.remove('cargando');
    pista.textContent = `Mantén apretado ${SEGUNDOS_TATA} segundos para entrar.`;
  };
  tata.addEventListener('pointerdown', empezar);
  tata.addEventListener('keydown', empezar);
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'keyup', 'blur']) tata.addEventListener(ev, cancelar);
  tata.addEventListener('contextmenu', e => e.preventDefault());

  return () => { if (temporizador) clearTimeout(temporizador); };
}
