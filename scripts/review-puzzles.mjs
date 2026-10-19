// Hoja de revisión de acertijos: una página HTML con fecha, tipo, historia, pista y SOLUCIÓN de cada día, para leerla antes de publicar.
// Uso: node scripts/review-puzzles.mjs [desde] [hasta]   (por defecto del día 29 en adelante: lo que aún no estaba publicado)
//      node scripts/review-puzzles.mjs --banco            (hoja del banco de retos: todos los acertijos, ordenados por nivel)
// Escribe revision/acertijos-<desde>-<hasta>.html (la carpeta revision/ no se sube a GitHub: lleva las soluciones en claro).
import { mkdirSync, writeFileSync } from 'node:fs'
import { sopaBuild } from './sopa-build.mjs'
import { fileURLToPath } from 'node:url'
import { DAY_ONE, levelStars, nextKey } from '../src/diario/ciphers.js'
import { KIND_NAME } from '../src/diario/criptico.js'
import { loadBanco, loadSources } from './load-sources.mjs'
import { clueText, coartadaClues } from '../src/diario/coartada.js'
import { sinVocales } from '../src/diario/codigos.js'

const BANCO = process.argv.includes('--banco')
const calendario = await loadSources()
const src = BANCO ? await loadBanco() : calendario
const nums = process.argv.slice(2).filter((a) => /^\d+$/.test(a))
const from = Number(nums[0] ?? (BANCO ? 1 : 29))
const to = Number(nums[1] ?? src.length)
const seedOf = (n) => (BANCO ? calendario.length + n : n) // mismas pistas de coartada que genera make-puzzles.mjs
const TYPE_NAME = { // mismos nombres que games.jsx (Node no puede importar archivos .jsx)
  cesar: 'Rueda de César', morse: 'Código Morse', teclado: 'Teclado antiguo', cerradura: 'Cerradura de 3 cifras', anagrama: 'Anagrama',
  acrostico: 'Mensaje escondido', simbolos: 'Alfabeto de símbolos', espejo: 'Alfabeto en espejo', criptico: 'Críptico', vigenere: 'Cifrado Vigenère', golpes: 'Golpes en la pared', interrogatorio: 'El interrogatorio', escitala: 'Escítala', sopa: 'Sopa de letras escondidas',
  numeros: 'Números a letras', rebus: 'Rebus de emojis', sinvocales: 'Texto sin vocales', intruso: 'El intruso', coartada: 'La coartada', binario: 'Binario a letras',
}
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const fecha = (n) => nextKey(DAY_ONE, n - 1).split('-').reverse().join('/')

