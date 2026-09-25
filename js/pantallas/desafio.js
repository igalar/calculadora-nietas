// Pantalla 4: Desafío. Sumas y restas según la edad; cada 5 aciertos, una estrella.
import { ICONOS } from '../iconos.js';
import { PERFILES } from '../logica/audios.js';
import { numeroATokens, formatoChile } from '../logica/numeros.js';
import { generarPregunta, respuestaCorrecta, cuentaEnColumnas, ACIERTOS_POR_ESTRELLA } from '../logica/desafio.js';
import { crear, botonVolver, selectorPerfil, animar, anunciar, esperar, hundir, escapar } from '../ui.js';
import * as voz from '../voz.js';
import * as db from '../db.js';

const VOZ_OP = { '+': 'mas', '-': 'menos' };
const SIMBOLO = { '+': '+', '-': '−' };
const MAX_ESTRELLAS_VISIBLES = 20;

export function mostrarDesafio(contenedor, app) {
  const perfil = app.perfil;
  const conComa = perfil === 'nieta1';   // la mayor también suma decimales
  let datos = { estrellas: 0, aciertos: 0 };
  let pregunta = null;
  let respuesta = '';
  let intentos = 0;
  let bloqueado = true;
  let vigente = true;

  const numeros = ['7', '8', '9', '4', '5', '6', '1', '2', '3'];
  const teclas = conComa
    ? ['7', '8', '9', 'borrar', '4', '5', '6', ',', '1', '2', '3', '0', 'ok']
    : [...numeros, 'borrar', '0', 'ok'];
  const botonTecla = t => {
    if (t === 'borrar') return `<button class="tecla fn" data-num="borrar" aria-label="Borrar">${ICONOS.borrar}</button>`;
    if (t === 'ok') return `<button class="tecla acento" data-num="ok" aria-label="Responder" ${conComa ? 'style="grid-column: 1 / -1"' : ''}>OK</button>`;
    if (t === ',') return `<button class="tecla fn" data-num="," aria-label="Coma">,</button>`;
    return `<button class="tecla" data-num="${t}">${t}</button>`;
  };

  const pantalla = crear(`
    <section class="pantalla desafio">
      ${botonVolver()}
      <div class="encabezado">
        <div><div class="antetitulo">${conComa ? 'Sumas y restas hasta 1.000' : 'Sumas y restas hasta 100'}</div><h1>Desafío</h1></div>
        ${selectorPerfil(perfil)}
      </div>
      <div class="tarjeta centrado">
        <div class="etiqueta-mayus"><span class="v-total">0</span> estrellas de ${escapar(PERFILES[perfil].nombre)}</div>
        <div class="estrellas" aria-hidden="true"></div>
        <div class="progreso-estrella" aria-label="Aciertos para la próxima estrella"></div>
      </div>
      <div class="tarjeta pregunta">
        <div class="cuenta-columnas" role="img"></div>
        <p class="aviso" aria-live="polite"></p>
      </div>
      <div class="teclado-respuesta ${conComa ? 'con-coma' : ''}">${teclas.map(botonTecla).join('')}</div>
      <button class="tecla boton" data-accion="otra" aria-label="Cambiar la pregunta">${ICONOS.siguiente}Otra pregunta</button>
    </section>`);
  contenedor.appendChild(pantalla);

  const operacion = pantalla.querySelector('.cuenta-columnas');
  const aviso = pantalla.querySelector('.aviso');
  const tarjeta = pantalla.querySelector('.pregunta');

  function dibujarEstrellas() {
    pantalla.querySelector('.v-total').textContent = datos.estrellas;
    const visibles = Math.min(datos.estrellas, MAX_ESTRELLAS_VISIBLES);
    pantalla.querySelector('.estrellas').innerHTML =
      ICONOS.estrellaLlena.repeat(visibles) + (datos.estrellas > visibles ? `<span class="fredoka">+${datos.estrellas - visibles}</span>` : '');
    const hechos = datos.aciertos % ACIERTOS_POR_ESTRELLA;
    const puntos = pantalla.querySelector('.progreso-estrella');
    puntos.innerHTML = [...Array(ACIERTOS_POR_ESTRELLA)].map((_, i) => `<i class="${i < hechos ? 'lleno' : ''}"></i>`).join('');
    puntos.setAttribute('aria-label', `${hechos} de ${ACIERTOS_POR_ESTRELLA} aciertos para la próxima estrella`);
  }

  // La cuenta se escribe como en el cuaderno: un número debajo del otro, el signo a la
  // izquierda, una raya y la respuesta abajo, cada cifra en su columna.
  function dibujarPregunta(mostrarResultado = false) {
    const escrita = mostrarResultado ? pregunta.resultado.replace('.', ',') : respuesta;
    const { filas: [fa, fb, fr], enteras } = cuentaEnColumnas(pregunta.a, pregunta.b, escrita, pregunta.resultado);
    const celda = (c, clase = '') => `<span class="celda ${c === ',' ? 'coma' : ''} ${clase}">${c}</span>`;
    const vacia = escrita === '';
    const claseRespuesta = 'respuesta' + (vacia ? ' vacia' : '') + (mostrarResultado ? ' correcta' : '');
    // Sin respuesta todavía: un "?" en la columna de las unidades
    const respuestaCeldas = fr.map((c, i) => celda(vacia && i === enteras - 1 ? '?' : c, claseRespuesta)).join('');
    operacion.style.gridTemplateColumns = 'var(--ancho-signo) ' +
      fa.map((_, i) => (i === enteras ? 'var(--ancho-coma)' : 'var(--ancho-cifra)')).join(' ');
    operacion.setAttribute('aria-label',
      `${formatoChile(pregunta.a)} ${pregunta.op === '+' ? 'más' : 'menos'} ${formatoChile(pregunta.b)}. Respuesta: ${escrita || 'vacía'}`);
    operacion.innerHTML =
      celda('') + fa.map(c => celda(c)).join('') +
      celda(SIMBOLO[pregunta.op], 'signo') + fb.map(c => celda(c)).join('') +
      '<span class="raya"></span>' +
      celda('') + respuestaCeldas;
  }

  function nuevaPregunta() {
    if (!vigente) return;
    pregunta = generarPregunta(perfil);
    respuesta = '';
    intentos = 0;
    bloqueado = false;
    aviso.textContent = '';
    aviso.className = 'aviso';
    dibujarPregunta();
    voz.decir(['cuanto_es', ...numeroATokens(pregunta.a), VOZ_OP[pregunta.op], ...numeroATokens(pregunta.b)], perfil);
  }

  async function responder() {
    if (bloqueado || respuesta === '' || respuesta.endsWith(',')) return;
    if (respuestaCorrecta(respuesta, pregunta.resultado)) {
      bloqueado = true;
      datos.aciertos++;
      const ganoEstrella = datos.aciertos % ACIERTOS_POR_ESTRELLA === 0;
      if (ganoEstrella) datos.estrellas++;
      db.guardarDato('desafio-' + perfil, datos);
      dibujarEstrellas();
      aviso.textContent = ganoEstrella ? '¡Ganaste una estrella!' : '¡Muy bien!';
      aviso.className = 'aviso bien';
      animar(tarjeta, 'celebrar');
      anunciar(aviso.textContent);
      if (ganoEstrella) {
        const celebracion = crear(`<div class="estrella-ganada" aria-hidden="true">${ICONOS.estrellaLlena}</div>`);
        document.body.appendChild(celebracion);
        setTimeout(() => celebracion.remove(), 1700);
        await Promise.all([voz.decir(['muy_bien', 'estrella'], perfil), esperar(1800)]);
      } else {
        voz.decir(['muy_bien'], perfil);
        await esperar(1100);
      }
      nuevaPregunta();
      return;
    }
    intentos++;
    animar(tarjeta, 'sacudir');
    if (intentos === 1) {
      aviso.textContent = '¡Inténtalo otra vez!';
      aviso.className = 'aviso mal';
      anunciar('Inténtalo otra vez');
      respuesta = '';
      dibujarPregunta();
      voz.decir(['otra_vez'], perfil);
      return;
    }
    bloqueado = true;
    dibujarPregunta(true);
    aviso.textContent = `La respuesta es ${formatoChile(pregunta.resultado)}`;
    aviso.className = 'aviso';
    anunciar(aviso.textContent);
    await Promise.all([
      voz.decir([...numeroATokens(pregunta.a), VOZ_OP[pregunta.op], ...numeroATokens(pregunta.b), 'igual', ...numeroATokens(pregunta.resultado)], perfil),
      esperar(2500),
    ]);
    await esperar(600);
    nuevaPregunta();
  }

  function teclear(n) {
    if (bloqueado) return;
    if (n === 'ok') { responder(); return; }
    if (n === 'borrar') respuesta = respuesta.slice(0, -1);
    else if (n === ',') { if (conComa && !respuesta.includes(',')) respuesta = (respuesta || '0') + ','; }
    else if (respuesta.replace(',', '').length < 6) respuesta = respuesta === '0' ? n : respuesta + n;
    dibujarPregunta();
  }

  pantalla.addEventListener('click', e => {
    const num = e.target.closest('[data-num]');
    if (num) { teclear(num.dataset.num); return; }
    if (e.target.closest('[data-accion="otra"]')) nuevaPregunta();
  });
  const alTeclear = e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const n = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'borrar'
      : (e.key === ',' || e.key === '.') && conComa ? ',' : null;
    if (!n) return;
    e.preventDefault();
    hundir(pantalla.querySelector(`[data-num="${n}"]`));
    teclear(n);
  };
  document.addEventListener('keydown', alTeclear);

  db.leerDato('desafio-' + perfil, datos).catch(() => datos).then(d => {
    if (!vigente) return;
    datos = { estrellas: 0, aciertos: 0, ...(d || {}) };
    dibujarEstrellas();
    nuevaPregunta();
  });

  return () => {
    vigente = false;
    document.removeEventListener('keydown', alTeclear);
    voz.callar();
  };
}
