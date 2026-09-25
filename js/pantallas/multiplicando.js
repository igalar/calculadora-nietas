// Pantalla 3: Multiplicando. Aprendo (recorrer una tabla), Practico (preguntas) y Mapa de avance.
import { ICONOS } from '../iconos.js';
import { PERFILES } from '../logica/audios.js';
import { numeroATokens } from '../logica/numeros.js';
import { ORDEN_TABLAS, registrar, estado, dominada, elegirPregunta, contarDominadas } from '../logica/tablas.js';
import { crear, botonVolver, selectorPerfil, interruptor, animar, anunciar, esperar, hundir, escapar } from '../ui.js';
import * as voz from '../voz.js';
import * as db from '../db.js';

const SEGUNDOS_CONTRARRELOJ = 60;
const MODO_INICIAL = { nieta1: 'practico', nieta2: 'aprendo' };
const TABLAS_INICIALES = { nieta1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], nieta2: [2, 5, 10] };

// Recuerda las elecciones mientras la app está abierta
const recuerdo = {
  modo: { ...MODO_INICIAL },
  tablas: { nieta1: [...TABLAS_INICIALES.nieta1], nieta2: [...TABLAS_INICIALES.nieta2] },
  contrarreloj: { nieta1: false, nieta2: false },
  profe: { nieta1: false, nieta2: false },
};

const otra = perfil => (perfil === 'nieta1' ? 'nieta2' : 'nieta1');
const multiplicacion = (a, b) => [...numeroATokens(a), 'por', ...numeroATokens(b)];

