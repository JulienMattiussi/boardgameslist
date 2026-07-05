# Etat de session et reprise - boardgameslist

> But de ce document : permettre de repartir sur une session de developpement
> neuve sans perdre aucune decision ni aucun point acquis.
> Dernière mise à jour : 2026-07-04.

Lire aussi : [plan-migration.md](plan-migration.md) (conception + archi cible) et
[../AGENTS.md](../AGENTS.md) (règles projet). Ce fichier-ci est le journal d'état.

## 1. Où on en est

Phase 0 terminée + **gros bond technique le 2026-07-05** :

- **Sheet DB** rempli : en-tête (section 4) + échantillon 16 jeux (11 Myludo + 5
  `.ods`), écrits via l'API le 2026-07-04, relus/vérifiés OK.
- **Upgrade stack** : Next 10 -> **Next 16 (App Router)**, React 17 -> **19**,
  TypeScript strict, Node épinglé 22 (`.nvmrc` + `engines`). Motif : Next 10 ne
  démarre pas sur Node 22 (postcss `ERR_PACKAGE_PATH_NOT_EXPORTED`).
- **Purge legacy** (nettoyage Phase 6 avancé, prérequis à l'upgrade) : MDX, Netlify
  CMS, embeds sociaux, tout `src/pages`, `content/`, `api/`, `meta/`,
  `netlify.toml`, les composants blog. Supprimés du code ET des deps.
- **Tests** : migrés **jest -> vitest** (`yarn test` = `vitest run`). 16 tests verts.
- **Phase 1 (lecture publique) faite** :
  - `src/lib/sheets.ts` : lecture server-only via `googleapis` (compte de service ;
    fichier local `GOOGLE_APPLICATION_CREDENTIALS`, sinon
    `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` sur Vercel).
  - `src/lib/games.ts` : type `Game` + `rowsToGames` (mapping en-tête->clé,
    parsing nombres/listes) + `fetchGames`. Fonctions pures testées.
  - `src/lib/format.ts` : `formatRange` (affichage plages), testé.
  - `src/app/` : `layout.tsx`, `page.tsx` (ISR `revalidate = 3600`), `globals.css`
    (thème en custom properties), `src/components/GameList.tsx`.
  - Vérifié bout-en-bout : `yarn build` OK (page prérendue depuis le Sheet live),
    serveur prod -> HTTP 200 affichant les 16 jeux.

**Prochaine étape** : Phase 2 (listes imprimables filtrées) ou enrichir l'affichage
(fiche jeu, tri/recherche). Voir section 8.

## 2. Décisions actées (ne pas re-débattre)

1. **Réorientation produit** : boardgameslist n'est plus un blog MDX. C'est l'outil
   qui édite/filtre/imprime une liste de jeux, par-dessus une DB Google Sheet.
   Myludo reste la base de saisie riche ; boardgameslist comble le manque de Myludo
   (liste propre imprimable filtrée).
2. **Archi** : Google Sheet = DB. Lecture publique via ISR. Ecriture via API route
   serveur + compte de service. Le navigateur ne parle jamais directement à l'API
   Sheets. Détails dans [plan-migration.md](plan-migration.md).
3. **Auth éditeurs** : Auth.js/Google + allow-list d'emails (moi + un ami). Lecture
   publique sans auth. Le compte de service (écriture) est séparé de l'identité des
   éditeurs.
4. **Import Myludo** : dédoublonnage en cascade `myludo_id` -> `ean` -> titre
   normalisé ; les correspondances par titre sont toujours confirmées à la main ;
   jamais d'écrasement silencieux d'une saisie manuelle.
5. **Hébergement** : Vercel. `next export` (statique) abandonné (incompatible
   ISR/API routes).
6. **Stack conservée** : Next.js + TypeScript + composants d'affichage + SEO.
   A retirer : MDX (`content/games/*`, `src/lib/games.ts`), Netlify CMS
   (`api/auth.ts`, `api/callback.ts`, dep `@openlab/vercel-netlify-cms-github`),
   `netlify.toml`.
7. **NOUVELLE décision (échantillon d'abord)** : on ne migre PAS les 283 jeux du
   `.ods` maintenant. On travaille sur un échantillon d'une quinzaine de jeux, tiré
   surtout du JSON Myludo + un représentant par colonne/onglet du `.ods`. On ne
   testera l'import des 283 jeux qu'à la toute fin, une fois le produit fini.

## 3. Branchement Google Sheets (opérationnel, testé OK)

- **Projet GCP** : `board-game-list-501417` (numéro `288244866285`).
- **APIs activées** : Google Sheets API + Google Drive API (sur ce projet).
- **Compte de service** : `boardgameslist-write@board-game-list-501417.iam.gserviceaccount.com`.
- **Clé JSON** : `board-game-list-501417-59cea35c1225.gcp-service-account.json`
  (racine du repo, gitignorée).
- **Sheet DB** : "Board Game List", ID **`1BrIawlaBq8dRsgikPG6DMgrcHC9472MruvF170XVKYw`**.
  Un seul onglet **"Jeux"** (sheetId 0, renommé depuis "Feuille 1" le 2026-07-04),
  contenant en-tête + 16 jeux.
- **Config locale** : [../.env.local](../.env.local) (gitignoré) contient
  `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_APPLICATION_CREDENTIALS`,
  `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
- **Statut** : lecture ET écriture vérifiées via l'API. Prêt.

### Pièges rencontrés (à ne pas refaire)

- L'URL de Sheet donnée au départ (`1RQwj...`) était un AUTRE classeur. Le bon ID
  est `1BrIa...` (celui réellement partagé avec le compte de service). Toujours
  vérifier via `drive/v3/files` ce que le compte de service voit réellement.
- Nom de la clé ne matchait pas la règle `.gitignore` initiale ; corrigé avec
  `*.gcp-service-account.json` et `*service-account*.json`.
- Les APIs avaient été activées sur un mauvais projet/compte au début ; bien
  vérifier le sélecteur de projet (le bon = `board-game-list-501417`).
- Un token OAuth obtenu ne prouve QUE la validité de la clé, pas l'activation des
  APIs ni le partage. Tester un vrai appel `spreadsheets.get`.

## 4. Schéma de colonnes cible (à écrire en en-tête du Sheet)

Ordre des colonnes (voir section 5 de [plan-migration.md](plan-migration.md)) :

`myludo_id`, `ean`, `titre`, `sous_titre`, `edition`, `joueurs_min`, `joueurs_max`,
`duree_min`, `duree_max`, `age`, `categories`, `themes`, `mecanismes`, `editeur`,
`auteurs`, `note_perso`, `note_moyenne`, `date_acquisition`, `emplacement`,
`image`, `source`

**Casse dans le Sheet** : la ligne d'en-tête est écrite EN MAJUSCULES
(`MYLUDO_ID`, `TITRE`, ...). La clé machine reste le snake_case ci-dessus ; le code
qui lit le Sheet passe l'en-tête en minuscules pour retrouver la clé.
**Exception** : la colonne `ean` est intitulée `EUROPEAN_ARTICLE_NUMBER` (nom
complet demandé, underscores pour la cohérence) ; le code doit donc mapper ce
libellé explicitement vers la clé `ean`. C'est le code-barres produit (13 chiffres),
2e maillon de la cascade de dédoublonnage.

## 5. Echantillon proposé (~15 jeux) pour la prochaine session

Sources : `~/Téléchargements/collection.json` (Myludo, 32 jeux) et
`~/Téléchargements/Liste des jeux de plateau.ods` (283 jeux, plusieurs onglets).

Objectif : couvrir les cas limites de parsing et la variété de catégories.

**Depuis Myludo (données riches) :**

| Jeu | Cas limite couvert |
|---|---|
| 2 Pommes 3 Pains | plage joueurs `2 — 6` + plage durée `15 — 30` |
| Charcuterie : The Board Game | sous-titre avec `:`, durée `10 — 30` |
| Colt Express - Chevaux & Diligence | sous-titre/extension avec `-` |
| Citadelles | durée simple `60`, 2-8 joueurs |
| Stellar | joueurs = `Duo` (NON numérique, casse le parseur naïf) |
| Set | plage large `1 — 20` |
| Les Âmes Seules | joueurs `1+`, durée `120+`, catégorie livre-jeu |
| Loading | durée très courte `5` |
| Loup-Garou Pour Une Nuit | 3-10, jeu d'ambiance |
| The Mind | 2-4, coopératif |
| Saboteur - Les mineurs contre-attaquent | sous-titre, `2 — 12` |

**Depuis le .ods (cas absents de Myludo) :**

| Jeu | Onglet / cas limite |
|---|---|
| Paléo | onglet "gros jeux" (colonne "Indice de complexité BGG" en plus) |
| Pictionary Man | joueurs `X` + durée `X` (inconnus) |
| Team 3 vert | joueurs `(5)` (parenthèses) |
| Concept | durée `20-50` (plage avec tiret) ; cas extrême voisin : Defis Scrabble durée `trop` (texte libre) |

Note : l'onglet "Enquêtesescapeénigmespuzzles" a des lignes vides en tête ; y
piocher un jeu escape/enquête si on veut couvrir cette catégorie.

## 6. Cas de parsing à gérer (issus de l'échantillon)

- Joueurs : plage `2 — 6` (tiret cadratin dans les données Myludo), `1+`, `Duo`,
  `X`, `(5)`, valeur simple.
- Durée : plage `15 — 30` / `20-50`, `120+`, `X`, `trop` (texte), valeur simple.
- Sous-titres présents ou vides ; titres avec `:` ou `-`.
- Ces valeurs non numériques ne doivent PAS faire planter l'import : parser au mieux,
  sinon laisser la cellule vide et conserver `source = manuel`.

### Conventions de parsing retenues pour le seeding (2026-07-04)

Ces règles ont servi à peupler l'échantillon ; à ré-implémenter en fonctions pures
testées lors de la phase import Myludo (elles ne sont PAS encore du code `src/`).

- `joueurs_min/max` et `duree_min/max` : valeur simple -> `min = max` ; plage
  `a - b` / `a — b` -> `(a, b)` ; ouvert `1+` / `120+` -> `min` seul, `max` vide ;
  `(5)` -> `5` ; non-numérique (`Duo`, `X`, `trop`) -> les deux vides.
- `Duo` (Stellar) : mappé vers `2` (joueurs_min = joueurs_max = 2), car Myludo
  encode ainsi un jeu strictement 2 joueurs. Le futur parseur doit gérer une petite
  table de mots connus (`duo` -> 2).
- Multi-valeurs (categories, themes, mecanismes, editeur, auteurs) : séparateur
  `; ` (point-virgule + espace). `ean` : séparateur `;` sans espace.
- Tout écrit en texte brut (valueInputOption RAW) pour éviter tout reformatage
  auto de Sheets (EAN à 13 chiffres, dates ISO).
- `note` (perso/moyenne) à `0` -> vide. `image` : vide (absent du JSON Myludo).

## 7. Config Claude déjà en place

- [../CLAUDE.md](../CLAUDE.md) -> `@AGENTS.md` (chargé auto chaque session).
- [../AGENTS.md](../AGENTS.md) : identité, règles data/auth/code, commandes.
- `.claude/settings.json` : permissions + hook.
- `.claude/hooks/flag-added-comments.py` : signale les commentaires gadgets sous `src/`.
- Préférences globales (pas de `Co-Authored-By`, pas de tiret long) dans
  `~/.claude/CLAUDE.md`.
- Equipe d'agents multi : volontairement NON reprise.

## 8. Prochaines étapes (ordre suggéré)

1. ~~Ecrire l'en-tête de colonnes (section 4) dans le Sheet.~~ FAIT 2026-07-04.
2. ~~Créer l'échantillon (~15 jeux) dans le Sheet.~~ FAIT 2026-07-04 (16 jeux :
   `Defis Scrabble` ajouté pour couvrir le cas durée `trop`).
3. ~~Phase 1 : lecture publique (ISR) + composants d'affichage.~~ FAIT 2026-07-05
   (avec l'upgrade Next 16 / App Router, voir section 1).
4. Phase 2 : listes imprimables filtrées (UI de filtres + `@media print`). Les vues
   sont des filtres calculés, pas des onglets (voir plan section 5). <- PROCHAINE.
5. Suite selon [plan-migration.md](plan-migration.md) : auth éditeur, édition,
   import Myludo.
6. En toute fin : test d'import des 283 jeux du `.ods`.

Idées d'affichage intermédiaires possibles avant/pendant Phase 2 : tri, recherche,
fiche jeu détaillée, déploiement Vercel (le repo est déjà prévu pour).

## 9. Ce qui reste à obtenir de l'utilisateur

- Setup du **client OAuth Google** (pour Auth.js) : pas encore fait. Nécessaire à
  la phase Auth éditeurs, pas avant.
- ~~Confirmer l'échantillon proposé.~~ Confirmé et écrit (section 8).
