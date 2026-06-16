/**
 * Modèle de mana et état de jeu minimal (spec §3.3) + production par caillou et Suspend.
 */

export type LandDrop =
  | 'none' | 'land' | 'landT' | 'vein' | 'city' | 'land0' | 'landGrant' | 'landScry' | 'scorched'
  | 'urzaMine' | 'urzaPP' | 'urzaTower' | 'planarNexus'

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
  scorched: number // Scorched Ruins en jeu (tape pour 4 chacun)
  // Tron : pièces en jeu. Nexus compte comme Mine/PP/Tower pour les conditions (mais tape 1).
  uMine: number
  uPP: number
  uTower: number
  uNexus: number // Planar Nexus (tous les types)
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
    scorched: 0,
    uMine: 0,
    uPP: 0,
    uTower: 0,
    uNexus: 0,
  }
}

/**
 * Mana du Tron pour des compteurs de pièces donnés. Planar Nexus (`nexus`) compte comme
 * Mine, Power-Plant ET Tower pour les conditions des autres pièces, mais ne tape que pour 1
 * (un type de terrain non-basique n'accorde pas l'aptitude, seulement le type).
 *   Mine/PP → 2 si le set est complet ; Tower → 3 ; sinon 1 chacun.
 */
/** Terrains dégagés à ~1 mana sacrifiables par Scorched Ruins (terrains simples + pièces Tron). */
export function scorchedSacPool(bf: Battlefield): number {
  return bf.plain + bf.uMine + bf.uPP + bf.uTower + bf.uNexus
}

export function tronMana(mine: number, pp: number, tower: number, nexus: number): number {
  const hasMine = mine + nexus > 0
  const hasPP = pp + nexus > 0
  const hasTower = tower + nexus > 0
  let t = nexus // Nexus : 1 chacun
  t += mine * (hasPP && hasTower ? 2 : 1)
  t += pp * (hasMine && hasTower ? 2 : 1)
  t += tower * (hasMine && hasPP ? 3 : 1)
  return t
}

/**
 * Mana disponible ce tour, selon le terrain posé (`drop`) et si c'est le tour du combo.
 *   mana = plain + rockMana + veins(1/tour) + bank + 4*scorched + 2*city + Tron + Maze
 *        + (drop == land/vein/landGrant/landScry ? 1) + (drop == city ? 2) + …
 *        + (combo ? +1 par vein (sacrifice de Crystal Vein pour {C}{C}))
 *
 * City of Traitors : 2 mana récurrents (tappée AVANT de poser le terrain qui la sacrifie ;
 * applyDrop met bf.city = false pour les tours suivants).
 * Crystal Vein : 1 mana/tour (récurrent), ou sacrifice pour 2 — ce burst (+1) n'est compté
 * que `combo=true` (le tour du combo), pas pendant la rampe où on la garde.
 */
export function computeMana(bf: Battlefield, drop: LandDrop, combo = false): number {
  let mana = bf.plain + bf.rockMana + bf.veins + bf.bank + 4 * bf.scorched // vein : 1/tour (récurrent)
  if (bf.city) mana += 2
  if (drop === 'land') mana += 1
  else if (drop === 'vein') mana += 1 // Crystal Vein tape 1 ce tour
  else if (drop === 'city') mana += 2
  else if (drop === 'landGrant') mana += 1 // donneur de type : tape pour 1 comme un terrain normal
  else if (drop === 'landScry') mana += 1 // terrain à scry/surveil : tape pour 1 comme un terrain normal
  else if (drop === 'scorched') mana += 4 - 2 // Scorched Ruins : tape pour 4, en sacrifiant 2 terrains dégagés (comptés dans bf.plain)
  // Tron : mana interdépendant (la pièce posée ce tour entre dégagée → comptée tout de suite).
  {
    const mine = bf.uMine + (drop === 'urzaMine' ? 1 : 0)
    const pp = bf.uPP + (drop === 'urzaPP' ? 1 : 0)
    const tower = bf.uTower + (drop === 'urzaTower' ? 1 : 0)
    const nexus = bf.uNexus + (drop === 'planarNexus' ? 1 : 0)
    mana += tronMana(mine, pp, tower, nexus)
  }
  // Terrains sans mana (Maze of Ith) : produisent 1 chacun SI un donneur de type est en jeu
  // (Yavimaya/Urborg les rend Forêt/Marais), y compris celui qu'on poserait ce tour-ci.
  const granted = bf.granters > 0 || drop === 'landGrant'
  if (granted) {
    mana += bf.maze
    if (drop === 'land0') mana += 1 // le Maze posé ce tour tape aussi
  }
  // Crystal Vein : sacrifice pour {C}{C} (one-shot) → +1 par vein, réservé au tour du combo
  // (pendant la rampe `combo=false`, on la garde et elle ne tape que pour 1).
  if (combo) mana += bf.veins + (drop === 'vein' ? 1 : 0)
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
    case 'scorched': {
      // sacrifie 2 terrains dégagés à ~1 mana : d'abord les terrains simples, puis les pièces
      // Tron si besoin (l'appelant garantit que le pool plain+Tron ≥ 2).
      let need = 2
      const fromPlain = Math.min(need, bf.plain)
      bf.plain -= fromPlain
      need -= fromPlain
      for (const k of ['uNexus', 'uMine', 'uPP', 'uTower'] as const) {
        while (need > 0 && bf[k] > 0) { bf[k] -= 1; need -= 1 }
      }
      bf.scorched += 1 // tape pour 4, dégagé dès ce tour
      bf.city = false
      break
    }
    case 'urzaMine': bf.uMine += 1; bf.city = false; break
    case 'urzaPP': bf.uPP += 1; bf.city = false; break
    case 'urzaTower': bf.uTower += 1; bf.city = false; break
    case 'planarNexus': bf.uNexus += 1; bf.city = false; break
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
