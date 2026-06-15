# Fantasticar Combo Lab — Spécifications

Application web pour visualiser une decklist Duel Commander construite autour de
**The Fantasticar**, calculer la probabilité de déclencher le combo (sacrifier le
véhicule en lançant 4 sorts non-créature dans le tour) et **mesurer l'impact d'un
changement de carte** sur cette probabilité.

> Statut : spec fonctionnelle + spec du moteur. Pas d'implémentation.
> Stack cible : Nuxt 3 / Vue 3, 100 % client (aucun backend), calcul en Web Worker.

---

## 1. Contexte & objectif

The Fantasticar : *« À chaque fois que vous lancez votre quatrième sort non-créature
dans un tour, vous pouvez sacrifier The Fantasticar pour créer quatre jetons 4/4. »*
Le véhicule lui-même coûte 3 et compte comme le 1ᵉʳ sort. Le plan du deck est donc :
**Fantasticar (sort 1) + 3 autres sorts non-créature le même tour**, le plus tôt
possible (cible T3).

L'app doit répondre à trois besoins :

1. **Voir** la decklist structurée et ses agrégats (nb de lands, de sorts à 0, de
   cailloux, etc.).
2. **Connaître** la proba de combo par tour (T2→T5), en *on the play* / *on the
   draw*, selon le mode de mulligan.
3. **Tester un changement** (couper une carte / en ajouter une) et voir le **delta**
   sur la sortie, avant/après.

---

## 2. Périmètre

**Inclus**
- Decklist éditable (99 cartes) avec catégorisation mécanique.
- Simulation Monte Carlo *goldfish* tour par tour, côté client.
- Stats cumulées T2→T5, axes *play/draw* × mode de mulligan.
- Mode what-if avec comparaison référence ↔ variante (deltas).
- Import/export de la liste (format texte Moxfield + JSON interne).

**Exclus (non-goals)**
- Pas de modélisation de l'adversaire (counter, removal, pression de vie).
- Pas de séquençage « optimal » prouvé : le moteur applique des heuristiques
  raisonnables (cf. §3.5), pas un solveur exhaustif de lignes.
- Pas de base de données de cartes externe (Scryfall…) : la catégorisation est
  portée par la donnée locale (cf. §3.2). Un enrichissement Scryfall est une
  évolution possible, pas une exigence.
- Pas de compte utilisateur ni de persistance serveur (localStorage suffit).

---

## 3. Modèle de simulation (cœur métier)

Le moteur est **déterministe à seed donné** et **framework-agnostic** (JS pur,
exécuté dans un worker). C'est la partie à spécifier le plus précisément : l'UI est
secondaire.

### 3.1 Taxonomie des cartes (`kind`)

Chaque carte porte un `kind` qui encode son comportement mécanique. Une carte = une
seule catégorie.

| `kind`      | Sens                          | Mana / tour | Combo ? | Coût | Remb.* |
|-------------|-------------------------------|-------------|---------|------|--------|
| `land`      | Terrain non engagé            | +1          | non     | —    | —      |
| `landT`     | Terrain engagé (tapped)       | 0 le tour posé, +1 ensuite | non | — | — |
| `city`      | City of Traitors              | +2, **sacrifié si on pose un autre terrain** | non | — | — |
| `vein`      | Crystal Vein (sac one-shot)   | +2 le tour où on la sacrifie | non | — | — |
| `zero`      | Sort non-créature coût 0      | —           | **oui** | 0    | 0      |
| `rock1`     | Fractured Powerstone          | +1 (dès le tour) | **oui** | 1 | 1   |
| `rock2u`    | Caillou coût 2, arrive prêt   | +1          | **oui** | 2    | 1      |
| `rock2t`    | Caillou coût 2, arrive engagé | +1 (tour suivant) | **oui** | 2 | 0 |
| `rock3`     | Solar Transformer             | +1          | **oui** | 3    | 1      |
| `one`       | Sort non-créature coût 1      | —           | **oui** | 1    | 0      |
| `chrom`     | Chromatic Sphere/Star         | — (sac → +1 mana + pioche) | **oui** | 1 | 1 |
| `two`       | Sort non-créature coût 2      | —           | **oui** | 2    | 0      |
| `o3`…`o7`   | Autre sort non-créature 3→7   | —           | **oui** | 3→7  | 0      |
| `creature`  | Créature                      | —           | **non** | —    | —      |

