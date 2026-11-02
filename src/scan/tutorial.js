// Tutorial animado de cómo se preparan los sobres del caso 5 (página /s/<juego>/tutorial). Dibujo SVG + CSS, sin vídeo.
// No toca la partida: no lee ni escribe nada de ella, así que la cuenta atrás ni se para ni se reinicia.
import './tutorial.css'

// Hoja interior: A4 con 8 paneles (2 columnas × 4 filas), dibujada a escala 1:3 en un lienzo de 200×120. Cada fila se llama T1, T2 (mitad de arriba) y B1, B2 (mitad de abajo).
const PANEL_W = 35
const PANEL_H = 24.75
const X0 = 65
const Y0 = 10
const panel = (col, row) => `<g class="pan"><rect x="${X0 + col * PANEL_W}" y="${Y0 + row * PANEL_H}" width="${PANEL_W}" height="${PANEL_H}" rx="1.2"/>` +
  `<rect class="pill" x="${X0 + col * PANEL_W + 3}" y="${Y0 + row * PANEL_H + 3}" width="14" height="3" rx="1.5"/>` +
  `<path d="M${X0 + col * PANEL_W + 3} ${Y0 + row * PANEL_H + 10}h27M${X0 + col * PANEL_W + 3} ${Y0 + row * PANEL_H + 14}h22M${X0 + col * PANEL_W + 3} ${Y0 + row * PANEL_H + 18}h25"/></g>`
const fila = (cls, row) => `<g class="${cls}"><g class="L">${panel(0, row)}</g><g class="R">${panel(1, row)}</g></g>`

const HOJA = `
<svg class="tut-svg" viewBox="45 0 120 120" aria-hidden="true" focusable="false">
  <g class="hoja">
    ${fila('T1', 0)}
    ${fila('T2', 1)}
    <g class="B">${fila('B1', 2)}${fila('B2', 3)}</g>
  </g>
  <path class="fold f1" d="M100 6V114"/>
  <path class="fold f2" d="M${X0 - 6} 59.5H${X0 + 76}"/>
  <path class="fold f3" d="M${X0 - 6} 34.75H${X0 + 76}"/>
  <g class="zig" transform="translate(139 20)"><path d="M2 2H24Q28 2 28 6T24 10H4Q0 10 0 14T4 18H26"/></g>
</svg>`

// Sobre: A4 con el dibujo girado; aquí se ve derecho. Frente 120×84; lengüeta arriba, solapas a los lados y solapa de abajo.
const SOBRE = `
<svg class="tut-svg" viewBox="0 0 200 190" aria-hidden="true" focusable="false">
  <g class="lat izq"><rect x="0" y="52" width="40" height="84"/></g>
  <g class="lat der"><rect x="160" y="52" width="40" height="84"/></g>
  <g class="inf"><rect x="40" y="136" width="120" height="42"/></g>
  <g class="tab"><rect x="40" y="30" width="120" height="22"/><text x="100" y="45" text-anchor="middle">LENGÜETA</text></g>
  <g class="ins"><rect x="80" y="2" width="40" height="28" rx="2"/><path d="M85 10h30M85 16h24M85 22h28"/></g>
  <g class="frente">
    <rect x="40" y="52" width="120" height="84" rx="3"/>
    <text class="gh" x="52" y="70">GRAN HOTEL MIRAMAR</text>
    <text class="t1" x="52" y="96">Vestíbulo</text>
    <text class="t2" x="52" y="118">21:30</text>
    <circle class="sello" cx="138" cy="106" r="14"/><text class="sl" x="138" y="111" text-anchor="middle">SL</text>
  </g>
  <path class="fold g1" d="M40 52V136M160 52V136"/>
  <path class="fold g2" d="M40 136H160"/>
  <path class="fold g4" d="M40 52H160"/>
  <g class="okmark"><circle cx="150" cy="62" r="11"/><path d="M144 62l4.5 5 8-9"/></g>
</svg>`

const PARTES = [
  { id: 'a', svg: HOJA, pasos: 3 },
  { id: 'b', svg: SOBRE, pasos: 4 },
]

export function tutorialPage({ app, brand, t, gameId }) {
  let parte = 0
  let paso = 0
  app.className = 'hoja tutorial'

  const pasosHtml = (p) => Array.from({ length: PARTES[p].pasos }, (_, i) =>
    `<li data-n="${i + 1}"><span class="num">${i + 1}</span><span>${t[`tut${PARTES[p].id.toUpperCase()}${i + 1}`]}</span></li>`).join('')

  app.innerHTML = `
    <div class="logo">${brand}</div>
    <h1>${t.tutTitle}</h1>
    <p class="tut-nota">${t.tutNote}</p>
    <div class="tut-tabs" role="tablist">
      ${PARTES.map((p, i) => `<button type="button" role="tab" data-parte="${i}" class="tut-tab secundario">${t[`tutPart${p.id.toUpperCase()}`]}</button>`).join('')}
    </div>
    <div class="tut-escena" id="te"></div>
    <ol class="tut-pasos" id="tp"></ol>
    <p class="tut-medida" id="tm"></p>
    <div class="tut-botones">
      <button type="button" id="tn"></button>
      <button type="button" id="tr" class="secundario">${t.tutRepeat}</button>
    </div>`

  const $ = (id) => document.getElementById(id)
  const render = () => {
    const p = PARTES[parte]
    if (!$('te').firstElementChild || $('te').dataset.parte !== String(parte)) {
      $('te').innerHTML = p.svg
      $('te').dataset.parte = String(parte)
      $('tp').innerHTML = pasosHtml(parte)
    }
    const svg = $('te').firstElementChild
    for (let i = 1; i <= 4; i++) svg.classList.toggle(`d${i}`, i <= paso)
    svg.dataset.paso = String(paso)
    $('tp').querySelectorAll('li').forEach((li) => {
      const n = Number(li.dataset.n)
      li.classList.toggle('hecho', n < paso)
      li.classList.toggle('actual', n === paso)
      if (n === paso) li.setAttribute('aria-current', 'step')
      else li.removeAttribute('aria-current')
    })
    document.querySelectorAll('.tut-tab').forEach((b) => {
      const on = Number(b.dataset.parte) === parte
      b.setAttribute('aria-selected', String(on))
      b.classList.toggle('activa', on)
    })
    $('tm').textContent = parte === 0 && paso === p.pasos ? t.tutSize : ''
    const ultimo = paso === p.pasos
    $('tn').textContent = !ultimo ? (paso === 0 ? t.tutStart : t.tutNext) : parte === 0 ? t.tutNextPart : t.tutDone
    $('tn').disabled = ultimo && parte === 1
  }

  $('tn').onclick = () => {
    const p = PARTES[parte]
    if (paso < p.pasos) paso++
    else if (parte === 0) { parte = 1; paso = 0 }
    render()
  }
  // Repetir: vuelve al paso anterior y lo vuelve a reproducir
  $('tr').onclick = () => {
    const atras = Math.max(0, paso - 1)
    const svg = $('te').firstElementChild
    svg.classList.add('sin-t') // volver atrás de golpe, sin animación, y reproducir otra vez el paso
    paso = atras
    render()
    void svg.getBoundingClientRect()
    svg.classList.remove('sin-t')
    requestAnimationFrame(() => requestAnimationFrame(() => { paso = atras + 1; render() }))
  }
  app.querySelectorAll('.tut-tab').forEach((b) => { b.onclick = () => { parte = Number(b.dataset.parte); paso = 0; render() } })
  render()
}
