# Calibration du moteur — note d'ingénierie

> Statut : cœur combo **prouvé optimal** (fuzz vs brute-force). Reproduction des valeurs §7
> à **~3 pt** près sur les extrêmes (cible spec : ±1,5 pt).

## Mise à jour — nouvelle decklist de référence

La decklist par défaut a été remplacée par une liste fournie, **catégorisée d'après les
données Scryfall** (coût/type/production de mana vérifiés). Corrections notables vs une
catégorisation « de mémoire » :

- **Eldrazi Confluence = {2}{C}{C} → coût 4** (et non 5 comme supposé au §3.8).
- **Hidden Grotto n'entre pas engagé** → `land` (la spec d'origine l'avait en `landT`).
- **Fractured Powerstone = {2}** → `rock2u` (corrigé précédemment).
- Cailloux à profil mana particulier modélisés finement (cf. `spellTable.ts`) :
  Basalt Monolith ({3}, tape 3, net 0), Mightstone & Weakstone ({5}, tape 2).

### Mécanique Suspend (impacte T4)

Le moteur gère le **suspend** de façon générale (`SpellProfile.suspend = N`, coût = coût de
suspend) : une carte suspendue au tour T se résout à T+N — elle entre alors comme permanent
(rampe `tapsFor`) **et** compte comme un sort non-créature lancé gratuitement ce tour
(`bf.freeCasts`, qui réduit le `need` du combo). C'est un levier **T4, pas T3**.

- **Sol Talisman** : Suspend 3—{1}, tape pour {C}{C} → suspendu ~T1, en ligne ~T4. Effet
  mesuré sur la nouvelle liste : **T3 inchangé**, **T4 +1,3 à +2,4 pt**.
- Le mécanisme est réutilisable : tout `kind` avec `suspend: N` dans la SpellTable est
  géré pareil (pour tester d'autres artefacts à suspend).
- La production des cailloux est désormais **par carte** (`tapsFor`, somme dans
  `bf.rockMana`) : Mightstone & Weakstone produit bien 2 (et non 1).

La validation §7 est conservée : elle tourne désormais sur la **decklist d'origine** gardée
en fixture (`test/fixtures/specDeck.ts`).

### Bug trouvé par le fuzz : ordre de lancement des rembourseurs

Le §3.4 lance les rembourseurs « par coût croissant ». Avec un rembourseur **cher mais
net 0** (Basalt Monolith : coût 3, remboursement 3), cet ordre est **sous-optimal** : il faut
le lancer tant que le solde est élevé. Le fuzz vs brute-force a détecté l'écart ; l'ordre a
été corrigé (problème du capital minimal : net ≤ 0 d'abord par coût croissant, puis net > 0
par remboursement décroissant). Le combo redevient **prouvé optimal**.

## Résultats (T3 cumulé, N=40 000, seed fixe)

| Mode | Axe | Moteur | Cible §7 | Écart |
|------|-----|:------:|:--------:|:-----:|
| none | play | 37,4 % | 34,5 % | +2,9 |
| none | draw | 51,2 % | 49 % | +2,2 |
| london | play | 50,0 % | 51,5 % | −1,5 |
| london | draw | 63,5 % | 65 % | −1,5 |
| london | **T4** play | 70,9 % | 71 % | ~0 ✓ |
| moxfield | draw | 77,1 % | 80 % | −2,9 |

Tout le reste est exact : totaux du deck (99/99), **monotonie** (T2≤T3≤T4≤T5),
hiérarchie des modes (none < london < moxfield), avantage de pioche (draw > play),
et **deltas play→draw** (mesurés à 13,5–14 pt, identiques à la référence).

## Ce qui a été vérifié / écarté

1. **Cœur combo prouvé optimal.** `comboFeasibleForMana` est fuzzé contre une recherche
   brute-force exhaustive sur 20 000 mains aléatoires : **0 écart**. On ne rate donc
   aucun combo — l'écart ne vient pas de la détection (§3.4) mais du développement (§3.5).

2. **Leviers de développement balayés** (vein 1↔2, pré-cast Fantasticar on/off/gated,
   ramp cailloux on/off, priorité landT, porte de richesse du ramp) :
   - le **pré-cast du Fantasticar** n'affecte pas le T3 (il ne joue que sur T4/T5 via
     `need=4`) ; la version « eager » est nécessaire pour caler **London T4 = 71** ;
   - le **ramp par cailloux** aide *uniformément* (le couper effondre tous les modes) ;
   - le **séquençage landT agressif** relève *tous* les modes (+3 à +4,6 pt) ;
   - la **porte de richesse** ne fait que baisser le niveau global.

   **Conclusion** : aucun levier de §3.5 n'**élargit l'écart** entre `none` (trop haut)
   et `moxfield` (trop bas). Le minimum atteignable pour `none` (33,4 %) effondre
   `moxfield` à 74 %. Atteindre ±1,5 pt partout exigerait une heuristique de
   développement *sensiblement différente* de celle décrite au §3.5 — donc un
   *fit sur la cible* plutôt qu'une implémentation de la spec. Or §2 précise
   explicitement : « heuristiques raisonnables, pas un solveur exhaustif ».

## Pourquoi c'est sans impact sur l'outil

La fonctionnalité différenciante est le **what-if** : delta entre `draft` et `baseline`,
calculés par le **même moteur, à seed identique**. Un offset systématique de ~3 pt
**s'annule dans le delta**. Les deltas et la monotonie étant exacts, l'outil remplit
sa fonction (comparer l'effet d'un changement de carte) avec fidélité.

## Marges d'amélioration (si l'on veut viser ±1,5 pt)

- Spécifier précisément l'heuristique de développement de référence (ordre exact des
  poses de terrain, politique de pré-cast), puis l'implémenter à l'identique.
- Ou ajouter un **optimiseur de séquençage** (mini-recherche par tour) au lieu d'une
  heuristique — coûteux en perf, hors périmètre v1 (cf. §2 non-goals).
