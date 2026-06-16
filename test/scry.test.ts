import { describe, it, expect } from 'vitest'
import type { Kind } from '../lib/engine/types'
import { kindCode } from '../lib/engine/types'
import { emptyBattlefield, computeMana, applyDrop } from '../lib/engine/mana'
import { scryKeep } from '../lib/engine/develop'
import { newHand, type Hand } from '../lib/engine/hand'

function handOf(...kinds: Kind[]): Hand {
  const h = newHand()
  for (const k of kinds) h[kindCode[k]]!++
  return h
}
const k = (n: Kind) => kindCode[n]

describe('landScry — terrain à scry/surveil', () => {
  it('tape pour 1 (comme un terrain normal) et déclenche un filtre', () => {
    const bf = emptyBattlefield()
    expect(computeMana(bf, 'landScry')).toBe(1)
    applyDrop(bf, 'landScry')
    expect(bf.plain).toBe(1)
    expect(bf.scry).toBe(1)
  })
})

describe('scryKeep — garde la pièce manquante, jette le superflu (contextuel)', () => {
  it('jette toujours les cartes mortes (créature, Maze, sorts ≥ 6)', () => {
    const hand = handOf('land')
    expect(scryKeep(hand, k('creature'))).toBe(false)
    expect(scryKeep(hand, k('land0'))).toBe(false)
    expect(scryKeep(hand, k('o6'))).toBe(false)
    expect(scryKeep(hand, k('o7'))).toBe(false)
  })

  it('garde un terrain tant qu’on manque de mana (< 3 sources), le jette ensuite', () => {
    expect(scryKeep(handOf('land', 'land'), k('land'))).toBe(true) // 2 sources < 3
    // 4 terrains + 2 sorts à 0 : assez de mana → on jette le terrain en trop pour creuser le 3e/4e sort
    expect(scryKeep(handOf('land', 'land', 'land', 'land', 'zero', 'zero'), k('land'))).toBe(false)
  })

  it('garde un sort bon marché tant qu’on n’a pas les 4, le jette ensuite', () => {
    expect(scryKeep(handOf('zero', 'zero'), k('zero'))).toBe(true) // 2 < 4 → on creuse encore
    expect(scryKeep(handOf('zero', 'zero', 'zero', 'one'), k('zero'))).toBe(false) // déjà 4
  })
})