\* *Remboursement* = mana rendu **le tour même** où la carte est lancée pendant le
combo (un caillou payé 2 et tapé pour 1 a un coût net de 1 ; un Chromatic se
sacrifie → net 0). Sert au comptage du combo (§3.4).

**Définition « sort de combo »** : tout `kind` dont la colonne « Combo ? » vaut oui.
Il faut en lancer **4** dans le tour (Fantasticar compris). Les `creature` et tous
les terrains ne comptent jamais.

### 3.2 Mapping de la decklist (99 cartes)

Donnée de référence (modifiable par l'utilisateur via l'éditeur). Total = 99.

```yaml
# LANDS (38)
land:   [Abstergo Entertainment, Blast Zone, Command Beacon, Conduit Pylons,
         Crystal Grotto, Darksteel Citadel, Deserted Temple, Dust Bowl,
         Gallifrey Council Chamber, Gemstone Caverns, Inventors' Fair,
         Mishra's Factory, Mishra's Foundry, Mutavault, Planar Nexus,
         Radiant Fountain, Rishadan Port, Scavenger Grounds, Scorched Ruins,
         Snow-Covered Wastes, Talon Gates of Madara, The Grey Havens,
         Thespian's Stage, Urza's Cave, Urza's Mine, Urza's Power Plant,
         Urza's Tower, Urza's Saga, Urza's Workshop, Vesuva, War Room,
         Zhalfirin Void]                                          # 32
landT:  [Arid Archway, Guildless Commons, Echoing Deeps, Hidden Grotto]  # 4
city:   [City of Traitors]                                        # 1
vein:   [Crystal Vein]                                            # 1

# SORTS À 0 (24)
zero:   [Astral Cornucopia, Bone Saw, Briber's Purse, Chimeric Mass,
         Claws of Gix, Clown Car, Dark Sphere, Delif's Cone,
         Engineered Explosives, Everflowing Chalice, Fountain of Youth,
         Jeweled Amulet, Lodestone Bauble, Mishra's Bauble, Orochi Hatchery,
         Paradise Mantle, Scale of Chiss-Goria, Sigil of Distinction,
         Spidersilk Net, Tooth of Chiss-Goria, Tormod's Crypt, Urza's Bauble,
         Welding Jar, Zuran Orb]                                  # 24

# CAILLOUX (9)
rock2u: [Fellwar Stone, Liquimetal Torque, Mind Stone, Prismatic Lens, Thought Vessel]  # 5
rock2t: [Coldsteel Heart, Guardian Idol]                         # 2
rock1:  [Fractured Powerstone]                                   # 1
rock3:  [Solar Transformer]                                      # 1

# SORTS À 1 (8)
one:    [Campfire, Expedition Map, Ghost Vacuum, Skateboard, Stone of Erech, World Map]  # 6
chrom:  [Chromatic Sphere, Chromatic Star]                       # 2

# SORTS À 2 non-créature (6)
two:    [Defense Grid, Disruptor Flute, Null Elemental Blast,
         Spatial Contortion, Warping Wail, Kozilek's Command]    # 6

# CRÉATURES (6)
creature: [Glaring Fleshraker, It That Heralds the End, Metallic Mimic,
           Patchwork Automaton, Skittering Cicada, Steel Overseer]  # 6

# AUTRES non-créature (8)
o3: [Tangle Wire, Tezzeret Cruel Captain]                        # 2
o4: [Mystic Forge, Karn Scion of Urza]                           # 2
o5: [Forsaken Monument, Eldrazi Confluence]                      # 2
o6: [Ugin the Ineffable]                                         # 1
o7: [Ugin Eye of the Storms]                                     # 1
```

