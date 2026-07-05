# Plan de conception et de migration - boardgameslist

> Statut : Phases 0 à 4 implémentées (lecture ISR, listes imprimables, auth, édition).
> Reste la Phase 5 (import Myludo). Dernière mise à jour : 2026-07-05.
>
> **Écarts actés vs conception initiale (2026-07-05) :**
> - **App Router** (et non Pages Router) : la stack est passée à Next 16 + React 19.
>   Les mentions `getStaticProps`/`revalidate` ci-dessous se traduisent en App Router
>   par un Server Component `async` + `export const revalidate`.
> - **Nettoyage (Phase 6) avancé** : MDX, Netlify CMS et embeds sociaux ont été
>   retirés dès l'upgrade, car ils bloquaient le passage à Next 16 / React 19.
> - **Node 22** épinglé ; Next 10 était incompatible.
> - Tests : **vitest** (et non jest).

## 1. Contexte et objectif

`boardgameslist` est parti d'un template de blog Next.js + Netlify CMS, en cours de
reconversion vers un catalogue de jeux de plateau. La decouverte de la plateforme
Myludo a rebattu les cartes : Myludo fait presque tout (base de donnees riche,
ludotheque perso, communaute, suivi de parties) **sauf editer une liste propre a
imprimer, filtree selon l'occasion**.

C'est precisement le creneau de `boardgameslist`.

**Objectif du produit cible :**

- Presenter une collection de jeux de plateau.
- Editer et imprimer des listes filtrees (equivalent des onglets actuels du tableur :
  par nombre de joueurs, par type de soiree, etc.).
- Editer les jeux via une interface plus agreable que Google Sheets.
- Importer des jeux depuis un export Myludo (CSV ou JSON), sans doublon et sans
  ecrasement silencieux d'une saisie manuelle.

## 2. Constat de l'existant

### 2.1 Source de donnees actuelle du code

Le repo actuel utilise des **fichiers MDX statiques** dans `content/games/`, lus au
build par `src/lib/games.ts`. Modele herite du blog : `slug, title, date, tags,
author, body`. Aucune notion propre au jeu de plateau (joueurs, duree, age, editeur).

La seule authentification presente (`api/auth.ts`, `api/callback.ts`) est un OAuth
GitHub pour Netlify CMS, sans rapport avec le workflow reel.

### 2.2 Source de donnees reelle (workflow actuel de l'utilisateur)

- Un **Google Sheet** (`Liste des jeux de plateau`) qui est la vraie source de verite :
  ~283 jeux uniques, deja mis en page comme une **liste imprimable** (3 colonnes cote
  a cote) avec seulement 3 infos par jeu : `TITRE`, `Nb J.` (min + max), `Duree`.
- Des **onglets = vues filtrees pretes a imprimer** : `exclu solo 2 joueurs`,
  `max 3 et 4`, `max 5 et 6`, `max 7, 8 et +`, `Enquetes escape enigmes puzzles`,
  `gros jeux`.
- Un **export Myludo** (`collection.json`) : 32 jeux, mais 40 champs chacun (tres
  riche).

### 2.3 Ecarts constates

- **283 (Sheet) contre 32 (Myludo)** : Myludo ne peut pas devenir source unique sans
  perdre 250 jeux. Le Sheet reste maitre ; Myludo alimente et enrichit.
- **Donnees Sheet irregulieres** (durees `X`, `(5)`, saisie humaine) : un import
  Myludo normalise les fiabiliserait.
- Tout ce dont la liste imprimable a besoin est present dans l'export Myludo, plus des
  champs bonus (age, editeur, note, categories, image).

## 3. Vision cible

```
Lecteurs (public) ──► Pages statiques (ISR) ──lit──► Google Sheet (DB)
                          ▲                              ▲
                          │ revalidation                │ ecrit (compte de service)
                          │                              │
Editeurs (moi + ami) ──► App boardgameslist ────────────┘
   connexion via            - UI d'edition des jeux
   Google (Auth.js,         - import CSV/JSON Myludo + dedoublonnage/conflits
   allow-list emails)       - editeur de listes imprimables filtrees
```

**Principe directeur : le navigateur ne parle jamais directement a l'API Google Sheets.**
Les lectures passent par le build (ISR), les ecritures par une API route serveur.

## 4. Architecture technique

| Domaine | Choix | Justification |
|---|---|---|
| Framework | Next.js + TypeScript (conserve) | ISR + API routes couvrent lecture et ecriture |
| Hebergement | Vercel | ISR et fonctions serverless natives, gratuit, `base_url` deja en `.vercel.app` |
| Base de donnees | Google Sheet | Edition tableur familiere, gratuit, deja source de verite |
| Lecture | SSG/ISR (`revalidate`) + revalidation a la demande | Quota Sheets non concerne, site rapide |
| Ecriture | API route serverless + compte de service Google | Faible volume, credentials cote serveur |
| Auth editeur | Auth.js (NextAuth) provider Google + allow-list d'emails | Chacun son login Google, pas de mot de passe partage |

