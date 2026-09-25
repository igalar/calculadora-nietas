# Calculadora de las nietas

Calculadora que habla con la voz de cada nieta y les ayuda a aprender las tablas de multiplicar.
Es una aplicación web (PWA): se instala en la tablet o el celular como una app más y funciona
sin internet. No tiene cuentas, anuncios ni analítica. Las grabaciones y el avance se guardan
solo en el dispositivo.

## Qué trae

| Pantalla | Qué hace |
|---|---|
| **Inicio** | "¿Quién va a calcular hoy?": Nieta 1 (la mayor) o Nieta 2 (la menor). Cada una puede poner su nombre en "Colores y nombre". Accesos a Desafío y Multiplicando. Abajo, el botón del Tata (hay que mantenerlo apretado 3 segundos). |
| **Calculadora** | Dice cada tecla y, al presionar "=", dice "igual" y el resultado completo. Usa coma decimal, admite hasta 12 dígitos y calcula 0,1 + 0,2 = 0,3 sin errores de redondeo. Cuando algo no se puede calcular, muestra "¡Uy! Eso no se puede". |
| **Multiplicando** | *Aprendo*: recorre una tabla con puntos de colores. *Practico*: preguntas salteadas con racha, contrarreloj opcional y modo Profe (pregunta la voz de la hermana). Las multiplicaciones falladas aparecen más seguido. *Mapa*: tabla de 10×10 que se pinta al acertar 3 veces seguidas. |
| **Desafío** | Sumas y restas escritas como en el cuaderno: un número bajo el otro, el signo a la izquierda y cada cifra en su columna (alineadas por la coma cuando hay decimales). Nieta 2 (la menor): resultados hasta 100. Nieta 1 (la mayor): hasta 1.000, a veces con decimales. Cada 5 aciertos gana una estrella. |
| **Colores y nombre** | Desde el Inicio, cada nieta elige sus 3 colores (fondo, teclas y botón principal) y puede cambiar su nombre y su nombre corto. Los demás tonos se calculan solos, y cualquier combinación se lee bien. |
| **Estudio de grabación** | Para grabar las 71 voces de cada nieta, escucharlas, regrabarlas y exportarlas o importarlas en un .zip. |

## Probarla en el computador

1. Doble clic en **`Abrir calculadora.bat`**. Se abre el navegador en `http://localhost:8000`.
   (Equivale a ejecutar `python servidor.py` en esta carpeta y abrir esa dirección.)
2. Deja abierta la ventana negra mientras la usas; ciérrala para terminar.

Mientras no haya grabaciones, la app usa la voz del sistema (español de Chile si está disponible).

**Pruebas automáticas** (con la app abierta como se indica arriba):

- `http://localhost:8000/pruebas/`: 121 pruebas de la lógica: calculadora, números a palabras,
  tablas, desafío y cuenta en columnas, colores (contraste de todas las combinaciones),
  nombres, zip y WAV.
- `http://localhost:8000/pruebas/integracion.html`: audio real y almacenamiento (se escuchan unos tonos).
- `http://localhost:8000/pruebas/offline.html`: revisa que la app quedó guardada para funcionar
  sin internet (abre antes la app una vez).

## Grabar las voces

1. En el Inicio, mantén apretado **"Para el Tata: grabar voces"** durante 3 segundos.
2. Elige la nieta arriba a la derecha.
3. La tarjeta dice qué palabra toca. La nieta **mantiene apretado el micrófono mientras habla y
   lo suelta al terminar**. El silencio del principio y del final se recorta solo, y el volumen
   se empareja.
4. Con ▶ se escucha la grabación y con › se pasa a la siguiente pendiente. Para regrabar, basta
   con grabar de nuevo.
5. Son 71 grabaciones por nieta: 22 teclas, 43 números y 6 frases. Se pueden hacer en varias
   sesiones; las que faltan se marcan con un círculo y usan la voz del sistema mientras tanto.

Consejos: un lugar silencioso, el micrófono a un palmo de la boca, y decir cada palabra de
forma natural y pareja.

Además de los audios pedidos, agregué dos: **"un"** y **"veintiún"**. Son necesarios para decir
bien "un millón", "treinta y un mil" o "veintiún mil".

**Respaldo:** usa **Exportar .zip** de vez en cuando. El zip trae carpetas `nieta1/` y
`nieta2/` con un `.wav` por palabra, más un `LEEME.txt` que dice qué es cada uno. Queda de
recuerdo, y con **Importar .zip** se cargan las voces en otro dispositivo.

