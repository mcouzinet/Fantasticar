import { describe, it, expect } from 'vitest'
import { emptyBattlefield, computeMana, applyDrop } from '../lib/engine/mana'

describe('Crystal Vein (one-shot : 1/tour, ou sacrifice pour 2 au combo)', () => {
  it('tape pour 1 pendant la rampe (combo=false), pour 2 le tour du combo (combo=true)', () => {
    const bf = emptyBattlefield()
    applyDrop(bf, 'vein') // une Crystal Vein en jeu
    expect(bf.veins).toBe(1)
    expect(computeMana(bf, 'none', false)).toBe(1) // rampe : 1/tour (on la garde)
    expect(computeMana(bf, 'none', true)).toBe(2) // combo : sacrifice pour {C}{C}
  })

  it('la Vein posée le tour du combo tape 1 + burst = 2', () => {
    const bf = emptyBattlefield()
    expect(computeMana(bf, 'vein', false)).toBe(1) // posée hors combo : 1
    expect(computeMana(bf, 'vein', true)).toBe(2) // posée le tour du combo : 1 + sacrifice
  })
})