### 4.1 Lecture (public) : SSG / ISR

- Le build lit le Sheet une fois et genere des pages statiques.
- `revalidate` (ex. 3600 s) : la page se regenere au plus une fois par heure en relisant
  le Sheet. Consommation ~1 appel/heure au lieu d'1 appel/visiteur.
- **Revalidation a la demande** apres une edition via l'app (ou webhook / bouton) pour
  rafraichir sans attendre le prochain cycle.

### 4.2 Ecriture (editeurs) : API route + compte de service

- Actions interactives ponctuelles (editer un jeu, importer Myludo) via fonction serveur.
- Le client n'a jamais les credentials Sheets.
- Quota negligeable.

### 4.3 Modele d'authentification

Decoupler **qui a le droit d'editer** de **comment l'app ecrit dans le Sheet** :

1. **Qui a le droit** : Auth.js + Google, avec une liste blanche d'emails autorises en
   variable d'environnement (le mien + celui de mon ami). Ajouter un editeur = ajouter
   un email.
2. **Comment l'app ecrit** : un compte de service Google unique. Le Sheet est partage en
   "Editeur" avec l'email du compte de service. Les editeurs n'ont pas besoin d'un acces
   direct au Sheet.

Lecture : aucune auth (public).

## 5. Modele de donnees (schema du nouveau Sheet)

Un Sheet vierge, un seul onglet `data`, une ligne par jeu, une colonne par champ.
Champs optionnels marques `?`.

| Colonne | Source Myludo | Notes |
|---|---|---|
| `myludo_id` | `ID` | cle de dedoublonnage primaire |
| `ean?` | `EAN` | cle de dedoublonnage secondaire |
| `titre` | `Titre` | |
| `sous_titre?` | `Sous-titre` | |
| `edition?` | `Edition` | annee, aide a distinguer les editions |
| `joueurs_min` | `Joueur(s)` (min) | parser la plage "2 a 6" |
| `joueurs_max` | `Joueur(s)` (max) | |
| `duree_min?` | `Duree` (min) | parser la plage "15 a 30" |
| `duree_max` | `Duree` (max) | valeur retenue par defaut pour l'affichage |
| `age?` | `Age(s)` | |
| `categories?` | `Categorie(s)` | sert aux filtres imprimables |
| `themes?` | `Theme(s)` | |
| `mecanismes?` | `Mecanisme(s)` | |
| `editeur?` | `Editeur(s)` | |
| `auteurs?` | `Auteur(s)` | |
| `note_perso?` | `Note personnelle` | |
| `note_moyenne?` | `Note moyenne` | |
| `date_acquisition?` | `Date d'acquisition` | |
| `emplacement?` | `Emplacement` | |
| `image?` | (a definir) | url de couverture si disponible |
| `source?` | (calcule) | `manuel` / `myludo`, protege les saisies manuelles |

Les **listes imprimables** ne sont plus des onglets a maintenir a la main, mais des
**vues calculees** :

- `max 3 et 4` = `joueurs_max <= 4`
- `max 5 et 6` = `joueurs_max entre 5 et 6`
- `gros jeux` = `duree_max >= seuil`
- `Enquetes / escape` = `categories` contient enquete|escape|enigme|puzzle
- `exclu solo 2 joueurs` = `joueurs_max >= 3`

## 6. Import Myludo : dedoublonnage et reconciliation

### 6.1 Cascade de correspondance

Pour chaque jeu de l'export Myludo, essayer dans l'ordre :

1. **`myludo_id` exact** : correspondance certaine, fusion automatique.
2. **`ean` exact** : quasi certain, fusion automatique.
3. **Titre normalise** (minuscules, sans accents ni ponctuation, espaces compactes,
   + edition/annee si dispo) : correspondance **probable**, jamais automatique.

### 6.2 Regles de fusion (niveaux 1 et 2)

- Cellule Sheet **vide** : remplie automatiquement (aucun risque).
- Cellule Sheet **deja remplie** avec valeur differente : **conflit**, rien n'est ecrit,
  le diff est collecte pour validation.

### 6.3 Reconciliation (niveau 3) : cas de la saisie manuelle

Scenario : un jeu ajoute a la main (sans `myludo_id`) est plus tard importe de Myludo.
Le match par ID echoue ; le match par titre le rattrape et propose une reconciliation :

> Correspondance probable detectee. Myludo veut importer "Citadelles". Une ligne saisie
> manuellement semble correspondre. Fusionner (rattacher le myludo_id a la ligne
> existante) ou Creer un nouveau jeu ?

Si **Fusionner** :

- Le `myludo_id` est ecrit **dans la ligne manuelle existante** (elle adopte l'identite
  Myludo).
- Les cellules vides sont completees, les conflits de valeurs signales pour arbitrage.
- Les imports suivants matcheront par ID au niveau 1 : plus jamais de doublon.

### 6.4 Ecran de confirmation d'import

Recapitulatif avant ecriture :

