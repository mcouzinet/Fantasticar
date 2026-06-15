import type { MulliganMode } from './types'
import type { Rng } from './prng'
import type { Hand } from './hand'
import type { ComboContext } from './combo'
import { bestCombo } from './combo'
import type { DevelopContext } from './develop'
import { develop } from './develop'
import { type Battlefield, promote } from './mana'
import { openingHand } from './mulligan'

export interface GameDeps {
  deckBuf: Int8Array
  rng: Rng
  hand: Hand // buffer réutilisé
  bf: Battlefield // buffer réutilisé
  comboCtx: ComboContext
  devCtx: DevelopContext
  mode: MulliganMode
  maxTurn: number
}

function resetBattlefield(bf: Battlefield): void {
  bf.plain = 0
  bf.tapped = 0
  bf.city = false
  bf.veins = 0
  bf.rockMana = 0
  bf.pendingRockMana = 0
  bf.suspend.length = 0
  bf.freeCasts = 0
}

/**
 * Joue une partie goldfish (spec §3.7). Renvoie le tour de combo (2..maxTurn) ou 0 (aucun).
 */
export function playGame(deps: GameDeps, onPlay: boolean): number {
  const { deckBuf, rng, hand, bf, comboCtx, devCtx, mode, maxTurn } = deps
  let pointer = openingHand(deckBuf, rng, mode, hand)
  resetBattlefield(bf)
  let fCast = false

  for (let t = 1; t <= maxTurn; t++) {
    if (t > 1 || !onPlay) {
      // Pioche (le deck ne s'épuise pas en ≤ 5 tours).
      if (pointer < deckBuf.length) hand[deckBuf[pointer++]!]!++
    }
    promote(bf) // les landT posés au tour précédent deviennent plain ; cailloux prêts

    if (t >= 2 && bestCombo(comboCtx, hand, bf, fCast)) return t

    fCast = develop(devCtx, hand, bf, fCast, maxTurn - t)
  }
  return 0
}
