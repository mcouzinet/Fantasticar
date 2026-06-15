import { REFERENCE_DECK } from '../engine/referenceDeck'
import { KINDS } from '../engine/types'
import type { Card, Deck, Kind } from '../engine/types'

const KIND_SET = new Set<string>(KINDS)

function norm(name: string): string {
  return name.trim().toLowerCase()
}

/** Index nom → kind construit depuis la liste de référence (source de vérité §3.2). */
function buildIndex(extra?: Deck): Record<string, Kind> {
  const idx: Record<string, Kind> = {}
  for (const c of REFERENCE_DECK.cards) idx[norm(c.name)] = c.kind
  if (extra) for (const c of extra.cards) idx[norm(c.name)] = c.kind
  return idx
}

export interface ParsedImport {
  cards: Card[]
  /** Noms inconnus à catégoriser à la main (spec §4.4). */
  unresolved: { name: string; qty: number }[]
}

const SET_TAIL = /\s*\([^)]*\)\s*\S*\s*$/ // " (SET) 123" en fin de ligne
const FOIL_TAIL = /\s*\*[a-z]\*\s*$/i // marqueur foil "*F*"

/**
 * Parse une liste au format Moxfield : lignes `1 Nom (SET) NUM`. Les lignes vides,
 * commentaires (`#`) et tags (`#!`) sont ignorés. Les noms inconnus tombent dans
 * `unresolved`.
 */
export function parseMoxfield(text: string, extra?: Deck): ParsedImport {
  const idx = buildIndex(extra)
  const cards: Card[] = []
  const unresolved: { name: string; qty: number }[] = []

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith('#') || line.startsWith('//')) continue
    const m = /^(\d+)\s*[xX]?\s+(.+)$/.exec(line)
    const qty = m ? Math.max(1, parseInt(m[1]!, 10)) : 1
    let name = (m ? m[2]! : line).replace(SET_TAIL, '').replace(FOIL_TAIL, '').trim()
    if (!name) continue
    const kind = idx[norm(name)]
    if (kind) {
      for (let i = 0; i < qty; i++) cards.push({ name, kind, qty: 1 })
    } else {
      unresolved.push({ name, qty })
    }
  }
  return { cards, unresolved }
}

/** Export texte façon Moxfield (une ligne `1 Nom` par exemplaire). */
export function toMoxfieldText(deck: Deck): string {
  return deck.cards.map((c) => `${c.qty} ${c.name}`).join('\n')
}

/** Export JSON interne (avec les kinds), pour versionner (spec §4.4). */
export function toJson(deck: Deck): string {
  return JSON.stringify(
    { cards: deck.cards.map((c) => ({ name: c.name, kind: c.kind, qty: c.qty })) },
    null,
    2,
  )
}

export function fromJson(text: string): Deck {
  const data = JSON.parse(text) as { cards?: Array<{ name: string; kind: string; qty?: number }> }
  if (!data || !Array.isArray(data.cards)) throw new Error('JSON invalide : champ "cards" attendu.')
  const cards: Card[] = data.cards.map((c) => {
    if (!KIND_SET.has(c.kind)) throw new Error(`Kind inconnu : "${c.kind}" (${c.name}).`)
    return { name: String(c.name), kind: c.kind as Kind, qty: c.qty && c.qty > 0 ? c.qty : 1 }
  })
  return { cards }
}
