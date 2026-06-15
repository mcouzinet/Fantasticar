import { describe, it, expect } from 'vitest'
import { parseMoxfield } from '../lib/io/deckIo'
import { CARD_CATALOG } from '../lib/io/cardCatalog'

describe('Catalogue de cartes (reconnaissance à l’import)', () => {
  it('toutes les cartes du catalogue sont reconnues (0 à catégoriser)', () => {
    const names = Object.keys(CARD_CATALOG)
    const text = names.map((n) => `1 ${n} (SET) 1`).join('\n')
    const parsed = parseMoxfield(text)
    expect(parsed.unresolved).toEqual([])
    expect(parsed.cards.length).toBe(names.length)
  })

  it('corrections de coût (vérifiées sur Scryfall)', () => {
    expect(CARD_CATALOG['Solar Transformer']).toBe('rock2t') // {2} engagé, pas un caillou à 3
    expect(CARD_CATALOG['Null Elemental Blast']).toBe('one') // coût {C} = 1, pas 2
  })

  it('annotations Moxfield de fin de ligne (tags #!… et foil *F*) n’empêchent pas la reconnaissance', () => {
    const text = [
      '1 Command Beacon (CMR) 349 #!Land',
      '1 Disruptor Flute (MH3) 461 *F*',
      '1 Mind Stone (KHC) 102 #!Draw #!Ramp',
    ].join('\n')
    const parsed = parseMoxfield(text)
    expect(parsed.unresolved).toEqual([])
    expect(parsed.cards.map((c) => c.name)).toEqual([
      'Command Beacon',
      'Disruptor Flute',
      'Mind Stone',
    ])
  })
})
