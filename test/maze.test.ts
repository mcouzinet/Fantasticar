import { describe, it, expect } from 'vitest'
import { emptyBattlefield, computeMana, applyDrop } from '../lib/engine/mana'

describe('Maze of Ith (land0) — terrain sans mana, conditionnel au donneur de type', () => {
  it('ne produit aucun mana sans donneur de type', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'land0') // pose un Maze
    expect(bf.maze).toBe(1)
    expect(computeMana(bf, 'none')).toBe(0) // 0 mana : pas de Yavimaya/Urborg
  })

  it('produit 1 par Maze une fois un donneur de type en jeu (Yavimaya/Urborg)', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'land0') // Maze #1
    applyDrop(bf, 'land0') // Maze #2
    expect(computeMana(bf, 'none')).toBe(0)

    // On pose le donneur ce tour : +1 (lui-même) + 2 (les Maze déjà en jeu deviennent productifs).
    expect(computeMana(bf, 'landGrant')).toBe(3)

    applyDrop(bf, 'landGrant')
    expect(bf.granters).toBe(1)
    expect(bf.plain).toBe(1) // le donneur tape pour 1 aux tours suivants
    // Tours suivants : 1 (donneur, via plain) + 2 (les deux Maze) = 3.
    expect(computeMana(bf, 'none')).toBe(3)
  })

  it('le Maze posé le tour où le donneur est déjà en jeu tape aussi', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'landGrant') // donneur en jeu (plain=1, granters=1)
    // Poser un Maze ce tour : base plain(1) + maze déjà en jeu(0) + le Maze posé(1) = 2.
    expect(computeMana(bf, 'land0')).toBe(2)
  })
})
