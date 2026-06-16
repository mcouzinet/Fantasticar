import { describe, it, expect } from 'vitest'
import type { Kind } from '../lib/engine/types'
import { kindCode } from '../lib/engine/types'
import { DEFAULT_SPELL_TABLE } from '../lib/engine/spellTable'
import { buildComboContext, bestCombo } from '../lib/engine/combo'
import { newHand, type Hand } from '../lib/engine/hand'
import { emptyBattlefield } from '../lib/engine/mana'

const ctx = buildComboContext(DEFAULT_SPELL_TABLE)

function handOf(...kinds: Kind[]): Hand {
  const h = newHand()
  for (const k of kinds) h[kindCode[k]]!++
  return h
}

/** Combo testé avec un mana "pur" (aucun terrain en main → seul le drop 'none' compte). */
function comboAtMana(hand: Hand, mana: number, fCast: boolean): boolean {
  const bf = emptyBattlefield()
  bf.plain = mana
  return bestCombo(ctx, hand, bf, fCast)
}

describe('comboFeasible (§3.4)', () => {
  it('Fantasticar + 3 zéros passe à 3 mana', () => {
    expect(comboAtMana(handOf('zero', 'zero', 'zero'), 3, false)).toBe(true)
  })

  it('échoue à 2 mana (pas de quoi lancer le Fantasticar)', () => {
    expect(comboAtMana(handOf('zero', 'zero', 'zero'), 2, false)).toBe(false)
  })

  it('Fantasticar déjà en jeu : il faut 4 sorts de combo le tour même', () => {
    expect(comboAtMana(handOf('zero', 'zero', 'zero', 'zero'), 3, true)).toBe(true)
    expect(comboAtMana(handOf('zero', 'zero', 'zero'), 3, true)).toBe(false)
  })

  it('chrom est un sort à 1 net (activation neutre/coûteuse) — pas un rembourseur gratuit', () => {
    // Fantasticar payé (3) ne laisse rien pour lancer les chrom (coût 1 chacun) → échoue.
    expect(comboAtMana(handOf('chrom', 'chrom', 'zero'), 3, false)).toBe(false)
    // Avec le mana pour les payer (3 Fantasticar + 2×1 chrom), le combo passe.
    expect(comboAtMana(handOf('chrom', 'chrom', 'zero'), 5, false)).toBe(true)
  })

  it('les créatures et terrains ne comptent jamais pour le combo', () => {
    expect(comboAtMana(handOf('creature', 'creature', 'creature'), 6, false)).toBe(false)
    expect(comboAtMana(handOf('zero', 'zero', 'creature'), 3, false)).toBe(false)
  })

  it("un caillou cher non payable ne débloque pas le combo", () => {
    // 3 'two' à 5 mana : F(3) puis 2 restants → un seul 'two' → 1 sort, insuffisant.
    expect(comboAtMana(handOf('two', 'two', 'two'), 5, false)).toBe(false)
  })
})
