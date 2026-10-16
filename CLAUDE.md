# Sobre Lacrado App

## Reglas de trabajo (obligatorias)

- Responder siempre en **español**.
- **No subir cambios** (git push, firebase deploy, publicar nada) sin preguntar antes a Alberto y esperar su "sí".
- Alberto **no es programador**: explicar cada paso en lenguaje sencillo, sin jerga (o explicando el término la primera vez). Decir qué se hace, por qué y qué verá él como resultado.
- No escribir código de una fase hasta que Alberto haya aprobado el plan de esa fase.
- Ante decisiones que le corresponden a él, dar una recomendación clara en vez de una lista de opciones.

## Qué es el proyecto

App web instalable (PWA) para gestionar partidas de casos de misterio imprimibles de la marca **Sobre Lacrado**. Solo la usa Alberto (administrador). Los jugadores no instalan nada: escanean códigos QR con el móvil.

## Cómo funciona (plan aprobado)

- Cada QR de un caso apunta a una página nuestra alojada en **Firebase Hosting**. Esa página registra el paso con su hora en **Firestore** y redirige al contenido real (YouTube, Drive, etc.).
- La primera vez que alguien escanea el vídeo de inicio (**V0**), se crea una partida en ese móvil. **Un móvil = un grupo.** Antes del vídeo se pide un **alias opcional**.
- Cada escaneo siguiente se asocia a esa partida. Los escaneos **no tienen orden obligatorio**. Un QR repetido se ignora. Escanear pistas se registra **sin penalizar**.
- Al escanear la **solución**, el tiempo se para. Si una partida no termina, se **cierra automáticamente a las 4 h**.
- Alberto ve en la app: partidas en curso, avisos al móvil al empezar, tiempos por partida, resumen por caso, evolución por fecha, pasos donde se atascan, y exportación CSV.
- Alberto puede **crear juegos nuevos desde la app**: nombre, pasos, destinos y tiempos. La app genera los QR imprimibles. Los PDF, fotos y audios se siguen haciendo fuera de la app.
- Idiomas: **español e inglés**. Diseño visual: se decide más adelante, **funcional primero**.

## Restricciones técnicas

- **Sin coste**: plan gratuito **Spark** de Firebase. **No usar Cloud Functions** ni ningún plan de pago.
- Proyecto Firebase: `app-sobre-lacrado`. Firestore ya creada en `europe-southwest1` (Madrid), con reglas que bloquean todo acceso (hay que abrirlas de forma controlada).
- **Privacidad**: no guardar nada que identifique a los jugadores (ni IP, ni modelo de móvil, ni nombre real), salvo un alias opcional.

## Estado

