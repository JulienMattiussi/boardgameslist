<div align="center">

# 🎲 Jeux de plateau

**Présenter, filtrer et surtout imprimer une collection de jeux de plateau propre**
**et bien organisée : ce que Myludo ne sait pas faire.**

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Google Sheets](https://img.shields.io/badge/DB-Google%20Sheets-0F766E?logo=googlesheets&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

</div>

---

Les données vivent dans un **Google Sheet**. Le site le lit publiquement (ISR), et
un petit groupe d'**éditeurs authentifiés via Google** peut le curer. Aucun secret
ne touche le navigateur : les lectures passent par le build, les écritures par une
route serveur avec un compte de service.

## ✨ Fonctionnalités

- 🔎 **Catalogue filtrable** : recherche plein texte, nombre de joueurs, durée,
  type (société / énigme-enquête), et tris (titre, note perso, note moyenne,
  durée, âge, date d'acquisition) avec choix du sens (croissant / décroissant).
- 🃏 **Vignettes riches** : note perso + note moyenne, et un mode "plus d'infos"
  (thèmes, mécanismes, édition, emplacement...).
- 🖨️ **Impression paramétrable** : une modale d'options (aperçu schématique
  inclus) avec une densité au choix (riche = image + catégories + thèmes,
  normale, ou compacte pour plus de jeux par page), des découpages cumulables
  (une page par type, par catégorie, par thème, par mécanique, par durée ou par
  nombre de joueurs) et un filtre solo (tous, solo uniquement, sans les jeux
  solo). Toute la configuration s'imprime en une fois et les options sont
  mémorisées d'une fois sur l'autre. Pensée pour le papier (export PDF via
  l'impression du navigateur). C'est le livrable central.
- ✏️ **Édition en ligne** (éditeurs connectés) : ajout, modification, suppression
  via une modale, avec autocomplétion des catégories / thèmes / mécanismes /
  éditeurs, et un bouton **Récupérer depuis BGG** (BoardGameGeek) qui préremplit
  les champs vides (image, catégories, mécaniques, auteurs...) à partir de l'URL
  ou de l'id BGG collé.
- 📥 **Import de collection** : un seul champ fichier, le format est détecté
  automatiquement (export **Myludo** CSV/JSON/XLSX ou collection **BoardGameGeek**
  CSV). Dédoublonnage en cascade (`myludo_id` / `bgg_id` / `ean` / titre), relecture
  pas-à-pas des conflits, et injection des `bgg_id` manquants au passage.

## 🧱 Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript strict, Node 22 |
| Données | Google Sheet (lecture compte de service + ISR, écriture API route) |
| Auth | Auth.js (NextAuth v5) + Google + allow-list d'emails |
| Tests | Vitest (logique pure + composants UI via jsdom) |
| Hébergement | Vercel |

## 🚀 Démarrage rapide

```bash
make install     # yarn install
make start       # serveur de dev (port 4210)
make build       # build de production
make start-prod  # serveur de production (port 4210)
```

La configuration locale (ID du Sheet, clé de compte de service, OAuth, allow-list)
se met dans `.env.local` (gitignoré). La liste exacte des variables et la config
Google Cloud sont dans **[docs/reference.md](docs/reference.md)**.

## 🧪 Qualité

```bash
make test        # vitest (une passe)
make lint        # eslint
make format      # prettier --write
make knip        # fichiers / deps / exports inutilisés
make check       # lint + format + knip + tests (tout)
```

Toute logique pure (parsing, dédoublonnage, filtres, comparaison) est isolée en
fonctions testées, et chaque primitive du kit UI a ses tests.

## 🗂️ Données

Un seul onglet **"Jeux"** dans le Sheet, une colonne par attribut
(`titre`, `ean`, `joueurs_min/max`, `duree_min/max`, `age`, `categories`,
`themes`, `mecanismes`, `note_perso`, `note_moyenne`...). Les cellules sont typées
(entiers, décimaux, dates, listes déroulantes) pour limiter les erreurs de saisie.
Détails et rationnel dans [docs/reference.md](docs/reference.md).

## 📚 Documentation

- **[docs/reference.md](docs/reference.md)** : config opérationnelle (Google
  Cloud/Sheets, variables d'environnement, typage des cellules), décisions et
  pièges.
- **[docs/plan-migration.md](docs/plan-migration.md)** : conception (architecture,
  modèle de données, règles d'import).
- **[AGENTS.md](AGENTS.md)** : règles projet (data/auth, conventions de code).
