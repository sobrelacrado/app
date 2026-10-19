// Sellos: práctica ilimitada fuera del acertijo del día. No da puntos ni cuenta para el ranking; solo guarda partidas y mejores tiempos en el móvil.
import { useEffect, useMemo, useRef, useState } from 'react'
import { dateKey, fmtTime } from './ciphers.js'
import { SIZES, conflicts, generate, hintCell, isSolved, recordWin, rng } from './sellos.js'

const STORE = 'sl_sellos'
const load = () => { try { return JSON.parse(localStorage.getItem(STORE)) ?? {} } catch { return {} } }
const save = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)) } catch { /* sin almacenamiento */ } }

const NAMES = { 5: 'Aprendiz', 6: 'Fácil', 7: 'Normal', 8: 'Difícil', 9: 'Experto' }
// Colores fijos, cremas y apagados como la marca (se leen igual en claro y oscuro); además las regiones llevan borde propio, así no dependen solo del color.
const COLORS = ['#e8cf9c', '#d9a38a', '#b6c79b', '#9fbfbd', '#c4aed0', '#e3b8b0', '#a9b8d6', '#d6c06a', '#c9c3b0']
const COLOR_NAMES = ['arena', 'terracota', 'salvia', 'agua', 'malva', 'rosa', 'pizarra', 'mostaza', 'piedra']
const newSeed = () => Math.floor(Math.random() * 2147483647) + 1

// Borde ondulado, como el lacre cuando se aplasta contra el papel.
const BORDE = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2
  const r = 10.6 + Math.sin(a * 7) * 0.55 + Math.sin(a * 3 + 1) * 0.35
  return `${i ? 'L' : 'M'}${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`
}).join('') + 'Z'

function Sello() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="ss-sello">
      <path d={BORDE} fill="#a8201a" stroke="#7d1510" strokeWidth="1" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="7.6" fill="#c23a30" stroke="#8f1a13" strokeWidth=".8" />
      <circle cx="12" cy="10.8" r="1.9" fill="#f1c7c2" />
      <path d="M10.9 11.8h2.2l.9 4.2h-4z" fill="#f1c7c2" />
      <path d="M7.2 8.4A6 6 0 0 1 11 5.3" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function Reglas({ abierto }) {
  return (
    <details className="dr-como" open={abierto}>
      <summary>¿Cómo se juega?</summary>
      <div className="ss-caja">
      <p>Hay que poner <b>tantos sellos como casillas tiene un lado</b> del tablero, cumpliendo estas reglas:</p>
      <ol className="ss-reglas">
        <li><b>Un solo sello en cada fila.</b> Nunca dos en la misma fila (la línea de izquierda a derecha).</li>
        <li><b>Un solo sello en cada columna.</b> Nunca dos en la misma columna (la línea de arriba abajo).</li>
        <li><b>Un solo sello en cada color.</b> Cada región de color lleva exactamente uno.</li>
        <li><b>No se pueden tocar</b>, ni de lado ni en diagonal.</li>
      </ol>
      <p>Toca una casilla para descartarla (✕) y otra vez para poner el sello. Si dos sellos se estorban, se marcan en rojo.</p>
      </div>
    </details>
  )
}

