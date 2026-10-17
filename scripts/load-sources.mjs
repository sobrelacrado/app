// Carga la lista completa de acertijos con las soluciones en claro: puzzles.src.mjs (semanas 1-4) + lote-01.src.mjs, lote-02.src.mjs...
// Los archivos .src.mjs no se suben a GitHub (el repositorio es público): viven solo en el PC de Alberto.
// Después aplica el ORDEN FINAL de días guardado en orden.src.mjs (lista de títulos; lo escribe scripts/shuffle-days.mjs).
// Los acertijos que no estén en esa lista (un lote nuevo) se añaden al final, sin mover nada de lo anterior.
import { readdirSync } from 'node:fs'

export async function loadRawSources() {
  const dir = new URL('../src/diario/', import.meta.url)
  const base = (await import(new URL('puzzles.src.mjs', dir))).default
  const lotes = readdirSync(dir).filter((f) => /^lote-\d+\.src\.mjs$/.test(f)).sort()
  const out = [...base]
  for (const f of lotes) out.push(...(await import(new URL(f, dir))).default)
  return out
}

export async function loadSources() {
  const raw = await loadRawSources()
  const dir = new URL('../src/diario/', import.meta.url)
  const orden = await import(new URL('orden.src.mjs', dir)).then((m) => m.default).catch(() => null)
  if (!orden) return raw
  const byTitle = new Map(raw.map((p) => [p.title, p]))
  if (byTitle.size !== raw.length) throw new Error('Hay títulos repetidos en los acertijos')
  const out = orden.map((t) => {
    const p = byTitle.get(t)
    if (!p) throw new Error(`orden.src.mjs nombra un acertijo que ya no existe: ${t}`)
    byTitle.delete(t)
    return p
  })
  return [...out, ...byTitle.values()] // lo nuevo, al final
}