### 3.3 Modèle de mana par tour

On suit un état de jeu `battlefield` minimal :

```
plain   : nb de terrains "land" déjà en jeu et prêts (1 mana chacun)
tapped  : nb de "landT" posés ce tour (deviennent plain au tour suivant)
city    : booléen, City of Traitors en jeu (2 mana)
veins   : nb de Crystal Vein en jeu (sac → 2 chacun, one-shot)
rocks   : nb de cailloux en jeu (1 mana chacun)
```

**Mana disponible un tour donné**, selon le terrain posé ce tour (`drop`) :
```
mana = plain + rocks + 2*veins
     + (city ? (drop est un terrain ? 0 : 2) : 0)   # poser un terrain sacrifie City
     + (drop == land ? 1 : 0)
     + (drop == vein ? 2 : 0)                        # posée puis sacrifiée
     + (drop == city ? 2 : 0)
```
Règle : **un seul terrain par tour**. Poser n'importe quel terrain sacrifie une City
en jeu. Un `landT` posé ce tour ne produit pas ce tour-ci.

### 3.4 Test de faisabilité du combo (`comboFeasible`)

Au début d'un tour (≥ T2), pour chaque choix de terrain possible (y compris « ne rien
poser »), on calcule `mana` (§3.3) puis on teste si le combo passe.

Entrées : `hand` (liste de kinds), `mana`, `fCast` (Fantasticar déjà en jeu ?).
Objectif : lancer Fantasticar (coût 3, sauf si déjà en jeu) **+** atteindre **4 sorts
de combo** au total (donc 3 de plus si Fantasticar est lancé ce tour, 4 si déjà en
jeu).

Algorithme (recherche exacte sur les rembourseurs) :
```
need   = fCast ? 4 : 3            # sorts à lancer EN PLUS du Fantasticar déjà compté
fCost  = fCast ? 0 : 3
refunders = sorts de combo en main dont remboursement > 0   # rock1, rock2u, rock3, chrom
others    = coûts des autres sorts de combo en main (remboursement 0), triés croissant
            # zero=0, one=1, two=2, o3=3, ...

pour chaque sous-ensemble S de refunders (cap 6) :
    bal = mana ; cnt = 0
    pour chaque r de S trié par coût croissant :
        si bal < coût(r) : sous-ensemble invalide
        bal -= coût(r) - remboursement(r) ; cnt += 1
    si invalide ou bal < fCost : continuer
    bal -= fCost                                    # on lance le Fantasticar
    pour chaque c de others (croissant) tant que cnt < need :
        si bal >= c : bal -= c ; cnt += 1
    si cnt >= need : COMBO OK
COMBO KO
```
Le sous-ensemble de rembourseurs est exploré exhaustivement (≤ 6) parce qu'avancer un
caillou net-0/net-1 peut à la fois payer un sort *et* augmenter le compte. Les sorts
sans remboursement sont lancés du moins cher au plus cher.

### 3.5 Heuristique de développement (tours sans combo)

À chaque tour où le combo ne passe pas, on « développe » (pré-cast) :

1. **Pose de terrain** (priorité) :
   - poser un `landT` **maintenant** si on a assez de terrains intacts pour les tours
     restants (on garde les `land`/`vein` jouables pour les tours où on en a besoin) ;
   - sinon `land`, sinon `vein`, sinon `landT`, sinon `city`, sinon rien.
   - Mettre à jour `battlefield` (un `landT` posé → `tapped`, prêt au tour suivant ;
     poser un terrain sacrifie une City en jeu).
