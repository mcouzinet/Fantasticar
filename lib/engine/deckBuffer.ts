import type { Deck } from './types'
import { kindCode } from './types'

/** Nombre total de cartes (somme des qty). */
export function deckTotal(deck: Deck): number {
  let n = 0
  for (const c of deck.cards) n += c.qty
  return n
}

/** Représente le deck comme un Int8Array de codes de kind (un slot par carte). */
export function buildDeckBuffer(deck: Deck): Int8Array {
  const total = deckTotal(deck)
  const buf = new Int8Array(total)
  let i = 0
  for (const c of deck.cards) {
    const code = kindCode[c.kind]
    for (let q = 0; q < c.qty; q++) buf[i++] = code
  }
  return buf
}
