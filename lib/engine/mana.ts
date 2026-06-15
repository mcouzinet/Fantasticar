/**
 * Modèle de mana et état de jeu minimal (spec §3.3).
 */

export type LandDrop = 'none' | 'land' | 'landT' | 'vein' | 'city'

export interface Battlefield {
  plain: number // terrains "land" prêts (1 mana chacun)
  tapped: number // "landT" posés ce tour (→ plain au tour suivant)
  city: boolean // City of Traitors en jeu (2 mana, sacrifiée si on pose un terrain)
  veins: number // Crystal Vein en jeu (2 chacun)
  rocks: number // cailloux produisant ce tour (1 mana chacun)
  pendingRocks: number // cailloux posés ce tour, prêts au tour suivant
}

export function emptyBattlefield(): Battlefield {
  return { plain: 0, tapped: 0, city: false, veins: 0, rocks: 0, pendingRocks: 0 }
}

/**
 * Mana disponible ce tour, selon le terrain posé (`drop`). Spec §3.3 :
 *   mana = plain + rocks + 2*veins
 *        + (city ? (on pose un terrain ? 0 : 2) : 0)   # poser un terrain sacrifie City
 *        + (drop == land ? 1 : 0)
 *        + (drop == vein ? 2 : 0)
 *        + (drop == city ? 2 : 0)
 */
export function computeMana(bf: Battlefield, drop: LandDrop): number {
  let mana = bf.plain + bf.rocks + 2 * bf.veins
  if (bf.city) mana += drop === 'none' ? 2 : 0
  if (drop === 'land') mana += 1
  else if (drop === 'vein') mana += 2
  else if (drop === 'city') mana += 2
  // 'landT' ne produit pas le tour posé ; 'none' n'ajoute rien.
  return mana
}

/** Applique la pose d'un terrain à l'état (un seul terrain par tour). */
export function applyDrop(bf: Battlefield, drop: LandDrop): void {
  switch (drop) {
    case 'land':
      bf.plain += 1
      bf.city = false // poser un terrain sacrifie une City en jeu
      break
    case 'landT':
      bf.tapped += 1
      bf.city = false
      break
    case 'vein':
      bf.veins += 1
      bf.city = false
      break
    case 'city':
      bf.city = true
      break
    case 'none':
      break
  }
}

/** Début de tour : les landT posés deviennent plain, les cailloux posés produisent. */
export function promote(bf: Battlefield): void {
  bf.plain += bf.tapped
  bf.tapped = 0
  bf.rocks += bf.pendingRocks
  bf.pendingRocks = 0
}
