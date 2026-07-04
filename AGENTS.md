# boardgameslist

A web app to present a board game collection and, above all, edit and print
filtered, clean game lists - the one thing Myludo does not do. Board game data
lives in a Google Sheet; the app reads it publicly and lets a small set of
editors curate it.

See [docs/plan-migration.md](docs/plan-migration.md) for the full product design,
target architecture, data model, and phased migration plan. Read it before any
substantial work.

## Current state vs target

- **Current**: a half-converted Next.js 10 + MDX + Netlify CMS blog template.
  Games are `content/games/*.mdx` files read at build by `src/lib/games.ts`.
- **Target**: Next.js on Vercel, Google Sheet as DB, public reads via ISR, editor
  writes via a server API route (Google service account), editor access via
  Auth.js/Google with an email allow-list. MDX + Netlify CMS get removed.

When in doubt about direction, follow the plan, not the legacy code.

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
yarn test        # jest
```
