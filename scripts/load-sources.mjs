// Carga la lista completa de acertijos con las soluciones en claro: puzzles.src.mjs (semanas 1-4) + lote-01.src.mjs, lote-02.src.mjs...
// Los archivos .src.mjs no se suben a GitHub (el repositorio es público): viven solo en el PC de Alberto.
import { readdirSync } from 'node:fs'

export async function loadSources() {
  const dir = new URL('../src/diario/', import.meta.url)
  const base = (await import(new URL('puzzles.src.mjs', dir))).default
  const lotes = readdirSync(dir).filter((f) => /^lote-\d+\.src\.mjs$/.test(f)).sort()
  const out = [...base]
  for (const f of lotes) out.push(...(await import(new URL(f, dir))).default)
  return out
}
