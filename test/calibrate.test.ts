import { describe, it, expect } from 'vitest'
import { REFERENCE_DECK } from '../lib/engine/referenceDeck'
import { deckStats } from '../lib/engine/deckStats'
import { runSimulation } from '../lib/engine/simulate'
import type { MulliganMode, SimResult } from '../lib/engine/types'
import { SPEC_DECK } from './fixtures/specDeck'

const N = 40_000 // seed fixe → résultats déterministes
const SEED = 0xc0ffee
const GATE = 0.035 // tolérance du gate (cf. CALIBRATION.md : ~3 pt sur les extrêmes)

function pct(x: number): string {
  return (x * 100).toFixed(1).padStart(5) + ' %'
}
function logTable(title: string, results: Record<MulliganMode, SimResult>) {
  const header = '            |   T2    |   T3    |   T4    |   T5    '
  const sep = '-'.repeat(header.length)
  /* eslint-disable no-console */
  console.log(`\n${title}  (N=${N})\n${sep}\n${header}\n${sep}`)
  for (const mode of ['none', 'london', 'moxfield'] as MulliganMode[]) {
    const r = results[mode]
    console.log(`${mode.padEnd(8)} play| ${pct(r.onPlay.t2)} | ${pct(r.onPlay.t3)} | ${pct(r.onPlay.t4)} | ${pct(r.onPlay.t5)}`)
    console.log(`${mode.padEnd(8)} draw| ${pct(r.onDraw.t2)} | ${pct(r.onDraw.t3)} | ${pct(r.onDraw.t4)} | ${pct(r.onDraw.t5)}`)
  }
  console.log(sep)
  /* eslint-enable no-console */
}
function runAll(deck: typeof REFERENCE_DECK): Record<MulliganMode, SimResult> {
  const cfg = (m: MulliganMode) => ({ iterations: N, mulligan: m, maxTurn: 5, seed: SEED })
  return {
    none: runSimulation(deck, cfg('none')),
    london: runSimulation(deck, cfg('london')),
    moxfield: runSimulation(deck, cfg('moxfield')),
  }
}

function assertInvariants(results: Record<MulliganMode, SimResult>) {
  // hiérarchie des modes : none < london < moxfield (le mulligan aide)
  expect(results.none.onDraw.t3).toBeLessThan(results.london.onDraw.t3)
  expect(results.london.onDraw.t3).toBeLessThan(results.moxfield.onDraw.t3)
  for (const r of [results.none, results.london, results.moxfield]) {
    for (const axis of [r.onPlay, r.onDraw]) {
      expect(axis.t2).toBeLessThanOrEqual(axis.t3 + 1e-9) // monotonie cumulée
      expect(axis.t3).toBeLessThanOrEqual(axis.t4 + 1e-9)
      expect(axis.t4).toBeLessThanOrEqual(axis.t5 + 1e-9)
    }
    expect(r.onDraw.t3).toBeGreaterThan(r.onPlay.t3) // avantage de pioche
  }
}

describe('Calibration moteur vs §7 (deck d’origine de la spec — fixture)', () => {
  const results = runAll(SPEC_DECK)
  const REF = {
    none: { play: 0.345, draw: 0.49 },
    london: { play: 0.515, draw: 0.65 },
    moxfield: { draw: 0.8 },
  }

  it('sous-totaux du deck d’origine (38/24/9/8/6/6/8)', () => {
    const s = deckStats(SPEC_DECK)
    expect(s.total).toBe(99)
    expect([s.byGroup.lands, s.byGroup.zeros, s.byGroup.rocks, s.byGroup.ones, s.byGroup.twos, s.byGroup.creatures, s.byGroup.others])
      .toEqual([38, 24, 9, 8, 6, 6, 8])
  })

  it('reproduit les valeurs T3 du §7 (±gate)', () => {
    logTable('§7 — deck d’origine', results)
    expect(Math.abs(results.none.onPlay.t3 - REF.none.play)).toBeLessThan(GATE)
    expect(Math.abs(results.none.onDraw.t3 - REF.none.draw)).toBeLessThan(GATE)
    expect(Math.abs(results.london.onPlay.t3 - REF.london.play)).toBeLessThan(GATE)
    expect(Math.abs(results.london.onDraw.t3 - REF.london.draw)).toBeLessThan(GATE)
    expect(Math.abs(results.moxfield.onDraw.t3 - REF.moxfield.draw)).toBeLessThan(GATE)
    expect(Math.abs(results.london.onPlay.t4 - 0.71)).toBeLessThan(GATE)
    assertInvariants(results)
  })
})

describe('Decklist de référence courante (nouvelle liste)', () => {
  it('totaux 99/99 et sous-totaux attendus', () => {
    const s = deckStats(REFERENCE_DECK)
    expect(s.total).toBe(99)
    expect(s.byGroup.lands).toBe(39)
    expect(s.byGroup.zeros).toBe(25)
    expect(s.byGroup.rocks).toBe(10)
    expect(s.byGroup.ones).toBe(10)
    expect(s.byGroup.twos).toBe(5)
    expect(s.byGroup.creatures).toBe(3)
    expect(s.byGroup.others).toBe(7)
  })

  it('probabilités cohérentes (monotonie, hiérarchie, pioche)', () => {
    const results = runAll(REFERENCE_DECK)
    logTable('Decklist de référence courante', results)
    assertInvariants(results)
    expect(results.none.onPlay.t2).toBeGreaterThan(0.01) // T2 non nul (City/Vein)
  })
})

describe('What-if : direction des deltas', () => {
  it('+2 sorts à 0 (au prix de 2 sorts chers) ⇒ delta T3 positif', () => {
    const cards = REFERENCE_DECK.cards.map((c) => ({ ...c }))
    let removed = 0
    const draft = cards.filter((c) => {
      if (removed < 2 && (c.kind === 'o7' || c.kind === 'o5' || c.kind === 'o4')) {
        removed++
        return false
      }
      return true
    })
    for (let i = 0; i < removed; i++) draft.push({ name: `Extra Zero ${i}`, kind: 'zero' as const, qty: 1 })
    const cfg = { iterations: N, mulligan: 'none' as MulliganMode, maxTurn: 5, seed: SEED }
    const base = runSimulation(REFERENCE_DECK, cfg)
    const variant = runSimulation({ cards: draft }, cfg)
    /* eslint-disable no-console */
    console.log(`\n[what-if +2 zero] ΔT3 play=${(100 * (variant.onPlay.t3 - base.onPlay.t3)).toFixed(2)} pt  draw=${(100 * (variant.onDraw.t3 - base.onDraw.t3)).toFixed(2)} pt`)
    /* eslint-enable no-console */
    expect(variant.onPlay.t3).toBeGreaterThan(base.onPlay.t3)
    expect(variant.onDraw.t3).toBeGreaterThan(base.onDraw.t3)
  })
})