2. **Pré-cast du Fantasticar** si `mana ≥ 3` **et** ≥ 3 `zero` en main (on prépare le
   tour combo où il ne restera qu'à enchaîner les sorts à 0).
3. **Pré-cast des cailloux** abordables, du moins cher au plus cher
   (`rock1`→`rock2u`→`rock2t`→`rock3`), en dépensant le mana net.
4. Re-tenter le pré-cast du Fantasticar avec le mana restant.

> Note d'implémentation : `landT` posé au tour T devient `plain` au début de T+1.

### 3.6 Modes de mulligan

L'utilisateur choisit le mode ; il change fortement les résultats (cf. §7).

- **`none`** — garde la première main de 7, toujours.
- **`london`** — mulligan de Londres jusqu'à 5 :
  - critère de garde : 7 → `2 ≤ lands ≤ 5 et zeros ≥ 2` ; 6 → `lands ≥ 2 et zeros ≥ 1` ;
    5 → `lands ≥ 1` ; sinon on garde.
  - bottoming des `(7 - taille)` cartes : on garde **au plus 3 terrains**, on priorise
    les `zero`/cantrips, on enfouit en priorité les coûts élevés (`o7`→…→`two`) puis
    les terrains au-delà de 3.
- **`moxfield`** — « New Hand » gratuit (re-tirage illimité à 7) : on re-mélange
  jusqu'à obtenir une main de 7 satisfaisant `2 ≤ lands ≤ 5 et zeros ≥ 2` (cap ~15
  tirages). Reproduit le comportement du playtester Moxfield.

`zeros` compte les `kind == zero` (les baubles sont catégorisés `zero`).

### 3.7 Boucle de partie & sorties

```
game(deck, { onPlay, mulligan, maxTurn = 5, seed }) -> numéro du tour de combo | null
  main = openingHand(deck, mulligan)
  pour t = 1..maxTurn :
      si (t > 1 ou !onPlay) : piocher 1
      promouvoir les landT posés au tour précédent (tapped -> plain)
      si t >= 2 et bestCombo(main, bf, fCast) : retourner t
      fCast = develop(main, bf, fCast, maxTurn - t)
  retourner null
```
- `onPlay = true` ⇒ pas de pioche au tour 1.
- **Sortie agrégée** sur `N` parties : pour chaque tour `t ∈ {2,3,4,5}`, la proba
  **cumulée** `P(combo au plus tard à t)` = (nb de parties dont le tour de combo ≤ t) / N.
- Intervalle de confiance ~ `±1.96·√(p(1-p)/N)` à afficher (ou au moins documenter le
  bruit MC : ±1 pt à N = 10 000, ±0,5 pt à N = 40 000).

### 3.8 Hypothèses & limites (à afficher dans l'UI, section « méthodo »)

- **Goldfish** : aucun adversaire, aucune interaction. Les probas sont des bornes
  hautes par rapport au jeu réel en tournoi.
- `X = 0` pour les sorts à coût variable (Chalice, Engineered Explosives, Astral
  Cornucopia, Orochi Hatchery, Clown Car, Chimeric Mass, Sigil, Briber's Purse).
- **Urza's Saga** traité comme un simple `land` (les chapitres, donc la recherche d'un
  artefact à 0, sont ignorés → conservateur).
- **Tron** non assemblé (chaque terrain Urza = 1 mana).
- **Gemstone Caverns / Scorched Ruins** modélisés comme `land` standards (conservateur :
  pas de départ en jeu, pas de double mana).
- Les **baubles ne cantripent pas** et **Chromatic** n'est crackée qu'à titre de mana :
  l'effet « creuser » est ignoré dans le moteur de base (conservateur).
- Coûts supposés à vérifier : Tezzeret Cruel Captain = 3 ; Kozilek's Command castable à 2
  (X=0) ; Solar Transformer = caillou à 3 ; Eldrazi Confluence = 5.
- Ces hypothèses doivent rester **centralisées et éditables** (cf. §5) pour pouvoir les
  corriger sans toucher au moteur.

---

## 4. Fonctionnalités de l'interface

Layout cible (desktop) : deux colonnes. À gauche l'éditeur de decklist, à droite le
panneau de simulation/stats. Responsive : empilées en mobile.

### 4.1 Affichage de la decklist

- Liste **groupée par catégorie métier** (Terrains, Sorts à 0, Cailloux, Sorts à 1,
  Sorts à 2, Créatures, Autres) avec **sous-total** par groupe et **total** global.
