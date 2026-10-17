// Hoja de revisión de acertijos: una página HTML con fecha, tipo, historia, pista y SOLUCIÓN de cada día, para leerla antes de publicar.
// Uso: node scripts/review-puzzles.mjs [desde] [hasta]   (por defecto del día 29 en adelante: lo que aún no estaba publicado)
// Escribe revision/acertijos-<desde>-<hasta>.html (la carpeta revision/ no se sube a GitHub: lleva las soluciones en claro).
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { DAY_ONE, levelStars, nextKey } from '../src/diario/ciphers.js'
import { KIND_NAME } from '../src/diario/criptico.js'
import { loadSources } from './load-sources.mjs'

const src = await loadSources()
const from = Number(process.argv[2] ?? 29)
const to = Number(process.argv[3] ?? src.length)
const TYPE_NAME = { // mismos nombres que games.jsx (Node no puede importar archivos .jsx)
  cesar: 'Rueda de César', morse: 'Código Morse', teclado: 'Teclado antiguo', cerradura: 'Cerradura de 3 cifras', anagrama: 'Anagrama',
  acrostico: 'Mensaje escondido', simbolos: 'Alfabeto de símbolos', espejo: 'Alfabeto en espejo', criptico: 'Críptico', vigenere: 'Cifrado Vigenère', golpes: 'Golpes en la pared', interrogatorio: 'El interrogatorio',
}
const DIAS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const fecha = (n) => nextKey(DAY_ONE, n - 1).split('-').reverse().join('/')

const cards = []
for (let n = from; n <= Math.min(to, src.length); n++) {
  const p = src[n - 1]
  if ((n - 1) % 7 === 0) cards.push(`<h2>Semana ${(n - 1) / 7 + 1}</h2>`)
  const solucion = p.type === 'cesar' ? `${esc(p.text)} <small>(desplazamiento ${p.shift})</small>`
    : p.type === 'vigenere' ? `${esc(p.text)} <small>(clave ${esc(p.key)} · ${p.keyGiven ? 'la clave se enseña' : 'clave secreta, se adivina con la pista'})</small>`
    : p.type === 'acrostico' ? `${esc(p.text)} <small>(iniciales de las líneas)</small>` : esc(p.text)
  const cuerpo = p.type === 'interrogatorio'
    ? `<p><b>Regla:</b> ${esc(p.rule)} · <b>Pista:</b> ${esc(p.hint)}</p><ul>${p.statements.map((st) => `<li><b>${esc(st.by)}:</b> «${esc(st.says)}»</li>`).join('')}</ul>`
    : p.type === 'criptico'
    ? `<p class="cripti">${esc(p.cryptic.clue)}</p><p><b>Tipo de juego:</b> ${esc(KIND_NAME[p.cryptic.kind])}</p><p><b>Cómo se resuelve:</b> ${esc(p.cryptic.explain)}</p>`
    : `<p><b>Pista:</b> ${esc(p.hint)}</p>${p.lines ? `<ul>${p.lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}`
  cards.push(`<section class="c ${esc(p.theme)} ${p.type === 'criptico' ? 'cr' : ''}">
    <div class="meta">Día ${n} · ${DIAS[(n - 1) % 7]} ${fecha(n)} · ${levelStars(p.level)} · ${esc(TYPE_NAME[p.type])} · ${esc(p.theme)}</div>
    <h3>${esc(p.title)}</h3>
    <p class="hist">${esc(p.clue)}</p>
    ${cuerpo}
    <p class="sol"><b>Solución:</b> ${solucion}</p>
  </section>`)
}

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Revisión de acertijos ${from}-${to}</title>
<style>
  body { font: 16px/1.5 Georgia, serif; max-width: 760px; margin: 0 auto; padding: 16px; background: #f6f2e8; color: #222; }
  h1 { font-size: 24px; } h2 { margin: 28px 0 8px; padding-bottom: 4px; border-bottom: 2px solid #222; }
  .c { background: #fff; border: 1px solid #ccc; border-left: 6px solid #888; border-radius: 6px; padding: 10px 14px; margin: 10px 0; break-inside: avoid; }
  .c.detective { border-left-color: #8d6a3a; } .c.policial { border-left-color: #2f5aa8; } .c.egipcio { border-left-color: #c79a1c; } .c.alien { border-left-color: #2e8f5a; }
  .c.cr { background: #fbf6ff; }
  .meta { font: 12px/1.4 monospace; color: #555; } h3 { margin: 4px 0; font-size: 19px; }
  p { margin: 4px 0; } .hist { font-style: italic; } .sol { margin-top: 8px; padding: 4px 8px; background: #e8f3e8; border-radius: 4px; }
  .cripti { font-size: 18px; font-style: italic; text-align: center; padding: 6px 0; border-top: 1px solid #aaa; border-bottom: 1px solid #aaa; }
  ul { margin: 4px 0; padding-left: 20px; font-size: 14px; } small { color: #555; }
</style></head><body>
<h1>Revisión de acertijos (días ${from} a ${Math.min(to, src.length)})</h1>
<p>Las soluciones están en verde. Anota lo que quieras cambiar (por número de día) y me lo dices.</p>
${cards.join('\n')}
</body></html>`

mkdirSync(new URL('../revision/', import.meta.url), { recursive: true })
const file = new URL(`../revision/acertijos-${from}-${Math.min(to, src.length)}.html`, import.meta.url)
writeFileSync(file, html)
console.log('Hoja de revisión escrita en', fileURLToPath(file))
