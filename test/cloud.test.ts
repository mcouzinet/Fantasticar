import { describe, it, expect } from 'vitest'
import { emptyBattlefield, computeMana, applyDrop, promote } from '../lib/engine/mana'
import { DEFAULT_SPELL_TABLE, FANTASTICAR_COST } from '../lib/engine/spellTable'
import { buildComboContext, bestCombo, comboFeasibleForMana } from '../lib/engine/combo'
import { KINDS, kindCode } from '../lib/engine/types'
import { newHand } from '../lib/engine/hand'
import { mulberry32 } from '../lib/engine/prng'

const ctx = buildComboContext(DEFAULT_SPELL_TABLE)

describe('Untaidake, the Cloud Keeper (mana légendaire {C}{C}{C})', () => {
  it('entre engagé : 0 mana le tour posé, +1 générique au tour suivant', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'cloud')
    expect(computeMana(bf, 'none')).toBe(0) // engagé ce tour
    promote(bf)
    expect(computeMana(bf, 'none')).toBe(1) // dégagé : tape {C}
  })

  it('le mana légendaire ne paie QUE le Fantasticar (pas les rembourseurs)', () => {
    // F=3, 1 Untaidake, 1 mana de base, un rock2u (coût 2) + 2 sorts à 0 : infaisable.
    // Soit l'Untaidake est légendaire (paie F) → 1 mana ne lance pas le rock2u ;
    // soit il est générique (2 mana lancent le rock2u) → il ne reste rien pour F=3.
    const hand = newHand()
    hand[kindCode.rock2u] = 1
    hand[kindCode.zero] = 2
    expect(comboFeasibleForMana(ctx, hand, 1, false, 0, 1)).toBe(false)
    // Avec 1 mana de plus, on lance le rock2u (générique) ET l'Untaidake paie F : faisable.
    expect(comboFeasibleForMana(ctx, hand, 2, false, 0, 1)).toBe(true)
  })

  it('un seul Untaidake disponible paie tout le Fantasticar (combo sans autre mana)', () => {
    const hand = newHand()
    hand[kindCode.zero] = 3 // 3 sorts à 0 en main
    const bf = emptyBattlefield()
    bf.cloud = 1 // un Untaidake dégagé
    expect(bestCombo(ctx, hand, bf, false)).toBe(true) // need 3 (zeros) + Fantasticar payé par Untaidake
  })

  it('sans Untaidake il faut 3 mana pour le même combo', () => {
    const hand = newHand()
    hand[kindCode.zero] = 3
    const bf0 = emptyBattlefield()
    expect(bestCombo(ctx, hand, bf0, false)).toBe(false) // 0 mana → ne paie pas le Fantasticar
    const bf3 = emptyBattlefield()
    bf3.plain = 3
    expect(bestCombo(ctx, hand, bf3, false)).toBe(true)
  })

  it('forme close == brute-force (mana légendaire) sur 20000 cas aléatoires', () => {
    const comboKinds = KINDS.filter((k) => DEFAULT_SPELL_TABLE[k].isComboSpell && !DEFAULT_SPELL_TABLE[k].suspend)
    const F = FANTASTICAR_COST
    // Brute : chaque Untaidake est soit +1 générique, soit +3 légendaire (Fantasticar uniquement).
    function brute(spells: { cost: number; refund: number }[], mana: number, fCast: boolean, free: number, clouds: number): boolean {
      const need = (fCast ? 4 : 3) - free
      if (fCast) {
        // Fantasticar déjà lancé : les Untaidake ne servent que de +1 générique.
        return solve(spells, mana + clouds, 0, need)
      }
      for (let j = 0; j <= clouds; j++) {
        const legCover = Math.min(F, 3 * j)
        const fGeneral = F - legCover // reste du Fantasticar payé en générique
        if (solve(spells, mana + (clouds - j), fGeneral, need)) return true
      }
      return false
    }
    function solve(spells: { cost: number; refund: number }[], mana: number, fCost: number, need: number): boolean {
      if (need <= 0) return mana >= fCost
      const n = spells.length
      const used = new Array<boolean>(n).fill(false)
      function rec(bal: number, fpaid: boolean, count: number): boolean {
        if (fpaid && count >= need) return true
        if (!fpaid && bal >= fCost && rec(bal - fCost, true, count)) return true
        if (count < need) {
          for (let i = 0; i < n; i++) {
            if (!used[i] && spells[i]!.cost <= bal) {
              used[i] = true
              if (rec(bal - spells[i]!.cost + spells[i]!.refund, fpaid, count + 1)) { used[i] = false; return true }
              used[i] = false
            }
          }
        }
        return false
      }
      return rec(mana, false, 0)
    }

    const rng = mulberry32(98765)
    let mismatches = 0
    for (let iter = 0; iter < 20000; iter++) {
      const hand = newHand()
      const spells: { cost: number; refund: number }[] = []
      let refunderCount = 0
      for (const k of comboKinds) {
        const qty = Math.floor(rng() * 3)
        const p = DEFAULT_SPELL_TABLE[k]
        if (p.refund > 0) refunderCount += qty
        for (let q = 0; q < qty; q++) { hand[kindCode[k]]!++; spells.push({ cost: p.cost, refund: p.refund }) }
      }
      if (refunderCount > 6) continue
      const mana = Math.floor(rng() * 7)
      const fCast = rng() < 0.5
      const free = Math.floor(rng() * 4)
      const clouds = Math.floor(rng() * 3) // 0..2 Untaidake
      const mine = comboFeasibleForMana(ctx, hand, mana, fCast, free, clouds)
      const ref = brute(spells, mana, fCast, free, clouds)
      if (mine !== ref) mismatches++
    }
    expect(mismatches).toBe(0)
  })
})
