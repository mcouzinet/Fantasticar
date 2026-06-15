import { describe, it, expect } from 'vitest'
import { encodeDeck, decodeDeck } from '../lib/io/deckShare'
import { REFERENCE_DECK } from '../lib/engine/referenceDeck'

describe('Partage par URL (encode/decode)', () => {
  it('round-trip : decode(encode(deck)) reproduit le deck', () => {
    const back = decodeDeck(encodeDeck(REFERENCE_DECK))
    expect(back).not.toBeNull()
    expect(back!.cards.map((c) => `${c.name}|${c.kind}`)).toEqual(
      REFERENCE_DECK.cards.map((c) => `${c.name}|${c.kind}`),
    )
  })

  it('chaîne compressée bien plus courte que le JSON brut', () => {
    const code = encodeDeck(REFERENCE_DECK)
    const raw = JSON.stringify(REFERENCE_DECK.cards.map((c) => [c.name, c.kind]))
    expect(code.length).toBeLessThan(raw.length)
  })

  it('renvoie null sur une entrée invalide', () => {
    expect(decodeDeck('nawak!!')).toBeNull()
    expect(decodeDeck('')).toBeNull()
  })
})
