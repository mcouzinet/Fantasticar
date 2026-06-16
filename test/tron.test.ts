import { describe, it, expect } from 'vitest'
import { tronMana, emptyBattlefield, computeMana, applyDrop, scorchedSacPool } from '../lib/engine/mana'

describe('Tron (Urza Mine/Power Plant/Tower + Planar Nexus)', () => {
  it('tronMana : Mine/PP tapent 2, Tower 3 si le set est complet', () => {
    expect(tronMana(1, 1, 1, 0)).toBe(7) // 3 vraies pièces = 2 + 2 + 3
    expect(tronMana(1, 0, 0, 0)).toBe(1) // Mine seule = 1
    expect(tronMana(0, 1, 0, 0)).toBe(1) // PP seule = 1
    expect(tronMana(0, 0, 1, 0)).toBe(1) // Tower seule = 1
  })

  it('Planar Nexus compte comme toutes les pièces (mais tape 1)', () => {
    expect(tronMana(0, 0, 0, 1)).toBe(1) // Nexus seul = 1 (pas d’aptitude boostée)
    expect(tronMana(0, 0, 1, 1)).toBe(4) // Nexus + Tower = 1 + 3
    expect(tronMana(1, 0, 0, 1)).toBe(3) // Nexus + Mine = 1 + 2
    expect(tronMana(1, 1, 1, 1)).toBe(8) // 3 vraies + Nexus = 7 + 1
  })

  it('computeMana intègre la pièce Tron posée ce tour (entre dégagée)', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'planarNexus') // Nexus en jeu
    expect(computeMana(bf, 'urzaTower')).toBe(4) // pose Tower : 3 (Tower, set complet via Nexus) + 1 (Nexus)
  })

  it('Scorched Ruins peut sacrifier des pièces Tron (pas seulement bf.plain)', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'urzaMine')
    applyDrop(bf, 'urzaTower')
    expect(scorchedSacPool(bf)).toBe(2) // 2 pièces Tron sacrifiables
  })
})