- Carpeta de trabajo: `M:\Sobre Lacrado\App`. Repositorio en GitHub: `app`.
- Plan por fases aprobado. Sin avisos push con la app cerrada por ahora (solo con la app abierta).
- Fase 0 (página en blanco publicada en https://app-sobre-lacrado.web.app): hecha.
- Fase 1 (modelo de datos + reglas de Firestore): hecha y reglas publicadas. Pruebas: `npm run test:rules` (16 OK, requiere JDK 21).
- Fase 2 (página del jugador `/s/<juego>/<paso>`, `scan.html` + `src/scan/`): código hecho y probado en emulador local (`tests/seed.mjs` crea datos de prueba). Pendiente: publicar en Hosting (pedir permiso). Web app de Firebase registrada: `1:656901903049:web:060fcfb2b93c6da18cf318`.

- Fase 3 (login Google + panel de partidas en directo, estilo expediente del caso 2 Duarte): hecha y publicada.
- Estilo de referencia: `M:\Sobre Lacrado\Para_el_proyecto\02_Plantilla_expediente_IP-26-031.html` y logo `M:\Sobre Lacrado\Logo\sello.png`.
- Fase 4 (estadísticas + CSV): hecha y publicada (`npm test` = pruebas unitarias `tests/stats.test.js` y `tests/games.test.js` + pruebas de reglas). Cálculos en `src/lib/stats.js`, CSV en `src/lib/csv.js`, lectura única en `src/lib/loadStats.js`, pantallas `src/components/Stats.jsx` y `Charts.jsx`. Pendiente: que Alberto lo revise con el emulador (`http://localhost:5000`), publicar y commit.
- Decisiones Fase 4: periodo por defecto 30 días; mediana como cifra principal; atasco = más de 20 min sin escanear tras un paso; CSV con `;`, BOM UTF-8, alias incluido y neutralizado contra fórmulas de Excel.
- Fase 5 (creador de juegos + hoja de QR): código escrito y probado (`npm test`: 20 pruebas de reglas/guardado, 11 de estadísticas, 9 de juegos/QR). Pestaña "Juegos": lista, editor (`GameEditor.jsx`), hoja de QR 12 por A4 (`QrSheet.jsx`, 3x4, celdas 59x68 mm), plantilla expediente y precarga del caso 2. Ids: juego 6 chars, paso 8 (`src/lib/ids.js`); enlace de QR `https://app-sobre-lacrado.web.app/s/<juego>/<paso>`. Juego desactivado: la página del jugador redirige sin registrar. Pendiente: revisión de Alberto (imprimir hoja de prueba), publicar y commit.
- Aviso a Alberto (ya comunicado): los PDF del caso 2 ya hechos tienen QR directos a YouTube/Drive y no registran; hay que regenerarlos con los enlaces de la app (copiar enlace en el editor de juegos).
- Fase 6 (PWA + avisos + idiomas): código escrito y probado (`npm test` = 30 unitarias + 6 de la web compilada `npm run test:build` + 20 de reglas). Alberto usa **Android**. PWA con `vite-plugin-pwa` (manifiesto a mano en `public/manifest.webmanifest`, enlazado solo desde `index.html`; service worker excluye `/s/` y `scan.html`; `registerType: 'prompt'` con banner Actualizar), iconos generados con `node scripts/make-icons.mjs` desde `assets-src/sello.png`, botón Instalar, banda Sin conexión. Avisos solo al **empezar** una partida (`AlertWatcher.jsx`, `lib/newRuns.js`), toast si la app está visible y notificación del sistema (vía service worker) si está oculta; sin avisos con la app cerrada. Login en modo app usa redirect (no probado en móvil: lo prueba Alberto). Pendiente: publicar y probar en el móvil (HTTPS solo en producción), commit.

## Login con Google en la app instalada (Android) — resuelto 16/10/2026
- La redirección (`signInWithRedirect`) con `authDomain` = `web.app` da `redirect_uri_mismatch`: esa dirección no está autorizada en Google Cloud (y Alberto no encontró la pantalla de clientes en el móvil).
- Solución aplicada: `authDomain` siempre `app-sobre-lacrado.firebaseapp.com` y acceso por ventana emergente (`signInWithPopup`) también en la app instalada, con `prompt: 'select_account'` para que Google deje elegir cuenta. Funciona en el Android de Alberto.
- La pantalla de acceso muestra una línea de diagnóstico (versión, modo app/navegador, dominio, resultado de redirección). Se puede quitar cuando se quiera.
- El cambio de `web.app` solo haría falta si algún día se vuelve a la redirección: habría que añadir `https://app-sobre-lacrado.web.app/__/auth/handler` en Google Cloud → Auth Platform → Clientes.

## Estado actual (16/10/2026) — manda sobre las líneas "Pendiente" de arriba
- Fases 0–7 hechas, publicadas en Hosting y probadas en el Android de Alberto (instalación, login, avisos al empezar partida, modo sin conexión).
- **Sin conexión**: Firestore usa caché local (`persistentLocalCache`) solo en el panel; la página del jugador (`/s/...`) usa `getFirestore` normal (ver `src/firebase.js`). No tocar eso sin probar el escaneo.
- **Fase 7 (interfaz)**: tipografía de títulos **Cinzel**; tarjetas de partida con anillo de tiempo (`timeLeft` en `lib/runs.js`), sellos por paso y animaciones (respetan "reducir animaciones"); **tema visual por juego** (`theme` en `games/{id}`: `detective` por defecto = caso 2, `policial` = caso 1, `egipcio` = caso 3, `alien` = caso 4; lista en `lib/themes.js`, estilos `.tema-*` y variables `--t-*` en `styles/theme.css`, selector "Aspecto del juego" en `GameEditor.jsx`); fichas de Partidas, Juegos y Estadísticas usan el tema de su juego. **Modo oscuro** opcional (botón ☾/☀ en la cabecera, guardado en `localStorage` `sl_modo`, claro por defecto, solo en pantalla: al imprimir los QR siempre es claro).
- Para añadir un tema nuevo: añadir su clave en `lib/themes.js`, un bloque `.tema-<clave>` (y su variante bajo `[data-modo='oscuro']`) en `theme.css`, y el nombre en `i18n.js` (`theme.<clave>`, es y en).
- Pruebas: `npm test` (49 unitarias + 7 de la web compilada + 22 de reglas con emulador, requiere JDK 21). Sin extensión de Chrome conectada no se puede probar en navegador: se revisan capturas con Edge sin pantalla (`msedge --headless=new --screenshot`) y Alberto prueba en el móvil.
- Recordatorios para Alberto: regenerar los PDF del caso 2 con los enlaces de la app (los actuales apuntan directo a YouTube/Drive y no registran); imprimir una hoja de QR de prueba; asignar tema a los juegos ya creados (Juegos → Editar → Aspecto → Guardar); el juego PRUEBA y sus 2 partidas de prueba se pueden desactivar/borrar desde la consola de Firebase.
- Pendientes opcionales: avisos con la app cerrada (alternativa gratuita: ntfy.sh); quitar la línea de diagnóstico de la pantalla de acceso cuando ya no haga falta.

## Actualización (16/10/2026, tarde): fases 8A, 8B y borrado
- **Fase 8A (minimalista)**: cabecera con menú ⋮ (`components/Menu.jsx`: avisos, modo oscuro, idioma, instalar, salir); ayudas desplegables con "?" (`components/Ayuda.jsx`); la ficha de partida (`RunCard.jsx`) muestra solo lo esencial (alias, pasos, anillo de tiempo, sellos) y el detalle sale al tocarla. La ficha es un `div role="button"` (no un `button`) porque dentro lleva botones.
- **Fase 8B**: en el editor los pasos van plegados (nombre + tipo + "Copiar enlace"; se despliegan al tocar; los nuevos nacen abiertos y los que fallan al guardar se abren solos); Estadísticas por capas (4 cifras arriba + "Ver más cifras"; Evolución, Dónde se atascan y Tiempos por partida en `<details class="capa">` cerrados).
- **Barra fija del editor**: `.barra-editor` (sticky) con Volver y Guardar arriba; Guardar y Volver también abajo.
- **Borrado** (`lib/games.js`: `deleteGame`, `deleteRun`, `countGameRuns`): "Zona de peligro" al final del editor y "Borrar partida" en la ficha desplegada; doble confirmación (botón + casilla "Entiendo…" + botón rojo). Borrar un juego se lleva pasos, partidas y escaneos (el juego se borra el último, por si se corta a medias). Tras borrar se vacía la caché de estadísticas (`clearStatsCache`). Probado en `tests/firestore.rules.test.js` (22 pruebas de reglas; `npm test` = 35 + 6 + 22).
- **Precarga del caso 3** (`CASE3` en `lib/games.js`): 6 pasos con destinos en `sobrelacrado.github.io` (el contenido del caso 3 está allí, no en la app), tema egipcio. El editor ofrece el botón "Precargar caso 3" cuando el juego no tiene pasos.
- **QR de los expedientes** (hechos con enlaces de la app, registran partidas): caso 2 → juego `ustrxq` (`Expediente_IP-26-031_v3.html/.pdf`, en `CASO DETECTIVE\Archivo Final`); caso 3 → juego `64ayym` (`Expediente_23-M-014_v5.html/.pdf`, en `Juego 3\imprenta`; falta la versión de imprenta con sangrado 3 mm, que se hizo con otro proceso). Para cambiar los QR: copiar `VIDEOS` en el HTML con los enlaces del juego ("Copiar todos los enlaces"), decodificar los QR con `jsqr` para verificar y exportar PDF con Edge sin pantalla (`msedge --headless=new --print-to-pdf`).
- **Límite de tiempo**: Alberto subió el límite de los casos 2 y 3 a 300 min (la media real en pruebas es ~3 h). La hoja 2 del caso 2 aún dice "entre 90 y 120 minutos": pendiente de decidir si se corrige.
- **Avisos**: funcionan con la app abierta o en segundo plano reciente; no con la app cerrada/dormida por Android (límite aceptado; alternativa futura: ntfy.sh).
- **Acceso de administrador desde Claude**: no hay forma limpia de escribir en Firestore como admin desde la línea de comandos (la sesión de la CLI de Firebase no se puede reutilizar desde scripts). Las altas/bajas de datos se hacen desde la propia app. Las partidas de prueba se crean con la API pública igual que lo hace un jugador (ver el patrón: crear la partida y luego el escaneo del paso de inicio).
- **Pendientes de Alberto**: borrar las partidas de prueba y el juego PRUEBA; asignar tema a los juegos que falten; decidir el texto de duración de la hoja 2 del caso 2; imprimir una hoja de QR de prueba. Opcional: mover "Imprimir QR" al editor.

## Fase 9A (16/10/2026): Diario público de códigos
- **Qué es**: página pública `/diario` (entrada propia `diario.html`, sin login, sin manifiesto, fuera del service worker; ruta en `firebase.json` antes del comodín). Un acertijo de código por día, 8 tipos con mecánicas distintas (`src/diario/games.jsx`): rueda de César, Morse, teclado antiguo, cerradura de 3 cifras (tipo Mastermind), anagrama, mensaje escondido (acróstico), símbolos (alfabeto "pigpen" dibujado en SVG) y espejo (Atbash). El aspecto de cada día usa los 4 temas (`tema-*`).
- **Contenido**: `src/diario/puzzles.src.mjs` (soluciones en claro, NO se incluye en la web) → `node scripts/make-puzzles.mjs` genera `src/diario/puzzles.js` (mensaje cifrado + huella de la solución; las pistas de la cerradura y el mezclado del anagrama salen solos con semilla). 28 acertijos = 4 semanas; la lista se repite desde `DAY_ONE` (2026-10-12, lunes). El script exige: nunca dos tipos iguales seguidos (ni al reiniciar), semanas completas y nivel por día de la semana (1,1,2,2,3,4,5).
- **Lógica pura y probada**: `src/diario/ciphers.js` (`tests/diario.test.js`). Racha, historial, pista y tiempo se guardan en `localStorage` (`sl_diario`) de cada jugador; el reloj solo cuenta con la pantalla visible. "Compartir resultado" usa emojis y no revela la solución.
- **Límite conocido**: las soluciones viajan en la web como huella (no es seguridad). El archivo fuente con las soluciones en claro (`puzzles.src.mjs`) NO se sube a GitHub (el repositorio es público; está en `.gitignore`) y vive solo en `M:Sobre LacradoAppsrcdiario`: hay que incluirlo en las copias de seguridad. Las pruebas que lo necesitan se saltan si falta. Para premios o concursos haría falta servidor.
- **Menú del panel**: "Ver el Diario" (solo administrador) abre el Diario dentro de la app (`App.jsx`, carga diferida) con botón "← Panel"; el panel queda oculto pero vivo (avisos activos).
- **Pendiente**: enlace "Descubre los casos de Sobre Lacrado" (`BRAND_URL` en `Diario.jsx`, vacío hasta que Alberto dé la dirección); Fase 9B (generador con banco de frases, pantalla de carga de acertijos, más tipos como Vigenère); Fase 9C (jugadores con correo ven sus propias estadísticas: requiere login de jugadores y cambios en las reglas; propuesta aún sin aprobar).
