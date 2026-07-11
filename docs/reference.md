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

Ordre des colonnes A -> X (cle machine snake_case) :

`myludo_id`, `ean`, `titre`, `sous_titre`, `edition`, `joueurs_min`,
`joueurs_max`, `duree_min`, `duree_max`, `age`, `categories`, `themes`,
`mecanismes`, `editeur`, `auteurs`, `note_perso`, `note_moyenne`,
`date_acquisition`, `emplacement`, `image`, `source`, `description`, `bgg_id`,
`complexite`.

- **`bgg_id` (colonne W)** : l'en-tete `BGG_ID` doit exister dans la ligne 1 de
  l'onglet Jeux. Le mapping lecture se fait par nom d'en-tete : sans cet en-tete,
  l'id BGG est ecrit en colonne W mais **jamais relu** (donc non persistant).
  `LAST_COLUMN` dans `sheets.ts` doit rester aligne (`X`).
- **`complexite` (colonne X)** : note de complexite BGG (le "Weight", 1.0 a 5.0),
  lue depuis `dynamicinfo` (`stats.avgweight`) dans le meme appel que la note
  moyenne. L'en-tete `COMPLEXITE` doit exister en X1, sinon la valeur est ecrite
  mais jamais relue (comme `bgg_id`). Uniquement alimentee par BGG (import,
  bouton "Recuperer depuis BGG", re-sync) ; affichee dans la fiche "Plus d'infos",
  l'impression riche et triable dans le catalogue.

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
  (feuille entiere "sauf `A2:W`") pour empecher un humain de casser le mapping ;
  le compte de service doit rester dans les autorises des plages protegees.

## 4. Import (Myludo & BGG)

Logique pure et testee dans [../src/lib/myludo/](../src/lib/myludo/) et
[../src/lib/bgg/import.ts](../src/lib/bgg/import.ts) ; dispatcher
[../src/lib/import.ts](../src/lib/import.ts). Points a ne pas re-decouvrir :

- **Import transparent** : un seul bouton/champ fichier. `parseCollection` detecte
  la source par l'en-tete (`objectid`+`objectname` -> BGG ; sinon Myludo). JSON/XLSX
  = toujours Myludo (BGG n'exporte qu'en CSV). Les deux produisent des
  `MyludoImport` (type partage, avec `bggId`).
- **Cascade de dedup unifiee** `myludo_id -> bgg_id -> ean -> titre` : chaque source
  ne remplit que son propre id, donc le meme code gere les deux. Un import BGG
  **injecte le bgg_id** sur les correspondances : doublon identique par titre
  reecrit juste pour poser l'id ; et **"garder l'actuel" n'ignore PLUS le jeu** :
  il garde les valeurs existantes (conflits + non-vides) mais complete les cases
  vides et injecte le bgg_id (`mergeFields` avec `replace: []`). Donc "tout garder
  l'actuel" sert a rapatrier tous les ids sans toucher aux donnees.
- **Actions groupees** (modale de relecture) : "Tout cocher/decocher" sur les
  nouveaux jeux ; "Tout : garder l'actuel / garder l'import / dupliquer" sous les
  boutons unitaires de l'assistant (`applyAllShortcut`).
- **Faux conflits neutralises** (`compare.ts`) : titre compare via `normalizeTitle`
  (meme normalisation que le matching : casse/accents/ponctuation) ; plages
  joueurs/duree non signalees si l'import est **contenu** dans l'existant
  (`rangeContains`) ; EAN via `canonEan` (zeros de tete).
- **Regles de source a l'import** : import Myludo -> tout passe `myludo`. Import BGG
  -> nouveau/`manuel` passent `bgg`, mais un jeu deja `myludo` **reste myludo**
  (on injecte juste le bgg_id). Idem pour l'enrichissement par bouton BGG
  (`applyBgg`) : `manuel` -> `bgg`, `myludo` conserve.
