# Reference operationnelle - boardgameslist

Doc de reference du projet une fois construit : configuration operationnelle,
decisions actees et pieges connus. Pour la conception (architecture, modele de
donnees, regles d'import), voir [plan-migration.md](plan-migration.md).

## 1. Configuration Google Cloud / Sheets

- **Projet GCP** : `board-game-list-501417` (numero `288244866285`).
- **APIs activees** : Google Sheets API + Google Drive API.
- **Compte de service** (ecriture) :
  `boardgameslist-write@board-game-list-501417.iam.gserviceaccount.com`.
- **Cle JSON** : `board-game-list-501417-59cea35c1225.gcp-service-account.json`
  (racine du repo, **gitignoree** via `*service-account*.json` ; jamais commitee).
- **Sheet DB** : "Board Game List", ID
  `1BrIawlaBq8dRsgikPG6DMgrcHC9472MruvF170XVKYw`. Un seul onglet **"Jeux"**
  (sheetId 0).
- **Variables d'env** ([../.env.local](../.env.local), gitignore ; a reporter sur
  l'hebergeur) : `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_APPLICATION_CREDENTIALS`
  (chemin du fichier de cle en local) ou `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` +
  `GOOGLE_SERVICE_ACCOUNT_EMAIL` (cle inline, prod), `AUTH_SECRET`,
  `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `EDITORS_ALLOWLIST`.

## 2. Rafraichissement des donnees (ISR)

- Lecture publique via ISR : [../src/app/page.tsx](../src/app/page.tsx)
  (`revalidate = 3600`). Une edition **directe dans le Sheet** apparait donc au
  plus une heure plus tard.
- Les ecritures **via l'app** (`/api/games`, `/api/import/apply`) appellent
  `revalidatePath("/")` : le site est a jour immediatement dans ce cas.
- Pour du temps reel sur edition manuelle : baisser `revalidate`, ou ajouter une
  route de revalidation appelee par un trigger Apps Script `onChange`. Non mis en
  place (volontaire, la collection bouge peu).

## 3. Colonnes du Sheet et typage

Ordre des colonnes A -> V (cle machine snake_case) :

`myludo_id`, `ean`, `titre`, `sous_titre`, `edition`, `joueurs_min`,
`joueurs_max`, `duree_min`, `duree_max`, `age`, `categories`, `themes`,
`mecanismes`, `editeur`, `auteurs`, `note_perso`, `note_moyenne`,
`date_acquisition`, `emplacement`, `image`, `source`, `description`.

- **Ligne d'en-tete EN MAJUSCULES** (`MYLUDO_ID`, `TITRE`, ...) ; le code passe
  l'en-tete en minuscules pour retrouver la cle. **Exception** : la colonne `ean`
  est intitulee `EUROPEAN_ARTICLE_NUMBER` (mappee explicitement vers `ean`).
- **Typage des cellules** (limite les erreurs de saisie ; validation en locale
  fr_FR, donc separateur de formule `;`) :
  - `edition`, `joueurs_min/max`, `duree_min/max`, `age` : **entiers** (l'age est
    un entier : le `+` de Myludo est retire a l'import et affiche seulement dans
    l'UI). Validation `age` :
    `=OR(ISBLANK(J2);AND(ISNUMBER(J2);J2=INT(J2);J2>=0))` (stricte).
  - `note_perso`, `note_moyenne` : decimal (`0.0`).
  - `date_acquisition` : date (n. de serie, format `yyyy-mm-dd`).
  - `source` : liste deroulante `myludo` / `manuel` (stricte).
  - `ean`, titres, categories... : texte.
- **Lecture** : `sheets.ts` lit en `valueRenderOption=UNFORMATTED_VALUE` +
  `dateTimeRenderOption=FORMATTED_STRING` (nombres en nombres, insensible a la
  locale ; dates en ISO). NE PAS relire en `FORMATTED_VALUE` puis reecrire (un
  `6,6` fr casserait le parse).
- **Protection recommandee** : proteger la ligne 1 (en-tetes) et la structure
  (feuille entiere "sauf `A2:V`") pour empecher un humain de casser le mapping ;
  le compte de service doit rester dans les autorises des plages protegees.

## 4. Import Myludo (rappels non evidents)

Logique pure et testee dans [../src/lib/myludo/](../src/lib/myludo/). Points a ne
pas re-decouvrir :

- **Format-agnostique** : CSV / JSON / XLSX passent par des readers -> meme forme
  `MyludoRaw` -> `MyludoImport`. La modale de relecture ne depend pas du format.
- **Validation** : un export doit avoir les 3 colonnes stables `ID`, `EAN`,
  `Titre` ; sinon rejet. Tout autre champ ajoute/retire est tolere (resilience).
- **Dedoublonnage en cascade** `myludo_id` -> `ean` -> titre normalise ; les
  correspondances par titre sont toujours confirmees a la main ; jamais
  d'ecrasement silencieux d'une saisie manuelle.
- **EAN** : le JSON stocke l'EAN en nombre et perd le zero de tete (UPC-A vs
  EAN-13) ; `compareGames` retire les zeros de tete avant comparaison pour eviter
  un faux conflit.
- **Dates XLSX** : cellules date stockees en numero de serie ; `readXlsx`
  reconvertit en `YYYY-MM-DD` via `xl/styles.xml`.
- **Autocomplete** (`taxonomies.ts` : CATEGORIES / THEMES / MECANISMES /
  EDITEURS) genere depuis les exports ; casse Myludo verbatim sauf apostrophes des
  categories.

## 5. Decisions actees (ne pas re-debattre)

1. boardgameslist = outil qui edite/filtre/imprime une liste de jeux par-dessus une
   DB Google Sheet. Myludo reste la base de saisie riche ; l'app comble le manque
   (liste propre imprimable filtree).
2. Google Sheet = DB. Lecture publique via ISR. Ecriture via API route + compte de
   service. Le navigateur ne parle jamais directement a l'API Sheets.
3. Auth editeurs : Auth.js/Google + allow-list d'emails. Lecture publique sans auth.
   Le compte de service (ecriture) est separe de l'identite des editeurs.
4. Hebergement Vercel. `next export` (statique) abandonne (incompatible ISR/API).

## 6. Pieges connus

- **Locale fr_FR du classeur** : les formules de validation via l'API exigent `;`
  comme separateur d'arguments (pas `,`).
- Verifier via `drive/v3/files` ce que le compte de service voit reellement (une
  URL de Sheet peut pointer un autre classeur ; un token OAuth valide ne prouve ni
  l'activation des APIs ni le partage : tester un vrai `spreadsheets.get`).
- **zsh** + **port 4210** + pas de `cd` : voir [../AGENTS.md](../AGENTS.md).

## 7. Config Claude / repo

- [../CLAUDE.md](../CLAUDE.md) -> `@AGENTS.md` (charge auto chaque session).
- [../AGENTS.md](../AGENTS.md) : identite, regles data/auth/code, commandes.
- `.claude/settings.json` : permissions + hook.
- `.claude/hooks/flag-added-comments.py` : signale les commentaires gadgets sous
  `src/`.
- Preferences globales (pas de `Co-Authored-By`, pas de tiret long) dans
  `~/.claude/CLAUDE.md`.
