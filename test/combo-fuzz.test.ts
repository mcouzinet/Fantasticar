import { describe, it, expect } from 'vitest'
import { KINDS, kindCode } from '../lib/engine/types'
import { DEFAULT_SPELL_TABLE, FANTASTICAR_COST } from '../lib/engine/spellTable'
import { buildComboContext, comboFeasibleForMana } from '../lib/engine/combo'
import { newHand } from '../lib/engine/hand'
import { mulberry32 } from '../lib/engine/prng'

const ctx = buildComboContext(DEFAULT_SPELL_TABLE)
// Sorts de combo lançables depuis la main (les suspend sont exclus, comme dans le moteur).
const comboKinds = KINDS.filter((k) => DEFAULT_SPELL_TABLE[k].isComboSpell && !DEFAULT_SPELL_TABLE[k].suspend)

/** Référence brute-force : explore tous les ordres de lancement (≤ need sorts + Fantasticar). */
function brute(spells: { cost: number; refund: number }[], mana: number, fCast: boolean, free: number): boolean {
  const need = (fCast ? 4 : 3) - free // `free` sorts déjà lancés gratuitement (suspend)
  const fCost = FANTASTICAR_COST
  if (need <= 0) return mana >= (fCast ? 0 : fCost)
  const n = spells.length
  const used = new Array<boolean>(n).fill(false)
  function rec(bal: number, fpaid: boolean, count: number): boolean {
    if (fpaid && count >= need) return true
    if (!fpaid && bal >= fCost && rec(bal - fCost, true, count)) return true
    if (count < need) {
      for (let i = 0; i < n; i++) {
        if (!used[i] && spells[i]!.cost <= bal) {
          used[i] = true
          if (rec(bal - spells[i]!.cost + spells[i]!.refund, fpaid, count + 1)) {
            used[i] = false
            return true
          }
          used[i] = false
        }
      }
    }
    return false
  }
  return rec(mana, fCast, 0)
}

describe('combo : fuzz vs brute-force', () => {
  it('comboFeasibleForMana == brute sur 20000 mains aléatoires', () => {
    const rng = mulberry32(12345)
    let mismatches = 0
    let firstMismatch = ''
    for (let iter = 0; iter < 20000; iter++) {
      const hand = newHand()
      const spells: { cost: number; refund: number }[] = []
      let refunderCount = 0
      for (const k of comboKinds) {
        const qty = Math.floor(rng() * 3) // 0..2
        const p = DEFAULT_SPELL_TABLE[k]
        if (p.refund > 0) refunderCount += qty
        for (let q = 0; q < qty; q++) {
          hand[kindCode[k]]!++
          spells.push({ cost: p.cost, refund: p.refund })
        }
      }
      if (refunderCount > 6) continue // hors périmètre du cap §3.4
      const mana = Math.floor(rng() * 9) // 0..8
      const fCast = rng() < 0.5
      const free = Math.floor(rng() * 4) // 0..3 sorts gratuits (suspend résolu ce tour)
      const mine = comboFeasibleForMana(ctx, hand, mana, fCast, free)
      const ref = brute(spells, mana, fCast, free)
      if (mine !== ref) {
        mismatches++
        if (!firstMismatch) {
          firstMismatch = `mana=${mana} fCast=${fCast} free=${free} mine=${mine} ref=${ref} spells=${JSON.stringify(spells)}`
        }
      }
    }
    if (mismatches > 0) console.log('PREMIER ÉCART:', firstMismatch)
    expect(mismatches).toBe(0)
  })
})