const cards = []
for (let n = from; n <= Math.min(to, src.length); n++) {
  const p = src[n - 1]
  if (BANCO) { if (n === from || src[n - 2].level !== p.level) cards.push(`<h2>Nivel ${p.level} ${levelStars(p.level)}</h2>`) } else if ((n - 1) % 7 === 0) cards.push(`<h2>Semana ${(n - 1) / 7 + 1}</h2>`)
  const solucion = p.type === 'cesar' ? `${esc(p.text)} <small>(desplazamiento ${p.shift})</small>`
    : p.type === 'vigenere' ? `${esc(p.text)} <small>(clave ${esc(p.key)} · ${p.keyGiven ? 'la clave se enseña' : 'clave secreta, se adivina con la pista'})</small>`
    : p.type === 'numeros' ? `${esc(p.text)} <small>(${p.mode === 'inverso' ? 'A=26, al revés' : 'A=1'})</small>`
    : p.type === 'escitala' ? `${esc(p.text)} <small>(grosor correcto: ${p.rows} filas)</small>`
    : p.type === 'acrostico' ? `${esc(p.text)} <small>(iniciales de las líneas)</small>` : esc(p.text)
  const cuerpo = p.type === 'sopa'
    ? `<p><b>Pista:</b> ${esc(p.hint)}</p><pre>${sopaBuild(p).rows.join('<br>')}</pre><p><b>Palabras:</b> ${p.words.map((w) => esc(typeof w === 'string' ? w : `${w.w} (${w.c})`)).join(' · ')}</p>`
    : p.type === 'interrogatorio'
    ? `<p><b>Regla:</b> ${esc(p.rule)} · <b>Pista:</b> ${esc(p.hint)}</p><ul>${p.statements.map((st) => `<li><b>${esc(st.by)}:</b> «${esc(st.says)}»</li>`).join('')}</ul>`
    : p.type === 'rebus'
    ? `<p class="cripti">${p.parts.map(esc).join(' + ')}</p><p><b>Pista:</b> ${esc(p.hint)}</p>`
    : p.type === 'intruso'
    ? `<p><b>Pista:</b> ${esc(p.hint)}</p><p>${p.items.map((x) => esc((x.e ?? '') + ' ' + x.n)).join(' · ')}</p><p><b>Qué tienen en común (menos el intruso):</b> ${esc(p.why)}</p>`
    : p.type === 'sinvocales'
    ? `<p><b>Pista:</b> ${esc(p.hint)}</p><p class="cripti">${sinVocales(p.text).map((w) => w.c + ' (' + w.len + ')').join('  ')}</p>`
    : p.type === 'coartada'
    ? `<p><b>Pista:</b> ${esc(p.hint)}</p>${p.ordered ? '<p>Salas en orden: ' + p.places.map(esc).join(' → ') + '</p>' : ''}<ul>${coartadaClues(p.people.length, p.solution, !!p.ordered, seedOf(n)).map((c) => '<li>' + esc(clueText(c, p.people, p.places)) + '</li>').join('')}</ul><p><b>Solución completa:</b> ${p.people.map((q, k) => esc(q) + ' → ' + esc(p.places[p.solution[k]])).join(' · ')}</p>`
    : p.type === 'criptico'
    ? `<p class="cripti">${esc(p.cryptic.clue)}</p><p><b>Tipo de juego:</b> ${esc(KIND_NAME[p.cryptic.kind])}</p><p><b>Cómo se resuelve:</b> ${esc(p.cryptic.explain)}</p>`
    : `<p><b>Pista:</b> ${esc(p.hint)}</p>${p.lines ? `<ul>${p.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}`
  cards.push(`<section class="c ${esc(p.theme)} ${p.type === 'criptico' ? 'cr' : ''}">
    <div class="meta">${BANCO ? `Banco ${n}` : `Día ${n} · ${DIAS[(n - 1) % 7]} ${fecha(n)}`} · ${levelStars(p.level)} · ${esc(TYPE_NAME[p.type])} · ${esc(p.theme)}</div>
    <h3>${esc(p.title)}</h3>
    <p class="hist">${esc(p.clue)}</p>
    ${cuerpo}
    <p class="sol"><b>Solución:</b> ${solucion}</p>
  </section>`)
}

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${BANCO ? 'Banco de retos' : `Revisión de acertijos ${from}-${to}`}</title>
<style>
  body { font: 16px/1.5 Georgia, serif; max-width: 760px; margin: 0 auto; padding: 16px; background: #f6f2e8; color: #222; }
  h1 { font-size: 24px; } h2 { margin: 28px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #222; }
  .c { background: #fff; border: 1px solid #ccc; border-left: 6px solid #888; border-radius: 6px; padding: 10px 14px; margin: 10px 0; break-inside: avoid; }
  .c.detective { border-left-color: #8d6a3a; } .c.policial { border-left-color: #2f5aa8; } .c.egipcio { border-left-color: #c79a1c; } .c.alien { border-left-color: #2e8f5a; }
  .c.cr { background: #fbf6ff; }
  .meta { font: 12px/1.4 monospace; color: #555; } h3 { margin: 4px 0; font-size: 19px; }
  p { margin: 4px 0; } .hist { font-style: italic; } .sol { margin-top: 8px; padding: 4px 8px; background: #e8f3e8; border-radius: 4px; }
  .cripti { font-size: 18px; font-style: italic; text-align: center; padding: 6px 0; border-top: 1px solid #aaa; border-bottom: 1px solid #aaa; }
  pre { font: 18px/1.2 monospace; letter-spacing: 6px; background: #f3efe3; padding: 8px; display: inline-block; }
  ul { margin: 4px 0; padding-left: 20px; font-size: 14px; } small { color: #555; }
</style></head><body>
<h1>${BANCO ? `Banco de retos (${src.length} acertijos)` : `Revisión de acertijos (días ${from} a ${Math.min(to, src.length)})`}</h1>
<p>Las soluciones están en verde. Anota lo que quieras cambiar (por número) y me lo dices.${BANCO ? ' Estos acertijos no tienen día: salen como «Reto de tu nivel» según los puntos de cada jugador.' : ''}</p>
${cards.join('\n')}
</body></html>`

mkdirSync(new URL('../revision/', import.meta.url), { recursive: true })
const file = new URL(BANCO ? '../revision/banco-retos.html' : `../revision/acertijos-${from}-${Math.min(to, src.length)}.html`, import.meta.url)
writeFileSync(file, html)
console.log('Hoja de revisión escrita en', fileURLToPath(file))
