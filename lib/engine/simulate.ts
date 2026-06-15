import type { Deck, SimConfig, SimResult, SpellTable, TurnProbabilities } from './types'
import { DEFAULT_SPELL_TABLE } from './spellTable'
import { mulberry32 } from './prng'
import { newHand } from './hand'
import { emptyBattlefield } from './mana'
import { buildComboContext } from './combo'
import { buildDevelopContext } from './develop'
import { buildDeckBuffer } from './deckBuffer'
import { type GameDeps, playGame } from './game'

export interface RunOptions {
  table?: SpellTable
  onProgress?: (done: number, total: number) => void
  batchSize?: number
}

/** Demi-largeur d'IC à 95 % en points, pire cas p=0,5 (≈ ±1 pt à N=10 000). */
function ciHalfWidthPt(n: number): number {
  return 100 * 1.96 * Math.sqrt(0.25 / n)
}

function toCumulative(exact: Int32Array, n: number, maxTurn: number): TurnProbabilities {
  let acc = 0
  const p: number[] = []
  for (let t = 2; t <= 5; t++) {
    if (t <= maxTurn) acc += exact[t] ?? 0
    p[t] = acc / n
  }
  return { t2: p[2]!, t3: p[3]!, t4: p[4]!, t5: p[5]! }
}

function runAxis(
  deps: GameDeps,
  onPlay: boolean,
  n: number,
  batchSize: number,
  doneOffset: number,
  total: number,
  onProgress?: (done: number, total: number) => void,
): TurnProbabilities {
  const exact = new Int32Array(deps.maxTurn + 1)
  let done = 0
  while (done < n) {
    const end = Math.min(done + batchSize, n)
    for (; done < end; done++) {
      const r = playGame(deps, onPlay)
      if (r >= 2) exact[r]!++
    }
    onProgress?.(doneOffset + done, total)
  }
  return toCumulative(exact, n, deps.maxTurn)
}

/**
 * Lance la simulation Monte Carlo complète (axes on-the-play et on-the-draw).
 * Déterministe à seed donné (spec §3.7, §6). `onProgress` permet d'alimenter une
 * barre de progression depuis un Web Worker.
 */
export function runSimulation(deck: Deck, config: SimConfig, opts: RunOptions = {}): SimResult {
  const table = opts.table ?? DEFAULT_SPELL_TABLE
  const batchSize = opts.batchSize ?? 2000
  const n = config.iterations
  const total = n * 2

  const comboCtx = buildComboContext(table)
  const devCtx = buildDevelopContext(table)
  const deckBuf = buildDeckBuffer(deck)

  const deps: GameDeps = {
    deckBuf,
    rng: mulberry32(config.seed >>> 0),
    hand: newHand(),
    bf: emptyBattlefield(),
    comboCtx,
    devCtx,
    mode: config.mulligan,
    maxTurn: config.maxTurn,
  }

  const onPlay = runAxis(deps, true, n, batchSize, 0, total, opts.onProgress)

  // Axe on-the-draw : flux PRNG distinct mais déterministe (pour des deltas what-if stables).
  deps.rng = mulberry32((config.seed ^ 0x9e3779b9) >>> 0)
  const onDraw = runAxis(deps, false, n, batchSize, n, total, opts.onProgress)

  return { onPlay, onDraw, iterations: n, ciHalfWidthPt: ciHalfWidthPt(n) }
}
