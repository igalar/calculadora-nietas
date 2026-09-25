// Pantalla 2: la calculadora que habla.
import { ICONOS } from '../iconos.js';
import { PERFILES } from '../logica/audios.js';
import { Calculadora } from '../logica/calculadora.js';
import { tokensATexto } from '../logica/numeros.js';
import { crear, botonVolver, selectorPerfil, avatar, hundir, anunciar, escapar } from '../ui.js';
import * as voz from '../voz.js';
import * as db from '../db.js';

// Se conserva la cuenta aunque se cambie de pantalla o de perfil
const calc = new Calculadora();

const TECLAS = [
  ['ac', 'AC', 'fn', 'Borrar todo'], ['borrar', ICONOS.borrar, 'fn', 'Borrar la última cifra'], ['%', '%', 'fn', 'Por ciento'], ['÷', '÷', 'op', 'Dividido'],
  ['7', '7'], ['8', '8'], ['9', '9'], ['×', '×', 'op', 'Por'],
  ['4', '4'], ['5', '5'], ['6', '6'], ['-', '−', 'op', 'Menos'],
  ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'op', 'Más'],
  ['raiz', ICONOS.raiz, 'fn', 'Raíz cuadrada'], ['0', '0'], [',', ',', '', 'Coma'], ['=', '=', 'acento', 'Igual'],
];

// Teclado del computador → teclas de la calculadora
const TECLADO_FISICO = {
  '+': '+', '-': '-', '*': '×', 'x': '×', 'X': '×', '/': '÷', ',': ',', '.': ',', '%': '%',
  'Enter': '=', '=': '=', 'Backspace': 'borrar', 'Escape': 'ac', 'Delete': 'ac', 'r': 'raiz', 'R': 'raiz',
};

export function mostrarCalculadora(contenedor, app) {
  const perfil = PERFILES[app.perfil];
  const teclas = TECLAS.map(([id, contenido, tipo = '', nombre]) =>
    `<button class="tecla ${tipo}" data-tecla="${id}" aria-label="${nombre || contenido}">${contenido}</button>`).join('');

  const pantalla = crear(`
    <section class="pantalla calculadora">
      ${botonVolver()}
      <div class="encabezado">
        <div><div class="antetitulo">La calculadora de</div><h1>${escapar(perfil.nombre)}</h1></div>
        ${selectorPerfil(app.perfil)}
      </div>
      <div class="visor" role="group" aria-label="Pantalla de la calculadora">
        <div class="expresion" aria-hidden="true"></div>
        <div class="numero" role="status" aria-live="polite"></div>
        <div class="linea"></div>
        <div class="habla">
          ${avatar(app.perfil)}
          <div class="burbuja" aria-hidden="true"><span class="dice">Toca una tecla</span><span class="onda">${ICONOS.onda}</span></div>
        </div>
      </div>
      <div class="extras">
        <button data-tecla="x2" aria-label="Al cuadrado">x²</button>
        <button data-tecla="inv" aria-label="Uno partido por equis">1/x</button>
        <button data-accion="voz" aria-pressed="${voz.estado.activa}"></button>
        <button data-accion="ayuda" aria-label="Ayuda">${ICONOS.ayuda}</button>
      </div>
      <div class="teclado">${teclas}</div>
      <p class="pie">Hecha con cariño por el Tata · 2026</p>
      <dialog class="ayuda" aria-labelledby="titulo-ayuda">
        <h2 id="titulo-ayuda">¿Qué hace cada tecla?</h2>
        <dl>
          <dt>AC</dt><dd>Borra todo para empezar de nuevo.</dd>
          <dt>${ICONOS.borrar}</dt><dd>Borra la última cifra.</dd>
          <dt>%</dt><dd>Por ciento. 200 + 10 % = 220.</dd>
          <dt>x²</dt><dd>Multiplica el número por sí mismo. 5² = 25.</dd>
          <dt>1/x</dt><dd>Divide 1 por el número. 1/4 = 0,25.</dd>
          <dt>${ICONOS.raiz}</dt><dd>Raíz cuadrada: qué número por sí mismo da ese. √9 = 3.</dd>
          <dt>,</dt><dd>Coma, para escribir decimales como 2,5.</dd>
          <dt>${ICONOS.vozSi}</dt><dd>Enciende o apaga la voz.</dd>
        </dl>
        <button class="tecla acento boton" data-accion="cerrar-ayuda" style="width:100%">¡Entendido!</button>
      </dialog>
    </section>`);
  contenedor.appendChild(pantalla);

  const numero = pantalla.querySelector('.numero');
  const expresion = pantalla.querySelector('.expresion');
  const burbuja = pantalla.querySelector('.burbuja');
  const dice = pantalla.querySelector('.dice');
  const botonVoz = pantalla.querySelector('[data-accion="voz"]');
  const ayuda = pantalla.querySelector('dialog');

  function actualizarPantalla() {
    const texto = calc.pantalla;
    numero.textContent = texto;
    numero.classList.toggle('mensaje', !!calc.error);
    numero.classList.toggle('mediano', !calc.error && texto.length > 9 && texto.length <= 12);
    numero.classList.toggle('chico', !calc.error && texto.length > 12);
    expresion.textContent = calc.expresion || ' ';
  }

  function actualizarBotonVoz() {
    const activa = voz.estado.activa;
    botonVoz.innerHTML = (activa ? ICONOS.vozSi : ICONOS.vozNo) + (activa ? 'Voz sí' : 'Voz no');
    botonVoz.setAttribute('aria-pressed', activa);
    botonVoz.setAttribute('aria-label', activa ? 'Voz encendida. Tocar para apagar' : 'Voz apagada. Tocar para encender');
  }

  async function presionar(tecla) {
    const tokens = calc.presionar(tecla);
    actualizarPantalla();
    if (!tokens.length) return;
    const texto = tokensATexto(tokens, app.perfil);
    dice.textContent = '«' + texto + '»';
    if (!voz.estado.activa) return;
    burbuja.classList.add('hablando');
    const terminada = await voz.decir(tokens, app.perfil);
    if (terminada) burbuja.classList.remove('hablando');
  }

  pantalla.addEventListener('click', e => {
    const tecla = e.target.closest('[data-tecla]');
    if (tecla) { presionar(tecla.dataset.tecla); return; }
    const accion = e.target.closest('[data-accion]');
    if (!accion) return;
    if (accion.dataset.accion === 'voz') {
      voz.estado.activa = !voz.estado.activa;
      if (!voz.estado.activa) { voz.callar(); burbuja.classList.remove('hablando'); }
      db.guardarDato('voz-activa', voz.estado.activa);
      actualizarBotonVoz();
      anunciar(voz.estado.activa ? 'Voz encendida' : 'Voz apagada');
    } else if (accion.dataset.accion === 'ayuda') {
      ayuda.showModal();
    } else if (accion.dataset.accion === 'cerrar-ayuda') {
      ayuda.close();
    }
  });

  const alTeclear = e => {
    if (e.ctrlKey || e.metaKey || e.altKey || ayuda.open) return;
    const tecla = /^[0-9]$/.test(e.key) ? e.key : TECLADO_FISICO[e.key];
    if (!tecla) return;
    e.preventDefault();
    hundir(pantalla.querySelector(`[data-tecla="${CSS.escape(tecla)}"]`));
    presionar(tecla);
  };
  document.addEventListener('keydown', alTeclear);

  actualizarPantalla();
  actualizarBotonVoz();
  return () => document.removeEventListener('keydown', alTeclear);
}