- **Nouveaux jeux** a creer.
- **Correspondances certaines** avec conflits de valeurs a arbitrer (champ par champ).
- **Correspondances probables** (par titre) a confirmer : fusionner ou creer.

Aucune ecriture sans validation. Aucune ecrasement silencieux d'une saisie manuelle.

## 7. Fonctionnalites du front

- **Catalogue** : liste des jeux, tri, recherche.
- **Fiche jeu** : affichage des champs disponibles.
- **Editeur de listes imprimables** : selection de filtres (nb joueurs, duree, categorie),
  apercu, impression / export PDF via une feuille de style print.
- **Edition des jeux** (editeurs authentifies) : creer, modifier, supprimer.
- **Import Myludo** (editeurs authentifies) : upload CSV/JSON, previsualisation,
  dedoublonnage, reconciliation, application.

## 8. Ce qu'on garde et ce qu'on retire

| Element | Sort | Raison |
|---|---|---|
| Next.js + TypeScript | Garder | Coeur, adapte au besoin |
| Composants d'affichage (`GameList`, `GameItem`, `GameLayout`, `Pagination`, `TagButton`) | Adapter | Couche presentation reutilisable, rebrancher source et champs |
| Composants SEO (`src/components/meta/*`) | Garder | |
| `config.json` | Adapter | |
| Contenu MDX (`content/games/*`, `src/lib/games.ts`) | Retirer | Remplace par le Sheet |
| Netlify CMS (`@openlab/vercel-netlify-cms-github`, `api/auth.ts`, `api/callback.ts`) | Retirer | Remplace par edition Sheet + UI |
| `netlify.toml`, `next export` (`package.json`) | Retirer | Incompatible ISR/API routes |

## 9. Quotas et performance

- API Google Sheets v4 : limites **par minute** (~300 lectures/min par projet, ~60 par
  utilisateur), **pas de plafond total ni journalier**, gratuit.
- Avec ISR, le build lit le Sheet ~1 fois par cycle de revalidation : quota jamais un
  probleme.
- Ecritures faibles et ponctuelles : quota non concerne.

## 10. Setup Google Cloud (une seule fois, gratuit)

1. **Compte de service** : creer le compte, activer l'API Google Sheets, telecharger la
   cle JSON, partager le Sheet en "Editeur" avec l'email du compte de service. Cle stockee
   en variable d'environnement sur Vercel.
2. **Client OAuth** (pour Auth.js) : creer un OAuth client Google. Ecran de consentement
   en mode test avec les emails des editeurs comme testeurs.

Variables d'environnement attendues (a finaliser) :

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `EDITORS_ALLOWLIST` (emails autorises, separes par des virgules)

## 11. Plan de migration par etapes

### Phase 0 - Preparation

- Creer le Sheet vierge avec le schema de la section 5.
- Setup Google Cloud (compte de service + client OAuth).
- Migrer les 283 jeux existants du Sheet actuel vers le nouveau schema (script ponctuel :
  parser `TITRE`, `Nb J.` min/max, `Duree`, marquer `source = manuel`).

### Phase 1 - Lecture publique (SSG/ISR)

- Couche d'acces Sheets en lecture (compte de service).
- Adapter les types et `src/lib` (remplacer `games.ts` MDX par une lecture Sheet).
- Adapter les composants d'affichage aux nouveaux champs.
- Deployer sur Vercel avec ISR. A ce stade, site public en lecture seule fonctionnel.

### Phase 2 - Listes imprimables filtrees

- UI de selection de filtres.
- Feuille de style print / export PDF.
- Remplacer la logique des anciens onglets par des filtres calcules.

### Phase 3 - Authentification editeur

- Integrer Auth.js + Google + allow-list.
- Proteger les routes d'edition.

### Phase 4 - Edition des jeux via l'app

- API route d'ecriture (compte de service).
- UI CRUD des jeux.
- Revalidation a la demande apres edition.

### Phase 5 - Import Myludo

- Parsing CSV et JSON Myludo.
- Cascade de dedoublonnage (section 6).
- Ecran de previsualisation, conflits et reconciliation.
- Application des changements + revalidation.

### Phase 6 - Nettoyage

- Retirer MDX, Netlify CMS, `netlify.toml`, `next export`.
- Mettre a jour le README (n'est plus un template de blog).

## 12. Risques et points ouverts

- **Migration des 283 jeux** : donnees irregulieres (`X`, `(5)`), parsing a fiabiliser,
  eventuellement completer manuellement apres coup.
- **Champ image** : l'export Myludo ne fournit pas forcement d'URL d'image exploitable ;
  a verifier / definir (upload manuel, ou pas d'image en v1).
- **Normalisation des titres** pour le niveau 3 : editions, extensions, traductions ;
  d'ou la validation humaine obligatoire.
- **Ecran de consentement Google** en mode test : limite a 100 testeurs, suffisant ; a
  basculer en production si ouverture plus large un jour.
- **Choix format d'import Myludo** : le JSON est plus riche et structure que le CSV ;
  privilegier le JSON, gerer le CSV en secours.
```
