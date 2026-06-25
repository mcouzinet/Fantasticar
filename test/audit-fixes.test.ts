import { describe, it, expect } from 'vitest'
import { kindCode, type Kind } from '../lib/engine/types'
import { newHand, type Hand } from '../lib/engine/hand'
import { openingHand } from '../lib/engine/mulligan'
import { gemstoneOpening } from '../lib/engine/game'
import { emptyBattlefield, promote } from '../lib/engine/mana'
import { mulberry32 } from '../lib/engine/prng'
import { DEFAULT_SPELL_TABLE } from '../lib/engine/spellTable'
import { buildComboContext, bestCombo } from '../lib/engine/combo'
import { buildDevelopContext, develop } from '../lib/engine/develop'

// Régressions pour les deux bugs mécaniques trouvés par l'audit du moteur (vérifiés en exécutant
// le code, pas par connaissance de cartes) :
//  - MULL : bottomCards ne savait enfouir que landT/land/vein → gardait une main > N après mulligan
//           pour les catégories non listées (landScry, Tron, gemstone, cloud/cloudpost/locus, City,
//           amulet, basalt…). Invariant restauré : une main mulliganée-à-N fait exactement N cartes.
//  - SG   : le free-start de Gemstone Caverns (sur la draw) doit exiler exactement une carte ;
//           EXILE_ORDER omettait bauble/locus/cloudpost → exil no-op → sur-comptage (pièce gardée).

function deckOf(spec: Partial<Record<Kind, number>>): Int8Array {
  const arr: number[] = []
  for (const [k, n] of Object.entries(spec)) for (let i = 0; i < n!; i++) arr.push(kindCode[k as Kind])
  return Int8Array.from(arr)
}
function handSize(h: Hand): number {
  let s = 0
  for (let i = 0; i < h.length; i++) s += h[i]!
  return s
}

describe('MULL fix — bottomCards retire exactement n (catégories non listées)', () => {
  // Toutes ces catégories n'étaient enfouies par AUCUNE passe de l'ancien bottomCards.
  const floodKinds: Kind[] = [
    'landScry', 'gemstone', 'urzaMine', 'urzaPP', 'urzaTower', 'planarNexus',
    'cloud', 'cloudpost', 'locus', 'scorched', 'city', 'amulet', 'basalt',
  ]
  it('une main inondée d’une catégorie non listée est trimmée à 5 (London), jamais gardée à 7', () => {
    const hand = newHand()
    for (const k of floodKinds) {
      const deck = deckOf({ [k]: 30 }) // 0 zero → London mulligan jusqu’à 5 (mull=2 force la garde)
      for (let seed = 1; seed <= 30; seed++) {
        openingHand(deck.slice(), mulberry32(seed), 'london', hand)
        expect(handSize(hand), `kind=${k} seed=${seed}`).toBeLessThanOrEqual(5)
      }
    }
  })

  it('deck zéro-lourd qui mulligane : on enfouit le landScry surplus AVANT les sorts à 0', () => {
    // landScry:5 + zero:25 → la plupart des openers ont < 2 terrains → échouent keepLondon@7/@6
    // → mull=2, on garde 5. Le fix doit enfouir le landScry (non listé) en priorité sur les zeros :
    // toute main gardée à 5 contenant un landScry impliquerait, sous l'ancien code, des zeros jetés.
    const deck = deckOf({ landScry: 5, zero: 25 })
    const hand = newHand()
    let mulledHands = 0
    for (let seed = 1; seed <= 200; seed++) {
      openingHand(deck.slice(), mulberry32(seed), 'london', hand)
      const size = handSize(hand)
      expect(size).toBeLessThanOrEqual(7)
      if (size === 5) {
        mulledHands++
        // Invariant du fix : sur une main mulliganée, on n'a pas jeté de zero tant qu'un landScry
        // (carte la moins utile au combo ici) restait enfouissable → 5 zeros si pas de land gardé.
        const zeros = hand[kindCode.zero]!
        const lands = hand[kindCode.landScry]!
        expect(zeros + lands).toBe(5)
        // l'ancien code gardait le landScry et jetait des zeros ; le fix garde le maximum de zeros.
        if (lands === 0) expect(zeros).toBe(5)
      }
    }
    expect(mulledHands).toBeGreaterThan(0) // le scénario de bottoming est bien exercé
  })
})

describe('SG fix — free-start Gemstone exile toujours exactement une carte', () => {
  it('exile bauble / locus / cloudpost quand c’est la seule autre carte (sur la draw)', () => {
    for (const k of ['bauble', 'locus', 'cloudpost'] as Kind[]) {
      const hand = newHand()
      hand[kindCode.gemstone] = 1
      hand[kindCode[k]] = 1
      const bf = emptyBattlefield()
      gemstoneOpening(hand, bf, false) // onPlay=false → free-start
      expect(bf.plain, `kind=${k}`).toBe(1) // Gemstone démarre en jeu
      expect(handSize(hand), `kind=${k} (exil obligatoire)`).toBe(0) // l’autre carte est exilée
    }
  })

  it('sur le play : Gemstone = terrain normal, pas de free-start ni d’exil', () => {
    const hand = newHand()
    hand[kindCode.gemstone] = 1
    hand[kindCode.bauble] = 1
    const bf = emptyBattlefield()
    gemstoneOpening(hand, bf, true) // onPlay=true
    expect(bf.plain).toBe(0)
    expect(hand[kindCode.land]).toBe(1) // Gemstone → terrain normal
    expect(hand[kindCode.bauble]).toBe(1) // rien exilé
  })
})

describe('DH fix — develop() ne pré-lance pas un caillou NÉCESSAIRE comme rampe', () => {
  const ctx = buildComboContext(DEFAULT_SPELL_TABLE)
  const devCtx = buildDevelopContext(DEFAULT_SPELL_TABLE)

  // Goldfish ISOLÉ (main fixe, sans pioche ni scry) : éprouve la séquence de develop() seule.
  function comboTurn(spec: Partial<Record<Kind, number>>, maxTurn = 6): number {
    const hand = newHand()
    for (const [k, n] of Object.entries(spec)) hand[kindCode[k as Kind]] = n!
    const bf = emptyBattlefield()
    let fCast = false
    for (let t = 1; t <= maxTurn; t++) {
      promote(bf)
      if (t >= 2 && bestCombo(ctx, hand, bf, fCast)) return t
      fCast = develop(devCtx, hand, bf, fCast, maxTurn - t)
    }
    return 0
  }

  it('garde le caillou quand il est l’une des `need` pièces (combo au lieu de jamais)', () => {
    // rock2u + 2 zero = 3 sorts de combo = need : le caillou ne doit PAS être dilapidé en rampe.
    // L'ancien moteur le pré-lançait → 2 zeros < need → jamais de combo (turn 0).
    expect(comboTurn({ land: 4, rock2u: 1, zero: 2 })).toBe(4)
    expect(comboTurn({ land: 5, rock3: 1, zero: 2 })).toBe(5)
  })

  it('contrôle : un caillou EXCÉDENTAIRE est toujours pré-lancé comme rampe (combo inchangé)', () => {
    // 3 zeros = need déjà atteint → rock2u est surplus → pré-lancé comme avant, combo au plus tôt.
    expect(comboTurn({ land: 3, rock2u: 1, zero: 3 })).toBe(3)
  })
})
