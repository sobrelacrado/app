// Detección de partidas nuevas a partir de los cambios de una escucha en directo.
// `known` es el conjunto de ids ya vistos (se actualiza aquí). Solo cuentan las altas recientes:
// así no se avisa de partidas antiguas que reaparecen por la caché del navegador.
export const MAX_AGE_MS = 15 * 60000

export function pickNewRuns(known, changes, now, maxAgeMs = MAX_AGE_MS) {
  const fresh = []
  for (const c of changes) {
    if (c.type !== 'added' || known.has(c.id)) continue
    known.add(c.id)
    if (c.startedAt && now - c.startedAt.getTime() <= maxAgeMs) fresh.push(c)
  }
  return fresh
}