function Partida({ initial, onWin, onLeave, onNew, firstTime }) {
  const { n, seed } = initial
  const board = useMemo(() => generate(n, seed), [n, seed])
  const colors = useMemo(() => {
    const rand = rng(seed + 1)
    return COLORS.map((c, i) => [rand(), i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i)
  }, [seed])
  // Casillas (0 vacía, 1 descartada, 2 sello) y tableros anteriores para deshacer, juntos para que varios toques seguidos no se pisen.
  const [{ cells, undo }, setBoard] = useState({ cells: initial.cells ?? new Array(n * n).fill(0), undo: [] })
  const [ms, setMs] = useState(initial.ms ?? 0)
  const [hinted, setHinted] = useState(!!initial.hinted)
  const [won, setWon] = useState(false)
  const msRef = useRef(ms)
  const wonRef = useRef(false)

  const seals = useMemo(() => cells.flatMap((v, i) => (v === 2 ? [i] : [])), [cells])
  const bad = useMemo(() => conflicts(n, board.regions, seals), [n, board, seals])

  // Cronómetro: solo corre con la pantalla visible y mientras no esté resuelto.
  useEffect(() => {
    if (won) return undefined
    const id = setInterval(() => { if (!document.hidden) { msRef.current += 1000; setMs(msRef.current) } }, 1000)
    return () => clearInterval(id)
  }, [won])

  // La partida a medias se guarda en cada cambio, al salir de la pantalla y al esconder la página (así el tiempo no se pierde).
  const cellsRef = useRef(cells)
  const hintedRef = useRef(hinted)
  useEffect(() => {
    cellsRef.current = cells
    hintedRef.current = hinted
    const keep = () => {
      if (wonRef.current) return
      const empty = !cellsRef.current.some(Boolean)
      save({ ...load(), game: empty ? null : { n, seed, cells: cellsRef.current, ms: msRef.current, hinted: hintedRef.current } })
    }
    keep()
    const onHide = () => { if (document.hidden) keep() }
    document.addEventListener('visibilitychange', onHide)
    return () => { document.removeEventListener('visibilitychange', onHide); keep() }
  }, [n, seed, cells, hinted])

  useEffect(() => {
    if (wonRef.current || !isSolved(n, board.regions, seals)) return
    wonRef.current = true
    setWon(true)
    onWin({ n, ms: msRef.current, hinted })
  }, [n, board, seals, hinted, onWin])

  const tap = (i) => {
    if (won) return
    setBoard((b) => ({ cells: b.cells.map((v, j) => (j === i ? (v + 1) % 3 : v)), undo: [...b.undo, b.cells] }))
  }
  const back = () => {
    setBoard((b) => (b.undo.length ? { cells: b.undo[b.undo.length - 1], undo: b.undo.slice(0, -1) } : b))
  }
  const hint = () => {
    const i = hintCell(board, seals)
    if (i == null || won) return
    setBoard((b) => ({ cells: b.cells.map((v, j) => (j === i ? 2 : v)), undo: [...b.undo, b.cells] }))
    setHinted(true)
  }
  const reset = () => {
    msRef.current = 0
    setMs(0)
    setHinted(false)
    setBoard({ cells: new Array(n * n).fill(0), undo: [] })
  }

  const side = (i, di, dj, edge) => {
    const r = Math.floor(i / n), c = i % n
    return edge || board.regions[(r + di) * n + c + dj] !== board.regions[i]
  }
  const label = (i) => {
    const r = Math.floor(i / n), c = i % n
    return `Fila ${r + 1}, columna ${c + 1}, región ${COLOR_NAMES[colors[board.regions[i]]]}: ${['vacía', 'descartada', 'sello'][cells[i]]}${bad.has(i) ? ', choca con otro sello' : ''}`
  }

  return (
    <>
      <div className="ss-barra">
        <span>{n}×{n} · {NAMES[n]}</span>
        <span className="ss-tiempo" aria-label="Tiempo">{fmtTime(ms)}</span>
        <span>{seals.length}/{n} sellos</span>
      </div>

      <div className={'ss-tablero' + (won ? ' ganado' : '')} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }} role="group" aria-label={`Tablero de ${n} por ${n}`}>
        {cells.map((v, i) => {
          const r = Math.floor(i / n), c = i % n
          const cls = ['ss-cel', side(i, -1, 0, r === 0) && 'bt', side(i, 0, -1, c === 0) && 'bl', r === n - 1 && 'bb', c === n - 1 && 'br', bad.has(i) && 'mal'].filter(Boolean).join(' ')
          return (
            <button key={i} type="button" className={cls} style={{ background: COLORS[colors[board.regions[i]]] }} aria-label={label(i)} onClick={() => tap(i)}>
              {v === 1 && <span className="ss-x" aria-hidden="true">✕</span>}
              {v === 2 && <Sello />}
            </button>
          )
        })}
      </div>

      {won ? (
        <div className="dr-resuelto" role="status">
          <div className="dr-sello">Resuelto</div>
          <p className="dr-datos">{fmtTime(ms)}{hinted ? ' · con pista' : ''}</p>
          <button type="button" onClick={onNew}>Otro tablero {n}×{n}</button>
          <button type="button" className="suave" onClick={onLeave}>Cambiar de tamaño</button>
        </div>
      ) : (
        <>
          <p className="dr-aviso" role="status">{bad.size ? 'Hay sellos que chocan: se marcan en rojo.' : ''}</p>
          <div className="ss-acciones">
            <button type="button" className="suave" onClick={back} disabled={!undo.length}>Deshacer</button>
            <button type="button" className="suave" onClick={hint}>Pista</button>
            <button type="button" className="suave" onClick={reset}>Reiniciar</button>
          </div>
          <Reglas abierto={firstTime} />
          <button type="button" className="suave ss-salir" onClick={onLeave}>← Cambiar de tamaño</button>
        </>
      )}
    </>
  )
}

export default function Sellos({ onExit }) {
  const [data, setData] = useState(load)
  const [game, setGame] = useState(null)
  const stats = data.stats ?? {}
  const saved = data.game

  const start = (n) => setGame({ n, seed: newSeed() })
  const win = (r) => {
    const next = { ...load(), game: null }
    next.stats = recordWin(next.stats ?? {}, { ...r, day: dateKey() })
    save(next)
    setData(next)
  }
  const leave = () => { setGame(null); setTimeout(() => setData(load()), 0) } // al volver al menú se lee lo que dejó la partida al cerrarse

  return (
    <article className="dr-carta tema-detective ss-carta">
      <h1>Sellos</h1>
      {game ? (
        <Partida key={game.seed} initial={game} onWin={win} onLeave={leave} onNew={() => start(game.n)} firstTime={!stats.played} />
      ) : (
        <>
          <p className="dr-nota dr-izq">
            Práctica sin límite: tableros nuevos cada vez, todos con una única solución. <b>No suma puntos</b> ni cambia tu ranking; es para entrenar la cabeza.
          </p>
          {saved && (
            <button type="button" className="dr-reto-boton" onClick={() => setGame(saved)}>▶ Continuar partida {saved.n}×{saved.n} · {fmtTime(saved.ms)}</button>
          )}
          <h2 className="dr-sub">Elige tamaño</h2>
          <div className="ss-tamanos">
            {SIZES.map((n) => (
              <button key={n} type="button" onClick={() => start(n)}>
                <b>{n}×{n}</b> <span>{NAMES[n]}</span>
                <small>{stats.best?.[n] != null ? `Mejor: ${fmtTime(stats.best[n])}` : 'Sin récord'}</small>
              </button>
            ))}
          </div>
          <p className="dr-nota">
            {stats.played ? <>Llevas <b>{stats.played}</b> {stats.played === 1 ? 'tablero resuelto' : 'tableros resueltos'}{stats.streak > 1 ? <> · racha de <b>{stats.streak}</b> días</> : null}. </> : null}
            Los récords solo cuentan si no usas pista.
          </p>
          <Reglas abierto={!stats.played} />
          <button type="button" className="suave" onClick={onExit}>← Volver</button>
        </>
      )}
    </article>
  )
}
