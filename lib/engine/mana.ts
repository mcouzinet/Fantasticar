/**
 * Modèle de mana et état de jeu minimal (spec §3.3) + production par caillou et Suspend.
 */

export type LandDrop = 'none' | 'land' | 'landT' | 'vein' | 'city' | 'land0' | 'landGrant' | 'landScry'

/** Une carte en exil suspendu : se résout quand `turnsLeft` atteint 0. */
export interface SuspendTimer {
  turnsLeft: number
  tapsFor: number // mana pérenne qu'elle ajoute en entrant
  combo: boolean // compte-t-elle comme un sort non-créature lancé le tour de résolution ?
}

export interface Battlefield {
  plain: number // terrains "land" prêts (1 mana chacun)
  tapped: number // "landT" posés ce tour (→ plain au tour suivant)
  city: boolean // City of Traitors en jeu (2 mana, sacrifiée si on pose un terrain)
  veins: number // Crystal Vein en jeu (2 chacun)
  rockMana: number // mana pérenne total des cailloux produisant ce tour
  pendingRockMana: number // mana pérenne arrivant au tour suivant
  suspend: SuspendTimer[] // cartes en exil suspendu
  freeCasts: number // sorts non-créature lancés gratuitement ce tour (sorties de suspend)
  maze: number // terrains "land0" en jeu (Maze of Ith) : 0 mana, sauf donneur de type
  granters: number // terrains donneurs de type en jeu (Yavimaya/Urborg) : rendent les Maze productifs
  scry: number // filtres scry/surveil 1 en attente de résolution (déclenchés ce tour, résolus dans game.ts)
  bank: number // mana banqué disponible CE tour (Jeweled Amulet), one-shot
  pendingBank: number // mana banqué ce tour, disponible au tour suivant
}

export function emptyBattlefield(): Battlefield {
  return {
    plain: 0,
    tapped: 0,
    city: false,
    veins: 0,
    rockMana: 0,
    pendingRockMana: 0,
    suspend: [],
    freeCasts: 0,
    maze: 0,
    granters: 0,
    scry: 0,
    bank: 0,
    pendingBank: 0,
  }
}

/**
 * Mana disponible ce tour, selon le terrain posé (`drop`). Spec §3.3 (rockMana = somme
 * de la production des cailloux en jeu) :
 *   mana = plain + rockMana + 2*veins
 *        + (city ? (on pose un terrain ? 0 : 2) : 0)
 *        + (drop == land ? 1 : 0) + (drop == vein ? 2 : 0) + (drop == city ? 2 : 0)
 */
export function computeMana(bf: Battlefield, drop: LandDrop): number {
  let mana = bf.plain + bf.rockMana + 2 * bf.veins + bf.bank
  if (bf.city) mana += drop === 'none' ? 2 : 0
  if (drop === 'land') mana += 1
  else if (drop === 'vein') mana += 2
  else if (drop === 'city') mana += 2
  else if (drop === 'landGrant') mana += 1 // donneur de type : tape pour 1 comme un terrain normal
  else if (drop === 'landScry') mana += 1 // terrain à scry/surveil : tape pour 1 comme un terrain normal
  // Terrains sans mana (Maze of Ith) : produisent 1 chacun SI un donneur de type est en jeu
  // (Yavimaya/Urborg les rend Forêt/Marais), y compris celui qu'on poserait ce tour-ci.
  const granted = bf.granters > 0 || drop === 'landGrant'
  if (granted) {
    mana += bf.maze
    if (drop === 'land0') mana += 1 // le Maze posé ce tour tape aussi
  }
  return mana
}

/** Applique la pose d'un terrain à l'état (un seul terrain par tour). */
export function applyDrop(bf: Battlefield, drop: LandDrop): void {
  switch (drop) {
    case 'land':
      bf.plain += 1
      bf.city = false
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
    case 'land0':
      bf.maze += 1
      bf.city = false
      break
    case 'landGrant':
      bf.plain += 1 // tape pour 1 dès le tour suivant (comme un terrain normal)
      bf.granters += 1
      bf.city = false
      break
    case 'landScry':
      bf.plain += 1 // tape pour 1 comme un terrain normal
      bf.scry += 1 // déclenche un filtre scry/surveil 1 (résolu après le développement)
      bf.city = false
      break
    case 'none':
      break
  }
}

/**
 * Début de tour (entretien) : les landT deviennent plain, les cailloux posés produisent,
 * et les cartes suspendues perdent un marqueur — celles qui atteignent 0 se résolvent
 * (entrent comme permanent producteur + comptent comme un sort gratuit ce tour).
 */
export function promote(bf: Battlefield): void {
  bf.plain += bf.tapped
  bf.tapped = 0
  bf.rockMana += bf.pendingRockMana
  bf.pendingRockMana = 0
  // mana banqué (Jeweled Amulet) : dispo ce tour-ci, one-shot (perdu s'il n'est pas rechargé).
  bf.bank = bf.pendingBank
  bf.pendingBank = 0

  bf.freeCasts = 0
  for (const s of bf.suspend) {
    if (s.turnsLeft > 0) {
      s.turnsLeft -= 1
      if (s.turnsLeft === 0) {
        bf.rockMana += s.tapsFor // entre, tape ce tour, reste en jeu (pérenne)
        if (s.combo) bf.freeCasts += 1 // lancé gratuitement ce tour → compte pour le combo
      }
    }
  }
}
