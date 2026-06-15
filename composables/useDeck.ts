import { REFERENCE_DECK } from '~/lib/engine/referenceDeck'
import type { Card, Deck, Kind } from '~/lib/engine/types'
import { deckStats, GROUPS, type GroupId } from '~/lib/engine/deckStats'
import { KIND_META } from '~/lib/ui/kinds'
import { fromJson, parseMoxfield, toJson, toMoxfieldText } from '~/lib/io/deckIo'

// v2 : nouvelle decklist de référence (invalide le cache v1 des sessions précédentes).
const STORAGE_KEY = 'fantasticar.deck.v2'

function clone(d: Deck): Deck {
  return { cards: d.cards.map((c) => ({ ...c })) }
}

/** Kind représentatif pour l'ajout générique via les steppers de catégorie. */
const GROUP_PRIMARY: Record<GroupId, Kind> = {
  lands: 'land',
  zeros: 'zero',
  rocks: 'rock2u',
  ones: 'one',
  twos: 'two',
  creatures: 'creature',
  others: 'o3',
}

const KIND_TO_GROUP: Record<Kind, GroupId> = (() => {
  const m = {} as Record<Kind, GroupId>
  for (const g of GROUPS) for (const k of g.kinds) m[k] = g.id
  return m
})()

let addCounter = 0

export function useDeck() {
  const baseline = useState<Deck>('deck:baseline', () => clone(REFERENCE_DECK))
  const draft = useState<Deck>('deck:draft', () => clone(REFERENCE_DECK))
  const unresolved = useState<{ name: string; qty: number }[]>('deck:unresolved', () => [])

  const draftStats = computed(() => deckStats(draft.value))
  const baselineStats = computed(() => deckStats(baseline.value))
  const isDirty = computed(
    () => JSON.stringify(draft.value.cards) !== JSON.stringify(baseline.value.cards),
  )

  function persist() {
    if (!import.meta.client) return
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ baseline: baseline.value, draft: draft.value }),
      )
    } catch {
      /* quota / mode privé : on ignore */
    }
  }

  function restore() {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const data = JSON.parse(raw) as { baseline?: Deck; draft?: Deck }
      if (data.baseline?.cards) baseline.value = clone(data.baseline)
      if (data.draft?.cards) draft.value = clone(data.draft)
    } catch {
      /* données corrompues : on garde la référence */
    }
  }

  // — Édition du draft —
  function cut(index: number) {
    draft.value.cards.splice(index, 1)
    persist()
  }

  function add(name: string, kind: Kind) {
    const finalName = name.trim() || `${KIND_META[kind].full} #${++addCounter}`
    draft.value.cards.push({ name: finalName, kind, qty: 1 })
    persist()
  }

  function swap(index: number, name: string, kind: Kind) {
    if (index >= 0 && index < draft.value.cards.length) draft.value.cards.splice(index, 1)
    add(name, kind)
  }

  /** Retire un exemplaire dont le kind appartient au groupe ; renvoie true si retiré. */
  function removeOneFromGroup(groupId: GroupId): boolean {
    for (let i = draft.value.cards.length - 1; i >= 0; i--) {
      if (KIND_TO_GROUP[draft.value.cards[i]!.kind] === groupId) {
        draft.value.cards.splice(i, 1)
        return true
      }
    }
    return false
  }

  /** Stepper §4.3 : +delta sur une catégorie, compensé par −delta sur la contrepartie. */
  function stepCategory(groupId: GroupId, delta: number, counterpart: GroupId) {
    if (groupId === counterpart) return
    if (delta > 0) {
      // +delta sur groupId, on retire delta de la contrepartie pour garder le total.
      let moved = 0
      for (let i = 0; i < delta; i++) if (removeOneFromGroup(counterpart)) moved++
      for (let i = 0; i < moved; i++) {
        draft.value.cards.push({
          name: `${KIND_META[GROUP_PRIMARY[groupId]].full} #${++addCounter}`,
          kind: GROUP_PRIMARY[groupId],
          qty: 1,
        })
      }
    } else if (delta < 0) {
      stepCategory(counterpart, -delta, groupId)
      return
    }
    persist()
  }

  function setDraftAsBaseline() {
    baseline.value = clone(draft.value)
    persist()
  }

  function resetDraft() {
    draft.value = clone(baseline.value)
    persist()
  }

  function resetToReference() {
    baseline.value = clone(REFERENCE_DECK)
    draft.value = clone(REFERENCE_DECK)
    unresolved.value = []
    persist()
  }

  // — Import / export —
  function importMoxfield(text: string) {
    const parsed = parseMoxfield(text, draft.value)
    draft.value = { cards: parsed.cards }
    unresolved.value = parsed.unresolved
    persist()
  }

  function importJson(text: string) {
    draft.value = fromJson(text)
    unresolved.value = []
    persist()
  }

  function resolveUnresolved(name: string, kind: Kind) {
    draft.value.cards.push({ name, kind, qty: 1 })
    unresolved.value = unresolved.value.filter((u) => u.name !== name)
    persist()
  }

  function dismissUnresolved(name: string) {
    unresolved.value = unresolved.value.filter((u) => u.name !== name)
  }

  const exportText = () => toMoxfieldText(draft.value)
  const exportJson = () => toJson(draft.value)

  return {
    baseline,
    draft,
    unresolved,
    draftStats,
    baselineStats,
    isDirty,
    restore,
    cut,
    add,
    swap,
    stepCategory,
    setDraftAsBaseline,
    resetDraft,
    resetToReference,
    importMoxfield,
    importJson,
    resolveUnresolved,
    dismissUnresolved,
    exportText,
    exportJson,
  }
}
