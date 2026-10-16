// Identificadores aleatorios cortos para los QR. Sin letras ambiguas (i, l, o, 0, 1).
export const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'

function randomId(length) {
  const limit = 256 - (256 % ALPHABET.length) // descarta valores que sesgarían el azar
  const out = []
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (b < limit && out.length < length) out.push(ALPHABET[b % ALPHABET.length])
    }
  }
  return out.join('')
}

export const newGameId = () => randomId(6)
export const newStepId = () => randomId(8) // es el "secreto" del QR: no se puede listar ni adivinar
