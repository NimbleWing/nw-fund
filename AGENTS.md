# nw-fund — AGENTS.md

## Developer Commands

- `pnpm tauri dev` — desktop dev (Vite on port **1420**, not 5173)
- `pnpm tauri:build` — full Windows NSIS build (clean → build → rename bundle → generate latest.json)
- `pnpm lint:all` — oxlint + cargo clippy (both required)
- `pnpm format:all` — oxfmt + cargo fmt (both required)
- `pnpm run release` — automated version bump + release via release-it
- **No test runner** configured; there are no tests.

## Tooling

- **Package manager**: pnpm (not npm)
- **Linter**: oxlint (not eslint) — `pnpm lint` / `pnpm lint:rust`
- **Formatter**: oxfmt (not prettier) — 100 printWidth, single quotes, sorted imports
- **Commits**: conventional commits enforced by commitlint + husky (pre-commit: lint-staged + clippy)
- **Task runner**: Taskfile.yml (`task dev`, `task lint`, `task fmt`, `task build-windows`)

## Architecture

- **Two windows**: `main` (decorations: false, custom titlebar) and `preference` (hidden, route `/preference`)
- **Routing**: react-router, two routes — `/` (Layout + sidebar) and `/preference` (settings)
- **State**: zustand (global), ahooks (local hooks)
- **i18n**: react-i18next, default locale is **zh-CN** (also has en-US)
- **Backend**: Rust with features/holiday (remote API → SQLite cache) and features/market_status (Chinese market hours)
- **Database**: SQLite via sqlx, **SQLX_OFFLINE=true** (no DB needed), auto-migrated on startup
- **Path aliases**: `@/*` → `src/*`, plus `@components/*`, `@features/*`, `@hooks/*`, `@utils/*`, `@plugins/*`, `@types/*`, `@constants/*`

## Releases & Updates

- **Target**: Windows NSIS only (no macOS/Linux)
- **Auto-updater**: GitHub releases with signature verification (pubkey in tauri.conf.json)
- Release process: `release-it` bumps version → syncs to Cargo.toml → generates latest.json
- Bundle script renames Chinese installer filename (`灵翼基金管理系统`) to English (`NW.Fund`)

## Notable

- Rust edition 2024, Node 24.14.0
- `index.html` has `lang="en"` `class="dark"` — dark mode default
- No GitHub Actions CI workflows exist
- Early-stage project: Layout shell + Preference + market status indicator
