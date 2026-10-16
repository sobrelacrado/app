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
- Pruebas: `npm test` (34 unitarias + 6 de la web compilada + 20 de reglas con emulador, requiere JDK 21). Sin extensión de Chrome conectada no se puede probar en navegador: se revisan capturas con Edge sin pantalla (`msedge --headless=new --screenshot`) y Alberto prueba en el móvil.
- Recordatorios para Alberto: regenerar los PDF del caso 2 con los enlaces de la app (los actuales apuntan directo a YouTube/Drive y no registran); imprimir una hoja de QR de prueba; asignar tema a los juegos ya creados (Juegos → Editar → Aspecto → Guardar); el juego PRUEBA y sus 2 partidas de prueba se pueden desactivar/borrar desde la consola de Firebase.
- Pendientes opcionales: avisos con la app cerrada (alternativa gratuita: ntfy.sh); quitar la línea de diagnóstico de la pantalla de acceso cuando ya no haga falta.
