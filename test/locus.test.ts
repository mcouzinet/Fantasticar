import { describe, it, expect } from 'vitest'
import { emptyBattlefield, computeMana, applyDrop, promote } from '../lib/engine/mana'

// Cloudpost tape {C} par Locus en jeu (Cloudpost + Glimmerpost/Trenchpost + Planar Nexus).
describe('Locus (Cloudpost / Glimmerpost / Trenchpost / Planar Nexus)', () => {
  it('Cloudpost seul (dégagé) tape pour 1 (lui-même = 1 Locus)', () => {
    const bf = emptyBattlefield()
    bf.cloudpost = 1
    expect(computeMana(bf, 'none')).toBe(1)
  })

  it('Cloudpost + Planar Nexus : Cloudpost tape 2, Nexus tape 1 → 3', () => {
    const bf = emptyBattlefield()
    bf.cloudpost = 1
    bf.uNexus = 1
    expect(computeMana(bf, 'none')).toBe(3) // Cloudpost 1×2 + Nexus 1
  })

  it('Cloudpost + Glimmerpost + Trenchpost + Planar Nexus (4 Locus) → 7', () => {
    const bf = emptyBattlefield()
    bf.cloudpost = 1
    bf.locus = 2 // Glimmerpost + Trenchpost
    bf.uNexus = 1
    // Cloudpost 1×4 = 4 ; Glimmerpost/Trenchpost 2 ; Nexus 1 = 7
    expect(computeMana(bf, 'none')).toBe(7)
  })

  it('Cloudpost entre engagé : 0 mana le tour posé, mais compte déjà comme Locus pour les autres', () => {
    const bf = emptyBattlefield()
    bf.cloudpost = 1 // un Cloudpost déjà dégagé
    // on pose un 2e Cloudpost ce tour (engagé) : il ne tape pas, mais booste le 1er (2 Locus)
    expect(computeMana(bf, 'cloudpost')).toBe(2) // le 1er Cloudpost tape pour 2
    applyDrop(bf, 'cloudpost')
    expect(computeMana(bf, 'none')).toBe(2) // 2e encore engagé ce tour → 1er tape 2
    promote(bf) // 2e Cloudpost se dégage
    expect(computeMana(bf, 'none')).toBe(4) // 2 Cloudpost × 2 Locus = 4
  })

  it('Glimmerpost/Trenchpost (locus) : dégagé, tape 1, et booste un Cloudpost en jeu', () => {
    const bf = emptyBattlefield()
    bf.cloudpost = 1
    expect(computeMana(bf, 'locus')).toBe(3) // pose Glimmerpost : Cloudpost 1×2 + locus 1
  })
})