- Badge visuel par `kind` (couleur + libellé court).
- Indicateur **« 99/99 »** mis en évidence si le total ≠ 99 (avertissement, non
  bloquant : le calcul reste valide à toute taille).
- Agrégats clés en tête : nb de lands, nb de sorts à 0, nb de cailloux, courbe
  simplifiée (compte par coût).
- Chaque ligne carte : nom + badge `kind` + bouton **couper (−)**.

### 4.2 Panneau de stats

- Sélecteurs : **mode de mulligan** (Aucun / London / Moxfield), **précision**
  (Rapide ~5 000 / Normal ~15 000 / Précis ~40 000 itérations).
- Bouton **« Lancer la simulation »** + **barre de progression** (le calcul tourne en
  worker, par lots, pour ne pas figer l'UI).
- Résultats : tableau **T2 / T3 / T4 / T5** (cumulés) sur deux lignes **On the play**
  et **On the draw**, + une **ligne « moyenne play/draw »**.
- Visualisation : barres (SVG/CSS, sans lib externe) par tour, play vs draw.
- Affichage de l'**incertitude** (± pts) selon N.
- La cible « T3 » est mise en avant (c'est la métrique de référence du deck).

### 4.3 What-if / changement de carte & comparaison

C'est la fonctionnalité différenciante.

- Notion de **référence** (`baseline`) et de **variante de travail** (`draft`). Au
  départ, `draft = baseline =` la liste courante.
- **Opérations d'édition sur le draft** :
  - **Couper** une carte (depuis la decklist).
  - **Ajouter** une carte : champ nom + sélecteur de `kind`.
  - **Échanger (swap)** : raccourci « couper X / ajouter Y » en une action (garde le
    total à 99).
  - **Steppers de catégorie** (réponse rapide à « et si je jouais plus de sorts à 0 ? ») :
    +/− sur une catégorie, compensé automatiquement sur une catégorie « contrepartie »
    choisie (par défaut les coûts élevés `o5+`/créatures), pour conserver 99.
- Quand `draft ≠ baseline`, le panneau de stats affiche, à côté de chaque valeur, le
  **delta vs baseline** (`▲ +x.x pt` / `▼ −x.x pt`, couleur), idéalement avec les deux
  simulations lancées sur la **même seed** pour réduire le bruit du delta.
- Actions : **« Comparer »** (relance baseline + draft), **« Définir le draft comme
  référence »**, **« Réinitialiser le draft »**.
- L'historique des essais (liste des swaps testés + delta T3 obtenu) est un plus
  appréciable (journal en mémoire de session).

### 4.4 Import / export

- **Import texte** au format Moxfield (`1 Nom (SET) NUM`, lignes `#!Tag` ignorées) →
  on mappe chaque nom à un `kind` via la donnée de référence ; un nom inconnu tombe
  dans une **file « à catégoriser »** que l'utilisateur résout à la main.
- **Export** : liste texte + JSON interne (avec les `kind`), pour versionner.

---

## 5. Modèle de données

```ts
type Kind =
  | 'land' | 'landT' | 'city' | 'vein'
  | 'zero' | 'rock1' | 'rock2u' | 'rock2t' | 'rock3'
  | 'one'  | 'chrom' | 'two'
  | 'o3' | 'o4' | 'o5' | 'o6' | 'o7'
  | 'creature'

interface Card { name: string; kind: Kind; qty: number }   // qty=1 en Commander

interface Deck { cards: Card[] }                            // total visé = 99

// Paramètres mécaniques centralisés (= hypothèses §3.8, éditables)
interface SpellProfile { cost: number; refund: number; isComboSpell: boolean }
type SpellTable = Record<Kind, SpellProfile>

interface SimConfig {
  iterations: number          // 5_000 | 15_000 | 40_000
  mulligan: 'none' | 'london' | 'moxfield'
  maxTurn: number             // 5
  seed: number
}

interface TurnProbabilities { t2: number; t3: number; t4: number; t5: number } // cumulés
interface SimResult {
  onPlay: TurnProbabilities
  onDraw: TurnProbabilities
  iterations: number
  ciHalfWidthPt: number       // demi-largeur d'IC en points, pour l'affichage ±
}

interface Comparison { baseline: SimResult; draft: SimResult } // l'UI calcule les deltas
```

---

## 6. Architecture technique

- **Nuxt 3 / Vue 3** (Composition API), rendu **statique / SPA** : aucune logique
  serveur nécessaire (calcul 100 % client). Déployable en site statique.
- **Moteur de simulation** = module TS pur (`/lib/engine/*`), **sans dépendance au
  framework**, testable en isolation et réutilisable (CLI, tests).
- **Web Worker** dédié au Monte Carlo :
  - exécution **par lots** (ex. 2 000 parties/lot) avec post-message de progression ;
  - l'UI reste fluide, la barre de progression est alimentée par le worker ;
  - pour la comparaison, deux runs (baseline/draft) **à seed identique**.
- **PRNG** seedable et rapide (type *mulberry32*/*xorshift*) — pas `Math.random()`,
  pour la reproductibilité et l'usage en worker.
- **État** : composable (`useDeck`, `useSim`) ; persistance via `localStorage`
  (decklist + dernière config). Pas de store lourd nécessaire.
- **Perf** : représenter une main/deck comme tableau d'entiers (`Int8Array`, un code
  par `kind`) plutôt que des chaînes ; le mélange Fisher-Yates sur un tableau réutilisé
  évite les allocations. Objectif : run « Normal » (15 000 × 2 axes) en < ~1,5 s.
- **Tests** : le moteur doit être couvert par des tests de non-régression sur les
  valeurs de référence du §7 (tolérance ± marge MC).

---

## 7. Critères d'acceptation & valeurs de référence

Valeurs cibles issues des simulations déjà réalisées sur **cette** liste (moteur de
base, ~25 000 itérations, **T3 cumulé**). À reproduire à **±1,5 pt** près.

| Mode mulligan | On the play (T3) | On the draw (T3) |
|---------------|:----------------:|:----------------:|
| Aucun         | ~34,5 %          | ~49 %            |
| London        | ~51,5 %          | ~65 %            |
| Moxfield (free 7) | —            | ~80 %            |

Repères de cohérence supplémentaires :
- T2 non nul (~4 % play / ~7 % draw sans mulligan) grâce à City of Traitors / Crystal
  Vein qui donnent 3 mana dès T2.
- Cumul T4 (London) ≈ 71 % play / ~83 % draw.
- **Monotonie** attendue : ↑ nb de sorts à 0 ⇒ ↑ P(T3) ; ↑ nb de lands ⇒ ↑ P(T3)
  (effet plus faible). Un test what-if « +2 sorts à 0 » doit produire un delta T3
  **positif** (~+2 à +4 pt selon l'axe).

Acceptation fonctionnelle :
1. Charger la liste de référence affiche 99/99 et les bons sous-totaux (38 lands, 24
   sorts à 0, 9 cailloux, 8 sorts à 1, 6 sorts à 2, 6 créatures, 8 autres).
2. Une simulation « Normal » renvoie des valeurs dans les fourchettes du tableau.
3. Couper une carte chère et ajouter un sort à 0, puis « Comparer », affiche un delta
   T3 positif et cohérent, sans figer l'UI.
4. Le total ≠ 99 déclenche un avertissement non bloquant.

---

## 8. Évolutions possibles (hors v1)

- Enrichissement Scryfall pour auto-catégoriser les imports (coût, type, oracle).
- Modélisation fine : Urza's Saga (chapitre III → tutore un 0), baubles cantrip,
  Gemstone Caverns en main d'ouverture, Mystic Forge.
- Réglage du critère de mulligan par l'utilisateur (sliders sur les seuils lands/zéros).
- Optimiseur : recherche du swap maximisant P(T3) sous contrainte (garder X interactions).
- Partage d'une variante par URL (état encodé).