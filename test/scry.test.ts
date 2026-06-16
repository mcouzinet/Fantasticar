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

describe('scryKeep — ne jeter que les cartes mortes (modèle conservateur)', () => {
  const hand = handOf('land')

  it('jette les cartes qui n’aident jamais le combo (créature, Maze, sorts ≥ 6)', () => {
    expect(scryKeep(hand, k('creature'))).toBe(false)
    expect(scryKeep(hand, k('land0'))).toBe(false)
    expect(scryKeep(hand, k('o6'))).toBe(false)
    expect(scryKeep(hand, k('o7'))).toBe(false)
  })

  it('garde tout ce qui peut servir (terrains, cailloux, sorts non-créature castables)', () => {
    for (const kind of ['land', 'landScry', 'vein', 'rock2u', 'basalt', 'zero', 'one', 'chrom', 'two', 'o3', 'o4', 'o5'] as const) {
      expect(scryKeep(hand, k(kind))).toBe(true)
    }
  })
})
