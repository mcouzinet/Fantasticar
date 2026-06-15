import { describe, it, expect } from 'vitest'
import type { Kind } from '../lib/engine/types'
import { kindCode } from '../lib/engine/types'
import { DEFAULT_SPELL_TABLE } from '../lib/engine/spellTable'
import { emptyBattlefield, promote } from '../lib/engine/mana'
import { buildComboContext, bestCombo } from '../lib/engine/combo'
import { newHand, type Hand } from '../lib/engine/hand'

const ctx = buildComboContext(DEFAULT_SPELL_TABLE)

function handOf(...kinds: Kind[]): Hand {
  const h = newHand()
  for (const k of kinds) h[kindCode[k]]!++
  return h
}

describe('Suspend — résolution temporelle', () => {
  it('une carte Suspend 3 se résout après 3 entretiens (mana + sort gratuit)', () => {
    const bf = emptyBattlefield()
    bf.suspend.push({ turnsLeft: 3, tapsFor: 2, combo: true })

    promote(bf) // 3 → 2
    expect(bf.freeCasts).toBe(0)
    expect(bf.rockMana).toBe(0)

    promote(bf) // 2 → 1
    expect(bf.freeCasts).toBe(0)
    expect(bf.rockMana).toBe(0)

    promote(bf) // 1 → 0 : résolution
    expect(bf.freeCasts).toBe(1) // compte comme un sort non-créature lancé ce tour
    expect(bf.rockMana).toBe(2) // entre et tape pour 2

    promote(bf) // ne re-résout pas ; le mana reste pérenne
    expect(bf.freeCasts).toBe(0)
    expect(bf.rockMana).toBe(2)
  })
})

describe('Suspend — impact sur le combo (sorts gratuits)', () => {
  it('un sort gratuit (suspend résolu) réduit le nombre de sorts à lancer', () => {
    // 3 mana, Fantasticar à lancer (need 3), seulement 2 zéros en main.
    const bf = emptyBattlefield()
    bf.plain = 3
    const hand = handOf('zero', 'zero')
    expect(bestCombo(ctx, hand, bf, false)).toBe(false) // F + 2 zéros = 3 sorts, insuffisant

    // Avec 1 sort gratuit ce tour (suspend résolu) : F + free + 2 zéros = 4 → combo.
    bf.freeCasts = 1
    expect(bestCombo(ctx, hand, bf, false)).toBe(true)
  })

  it('Sol Talisman n’est pas lançable depuis la main (suspend only)', () => {
    // Une main de Sol Talisman + 2 zéros à 3 mana ne combote pas : sol n'est pas castable.
    const bf = emptyBattlefield()
    bf.plain = 3
    expect(bestCombo(ctx, handOf('sol', 'zero', 'zero'), bf, false)).toBe(false)
  })
})
