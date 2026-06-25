import type { MulliganMode } from './types'
import { kindCode } from './types'
import type { Rng } from './prng'
import type { Hand } from './hand'
import type { ComboContext } from './combo'
import { bestCombo } from './combo'
import type { DevelopContext } from './develop'
import { develop, scryKeep } from './develop'
import { type Battlefield, promote } from './mana'
import { openingHand } from './mulligan'

const GEM = kindCode.gemstone
const LAND = kindCode.land

// Carte exilée par Gemstone Caverns (free-start) : on sacrifie la moins utile au combo.
// Ordre = du plus jetable au plus précieux ; on exile le premier kind présent en main.
const EXILE_ORDER: number[] = [
  kindCode.creature, kindCode.o7, kindCode.o6, kindCode.o5, kindCode.o4, kindCode.o3,
  kindCode.mightstone, kindCode.land0, kindCode.sol, kindCode.dynamo, kindCode.rock3,
  kindCode.two, kindCode.landT, kindCode.one, kindCode.chrom,
  kindCode.rock2t, kindCode.rock2u, kindCode.basalt,
  kindCode.landScry, kindCode.landGrant, kindCode.land,
  kindCode.urzaMine, kindCode.urzaPP, kindCode.urzaTower, kindCode.planarNexus,
  kindCode.scorched, kindCode.vein, kindCode.city, kindCode.cloud,
  kindCode.zero, kindCode.amulet,
]
function exileWorst(hand: Hand): void {
  for (const c of EXILE_ORDER) {
    if (hand[c]! > 0) { hand[c]!--; return }
  }
}

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

/** Gemstone Caverns : free-start sur la draw (démarre en jeu + exil), puis le reste = terrain normal. */
export function gemstoneOpening(hand: Hand, bf: Battlefield, onPlay: boolean): void {
  if (!onPlay && hand[GEM]! > 0) {
    hand[GEM]!-- // ce Gemstone part sur le champ de bataille
    bf.plain += 1 // en jeu dès le départ (dégagé, tape pour 1)
    exileWorst(hand) // exil d'une carte de la main
  }
  hand[LAND]! += hand[GEM]! // tout Gemstone restant = terrain normal
  hand[GEM]! = 0
}

export function resetBattlefield(bf: Battlefield): void {
  bf.plain = 0
  bf.tapped = 0
  bf.city = false
  bf.veins = 0
  bf.rockMana = 0
  bf.pendingRockMana = 0
  bf.suspend.length = 0
  bf.freeCasts = 0
  bf.maze = 0
  bf.granters = 0
  bf.scry = 0
  bf.bank = 0
  bf.pendingBank = 0
  bf.scorched = 0
  bf.uMine = 0
  bf.uPP = 0
  bf.uTower = 0
  bf.uNexus = 0
  bf.cloud = 0
  bf.cloudTapped = 0
  bf.cloudpost = 0
  bf.cloudpostTapped = 0
  bf.locus = 0
}

/**
 * Joue une partie goldfish (spec §3.7). Renvoie le tour de combo (2..maxTurn) ou 0 (aucun).
 */
export function playGame(deps: GameDeps, onPlay: boolean): number {
  const { deckBuf, rng, hand, bf, comboCtx, devCtx, mode, maxTurn } = deps
  let pointer = openingHand(deckBuf, rng, mode, hand)
  resetBattlefield(bf)
  gemstoneOpening(hand, bf, onPlay) // free-start de Gemstone Caverns sur la draw

  let fCast = false

  for (let t = 1; t <= maxTurn; t++) {
    if (t > 1 || !onPlay) {
      // Pioche (le deck ne s'épuise pas en ≤ 5 tours) ; un Gemstone pioché = simple terrain.
      if (pointer < deckBuf.length) {
        const code = deckBuf[pointer++]!
        hand[code === GEM ? LAND : code]!++
      }
    }
    promote(bf) // les landT posés au tour précédent deviennent plain ; cailloux prêts

    if (t >= 2 && bestCombo(comboCtx, hand, bf, fCast)) return t

    fCast = develop(devCtx, hand, bf, fCast, maxTurn - t)

    // Résolution des scry/surveil 1 déclenchés ce tour (terrains landScry posés au développement).
    // On regarde la prochaine carte ; si elle n'aide pas la main, on la retire du dessus (bottom/
    // cimetière) → la prochaine pioche tombe sur la carte suivante. Pas d'anticipation : 1 carte vue.
    while (bf.scry > 0 && pointer < deckBuf.length) {
      if (!scryKeep(hand, deckBuf[pointer]!)) pointer++
      bf.scry -= 1
    }
    bf.scry = 0
  }
  return 0
}
