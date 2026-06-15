# Fantasticar Combo Lab

Application web **100 % client** (Nuxt 3 / Vue 3, calcul en Web Worker) pour visualiser une
decklist Duel Commander autour de **The Fantasticar**, estimer par Monte Carlo la probabilité
de déclencher le combo (4 sorts non-créature dans un tour) de T2 à T5, et **mesurer l'impact
d'un changement de carte** (what-if avec deltas).

## Démarrage

```bash
npm install
npm run dev        # serveur de dev sur http://localhost:3000
```

Autres commandes :

```bash
npm test           # tests du moteur (vitest) — combo, calibration §7, fuzz
npm run build      # build de production (SPA)
npm run generate   # site statique (déployable tel quel)
npm run preview    # prévisualise le build
```

## Architecture

```
lib/engine/        Moteur de simulation — TypeScript pur, sans dépendance framework
  types.ts           Modèle de données (Kind, Deck, SimConfig, SimResult…)
  spellTable.ts      Profils mécaniques par kind (coût / remboursement) — hypothèses §3.8
  referenceDeck.ts   Decklist de référence (99 cartes, catégorisée d'après Scryfall)
  prng.ts            PRNG seedable (mulberry32) + Fisher-Yates
  mana.ts            État de jeu + mana par tour (§3.3)
  combo.ts           Faisabilité du combo (§3.4) — recherche exacte sur les rembourseurs
  develop.ts         Heuristique de développement (§3.5)
  mulligan.ts        Modes de mulligan : none / london / moxfield (§3.6)
  game.ts            Boucle de partie (§3.7)
  simulate.ts        Runner Monte Carlo (2 axes, progression par lots)
lib/sim.worker.ts  Web Worker (exécute le moteur hors thread principal)
lib/io/deckIo.ts   Import Moxfield / JSON, export (§4.4)
lib/ui/kinds.ts    Métadonnées d'affichage par catégorie
composables/       useDeck (état decklist + what-if), useSim (worker)
components/        UI (decklist, agrégats, stats, what-if, import/export, bars SVG)
app.vue            Layout deux colonnes
test/              Tests vitest (combo, fuzz brute-force, calibration §7)
```

Le moteur est **framework-agnostic** : il tourne aussi bien dans le worker que dans les tests
(ou un futur CLI), sans Vue.

## État & qualité

- **Cœur combo prouvé optimal** : `comboFeasibleForMana` est fuzzé contre une recherche
  brute-force exhaustive (0 écart sur 20 000 mains).
- **Calibration §7** : le moteur reproduit les valeurs de référence à **~3 pt** près sur les
  extrêmes (cible spec ±1,5 pt). Les invariants utiles à l'outil — monotonie, hiérarchie des
  modes, deltas play/draw, et surtout le **delta what-if** (offset systématique qui s'annule)
  — sont exacts. Détails et investigation : [`CALIBRATION.md`](./CALIBRATION.md).
- **Perf** : ~1 µs/partie → un run « Normal » (15 000 × 2 axes) en ~35 ms (cible spec < 1,5 s).
- Build de production et `tsc --noEmit` : verts.

## Fonctionnalités

- Decklist éditable groupée par catégorie, agrégats, indicateur 99/99, courbe des coûts.
- Simulation Monte Carlo en Web Worker (barre de progression, 3 niveaux de précision).
- Tableau T2→T5 (on the play / on the draw / moyenne) + barres SVG, T3 mis en avant, ± IC.
- What-if : référence ↔ variante, couper / ajouter / steppers de catégorie, **deltas colorés**.
- Import Moxfield (avec file « à catégoriser ») / export texte + JSON.
- Persistance localStorage. Aucune donnée envoyée à un serveur.
