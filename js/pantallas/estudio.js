// Pantalla 5: Estudio de grabación (para el Tata).
import { ICONOS } from '../iconos.js';
import { AUDIOS, AUDIOS_POR_ID, GRUPOS, PERFILES, textoDeAudio } from '../logica/audios.js';
import { numeroATokens } from '../logica/numeros.js';
import { crearZip, leerZip } from '../logica/zip.js';
import { crear, selectorPerfil, escapar, anunciar } from '../ui.js';
import * as voz from '../voz.js';
import * as db from '../db.js';
import * as grabador from '../grabador.js';

const IDS = AUDIOS.map(a => a.id);
const actualPorPerfil = { nieta1: 'n0', nieta2: 'n0' };

export function mostrarEstudio(contenedor, app) {
  const perfil = app.perfil;
  let actual = actualPorPerfil[perfil];
  let presionado = false;
  let ocupado = false;

  const pantalla = crear(`
    <section class="pantalla estudio">
      <div class="encabezado" style="align-items:center">
        <button class="volver" data-ir="inicio">${ICONOS.anterior}Volver</button>
        ${selectorPerfil(perfil)}
      </div>
      <div><h1>Estudio de grabación</h1><p class="subtitulo v-resumen"></p></div>
      <div class="barra" role="progressbar" aria-label="Grabaciones listas" aria-valuemin="0" aria-valuemax="${IDS.length}"><div></div></div>

      <div class="tarjeta centrado ahora-di">
        <div class="etiqueta-mayus">Ahora di…</div>
        <div class="texto-grande" aria-live="polite"></div>
        <div class="fila-botones">
          <button class="tecla fn boton-redondo" data-accion="escuchar" aria-label="Escuchar la grabación">${ICONOS.reproducir}</button>
          <button class="tecla acento boton-microfono" data-accion="grabar" aria-label="Grabar: mantén apretado mientras hablas">${ICONOS.microfono}</button>
          <button class="tecla fn boton-redondo" data-accion="siguiente" aria-label="Siguiente pendiente">${ICONOS.siguiente}</button>
        </div>
        <p class="estado-grabacion" aria-live="polite">Mantén apretado para grabar, suelta para terminar.</p>
      </div>

      <div class="grupos"></div>

      <button class="tecla boton" data-accion="probar">${ICONOS.vozSi}Probar cómo suena la voz</button>
      <div class="acciones-zip">
        <button class="tecla boton" data-accion="exportar">${ICONOS.exportar}Exportar .zip</button>
        <button class="tecla boton" data-accion="importar">${ICONOS.importar}Importar .zip</button>
      </div>
      <input type="file" accept=".zip,application/zip" hidden>
      <p class="nota">Las grabaciones se guardan solo en este dispositivo. Exporta un .zip de vez en cuando
        para no perderlas y guardarlas de recuerdo. Si falta alguna, la app usa la voz del sistema.</p>
    </section>`);
  contenedor.appendChild(pantalla);

  const estado = pantalla.querySelector('.estado-grabacion');
  const microfono = pantalla.querySelector('[data-accion="grabar"]');
  const archivo = pantalla.querySelector('input[type="file"]');

  function elegir(id) {
    actual = id;
    actualPorPerfil[perfil] = id;
    dibujar();
  }

  function dibujar() {
    const listos = voz.contarGrabados(perfil, IDS);
    pantalla.querySelector('.v-resumen').textContent = `Voz de ${PERFILES[perfil].nombre} · ${listos} de ${IDS.length} grabaciones listas`;
    const barra = pantalla.querySelector('.barra');
    barra.firstElementChild.style.width = (100 * listos / IDS.length) + '%';
    barra.setAttribute('aria-valuenow', listos);

    const audio = AUDIOS_POR_ID[actual];
    const texto = textoDeAudio(actual, perfil);
    const simbolo = audio.etiqueta && audio.etiqueta !== audio.texto && audio.grupo !== 'Frases'
      ? `<span class="simbolo">${escapar(audio.etiqueta)}</span>` : '';
    pantalla.querySelector('.texto-grande').innerHTML = `${simbolo}<span>«${escapar(texto)}»</span>`;
    pantalla.querySelector('[data-accion="escuchar"]').disabled = !voz.estaGrabado(perfil, actual);

    pantalla.querySelector('.grupos').innerHTML = GRUPOS.map(grupo => {
      const audios = AUDIOS.filter(a => a.grupo === grupo);
      const hechos = voz.contarGrabados(perfil, audios.map(a => a.id));
      const botones = audios.map(a => {
        const grabado = voz.estaGrabado(perfil, a.id);
        const rotulo = grupo === 'Frases' ? textoDeAudio(a.id, perfil) : a.etiqueta;
        return `<button class="${grabado ? '' : 'pendiente'}" data-audio="${a.id}" aria-current="${a.id === actual}"
          aria-label="${escapar(textoDeAudio(a.id, perfil))}: ${grabado ? 'grabado' : 'pendiente'}">
          <span class="txt">${escapar(rotulo)}</span><span class="marca">${grabado ? ICONOS.listo : ICONOS.pendiente}</span></button>`;
      }).join('');
      return `<div class="grupo-titulo"><h2>${grupo}</h2><span>${hechos} de ${audios.length}</span></div>
        <div class="lista-audios ${grupo === 'Frases' ? 'frases' : ''}">${botones}</div>`;
    }).join('');
  }

  function siguientePendiente() {
    const i = IDS.indexOf(actual);
    for (let k = 1; k <= IDS.length; k++) {
      const id = IDS[(i + k) % IDS.length];
      if (!voz.estaGrabado(perfil, id)) return id;
    }
    return IDS[(i + 1) % IDS.length];
  }

  // ----- Grabar manteniendo presionado -----
  async function empezarGrabacion() {
    if (ocupado) return;
    if (!grabador.hayMicrofono()) {
      estado.textContent = 'Este navegador no permite grabar. Abre la app desde https o desde localhost.';
      return;
    }
    presionado = true;
    voz.callar();
    try {
      await grabador.empezar();
    } catch (e) {
      presionado = false;
      estado.textContent = 'No se pudo usar el micrófono. Revisa que la app tenga permiso para usarlo.';
      return;
    }
    if (!presionado) {   // se soltó mientras se pedía permiso
      await grabador.terminar().catch(() => null);
      estado.textContent = 'Ahora sí: mantén apretado el micrófono mientras hablas.';
      return;
    }
    microfono.classList.add('grabando');
    estado.textContent = 'Grabando… suelta cuando termines.';
  }

  async function terminarGrabacion() {
    if (!presionado) return;
    presionado = false;
    microfono.classList.remove('grabando');
    if (!grabador.grabando()) return;
    ocupado = true;
    estado.textContent = 'Guardando…';
    try {
      const r = await grabador.terminar();
      if (!r) {
        estado.textContent = 'No se escuchó nada. Intenta de nuevo, un poco más cerca del micrófono.';
        return;
      }
      await db.guardarAudio(perfil, actual, r.wav);
      voz.olvidar(perfil, actual);
      await voz.actualizarLista();
      dibujar();
      estado.textContent = '¡Listo! Escúchala o pasa a la siguiente.';
      anunciar('Grabación guardada');
      voz.reproducirDatos(r.wav);
    } catch (e) {
      console.error(e);
      estado.textContent = 'Hubo un problema al guardar la grabación. Intenta de nuevo.';
    } finally {
      ocupado = false;
    }
  }

  microfono.addEventListener('pointerdown', e => {
    e.preventDefault();
    microfono.setPointerCapture?.(e.pointerId);
    empezarGrabacion();
  });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) microfono.addEventListener(ev, terminarGrabacion);
  microfono.addEventListener('keydown', e => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); empezarGrabacion(); }
  });
  microfono.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') terminarGrabacion(); });
  microfono.addEventListener('contextmenu', e => e.preventDefault());

  // ----- Exportar / importar -----
  async function exportar() {
    estado.textContent = 'Preparando el archivo…';
    const claves = await db.listarAudios();
    const archivos = [];
    const lineas = ['Voces de la calculadora de las nietas', `Exportado el ${new Date().toLocaleString('es-CL')}`, ''];
    for (const clave of claves.sort()) {
      const [p, id] = clave.split('/');
      if (!PERFILES[p] || !AUDIOS_POR_ID[id]) continue;
      const datos = await db.leerAudio(p, id);
      if (!datos) continue;
      archivos.push({ nombre: `${p}/${id}.wav`, datos: new Uint8Array(datos) });
      lineas.push(`${p}/${id}.wav  →  ${textoDeAudio(id, p)}`);
    }
    if (!archivos.length) { estado.textContent = 'Todavía no hay grabaciones para exportar.'; return; }
    archivos.push({ nombre: 'LEEME.txt', datos: new TextEncoder().encode(lineas.join('\r\n')) });
    const zip = crearZip(archivos);
    const url = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `voces-nietas-${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    estado.textContent = `Se exportaron ${archivos.length - 1} grabaciones.`;
  }

  async function importar(file) {
    estado.textContent = 'Leyendo el archivo…';
    try {
      const archivos = await leerZip(new Uint8Array(await file.arrayBuffer()));
      let n = 0;
      for (const { nombre, datos } of archivos) {
        const partes = nombre.split('/');
        if (partes.length < 2) continue;
        const p = partes[partes.length - 2].toLowerCase();
        const id = partes[partes.length - 1].replace(/\.wav$/i, '');
        const esWav = datos.length > 44 && String.fromCharCode(...datos.subarray(0, 4)) === 'RIFF';
        if (!PERFILES[p] || !AUDIOS_POR_ID[id] || !esWav) continue;
        await db.guardarAudio(p, id, datos.slice().buffer);
        voz.olvidar(p, id);
        n++;
      }
      await voz.actualizarLista();
      dibujar();
      estado.textContent = n ? `Se importaron ${n} grabaciones.` : 'El archivo no tenía grabaciones de esta app.';
    } catch (e) {
      estado.textContent = 'No se pudo leer el archivo. ¿Es un .zip exportado desde esta app?';
    }
  }

  pantalla.addEventListener('click', e => {
    const chip = e.target.closest('[data-audio]');
    if (chip) {
      elegir(chip.dataset.audio);
      if (voz.estaGrabado(perfil, actual)) voz.decir([actual], perfil, { forzar: true });
      return;
    }
    const accion = e.target.closest('[data-accion]')?.dataset.accion;
    if (accion === 'escuchar') voz.decir([actual], perfil, { forzar: true });
    else if (accion === 'siguiente') { elegir(siguientePendiente()); estado.textContent = 'Mantén apretado para grabar, suelta para terminar.'; }
    else if (accion === 'probar') {
      const a = 2 + Math.floor(Math.random() * 8), b = 2 + Math.floor(Math.random() * 8);
      voz.decir(['cuanto_es', ...numeroATokens(a), 'por', ...numeroATokens(b), 'igual', ...numeroATokens(a * b)], perfil, { forzar: true });
    }
    else if (accion === 'exportar') exportar();
    else if (accion === 'importar') archivo.click();
  });
  archivo.addEventListener('change', () => {
    if (archivo.files[0]) importar(archivo.files[0]);
    archivo.value = '';
  });

  dibujar();
  return () => {
    voz.callar();
    grabador.liberar();
  };
}
