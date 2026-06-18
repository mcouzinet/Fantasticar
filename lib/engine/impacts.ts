import type { Card, Kind, SimConfig, SimResult } from './types'
import { KINDS } from './types'
import { REFERENCE_DECK } from './referenceDeck'
import { runSimulation } from './simulate'

export interface CardImpact {
  kind: Kind
  t2: number // delta (points, fraction 0..1) sur P(combo ≤ T2), moyenne play/draw
  t3: number
  t4: number
  t5: number
}

function avg4(r: SimResult): { t2: number; t3: number; t4: number; t5: number } {
  return {
    t2: (r.onPlay.t2 + r.onDraw.t2) / 2,
    t3: (r.onPlay.t3 + r.onDraw.t3) / 2,
    t4: (r.onPlay.t4 + r.onDraw.t4) / 2,
    t5: (r.onPlay.t5 + r.onDraw.t5) / 2,
  }
}

/**
 * Influence (rough) de chaque catégorie de carte sur les probabilités de combo.
 * Mesure marginale : on remplace UNE carte neutre (une créature, poids mort pour le combo)
 * de la liste de référence par une carte de la catégorie K, et on lit le delta sur T2..T5.
 * Comparaison à seed identique (baseline vs variante) → deltas peu bruités, comme le what-if.
 *
 * C'est volontairement contextuel (dépend de la liste de référence) : juste pour se faire
 * une idée du sens et de l'ordre de grandeur de l'effet de chaque type de carte.
 */
export function cardImpacts(config: SimConfig, onProgress?: (done: number, total: number) => void): CardImpact[] {
  const cfg: SimConfig = { ...config, iterations: Math.min(config.iterations, 25000) }
  const base = avg4(runSimulation(REFERENCE_DECK, cfg))
  // Cartes « neutres » de référence = les créatures (poids mort pour le combo). On les remplace
  // TOUTES par la catégorie testée et on divise le delta par leur nombre : signal plus fort →
  // beaucoup moins de bruit qu'un swap d'une seule carte (sinon des catégories quasi égales, p.ex.
  // « sort à 0 » vs Jeweled Amulet à ~0,3 pt près, s'inversaient au gré du bruit). Reste la moyenne
  // marginale par carte ajoutée — même sens et ordre de grandeur.
  const blanks: number[] = []
  REFERENCE_DECK.cards.forEach((c, i) => { if (c.kind === 'creature') blanks.push(i) })
  const nBlank = Math.max(1, blanks.length)

  const kinds = KINDS.filter((k) => k !== 'creature')
  const out: CardImpact[] = []
  let done = 0
  for (const kind of kinds) {
    const blankSet = new Set(blanks)
    const cards: Card[] = REFERENCE_DECK.cards.map((c, i) =>
      blankSet.has(i) ? { name: `+${kind}${i}`, kind, qty: 1 } : c,
    )
    const a = avg4(runSimulation({ cards }, cfg))
    out.push({
      kind,
      t2: (a.t2 - base.t2) / nBlank,
      t3: (a.t3 - base.t3) / nBlank,
      t4: (a.t4 - base.t4) / nBlank,
      t5: (a.t5 - base.t5) / nBlank,
    })
    onProgress?.(++done, kinds.length)
  }
  return out.sort((x, y) => (y.t2 + y.t3 + y.t4) - (x.t2 + x.t3 + x.t4))
}
