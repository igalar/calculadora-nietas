// Pantalla "Colores y nombre": cada nieta elige sus 3 colores y puede cambiar su nombre.
import { ICONOS } from '../iconos.js';
import { PERFILES, NOMBRES_ORIGINALES } from '../logica/audios.js';
import { PALETAS, COLORES_ORIGINALES } from '../logica/colores.js';
import { crear, botonVolver, selectorPerfil, escapar, anunciar } from '../ui.js';
import * as voz from '../voz.js';

const PARTES = [
  ['fondo', 'Fondo', 'El color de toda la pantalla'],
  ['teclas', 'Teclas', 'Las teclas de operaciones y funciones'],
  ['acento', 'Botón principal', 'La tecla "=", el círculo con la inicial y los botones grandes'],
];

export function mostrarPersonalizar(contenedor, app) {
  const perfil = app.perfil;
  const p = PERFILES[perfil];

  const grupoColores = ([parte, titulo, detalle]) => {
    const actual = app.colores[perfil][parte];
    const muestras = PALETAS[parte].map(([hex, nombre]) =>
      `<button class="muestra" data-parte="${parte}" data-color="${hex}" style="--muestra:${hex}"
        aria-pressed="${hex === actual}" aria-label="${titulo}: ${nombre}">${hex === actual ? ICONOS.listo : ''}</button>`).join('');
    return `<fieldset class="tarjeta grupo-colores">
      <legend class="oculto-visual">${titulo}</legend>
      <h2>${titulo}</h2><p class="subtitulo">${detalle}</p>
      <div class="muestras" role="group" aria-label="${titulo}">${muestras}</div>
    </fieldset>`;
  };

  const pantalla = crear(`
    <section class="pantalla personalizar">
      ${botonVolver()}
      <div class="encabezado">
        <div><div class="antetitulo">Mi calculadora</div><h1>Colores y nombre</h1></div>
        ${selectorPerfil(perfil)}
      </div>

      <div class="tarjeta vista-previa" aria-hidden="true">
        <span class="avatar">${escapar(p.inicial)}</span>
        <span class="vp-nombre">La calculadora de <strong>${escapar(p.nombre)}</strong></span>
        <span class="vp-teclas">
          <span class="tecla">7</span><span class="tecla op">+</span><span class="tecla acento">=</span>
        </span>
      </div>

      ${PARTES.map(grupoColores).join('')}

      <div class="tarjeta">
        <h2>Nombre</h2>
        <label class="campo">Nombre
          <input type="text" name="nombre" maxlength="16" autocomplete="off" value="${escapar(p.nombre)}">
        </label>
        <label class="campo">Nombre corto <small>(el del botón para cambiar de perfil)</small>
          <input type="text" name="corto" maxlength="8" autocomplete="off" value="${escapar(p.corto)}">
        </label>
      </div>

      <button class="tecla boton" data-accion="restaurar">Volver a los colores y nombre originales</button>
    </section>`);
  contenedor.appendChild(pantalla);

  const nombre = pantalla.querySelector('[name="nombre"]');
  const corto = pantalla.querySelector('[name="corto"]');

  pantalla.addEventListener('click', e => {
    const muestra = e.target.closest('[data-color]');
    if (muestra) {
      const parte = muestra.dataset.parte;
      app.guardarColores(perfil, { ...app.colores[perfil], [parte]: muestra.dataset.color });
      for (const b of pantalla.querySelectorAll(`[data-parte="${parte}"]`)) {
        const elegida = b === muestra;
        b.setAttribute('aria-pressed', elegida);
        b.innerHTML = elegida ? ICONOS.listo : '';
      }
      anunciar(muestra.getAttribute('aria-label'));
      return;
    }
    if (e.target.closest('[data-accion="restaurar"]')) {
      const original = NOMBRES_ORIGINALES[perfil];
      app.guardarNombre(perfil, original.nombre, original.corto);
      app.guardarColores(perfil, { ...COLORES_ORIGINALES[perfil] }, { redibujar: true });
    }
  });

  // El nombre se guarda al terminar de escribir (sin redibujar para no perder el cursor)
  let espera = null;
  const guardarNombre = () => {
    clearTimeout(espera);
    app.guardarNombre(perfil, nombre.value, corto.value);
    const actual = PERFILES[perfil];
    pantalla.querySelector('.vp-nombre strong').textContent = actual.nombre;
    pantalla.querySelector('.vista-previa .avatar').textContent = actual.inicial;
    pantalla.querySelector(`[data-perfil-boton="${perfil}"]`).textContent = actual.corto;
  };
  for (const campo of [nombre, corto]) {
    campo.addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(guardarNombre, 400); });
    campo.addEventListener('change', guardarNombre);
    campo.addEventListener('keydown', e => { if (e.key === 'Enter') campo.blur(); });
  }

  return () => { if (espera) guardarNombre(); voz.callar(); };
}
