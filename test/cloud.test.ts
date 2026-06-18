import { describe, it, expect } from 'vitest'
import { emptyBattlefield, computeMana, applyDrop, promote } from '../lib/engine/mana'
import { DEFAULT_SPELL_TABLE, FANTASTICAR_COST } from '../lib/engine/spellTable'
import { buildComboContext, bestCombo, comboFeasibleForMana } from '../lib/engine/combo'
import { buildDevelopContext, develop } from '../lib/engine/develop'
import { KINDS, kindCode } from '../lib/engine/types'
import { newHand } from '../lib/engine/hand'
import { mulberry32 } from '../lib/engine/prng'

const ctx = buildComboContext(DEFAULT_SPELL_TABLE)
const devCtx = buildDevelopContext(DEFAULT_SPELL_TABLE)

// Untaidake, the Cloud Keeper : terrain légendaire qui entre engagé puis tape {C}{C} réservé
// aux sorts légendaires (aucun mana générique) → couvre 2 du coût du Fantasticar (le seul légendaire).
describe('Untaidake, the Cloud Keeper ({C}{C} légendaire)', () => {
  it('entre engagé et ne produit AUCUN mana générique (même dégagé)', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'cloud')
    expect(computeMana(bf, 'none')).toBe(0) // engagé ce tour
    promote(bf)
    expect(bf.cloud).toBe(1) // dégagé au tour suivant
    expect(computeMana(bf, 'none')).toBe(0) // mais 0 mana générique (mana légendaire only)
  })

  it('le mana légendaire ne paie QUE le Fantasticar (ni rembourseurs ni sorts)', () => {
    // 2 Untaidake = 4 mana légendaires (couvrent tout le Fantasticar, F=3). Mais un rock2u (coût 2)
    // ne peut PAS être lancé avec ce mana : il faut 2 mana GÉNÉRIQUES.
    const hand = newHand()
    hand[kindCode.rock2u] = 1
    hand[kindCode.zero] = 2
    expect(comboFeasibleForMana(ctx, hand, 1, false, 0, 2)).toBe(false) // 1 générique < coût du rock2u
    expect(comboFeasibleForMana(ctx, hand, 2, false, 0, 2)).toBe(true) // 2 génériques lancent le rock2u
  })

  it('un Untaidake couvre 2 du Fantasticar : il manque encore 1 mana générique', () => {
    const spells = newHand()
    spells[kindCode.zero] = 3
    const bf = emptyBattlefield()
    bf.cloud = 1
    expect(bestCombo(ctx, spells, bf, false)).toBe(false) // 2 légendaires < 3, pas de générique
    bf.plain = 1 // un terrain quelconque → le 3e mana
    expect(bestCombo(ctx, spells, bf, false)).toBe(true) // Untaidake (2) + terrain (1) = Fantasticar, 3 zeros gratuits
  })

  it('deux Untaidake paient entièrement le Fantasticar (combo sans autre mana)', () => {
    const spells = newHand()
    spells[kindCode.zero] = 3
    const bf = emptyBattlefield()
    bf.cloud = 2 // 4 mana légendaires ≥ 3
    expect(bestCombo(ctx, spells, bf, false)).toBe(true)
  })

  it('Untaidake est posé en priorité (engagé → en ligne le tour suivant), avant un terrain simple', () => {
    const hand = newHand()
    hand[kindCode.cloud] = 1
    hand[kindCode.land] = 1
    hand[kindCode.zero] = 3
    const bf = emptyBattlefield()
    develop(devCtx, hand, bf, false, 4) // T1 : pose Untaidake (engagé), garde le terrain
    expect(bf.cloudTapped).toBe(1)
    expect(hand[kindCode.cloud]).toBe(0)
    expect(hand[kindCode.land]).toBe(1)
    promote(bf) // T2 : Untaidake dégagé
    // T2 : Untaidake (2 légendaires) + pose du terrain gardé (1) → Fantasticar payé, 3 zeros gratuits.
    expect(bestCombo(ctx, hand, bf, false)).toBe(true)
  })

  it('sans Untaidake il faut 3 mana pour le même combo', () => {
    const hand = newHand()
    hand[kindCode.zero] = 3
    const bf0 = emptyBattlefield()
    expect(bestCombo(ctx, hand, bf0, false)).toBe(false)
    const bf3 = emptyBattlefield()
    bf3.plain = 3
    expect(bestCombo(ctx, hand, bf3, false)).toBe(true)
  })

  it('moteur == brute-force (mana légendaire {C}{C}) sur 20000 cas aléatoires', () => {
    const comboKinds = KINDS.filter((k) => DEFAULT_SPELL_TABLE[k].isComboSpell && !DEFAULT_SPELL_TABLE[k].suspend)
    const F = FANTASTICAR_COST
    // Brute : les Untaidake n'ajoutent AUCUN mana générique ; ils couvrent 2·clouds du Fantasticar.
    function brute(spells: { cost: number; refund: number }[], mana: number, fCast: boolean, free: number, clouds: number): boolean {
      const need = (fCast ? 4 : 3) - free
      const fCost = fCast ? 0 : Math.max(0, F - 2 * clouds)
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
