import LZString from 'lz-string'
import { KINDS } from '../engine/types'
import type { Deck, Kind } from '../engine/types'

const KIND_SET = new Set<string>(KINDS)

/**
 * Encode un deck en chaîne URL-safe compressée (forme compacte [nom, kind] + lz-string).
 * Sert au partage par URL (opt-in) — tout reste côté client, rien n'est envoyé.
 */
export function encodeDeck(deck: Deck): string {
  const payload = deck.cards.map((c) => [c.name, c.kind] as const)
  return LZString.compressToEncodedURIComponent(JSON.stringify(payload))
}

/** Décode une chaîne de partage ; renvoie null si invalide. */
export function decodeDeck(code: string): Deck | null {
  try {
    const json = LZString.decompressFromEncodedURIComponent(code)
    if (!json) return null
    const arr = JSON.parse(json)
    if (!Array.isArray(arr)) return null
    const cards = arr
      .filter((x): x is [string, string] => Array.isArray(x) && typeof x[0] === 'string' && KIND_SET.has(x[1]))
      .map(([name, kind]) => ({ name, kind: kind as Kind, qty: 1 }))
    return cards.length ? { cards } : null
  } catch {
    return null
  }
}
