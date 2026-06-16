# Fantasticar Combo Lab

Application web **100 % client** (Nuxt 3 / Vue 3, calcul en Web Worker) pour visualiser une
decklist Duel Commander autour de **The Fantasticar**, estimer par Monte Carlo la probabilité
de déclencher le combo (4 sorts non-créature dans un tour, dont le Fantasticar) de T2 à T5,
et **mesurer l'impact d'un changement de carte** (what-if avec deltas).

En ligne : <https://fantasticar-combo-lab.surge.sh> · Code : <https://github.com/mcouzinet/Fantasticar>

## Démarrage

```bash
npm install
npm run dev        # serveur de dev sur http://localhost:3000
```

Autres commandes :

```bash
npm test           # tests du moteur (vitest) — combo, calibration §7, fuzz, scry, maze…
npm run build      # build de production (SPA)
npm run generate   # site statique (déployable tel quel, ex. surge .output/public)
npm run preview    # prévisualise le build
```

## Architecture

```
lib/engine/        Moteur de simulation — TypeScript pur, sans dépendance framework
  types.ts           Modèle de données (Kind, Deck, SimConfig, SimResult…)
  spellTable.ts      Profils mécaniques par kind (coût / remboursement) — hypothèses §3.8
  referenceDeck.ts   Decklist de référence (99 cartes, catégorisée d'après Scryfall)
  prng.ts            PRNG seedable (mulberry32) + Fisher-Yates (co-permutation d'ids optionnelle)
  mana.ts            État de jeu + mana par tour (cailloux, scry, banque, scorched, City…)
  hand.ts            Main (compte par kind), comptage des terrains
  combo.ts           Faisabilité du combo (§3.4) + traceCombo (ligne gagnante, pour les recettes)
  develop.ts         Heuristique de développement (§3.5) + filtre scry/surveil
  mulligan.ts        Modes de mulligan : none / london / moxfield (§3.6)
  game.ts            Boucle de partie (§3.7)
  simulate.ts        Runner Monte Carlo (2 axes, progression par lots)
  trace.ts           Simulateur « tracé » : suit l'identité des cartes → recettes des combos T2
lib/sim.worker.ts  Web Worker (exécute le moteur hors thread principal)
lib/io/             Import Moxfield / JSON, export, catalogue de cartes, partage par URL
lib/ui/kinds.ts    Métadonnées d'affichage par catégorie
composables/       useDeck (état decklist + what-if), useSim (worker)
components/        UI (decklist, agrégats, what-if, résultats, combos T2, import/export, SVG)
app.vue            Dashboard pleine largeur (decklist · what-if · résultats)
test/              Tests vitest (combo, fuzz brute-force, calibration §7, scry, maze, catalogue…)
```

Le moteur est **framework-agnostic** : il tourne aussi bien dans le worker que dans les tests
(ou un futur CLI), sans Vue.

## Modélisation par carte

Le moteur modélise finement les cartes à mécanique particulière (cailloux nets, Suspend,
scry/surveil, banque de mana, sources 2-mana à usage unique, Scorched Ruins, Maze of Ith…).
Le détail et la calibration sont dans [`CALIBRATION.md`](./CALIBRATION.md).

## État & qualité

- **Cœur combo prouvé optimal** : `comboFeasibleForMana` est fuzzé contre une recherche
  brute-force exhaustive (0 écart sur 20 000 mains).
- **Calibration §7** : depuis la correction mécanique de Chromatic (sort à 1 net, pas un
  rembourseur gratuit), le moteur diverge de **~5 pt** des valeurs §7 sur london/moxfield —
  divergence **volontaire** au profit de la justesse. Les invariants utiles à l'outil
  (monotonie, hiérarchie des modes, deltas play/draw, **delta what-if** qui annule tout offset)
  restent exacts. Détails : [`CALIBRATION.md`](./CALIBRATION.md).
- **Perf** : un run (50 000 × 2 axes) en ~quelques dizaines de ms ; les recettes T2 (tracées)
  sont plafonnées à 30 000 itérations pour rester fluides.
- Build de production et `tsc --noEmit` : verts. Suite de tests : verte.

## Fonctionnalités

- Decklist éditable groupée par catégorie, agrégats, indicateur 100/100 (99 + commander),
  courbe des coûts.
- Simulation Monte Carlo en Web Worker, **relancée automatiquement** à chaque changement de deck.
- Tableau T2→T5 (on the play / on the draw / moyenne) + jauges T3 + barres SVG, ± IC.
- **What-if** : référence ↔ variante, couper / ajouter / steppers de catégorie, **deltas colorés**.
- **Combos T2 — cartes impliquées** : fréquence (par nom de carte) des cartes présentes dans
  les combos T2, qui révèle les vrais activateurs (Crystal Vein, City of Traitors, Jeweled Amulet…).
- Import Moxfield (tolère les tags `#!…` et marqueurs foil ; file « à catégoriser ») /
  export texte + JSON ; catalogue de reconnaissance élargi.
- **Partage de deck par URL** (opt-in, lz-string) ; persistance localStorage ; mesure d'audience
  anonyme sans cookie (GoatCounter). Aucune donnée de deck envoyée à un serveur.
