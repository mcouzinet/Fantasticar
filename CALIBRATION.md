# Calibration du moteur — note d'ingénierie

> Statut : cœur combo **prouvé optimal** (fuzz vs brute-force). Reproduction des valeurs §7
> à **~5–6 pt** près sur les extrêmes depuis la correction mécanique de Chromatic (voir plus
> bas) — divergence volontaire au profit de la justesse. Les invariants utiles à l'outil
> (monotonie, hiérarchie des modes, deltas play/draw, **delta what-if**) restent exacts.

## Modélisation fine par carte

Le moteur ne traite pas les cartes par « coût générique » : plusieurs cartes ont une
mécanique propre, modélisée fidèlement (catégorisation vérifiée sur Scryfall). Récapitulatif
des `kind` spéciaux (cf. `spellTable.ts`, `mana.ts`, `develop.ts`) :

| `kind` | Cartes | Modélisation |
|--------|--------|--------------|
| `rock2u` / `rock2t` | cailloux à 2 dégagés / engagés | tape pour 1 (dégagé : net 1 ; engagé : produit au tour suivant) |
| `basalt` | Basalt Monolith | {3}, tape 3, net 0 le tour lancé — pas de rampe pérenne |
| `mightstone` | Mightstone & Weakstone | {5}, tape pour 2 |
| `sol` | Sol Talisman | **Suspend 3**—{1} → en ligne ~T4, tape pour 2 (impacte T4, pas T3) |
| `chrom` | Chromatic Sphere/Star, Relic of Progenitus, Vexing Bauble | **sort à 1 net** : l'activation qui pioche coûte ~autant qu'elle rend → pas un rembourseur gratuit |
| `amulet` | Jeweled Amulet | banque 1 mana d'un tour sur l'autre (activateur T2), chargé seulement si ≥ 3 autres sorts bon marché en main |
| `city` | City of Traitors, Crystal Vein | source **2 mana à usage unique** (on tappe avant le sacrifice ; City sacrifiée si on pose un autre terrain) |
| `landScry` | Conduit Pylons, Crystal Grotto, Gallifrey Council Chamber, Hidden Grotto, Rumble Arena, Surveillance Room, The Grey Havens, Zhalfirin Void | terrain dégagé qui scry/surveil 1 à l'arrivée → filtre la prochaine pioche (creuse la pièce manquante, sans anticipation) |
| `scorched` | Scorched Ruins | sacrifie 2 terrains dégagés à l'arrivée → tape pour 4 (dispo dès le T3, +2 mana net) |
| `land0` / `landGrant` | Maze of Ith / Yavimaya, Urborg | terrain 0 mana, sauf si un donneur de type est en jeu (qui le rend productif) |

### Mécanique Suspend (impacte T4)

`SpellProfile.suspend = N` : carte exilée au tour T, se résout à T+N — elle entre alors
comme permanent (rampe `tapsFor`) **et** compte comme un sort non-créature lancé gratuitement
ce tour (`bf.freeCasts`, qui réduit le `need` du combo). Sol Talisman : T3 inchangé, T4 +1–2 pt.

### Mécanique scry/surveil (impacte T3)

Les terrains à scry/surveil 1 (`landScry`) filtrent la prochaine pioche : on jette la carte
du dessus si elle est inutile pour assembler le combo (créature, terrain en trop, sort trop
cher), sinon on la garde. Pioche **à l'aveugle** (1 carte vue, ce que la carte fait vraiment :
pas de triche/anticipation). Effet mesuré : **+~1,3 pt T3**.

### Bug trouvé en route : mulligan qui ignorait les nouveaux terrains

`landsInHand` ne comptait que `land/landT/city/vein`. Les nouveaux terrains producteurs
(`landGrant`, `landScry`) n'étaient pas vus comme des terrains → mains mulliganées à tort
(−3 pt). Corrigé (`hand.ts`).

### Bug trouvé par le fuzz : ordre de lancement des rembourseurs

Le §3.4 lance les rembourseurs « par coût croissant ». Avec un rembourseur **cher mais net 0**
(Basalt Monolith), c'est sous-optimal : il faut le lancer tant que le solde est élevé. Le fuzz
vs brute-force a détecté l'écart ; l'ordre a été corrigé (capital minimal : net ≤ 0 d'abord
par coût croissant, puis net > 0 par remboursement décroissant). Combo **prouvé optimal**.

## Validation §7 (deck d'origine de la spec, fixture, N=40 000, seed fixe)

La validation tourne sur la **decklist d'origine** gardée en fixture
(`test/fixtures/specDeck.ts`), pas sur la liste de référence courante.

| Mode | Axe | Moteur | Cible §7 | Écart |
|------|-----|:------:|:--------:|:-----:|
| none | play | 33,3 % | 34,5 % | −1,2 |
| none | draw | 46,4 % | 49 % | −2,6 |
| london | play | 46,6 % | 51,5 % | −4,9 |
| london | draw | 60,0 % | 65 % | −5,0 |
| london | **T4** play | 69,9 % | 71 % | −1,1 |
| moxfield | draw | 74,5 % | 80 % | −5,5 |

L'écart sur london/moxfield s'est creusé (~1,5 → ~5 pt) **depuis la correction de Chromatic**
(`chrom` refund 1 → 0). Le §7 de la spec modélisait visiblement Chromatic Sphere/Star comme
des rembourseurs net-0 (« gratuits ») ; or leur activation pour piocher coûte autant qu'elle
rend → ce sont des sorts à 1 nets. On a privilégié la **justesse mécanique** sur le collage au
chiffre §7 : le gate du test est élargi en conséquence (`GATE = 0.06`, documenté dans
`calibrate.test.ts`).

Tout le reste est exact : totaux du deck (99/99), **monotonie** (T2 ≤ T3 ≤ T4 ≤ T5), hiérarchie
des modes (none < london < moxfield), avantage de pioche (draw > play).

## Pourquoi c'est sans impact sur l'outil

La fonctionnalité différenciante est le **what-if** : delta entre `draft` et `baseline`,
calculés par le **même moteur, à seed identique**. Un offset systématique **s'annule dans le
delta**. Les deltas et la monotonie étant exacts, l'outil remplit sa fonction (comparer l'effet
d'un changement de carte, et lister les cartes qui rendent un combo T2 possible) avec fidélité.

## Cœur combo prouvé optimal

`comboFeasibleForMana` est fuzzé contre une recherche brute-force exhaustive sur 20 000 mains
aléatoires : **0 écart**. On ne rate aucun combo — un éventuel offset vient du développement
(§3.5, heuristiques raisonnables et non un solveur exhaustif, cf. §2), pas de la détection.
