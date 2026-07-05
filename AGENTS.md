# boardgameslist

A web app to present a board game collection and, above all, edit and print
filtered, clean game lists - the one thing Myludo does not do. Board game data
lives in a Google Sheet; the app reads it publicly and lets a small set of
editors curate it.

See [docs/plan-migration.md](docs/plan-migration.md) for the full product design,
target architecture, data model, and phased migration plan, and
[docs/session-state.md](docs/session-state.md) for the current status, live
decisions, operational Google Sheets config, and next steps. Read both before any
substantial work - session-state.md is the handoff journal and is kept current.

**Sample-first**: do NOT migrate the full 283-game `.ods` yet. Work with a ~15-game
sample (mostly from the Myludo JSON + one per `.ods` column), and only test the full
283 import at the very end. See session-state.md section 5.

## Current state vs target

- **Current**: Next.js 16 (App Router, `src/app/`) + React 19 + TypeScript strict,
  Node 22. The Google Sheet is already the DB: `src/lib/sheets.ts` reads it via a
  service account, `src/lib/games.ts` parses rows into typed `Game` objects, and
  `src/app/page.tsx` renders them with ISR (`revalidate = 3600`). The legacy MDX
  blog + Netlify CMS + social embeds have been removed. Public read path is done.
- **Target (remaining)**: editor writes via a server API route (Google service
  account), editor access via Auth.js/Google with an email allow-list, printable
  filtered lists, Myludo import. See the phased plan.

Path alias: `@/*` maps to `src/*`. When in doubt about direction, follow the plan.

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

## Commands

```bash
make install     # yarn install
make start       # yarn dev (dev server)
make build       # yarn build
make start-prod  # yarn start (production server)
yarn test        # vitest run (one-shot)
yarn test:watch  # vitest (watch mode)
```