- **Enrichissement auto (phase 2)** : quand l'import contient des jeux a `bgg_id`,
  `ImportModal.apply` va chercher les donnees riches via `/api/bgg/thing`
  (geekitems + dynamicinfo) **avant** l'ecriture, en throttlant
  (`ENRICH_CONCURRENCY`) et en fusionnant image/categories/themes/mecaniques/
  auteurs/editeur/note dans les cases vides (`enrichFields`). Fait AVANT l'apply
  unique pour eviter le probleme de rowIndex des jeux crees. Barre de progression +
  bouton "Passer" (annule le reste et ecrit ce qui est deja enrichi). Pas de
  resync separe : l'enrichissement n'a lieu qu'a l'import.
- **BGG CSV** : delimite `;` (comme Myludo). Colonnes utiles : `objectid`,
  `objectname`, `rating` (perso), `average` (moyenne), `min/maxplayers`,
  `min/maxplaytime`, `yearpublished`, `barcode` (EAN), `acquisitiondate`,
  `invlocation`. On ne garde que les jeux **possedes** (`own=1`). Pas
  d'image/categories/mecaniques dans le CSV (viennent de geekitems).
- **L'age NE vient PAS du CSV** : le CSV n'a que `bggrecagerange` (age
  **recommande par la communaute**, ex "10+"), different du `minage` **editeur**
  (la boite, ex 8) que renvoie geekitems et que pose le bouton "Recuperer depuis
  BGG". Pour rester coherent, l'import laisse `age` vide et c'est
  l'enrichissement geekitems (`enrichFields`) qui le remplit -> meme source (age
  editeur) partout.
- **Format-agnostique** : CSV / JSON / XLSX passent par des readers -> meme forme
  `MyludoRaw` -> `MyludoImport`. La modale de relecture ne depend pas du format.
- **Validation** : un export doit avoir les 3 colonnes stables `ID`, `EAN`,
  `Titre` ; sinon rejet. Tout autre champ ajoute/retire est tolere (resilience).
- **Dedoublonnage en cascade** `myludo_id` -> `ean` -> titre normalise ; les
  correspondances par titre sont toujours confirmees a la main ; jamais
  d'ecrasement silencieux d'une saisie manuelle.
- **Tout jeu importe passe en `source: "myludo"`** : `mergeFields` le force pour
  les jeux completes/fusionnes ; un doublon **identique** dont la source n'est pas
  deja `myludo` est quand meme reecrit (via `mergeFields` sans changement de donnee)
  juste pour flipper la source. Seuls les jeux non presents dans l'import gardent
  leur source.
- **EAN** : le JSON stocke l'EAN en nombre et perd le zero de tete (UPC-A vs
  EAN-13) ; `compareGames` retire les zeros de tete avant comparaison pour eviter
  un faux conflit.
- **Dates XLSX** : cellules date stockees en numero de serie ; `readXlsx`
  reconvertit en `YYYY-MM-DD` via `xl/styles.xml`.
- **Autocomplete** (`taxonomies.ts` : CATEGORIES / THEMES / MECANISMES /
  EDITEURS) genere depuis les exports ; casse Myludo verbatim sauf apostrophes des
  categories.

## 4b. Integration BoardGameGeek (BGG)

Logique dans [../src/lib/bgg/](../src/lib/bgg/). Points a ne pas re-decouvrir :

