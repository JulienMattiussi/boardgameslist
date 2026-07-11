# boardgameslist

A web app to present a board game collection and, above all, edit and print
filtered, clean game lists - the one thing Myludo does not do. Board game data
lives in a Google Sheet; the app reads it publicly and lets a small set of
editors curate it.

See [docs/reference.md](docs/reference.md) for the operational reference (Google
Cloud/Sheets config, env vars, sheet typing, decisions, gotchas) and
[docs/plan-migration.md](docs/plan-migration.md) for the design (architecture,
data model, import rules). Read reference.md before any operational work.

## State

Next.js 16 (App Router, `src/app/`) + React 19 + TypeScript strict, Node 22.
Google Sheet as DB. The migration is complete: public read (ISR), filterable
catalog, configurable print (a `PrintModal` with schematic preview -> `PrintDocument`
renders one `PrintList` per section; each section flows its games through a CSS
multi-column layout - `column-fill: auto` - so the browser fills columns top to
bottom and paginates naturally, no server-side column splitting; pure logic in
`src/lib/print.ts`), editor auth
(Auth.js/Google + allow-list), full editing (add/edit/delete via `/api/games` + a
modal), and Myludo import (CSV/JSON/XLSX -> dedup cascade -> step-by-step review
modal). The legacy MDX blog + Netlify CMS have been removed.

BGG (BoardGameGeek) integration: a `bgg_id` sheet column (W) and a `complexite`
column (X, the BGG "Weight" 1-5), pure JSON mappers in
`src/lib/bgg/`, a "Recuperer depuis BGG" panel in `GameFormModal` (prefill from a
pasted url/id), and a **BGG collection CSV import** merged into the transparent
import flow (`src/lib/import.ts` auto-detects Myludo vs BGG; unified dedup cascade
`myludo_id -> bgg_id -> ean -> titre`). The official XML APIs (v1 & v2) are
Cloudflare-blocked (401); data uses BGG's internal JSON
(`api.geekdo.com/api/geekitems` + `/dynamicinfo` for the rating and the
complexity/weight) via the server
route `/api/bgg/thing`, **by id only** (name search is blocked too). See
[docs/reference.md](docs/reference.md) sections 4 and 4b before touching it.

Path alias: `@/*` maps to `src/*`.

## Data and auth rules (non-negotiable)

- **The browser never talks to the Google Sheets API.** Reads go through the build
  (ISR); writes go through a server API route.
- **Secrets stay server-side** (service account key, OAuth secret, allow-list).
  Never ship them to the client.
- **Reads are public. Writes require an editor** (Auth.js/Google + email allow-list
  in `EDITORS_ALLOWLIST`).
- **Import dedup is a cascade** `myludo_id` -> `ean` -> normalized title. Title
  matches are always human-confirmed. Never overwrite a non-empty cell without
  surfacing the conflict.
- **`next export` (static) is banned** - it breaks ISR and API routes.

## Coding rules

- **No em-dash or en-dash** anywhere (code, UI copy, comments, commits). ASCII `-`,
  colon, parentheses, or rephrase. Global user preference.
- **Code and comments in English.** UI copy is in French (the product is
  French-facing).
- **TypeScript strict** - no implicit `any`.
- **No flavor comments.** A `PostToolUse` hook flags comments added under `src/`;
  justify each as genuinely disambiguating non-obvious code, or remove it.
- **No `console.log`.**
- **Colors and typography as CSS custom properties** in a theme file. Never
  hardcode a color in a component - use `var(--token)`.
- **No speculative abstractions** - don't add helpers, options, or fallbacks not
  needed by the current task.
- **Reuse the shared UI kit** in `src/components/ui/` (`Button`, `IconButton`,
  `Chip`, `Field`, `MetaItem`, `DetailRow`, `controls.module.css`) instead of
  re-styling one-off buttons/chips/fields. Visual language: clickable = filled or
  round (buttons, chips); static = flat (tags, group-icon markers). Each ui
  primitive is unit-tested.
- **Pure logic is unit-tested** (parsing, dedup/reconciliation, filters). Keep it
  in pure exported functions, not buried in I/O, so it can be tested.
- **Client components** using hooks or event handlers start with `"use client"`.
- **Print styles matter** - the printable list is the core deliverable; verify
  `@media print` rendering for it.

## Definition of done

Code + tests + docs. Update `AGENTS.md` when a new pattern, rule, or env var is
introduced; update `README.md` for user-visible changes; keep
`docs/plan-migration.md` in sync when the design shifts.

## Commit conventions

- No `Co-Authored-By` trailer.
- No em-dashes anywhere.

## Shell (zsh)

Commands run under **zsh**: an unquoted glob that matches nothing aborts the whole
command (`zsh: no matches found`), unlike bash. Quote any glob meant for the tool:

- `grep -rn ... --include='*.ts'` (not `--include=*.ts`)
- `find . -name '*.tsx'` (don't pass `dir/*.tsx` as an argument)

**Do not prefix commands with `cd`.** The shell cwd is already the project root and
persists between calls, so `cd` is redundant; it also breaks permission matching
(a command starting with `cd` no longer matches the `Bash(yarn:*)` etc. allow-rules,
triggering a prompt) and `Bash(cd:*)` is intentionally NOT allowed (it could leave
the project). Run tools directly (`yarn test`), and use absolute paths for anything
outside the project (e.g. scratchpad scripts).

**Never touch port 4210 for ad-hoc checks.** 4210 is the user's dev server
(`make start`). For throwaway `next start` / `next dev` verifications, use a
different port (`yarn start -p 4399`) and only ever kill THAT port
(`fuser -k 4399/tcp`). Do not run `fuser -k 4210/tcp` or `pkill -f next` - it kills
the user's running dev server.

## Commands

```bash
make install     # yarn install
make start       # yarn dev (dev server, port 4210)
make build       # yarn build
make start-prod  # yarn start (production server, port 4210)
make test        # vitest run (one-shot)
make lint        # eslint
make format      # prettier --write
make knip        # find unused files/deps/exports
make check       # lint + format:check + knip + tests
yarn test:watch  # vitest (watch mode)
```
