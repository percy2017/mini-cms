# AGENTS.md — hostbol.lat

Laravel 13 + React 19 + Inertia 3 SPA. PHP 8.3, Vite 8, Tailwind 4, SQLite default. Path aliases: `@/` → `resources/js/*` (see `components.json`).

## Install gotcha (read first)

Global npm is configured with `omit=dev` and the shell exports `NODE_ENV=production`, so plain `npm install` **silently skips devDependencies** (vite, eslint, prettier, `@laravel/vite-plugin-wayfinder`, typescript, …). Build then fails with `ERR_MODULE_NOT_FOUND`.

Always run:

```bash
npm install --include=dev
```

If a build complains about a missing package that *is* listed in `package.json`, this is the reason. The project's `.npmrc` only contains `ignore-scripts=true` — the omit setting is global, not project-local.

After installing new packages, use the same flag:

```bash
npm install <pkg> --include=dev   # or: --omit=
```

## Daily commands

Use the Composer scripts (they wrap Artisan + npm). Don't run raw `php artisan serve` + `npm run dev` separately unless debugging one of them.

| Task | Command |
|---|---|
| First-time setup | `composer setup` |
| Dev (server + queue + pail + vite, all in one terminal) | `composer dev` |
| Production client build | `npm run build` |
| Lint PHP | `composer lint` (or `:check`) |
| Lint/format TS | `npm run lint` / `npm run format` (or `:check`) |
| TypeScript check | `npm run types:check` |
| PHPStan (level 7) | `composer types:check` |
| Run tests | `composer test` |
| Full CI gate | `composer ci:check` |

`composer test` runs in this fixed order: `config:clear` → `pint --test` → `phpstan analyse` → `artisan test`. Don't reorder.

Single test: `php artisan test --filter=TestName` (Pest). Tests run against `:memory:` SQLite (see `phpunit.xml`); no DB to seed by hand.

## Generated / off-limits to edit

These directories are regenerated; ESLint is configured to ignore them (`eslint.config.js`):

- `resources/js/actions/**` — Wayfinder action bindings
- `resources/js/routes/**` — Wayfinder route bindings
- `resources/js/wayfinder/**` — Wayfinder runtime
- `resources/js/components/ui/*` — shadcn/ui components (`components.json` style: `new-york`, base `neutral`)

If you need a new route type-safe on the frontend, add it to Laravel routes first; Wayfinder regenerates on `npm run dev` / `npm run build`.

## Architecture pointers

- HTTP entry / routing: `bootstrap/app.php` (uses Laravel 11+ `Application::configure` style). Middleware chain ends with `HandleAppearance`, `HandleInertiaRequests`, `AddLinkHeadersForPreloadedAssets`.
- Frontend entry: `resources/js/app.tsx`. Page components live in `resources/js/pages/` and are wired via Inertia.
- Routes: `routes/web.php`, `routes/settings.php`, `routes/channels.php` (Reverb), `routes/console.php`.
- Domain code lives in `app/` (`Actions`, `Broadcasting`, `Concerns`, `Console`, `Http`, `Jobs`, `MediaLibrary`, `Models`, `Providers`, `Services`).
- Migrations use `YYYY_MM_DD_HHMMSS_` prefix from 2026 onward (don't normalize to `0001_*`).
- Spatie `laravel-medialibrary` + `laravel-permission` are installed; Fortify handles auth (incl. 2FA + passkeys — see the 2025-08 and 2024-01 migrations).

## Toolchain quirks

- **React Compiler is on** via `babel-plugin-react-compiler` (see `vite.config.ts`). Write code as if it might be re-ordered/memoized; pure renders expected.
- **ESLint** enforces: alphabetized `import/order`, blank lines around control statements (`@stylistic/padding-line-between-statements`), braces on all `if`/`else`, `consistent-type-imports` with `prefer-top-level`. Curly-brace rule is re-asserted after `prettier` in the config — don't let Prettier collapse `if` blocks.
- **PHPStan** scans `app/`, `bootstrap/`, `config/`, `database/`, `routes/` at level 7. Doesn't scan `resources/` or `tests/`.
- **`pnpm-workspace.yaml` exists but the lockfile is `package-lock.json`** — the project uses **npm**, not pnpm. Don't `pnpm install`.
- **`.npmrc`**: `ignore-scripts=true` (postinstall scripts from npm packages won't run). Code-generators like Wayfinder run via Vite plugins instead, not npm lifecycle.
- **Vite** plugins in order: `laravel` → `inertia` → `react` → `tailwindcss` → `wayfinder`. Fonts come from Bunny CDN (Instrument Sans 400/500/600) via `laravel-vite-plugin/fonts`.
- **MCP**: `.mcp.json` exposes `laravel-boost` (run via `php artisan boost:mcp`). Use it for Laravel-context-aware queries.

## Production deploy

`ecosystem.config.cjs` runs two PM2 processes (do not start them with `php artisan` directly in prod):

- `hostbol-reverb` → `php artisan reverb:start --host=0.0.0.0 --port=3015` (NODE_ENV=production)
- `hostbol-queue` → `php artisan queue:work --tries=3 --timeout=60`

Logs go to `storage/logs/pm2/`. Build artifacts are in `public/build/`.

## Environment

`.env.example` ships with `DB_CONNECTION=sqlite`, `SESSION_DRIVER=database`, `CACHE_STORE=database`, `QUEUE_CONNECTION=database`, `BROADCAST_CONNECTION=log`. Override `.env` only locally; never commit it. `VITE_APP_NAME` is read by Vite at build time and bakes into the client bundle.