import type { Deck, Kind } from './types'
import { KINDS } from './types'

export type GroupId =
  | 'lands'
  | 'zeros'
  | 'rocks'
  | 'rocksTapped'
  | 'ones'
  | 'twos'
  | 'creatures'
  | 'others'

export interface GroupDef {
  id: GroupId
  label: string
  kinds: Kind[]
}

/** Regroupement métier pour l'affichage (spec §4.1). */
export const GROUPS: GroupDef[] = [
  { id: 'lands', label: 'Terrains', kinds: ['land', 'landT', 'city', 'vein', 'land0', 'landGrant', 'landScry', 'scorched', 'urzaMine', 'urzaPP', 'urzaTower', 'planarNexus', 'cloud', 'gemstone', 'cloudpost', 'locus'] },
  { id: 'zeros', label: 'Sorts à 0', kinds: ['zero', 'amulet', 'bauble'] },
  { id: 'rocks', label: 'Cailloux', kinds: ['rock2u', 'rock3', 'basalt', 'mightstone', 'dynamo', 'sol'] },
  { id: 'rocksTapped', label: 'Cailloux engagés', kinds: ['rock2t'] },
  { id: 'ones', label: 'Sorts à 1', kinds: ['one', 'chrom'] },
  { id: 'twos', label: 'Sorts à 2', kinds: ['two'] },
  { id: 'creatures', label: 'Créatures', kinds: ['creature'] },
  { id: 'others', label: 'Autres', kinds: ['o3', 'o4', 'o5', 'o6', 'o7'] },
]

export interface DeckStats {
  total: number
  byKind: Record<Kind, number>
  byGroup: Record<GroupId, number>
}

export function deckStats(deck: Deck): DeckStats {
  const byKind = Object.fromEntries(KINDS.map((k) => [k, 0])) as Record<Kind, number>
  for (const c of deck.cards) byKind[c.kind] += c.qty

  const byGroup = {} as Record<GroupId, number>
  let total = 0
  for (const g of GROUPS) {
    const n = g.kinds.reduce((s, k) => s + byKind[k], 0)
    byGroup[g.id] = n
    total += n
  }
  return { total, byKind, byGroup }
}