- **Les API XML officielles sont BLOQUEES** : `boardgamegeek.com/xmlapi2/*` (v2) ET
  `boardgamegeek.com/xmlapi/*` (v1) renvoient **HTTP 401** (Cloudflare), quel que
  soit l'hote (`boardgamegeek.com`, `api.geekdo.com`), le User-Agent, l'IP (sandbox
  datacenter ET navigateur de l'editeur). Ce n'est pas un souci de cle : la doc
  n'exige aucune auth, c'est de l'anti-bot. **Ne pas re-tester ces endpoints.**
- **Ce qui marche : l'API interne JSON du site**
  `api.geekdo.com/api/geekitems?objecttype=thing&objectid=ID` -> 200 JSON, meme
  depuis une IP datacenter (donc OK sur Vercel). On l'appelle **cote serveur**
  (route `/api/bgg/thing`, gated editeur) pour eviter le CORS et garder l'endpoint
  non officiel hors du client. Non documentee => peut casser un jour.
- **Recuperation par ID uniquement, pas de recherche par nom** : l'endpoint de
  recherche du site (`boardgamegeek.com/search/boardgame?q=...`, JSON) est protege
  Cloudflare (403 hors navigateur same-origin ; cross-origin bloque). L'editeur
  colle donc l'URL ou l'id BGG (`parseBggId` extrait le numero d'une URL
  `.../boardgame/13/...` ou d'un id brut).
- **La note moyenne vient d'un 2e endpoint** : `geekitems` ne la contient pas ;
  `api.geekdo.com/api/dynamicinfo?objecttype=thing&objectid=ID` -> `item.stats.average`
  (et `avgweight` = complexite, non stockee). `getGameById` appelle les deux en
  parallele (dynamicinfo best-effort : si echec, note = null).
- **Mapping geekitems -> Game** (`map.ts`, `parseGeekItem`) : les valeurs BGG sont
  en **anglais** et traduites en FR via des dictionnaires (`translate`, drop des
  valeurs sans equivalent) :
  - `boardgamecategory` alimente **deux** champs : `categories` (via
    `BGG_CATEGORY_TO_FR`, categories "format" : Card Game, Dice...) ET `themes`
    (via `BGG_CATEGORY_TO_THEME`, categories "thematiques" : Fantasy->Fantasy,
    Economic->Économie, World War II->Guerre...).
  - `boardgamemechanic` -> `mecanismes` via `BGG_MECHANIC_TO_FR` (Dice
    Rolling->Jet De Dés, Take That->Dans Ta Face...).
  - `boardgamedesigner`->auteurs, `boardgamepublisher`->editeur (**cap a 3**),
    `imageurl`->image, `primaryname.name`->titre, `min/maxplayers`,
    `min/maxplaytime`, `minage`, `yearpublished`->edition. String a coercer ;
    `0`/absent -> null. Description = HTML nettoye (entites + balises).
  - Les dictionnaires sont **best-effort** (les valeurs BGG inconnues sont
    droppees) : a etendre au fil de l'eau selon la collection.
- **Images geekdo** : les URLs contiennent des parentheses
  (`.../filters:strip_icc()/pic.png`) ; en CSS il **faut** `url("...")` avec
  guillemets, sinon les `()` cassent le parsing (fond vide). Cf. `GameCard.cover`.
- **Vignettes de l'impression riche** : rendues en `<img data-print-image>` (pas
  en `background-image`). Une image de fond CSS n'est pas chargee tant que
  l'element est `display:none`, or la feuille d'impression l'est a l'ecran : les
  vignettes ne se chargeaient jamais avant l'impression (sauf si deja en cache via
  la vue "Plus d'infos"). Un `<img>` se charge meme sous un ancetre masque, et
  l'effet d'impression dans `Catalog` **attend** que ces images soient chargees
  (avec un garde-fou de 8 s) avant d'appeler `window.print()`.
- **Regle d'ecrasement (`applyBgg` dans `GameFormModal`)** : le bouton ecrase les
  champs (quand BGG a une valeur, **titre compris**) **sauf si le jeu est
  `source: "myludo"`** (la, remplissage des cases vides seulement, titre Myludo
  conserve). Donc `manuel` ET `bgg` (re-sync) ecrasent : condition
  `prev.source !== "myludo"`, PAS `=== "manuel"` (sinon un jeu deja synchronise -
  devenu `bgg` - ne se mettrait plus jamais a jour). Seuls **sous-titre et
  description** restent gardes s'ils existaient. `manuel` passe `bgg` a la 1re
  synchro. (L'enrichissement de masse a l'import ne touche PAS le titre, cf.
  `enrichFields` : seul le bouton par jeu peut reecrire un titre.)

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