export function mostrarMultiplicando(contenedor, app) {
  const perfil = app.perfil;
  let progreso = {};
  let records = { racha: 0, contrarreloj: 0 };
  let limpiarVista = null;
  let vigente = true;

  const pantalla = crear(`
    <section class="pantalla multiplicando">
      ${botonVolver()}
      <div class="encabezado">
        <div><div class="antetitulo">Aprende las tablas</div><h1>Multiplicando</h1></div>
        ${selectorPerfil(perfil)}
      </div>
      <div class="pestanas" role="tablist" aria-label="Nivel">
        <button role="tab" data-modo="aprendo">${ICONOS.libro}Aprendo</button>
        <button role="tab" data-modo="practico">${ICONOS.racha}Practico</button>
        <button role="tab" data-modo="mapa">${ICONOS.mapa}Mapa</button>
      </div>
      <div class="contenido" role="tabpanel"></div>
    </section>`);
  contenedor.appendChild(pantalla);
  const contenido = pantalla.querySelector('.contenido');

  const guardarProgreso = () => db.guardarDato('tablas-' + perfil, progreso);
  const guardarRecords = () => db.guardarDato('records-' + perfil, records);

  function cambiarModo(modo) {
    recuerdo.modo[perfil] = modo;
    for (const b of pantalla.querySelectorAll('[data-modo]')) b.setAttribute('aria-selected', b.dataset.modo === modo);
    if (limpiarVista) { limpiarVista(); limpiarVista = null; }
    voz.callar();
    contenido.innerHTML = '';
    limpiarVista = { aprendo: vistaAprendo, practico: vistaPractico, mapa: vistaMapa }[modo]() || null;
  }

  pantalla.querySelector('.pestanas').addEventListener('click', e => {
    const b = e.target.closest('[data-modo]');
    if (b) cambiarModo(b.dataset.modo);
  });

  // ---------- Aprendo ----------
  function vistaAprendo(tablaInicial = null) {
    let tabla = tablaInicial;
    let b = 1;
    let revelado = false;

    function elegirTabla() {
      contenido.innerHTML = '';
      const botones = ORDEN_TABLAS.map(t => {
        const n = [...Array(10)].filter((_, i) => dominada(progreso, t, i + 1)).length;
        return `<button class="tecla" data-tabla="${t}" aria-label="Tabla del ${t}. Dominas ${n} de 10">${t}<small>${n}/10</small></button>`;
      }).join('');
      contenido.appendChild(crear(`
        <div class="opciones">
          <p class="avance-texto">¿Qué tabla quieres aprender?</p>
          <div class="tablas-grilla">${botones}</div>
          <p class="nota">Orden sugerido: 2, 5, 10, 3 y 4; luego las demás.</p>
        </div>`));
    }

    function dibujarPaso() {
      const a = tabla;
      const r = a * b;
      const tam = Math.max(a, b) <= 5 ? 22 : Math.max(a, b) <= 8 ? 17 : 13;
      const puntos = [...Array(a)].map((_, fila) =>
        [...Array(b)].map(() => `<span class="fila-nueva" style="animation-delay:${fila * 60}ms"></span>`).join('')).join('');
      contenido.innerHTML = '';
      contenido.appendChild(crear(`
        <div class="opciones">
          <div class="tarjeta centrado">
            <div class="etiqueta-mayus">Tabla del ${a}</div>
            <div class="operacion-grande" aria-live="polite">
              <span>${a}</span><span>×</span><span>${b}</span><span>=</span>
              <span class="resultado ${revelado ? '' : 'vacio'}">${revelado ? r : '?'}</span>
            </div>
            <div class="puntos" style="--tam:${tam}px; grid-template-columns: repeat(${b}, ${tam}px)" aria-hidden="true">${puntos}</div>
            <p class="leyenda-puntos">${a} ${a === 1 ? 'fila' : 'filas'} de ${b} ${b === 1 ? 'punto' : 'puntos'}</p>
          </div>
          <div class="fila-botones">
            <button class="tecla fn boton-redondo" data-paso="-1" aria-label="Anterior" ${b === 1 ? 'disabled' : ''}>${ICONOS.anterior}</button>
            <button class="tecla acento boton" data-accion="revelar">${revelado ? ICONOS.vozSi + 'Escuchar' : '¿Cuánto es?'}</button>
            <button class="tecla fn boton-redondo" data-paso="1" aria-label="Siguiente">${ICONOS.siguiente}</button>
          </div>
          <p class="avance-texto">${b} de 10</p>
          <button class="tecla boton" data-accion="otra-tabla">Elegir otra tabla</button>
        </div>`));
      if (revelado) voz.decir([...multiplicacion(a, b), 'igual', ...numeroATokens(r)], perfil);
      else voz.decir(multiplicacion(a, b), perfil);
    }

    function terminarTabla() {
      contenido.innerHTML = '';
      contenido.appendChild(crear(`
        <div class="opciones">
          <div class="tarjeta centrado celebrar">
            <div class="estrellas">${ICONOS.estrellaLlena}${ICONOS.estrellaLlena}${ICONOS.estrellaLlena}</div>
            <h2>¡Terminaste la tabla del ${tabla}!</h2>
            <p class="subtitulo">Ahora pruébala en Practico para pintar tu mapa.</p>
          </div>
          <button class="tecla acento boton" data-accion="practicar">Practicar la tabla del ${tabla}</button>
          <button class="tecla boton" data-accion="otra-tabla">Elegir otra tabla</button>
        </div>`));
      voz.decir(['muy_bien'], perfil);
    }

    const alClic = e => {
      const t = e.target.closest('[data-tabla]');
      if (t) { tabla = Number(t.dataset.tabla); b = 1; revelado = false; dibujarPaso(); return; }
      const paso = e.target.closest('[data-paso]');
      if (paso) {
        const d = Number(paso.dataset.paso);
        if (d > 0 && b === 10) { terminarTabla(); return; }
        b = Math.min(10, Math.max(1, b + d));
        revelado = false;
        dibujarPaso();
        return;
      }
      const accion = e.target.closest('[data-accion]');
      if (!accion) return;
      if (accion.dataset.accion === 'revelar') { revelado = true; dibujarPaso(); }
      else if (accion.dataset.accion === 'otra-tabla') { tabla = null; voz.callar(); elegirTabla(); }
      else if (accion.dataset.accion === 'practicar') {
        recuerdo.tablas[perfil] = [tabla];
        cambiarModo('practico');
      }
    };
    contenido.addEventListener('click', alClic);
    if (tabla) dibujarPaso(); else elegirTabla();
    return () => contenido.removeEventListener('click', alClic);
  }

  // ---------- Practico ----------
  function vistaPractico() {
    let juego = null;   // estado del juego en curso
    let reloj = null;

    function configuracion() {
      const elegidas = recuerdo.tablas[perfil];
      const chips = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(t =>
        `<button class="tecla" data-tabla="${t}" aria-pressed="${elegidas.includes(t)}" aria-label="Tabla del ${t}">${t}</button>`).join('');
      const hermana = PERFILES[otra(perfil)].nombre;
      contenido.innerHTML = '';
      contenido.appendChild(crear(`
        <div class="opciones">
          <p class="avance-texto">¿Qué tablas quieres practicar?</p>
          <div class="tablas-grilla">${chips}</div>
          <button class="tecla boton" data-accion="todas">${elegidas.length === 10 ? 'Quitar todas' : 'Todas las tablas'}</button>
          ${interruptor('contrarreloj', 'Contrarreloj', `¿Cuántas alcanzas en ${SEGUNDOS_CONTRARRELOJ} segundos?`, recuerdo.contrarreloj[perfil], 'reloj')}
          ${interruptor('profe', 'Modo Profe', `Te pregunta la voz de ${hermana}`, recuerdo.profe[perfil], 'profe')}
          <p class="nota">Mejor racha: ${records.racha} · Récord contrarreloj: ${records.contrarreloj}</p>
          <button class="tecla acento boton" data-accion="empezar" ${elegidas.length ? '' : 'disabled'}>¡Empezar!</button>
        </div>`));
    }

    function empezar() {
      juego = {
        tablas: [...recuerdo.tablas[perfil]].sort((x, y) => x - y),
        contrarreloj: recuerdo.contrarreloj[perfil],
        voz: recuerdo.profe[perfil] ? otra(perfil) : perfil,
        racha: 0,
        aciertos: 0,
        pregunta: null,
        respuesta: '',
        intentos: 0,
        bloqueado: false,
        restante: SEGUNDOS_CONTRARRELOJ,
      };
      contenido.innerHTML = '';
      const teclas = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => `<button class="tecla" data-num="${n}">${n}</button>`).join('');
      contenido.appendChild(crear(`
        <div class="opciones">
          <div class="marcadores">
            <span class="marcador" aria-label="Racha">${ICONOS.racha}<span class="v-racha">0</span></span>
            ${juego.contrarreloj
              ? `<span class="marcador reloj" aria-label="Tiempo">${ICONOS.reloj}<span class="v-reloj">1:00</span></span>`
              : `<span class="marcador" aria-label="Aciertos">${ICONOS.listo}<span class="v-aciertos">0</span></span>`}
          </div>
          <div class="tarjeta pregunta">
            ${juego.voz !== perfil ? `<div class="etiqueta-mayus centrado">Pregunta ${escapar(PERFILES[juego.voz].nombre)}</div>` : ''}
            <div class="operacion-grande" aria-live="polite"></div>
            <p class="aviso" aria-live="polite"></p>
          </div>
          <div class="teclado-respuesta">
            ${teclas}
            <button class="tecla fn" data-num="borrar" aria-label="Borrar">${ICONOS.borrar}</button>
            <button class="tecla" data-num="0">0</button>
            <button class="tecla acento" data-num="ok" aria-label="Responder">OK</button>
          </div>
          <button class="tecla boton" data-accion="terminar">Terminar</button>
        </div>`));
      if (juego.contrarreloj) {
        reloj = setInterval(() => {
          juego.restante--;
          const r = contenido.querySelector('.v-reloj');
          if (r) r.textContent = `0:${String(Math.max(0, juego.restante)).padStart(2, '0')}`;
          contenido.querySelector('.reloj')?.classList.toggle('urgente', juego.restante <= 10);
          if (juego.restante <= 0) finContrarreloj();
        }, 1000);
      }
      siguientePregunta();
    }

    function dibujarPregunta(mostrarResultado = false) {
      const { a, b } = juego.pregunta;
      const caja = mostrarResultado ? a * b : juego.respuesta;
      contenido.querySelector('.operacion-grande').innerHTML =
        `<span>${a}</span><span>×</span><span>${b}</span><span>=</span>` +
        `<span class="respuesta-caja ${caja === '' ? 'vacia' : ''}">${caja === '' ? '?' : caja}</span>`;
    }

    function siguientePregunta() {
      if (!vigente || !juego) return;
      juego.pregunta = elegirPregunta(progreso, juego.tablas, juego.pregunta);
      juego.respuesta = '';
      juego.intentos = 0;
      juego.bloqueado = false;
      contenido.querySelector('.aviso').textContent = '';
      contenido.querySelector('.aviso').className = 'aviso';
      dibujarPregunta();
      const { a, b } = juego.pregunta;
      voz.decir(['cuanto_es', ...multiplicacion(a, b)], juego.voz);
    }

    function actualizarMarcadores() {
      contenido.querySelector('.v-racha').textContent = juego.racha;
      const ac = contenido.querySelector('.v-aciertos');
      if (ac) ac.textContent = juego.aciertos;
    }

    async function responder() {
      if (juego.bloqueado || juego.respuesta === '') return;
      const { a, b } = juego.pregunta;
      const aviso = contenido.querySelector('.aviso');
      const tarjeta = contenido.querySelector('.pregunta');
      if (Number(juego.respuesta) === a * b) {
        juego.bloqueado = true;
        if (juego.intentos === 0) registrar(progreso, a, b, true);
        guardarProgreso();
        juego.racha++;
        juego.aciertos++;
        if (juego.racha > records.racha) { records.racha = juego.racha; guardarRecords(); }
        actualizarMarcadores();
        aviso.textContent = '¡Muy bien!';
        aviso.className = 'aviso bien';
        animar(tarjeta, 'celebrar');
        anunciar('¡Muy bien!');
        voz.decir(['muy_bien'], juego.voz);
        await esperar(1100);
        siguientePregunta();
        return;
      }
      juego.intentos++;
      if (juego.intentos === 1) { registrar(progreso, a, b, false); guardarProgreso(); }
      juego.racha = 0;
      actualizarMarcadores();
      animar(tarjeta, 'sacudir');
      if (juego.intentos === 1) {
        aviso.textContent = '¡Inténtalo otra vez!';
        aviso.className = 'aviso mal';
        anunciar('Inténtalo otra vez');
        juego.respuesta = '';
        dibujarPregunta();
        voz.decir(['otra_vez'], juego.voz);
        return;
      }
      // Segundo error: se muestra la respuesta y se sigue
      juego.bloqueado = true;
      dibujarPregunta(true);
      aviso.textContent = `${a} × ${b} = ${a * b}`;
      aviso.className = 'aviso';
      anunciar(`${a} por ${b} es ${a * b}`);
      await Promise.all([voz.decir([...multiplicacion(a, b), 'igual', ...numeroATokens(a * b)], juego.voz), esperar(2200)]);
      await esperar(600);
      siguientePregunta();
    }

    function teclear(n) {
      if (!juego || juego.bloqueado) return;
      if (n === 'ok') { responder(); return; }
      if (n === 'borrar') juego.respuesta = juego.respuesta.slice(0, -1);
      else if (juego.respuesta.length < 3) juego.respuesta = juego.respuesta === '0' ? n : juego.respuesta + n;
      dibujarPregunta();
    }

    function finContrarreloj() {
      clearInterval(reloj);
      reloj = null;
      const aciertos = juego.aciertos;
      const record = aciertos > records.contrarreloj;
      if (record) { records.contrarreloj = aciertos; guardarRecords(); }
      juego = null;
      contenido.innerHTML = '';
      contenido.appendChild(crear(`
        <div class="opciones">
          <div class="tarjeta centrado celebrar">
            <div class="etiqueta-mayus">¡Se acabó el tiempo!</div>
            <div class="operacion-grande">${aciertos}</div>
            <h2>${aciertos === 1 ? 'respuesta correcta' : 'respuestas correctas'}</h2>
            <p class="subtitulo">${record ? '¡Es tu nuevo récord!' : `Tu récord es ${records.contrarreloj}.`}</p>
          </div>
          <button class="tecla acento boton" data-accion="empezar">Otra vez</button>
          <button class="tecla boton" data-accion="configurar">Cambiar tablas</button>
        </div>`));
      voz.decir(aciertos > 0 ? ['muy_bien'] : ['otra_vez'], perfil);
    }

    const alClic = e => {
      const num = e.target.closest('[data-num]');
      if (num) { teclear(num.dataset.num); return; }
      const t = e.target.closest('[data-tabla]');
      if (t) {
        const n = Number(t.dataset.tabla);
        const lista = recuerdo.tablas[perfil];
        recuerdo.tablas[perfil] = lista.includes(n) ? lista.filter(x => x !== n) : [...lista, n];
        configuracion();
        return;
      }
      const sw = e.target.closest('[data-interruptor]');
      if (sw) {
        const clave = sw.dataset.interruptor;
        recuerdo[clave][perfil] = !recuerdo[clave][perfil];
        sw.setAttribute('aria-checked', recuerdo[clave][perfil]);
        if (clave === 'profe' && recuerdo.profe[perfil]) voz.decir(['hola'], otra(perfil));
        return;
      }
      const accion = e.target.closest('[data-accion]');
      if (!accion) return;
      const a = accion.dataset.accion;
      if (a === 'todas') {
        recuerdo.tablas[perfil] = recuerdo.tablas[perfil].length === 10 ? [] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        configuracion();
      } else if (a === 'empezar') empezar();
      else if (a === 'configurar') configuracion();
      else if (a === 'terminar') {
        if (reloj) { clearInterval(reloj); reloj = null; }
        juego = null;
        voz.callar();
        configuracion();
      }
    };
    const alTeclear = e => {
      if (!juego || e.ctrlKey || e.metaKey || e.altKey) return;
      const n = /^[0-9]$/.test(e.key) ? e.key : e.key === 'Enter' ? 'ok' : e.key === 'Backspace' ? 'borrar' : null;
      if (!n) return;
      e.preventDefault();
      hundir(contenido.querySelector(`[data-num="${n}"]`));
      teclear(n);
    };
    contenido.addEventListener('click', alClic);
    document.addEventListener('keydown', alTeclear);
    configuracion();
    return () => {
      if (reloj) clearInterval(reloj);
      juego = null;
      contenido.removeEventListener('click', alClic);
      document.removeEventListener('keydown', alTeclear);
    };
  }

  // ---------- Mapa de avance ----------
  function vistaMapa() {
    const total = contarDominadas(progreso);
    let celdas = '<span class="cab" aria-hidden="true">×</span>';
    for (let b = 1; b <= 10; b++) celdas += `<span class="cab" aria-hidden="true">${b}</span>`;
    for (let a = 1; a <= 10; a++) {
      celdas += `<span class="cab" aria-hidden="true">${a}</span>`;
      for (let b = 1; b <= 10; b++) {
        const e = estado(progreso, a, b);
        const clase = e.racha >= 3 ? 'dominada' : e.intentos > 0 ? 'en-camino' : '';
        const txt = clase === 'dominada' ? 'dominada' : clase ? `en camino, ${e.racha} de 3 seguidas` : 'por aprender';
        celdas += `<button class="${clase}" data-a="${a}" data-b="${b}" aria-label="${a} por ${b}: ${txt}">${clase === 'dominada' ? a * b : ''}</button>`;
      }
    }
    contenido.innerHTML = '';
    contenido.appendChild(crear(`
      <div class="opciones">
        <div class="tarjeta">
          <p class="avance-texto">${escapar(PERFILES[perfil].nombre)} domina <strong>${total}</strong> de 100</p>
          <div class="barra" style="margin:10px 0 14px"><div style="width:${total}%"></div></div>
          <div class="mapa">${celdas}</div>
        </div>
        <div class="leyenda">
          <span><i style="background:var(--acento)"></i>Dominada</span>
          <span><i style="background:var(--op)"></i>En camino</span>
          <span><i style="background:var(--suave);box-shadow:inset 0 0 0 2px var(--borde)"></i>Por aprender</span>
        </div>
        <p class="nota">Una multiplicación se pinta cuando la respondes bien 3 veces seguidas en Practico.</p>
      </div>`));
    const alClic = e => {
      const c = e.target.closest('[data-a]');
      if (!c) return;
      const a = Number(c.dataset.a), b = Number(c.dataset.b);
      voz.decir([...multiplicacion(a, b), 'igual', ...numeroATokens(a * b)], perfil);
    };
    contenido.addEventListener('click', alClic);
    return () => contenido.removeEventListener('click', alClic);
  }

  // Cargar datos guardados y mostrar el modo del perfil
  Promise.all([db.leerDato('tablas-' + perfil, {}), db.leerDato('records-' + perfil, records)])
    .catch(() => [{}, records])
    .then(([p, r]) => {
      if (!vigente) return;
      progreso = p || {};
      records = { racha: 0, contrarreloj: 0, ...(r || {}) };
      cambiarModo(recuerdo.modo[perfil]);
    });

  return () => {
    vigente = false;
    if (limpiarVista) limpiarVista();
    voz.callar();
  };
}
