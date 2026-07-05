# boardgameslist

Application web pour présenter une collection de jeux de plateau et, surtout,
éditer et imprimer des listes filtrées et propres - ce que Myludo ne permet pas.

Les données vivent dans un Google Sheet : le site le lit publiquement (ISR) et un
petit groupe d'éditeurs (authentifiés via Google) peut le modifier.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript strict**, Node 22.
- **Google Sheet** comme base de données (lecture via compte de service, ISR).
- **Auth.js (NextAuth v5)** + Google + allow-list d'emails pour les éditeurs.
- **Vitest** pour les tests (logique pure + composants UI via jsdom).
- Hébergement **Vercel**.

## Fonctionnalités

- Catalogue filtrable : recherche, nombre de joueurs, durée, type (société /
  énigme-enquête), tri (titre, notes perso/moyenne, durée, âge).
- Vignettes avec note perso + moyenne, et un mode "plus d'infos" (thèmes,
  mécanismes, édition, emplacement...).
- Liste imprimable filtrée (export PDF via l'impression du navigateur).
- Édition (éditeurs connectés) : ajout / modification / suppression via une modale,
  avec autocomplétion des catégories / thèmes / éditeurs.

## Développement

```bash
make install     # yarn install
make start       # serveur de dev (port 4210)
make build       # build de production
make start-prod  # serveur de production (port 4210)
make test        # vitest (une passe)
make lint        # eslint
make format      # prettier --write
make knip        # fichiers / deps / exports inutilises
make check       # lint + format + knip + tests (tout)
```

La configuration locale (ID du Sheet, clé de compte de service, OAuth, allow-list)
se met dans `.env.local` (gitignoré). Voir `docs/plan-migration.md` pour l'archi
cible et `docs/session-state.md` pour l'état courant.

## Documentation

- [docs/plan-migration.md](docs/plan-migration.md) : conception, architecture cible,
  modèle de données, plan par phases.
- [docs/session-state.md](docs/session-state.md) : état d'avancement et décisions.
- [AGENTS.md](AGENTS.md) : règles projet (data/auth, conventions de code).
