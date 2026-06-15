import type { Kind, SpellTable } from './types'
import { KINDS, kindCode } from './types'
import { FANTASTICAR_COST } from './spellTable'
import type { Hand } from './hand'
import { zerosInHand } from './hand'
import { applyDrop, computeMana, type Battlefield, type LandDrop } from './mana'

/** Cailloux précalculés (code, coût, coût net = cost-refund), triés net puis coût croissants. */
export interface DevelopContext {
  rockKinds: number[]
  rockCost: number[]
  rockNet: number[]
}

export function buildDevelopContext(table: SpellTable): DevelopContext {
  const rocks: { code: number; cost: number; net: number }[] = []
  for (const kind of KINDS as readonly Kind[]) {
    const p = table[kind]
    if (!p.producesMana) continue
    rocks.push({ code: kindCode[kind], cost: p.cost, net: p.cost - p.refund })
  }
  rocks.sort((a, b) => a.net - b.net || a.cost - b.cost) // rock1, rock2u, rock2t, rock3
  return {
    rockKinds: rocks.map((r) => r.code),
    rockCost: rocks.map((r) => r.cost),
    rockNet: rocks.map((r) => r.net),
  }
}

const LAND = kindCode.land
const LANDT = kindCode.landT
const VEIN = kindCode.vein
const CITY = kindCode.city

/** Choix de la pose de terrain (spec §3.5.1). */
function chooseDrop(hand: Hand, remaining: number): LandDrop {
  const hasLandT = hand[LANDT]! > 0
  const immediate = hand[LAND]! + hand[VEIN]! // terrains "intacts" gardés en réserve
  // Poser un landT maintenant si on garde assez de terrains intacts pour les tours restants.
  if (hasLandT && immediate >= remaining) return 'landT'
  if (hand[LAND]! > 0) return 'land'
  if (hand[VEIN]! > 0) return 'vein'
  if (hand[LANDT]! > 0) return 'landT'
  if (hand[CITY]! > 0) return 'city'
  return 'none'
}

function removeDrop(hand: Hand, drop: LandDrop): void {
  switch (drop) {
    case 'land': hand[LAND]!--; break
    case 'landT': hand[LANDT]!--; break
    case 'vein': hand[VEIN]!--; break
    case 'city': hand[CITY]!--; break
    case 'none': break
  }
}

/**
 * Développe (pré-cast) sur un tour SANS combo (spec §3.5). Mute `hand` et `bf`,
 * renvoie le nouvel état `fCast` (Fantasticar en jeu ?).
 *
 * @param remaining nb de tours restants APRÈS celui-ci (maxTurn - t)
 */
export function develop(
  ctx: DevelopContext,
  hand: Hand,
  bf: Battlefield,
  fCast: boolean,
  remaining: number,
): boolean {
  // 1. Pose de terrain (priorité).
  const drop = chooseDrop(hand, remaining)
  let pool = computeMana(bf, drop)
  removeDrop(hand, drop)
  applyDrop(bf, drop)

  // 2. Pré-cast du Fantasticar si on prépare le tour combo (≥ 3 zéros en réserve).
  if (!fCast && pool >= FANTASTICAR_COST && zerosInHand(hand) >= 3) {
    pool -= FANTASTICAR_COST
    fCast = true
  }

  // 3. Pré-cast des cailloux abordables, du moins cher (net) au plus cher.
  for (let i = 0; i < ctx.rockKinds.length; i++) {
    const code = ctx.rockKinds[i]!
    const cost = ctx.rockCost[i]!
    const net = ctx.rockNet[i]!
    while (hand[code]! > 0 && pool >= cost) {
      hand[code]!--
      pool -= net
      bf.pendingRocks += 1 // produit à partir du tour suivant
    }
  }

  // 4. Re-tenter le pré-cast du Fantasticar avec le mana restant (advance le commander).
  if (!fCast && pool >= FANTASTICAR_COST) {
    pool -= FANTASTICAR_COST
    fCast = true
  }

  return fCast
}
