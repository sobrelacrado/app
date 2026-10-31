// Carga la lista completa de acertijos con las soluciones en claro: puzzles.src.mjs (semanas 1-4) + lote-01.src.mjs, lote-02.src.mjs...
// Los archivos .src.mjs no se suben a GitHub (el repositorio es público): viven solo en el PC de Alberto.
// Después aplica el ORDEN FINAL de días guardado en orden.src.mjs (lista de títulos; lo escribe scripts/super-shuffle.mjs).
// El calendario son los títulos de esa lista, vengan de un lote o del banco: scripts/super-shuffle.mjs puede subir retos del banco al calendario
// y bajar del calendario al banco los que sobran (los nombra en la lista `fuera` de orden.src.mjs).
// Los acertijos de un lote que no estén ni en la lista ni en `fuera` (un lote nuevo) se añaden al final, sin mover nada de lo anterior.
import { readdirSync } from 'node:fs'

const DIR = new URL('../src/diario/', import.meta.url)

async function archivos(re) {
  const out = []
  for (const f of readdirSync(DIR).filter((f) => re.test(f)).sort()) out.push(...(await import(new URL(f, DIR))).default)
  return out
}

export async function loadRawSources() {
  const base = (await import(new URL('puzzles.src.mjs', DIR))).default
  return [...base, ...(await archivos(/^lote-\d+\.src\.mjs$/))]
}

// Banco tal como está en los archivos banco-NN.src.mjs (sin aplicar lo que el calendario le haya quitado).
export const loadBancoRaw = () => archivos(/^banco-\d+\.src\.mjs$/)

async function leerOrden() {
  const m = await import(new URL('orden.src.mjs', DIR)).catch(() => null)
  return m ? { orden: m.default, fuera: new Set(m.fuera ?? []) } : null
}

export async function loadSources() {
  const raw = await loadRawSources()
  const ord = await leerOrden()
  if (!ord) return raw
  const todos = [...raw, ...(await loadBancoRaw())]
  const byTitle = new Map(todos.map((p) => [p.title, p]))
  if (byTitle.size !== todos.length) throw new Error('Hay títulos repetidos en los acertijos')
  const out = ord.orden.map((t) => {
    const p = byTitle.get(t)
    if (!p) throw new Error(`orden.src.mjs nombra un acertijo que ya no existe: ${t}`)
    byTitle.delete(t)
    return p
  })
  const nuevos = raw.filter((p) => byTitle.has(p.title) && !ord.fuera.has(p.title))
  return [...out, ...nuevos] // lo nuevo, al final
}

// Banco de retos: banco-01.src.mjs, banco-02.src.mjs... más los del calendario que se bajaron aquí. Acertijos aparte del calendario (solo para el "Reto de tu nivel").
// El nombre NO empieza por "lote-" a propósito: así nunca se cuelan en los días programados.
export async function loadBanco() {
  const ord = await leerOrden()
  const bancoRaw = await loadBancoRaw()
  if (!ord) return bancoRaw
  const enCalendario = new Set(ord.orden)
  const raw = await loadRawSources()
  return [...bancoRaw.filter((p) => !enCalendario.has(p.title)), ...raw.filter((p) => ord.fuera.has(p.title) && !enCalendario.has(p.title))]
}