## Dónde está publicada

La app está publicada en **https://igalar.github.io/calculadora-nietas/**
(código en `github.com/igalar/calculadora-nietas`). Solo se publican los archivos de la app:
las voces y el avance **nunca** salen de cada teléfono o tablet. En el código, las niñas
aparecen solo como "Nieta 1" y "Nieta 2"; sus nombres se escriben en cada dispositivo.

## Instalarla en un teléfono o tablet

- **iPhone / iPad (Safari):** abre la dirección en **Safari**, toca **Compartir** (el cuadrado
  con la flecha) y elige **"Agregar a inicio"**.
- **Android (Chrome):** abre la dirección, toca el menú ⋮ y elige **"Instalar"** (no "Crear
  acceso directo").

Ábrela una vez desde el ícono con internet. Desde entonces funciona sin conexión. La primera
vez que grabes, acepta el permiso del micrófono. Después entra a **"Colores y nombre"** para
escribir el nombre de cada nieta.

> **Importante en iPhone/iPad:** la app instalada en la pantalla de inicio guarda sus datos
> aparte de Safari. Graba (o importa el .zip) **dentro de la app instalada**, no en Safari.
> Exporta el .zip de vez en cuando: si el teléfono se queda sin espacio, iOS puede borrar los
> datos de las apps web.

Para grabar una sola vez: graba en un dispositivo, usa **Exportar .zip**, pásalo a los demás
(WhatsApp, correo, AirDrop) y usa **Importar .zip** en cada uno.

**Sin internet (solo Android):** también se puede instalar desde el computador por cable USB
(`Conectar celular por USB.bat`, en la carpeta de arriba) o por el Wi-Fi de la casa, activando en
Chrome `chrome://flags` → "Insecure origins treated as secure" con la dirección del PC. Pero una
app instalada así es distinta de la publicada, y no recibe sus actualizaciones.

## Actualizar la app

1. Cambia los archivos y pruébalos en el computador (`Abrir calculadora.bat`).
2. Publica los cambios desde esta carpeta:
   ```
   git add -A
   git commit -m "Describe el cambio"
   git push
   ```
3. En uno o dos minutos GitHub publica la versión nueva. Cada teléfono la recibe la próxima vez
   que abra la app con internet. Las grabaciones y el avance no se pierden.

Cuando hay conexión, la app siempre carga la versión más nueva y guarda una copia; sin conexión
usa esa copia. Si se agrega un archivo **nuevo** a la app, súmalo a la lista de `sw.js` y sube
el número de `VERSION` para que también quede guardado sin conexión.

En el computador, recuerda que la versión nueva solo llega si el servidor está funcionando
(`Abrir calculadora.bat` con su ventana abierta). Si abres la app sin él, verás la última copia
guardada.

## Estructura del proyecto

```
Nietas/
├─ index.html              Página principal
├─ estilos.css             Diseño y temas de color de cada nieta
├─ manifest.webmanifest    Datos para instalarla como app
├─ sw.js                   Service worker: funcionamiento sin internet
├─ fuentes/                Fredoka y Nunito (incluidas, no dependen de internet)
├─ iconos/                 Íconos de la app
├─ js/
│  ├─ app.js               Arranque, perfil activo y navegación
│  ├─ voz.js               Reproduce grabaciones encadenadas; si falta una, usa la voz del sistema
│  ├─ grabador.js          Micrófono, recorte de silencios y conversión a WAV
│  ├─ db.js                Almacenamiento local (IndexedDB)
│  ├─ ui.js, iconos.js     Utilidades de interfaz e íconos SVG
│  ├─ pantallas/           Inicio, Calculadora, Multiplicando, Desafío, Estudio, Colores y nombre
│  └─ logica/              Lógica pura, cubierta por las pruebas:
│     ├─ calculadora.js    La calculadora
│     ├─ numeros.js        Números → palabras en español de Chile, y formato 1.234,5
│     ├─ audios.js         Lista de las 71 grabaciones
│     ├─ tablas.js         Dominio y elección de preguntas de las tablas
│     ├─ desafio.js        Preguntas del desafío y cuenta en columnas
│     ├─ colores.js        Paletas y cálculo del tema a partir de los 3 colores
│     ├─ zip.js            Crear y leer .zip
│     └─ wav.js            Recorte de silencio y formato WAV
├─ pruebas/                Pruebas automáticas y herramientas de revisión
├─ servidor.py             Servidor local para probar en el computador
└─ Abrir calculadora.bat   Abre la app en el computador con doble clic
```
