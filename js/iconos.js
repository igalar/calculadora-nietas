// Íconos SVG simples (trazo, 24×24). Heredan el color del texto.

const trazo = contenido =>
  `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.2" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${contenido}</svg>`;

export const ICONOS = {
  microfono: trazo('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>'),
  reproducir: trazo('<path d="M8 5.5v13l10-6.5z" fill="currentColor"/>'),
  siguiente: trazo('<path d="M9 5l7 7-7 7"/>'),
  anterior: trazo('<path d="M15 5l-7 7 7 7"/>'),
  borrar: trazo('<path d="M9 5h11v14H9l-6-7z"/><path d="M12.5 9.5l5 5M17.5 9.5l-5 5"/>'),
  raiz: trazo('<path d="M3 13h3l3 7 5-16h7"/>'),
  vozSi: trazo('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  vozNo: trazo('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  ayuda: trazo('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><circle cx="12" cy="17" r=".6" fill="currentColor"/>'),
  estrella: trazo('<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>'),
  estrellaLlena: trazo('<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="currentColor"/>'),
  por: trazo('<path d="M6 6l12 12M18 6L6 18"/>'),
  onda: trazo('<path d="M4 10v4M8 7v10M12 9v6M16 5v14M20 10v4"/>'),
  listo: trazo('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  pendiente: trazo('<circle cx="12" cy="12" r="6"/>'),
  exportar: trazo('<path d="M12 3v12M7.5 10.5L12 15l4.5-4.5"/><path d="M4 17v3h16v-3"/>'),
  importar: trazo('<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5"/><path d="M4 17v3h16v-3"/>'),
  reloj: trazo('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9.5 2.5h5"/>'),
  racha: trazo('<path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z"/>'),
  mapa: trazo('<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M3.5 9.5h17M3.5 15h17M9.5 3.5v17M15 3.5v17"/>'),
  libro: trazo('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23"/>'),
  profe: trazo('<circle cx="8" cy="8" r="3"/><path d="M2.5 20a5.5 5.5 0 0 1 11 0"/><path d="M15 5.5h6v5h-3l-2 2v-2h-1z"/>'),
  cerrar: trazo('<path d="M6 6l12 12M18 6L6 18"/>'),
  paleta: trazo('<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1-1.6-1-2.7 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.4 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2" fill="currentColor"/><circle cx="10.5" cy="7" r="1.2" fill="currentColor"/><circle cx="15.5" cy="7.5" r="1.2" fill="currentColor"/>'),
  sumaResta:trazo('<path d="M7 4v8M3 8h8M14 17h7"/>'),
};
