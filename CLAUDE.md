# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal navigation/bookmarks site ("NavHub") built with Next.js 16 App Router, React 19, and Tailwind CSS v4. Users manage categorized bookmarks that sync bidirectionally with GitHub (data stored in `data/sites.json` in the user's forked repo). Supports guest mode (read-only), GitHub OAuth for authenticated editing, offline via service worker, and drag-and-drop reordering.

## Commands

```bash
npm run dev                      # Dev server on localhost:3000
npm run build                    # Production build (next build + sync standalone assets)
npm run start                    # Run production build locally (node server.js)
npm run lint / npm run lint:fix  # ESLint (Next.js + TS rules)
npm run format / npm run format:check  # Prettier on src/**/*
npm run type-check               # tsc --noEmit (strict mode)
npm test                         # Vitest (jsdom, globals; runs in watch mode)
npm run test:ui                  # Vitest with browser UI
npm run test:coverage            # Vitest with v8 coverage
```

Single test: `npx vitest run src/lib/errors.test.ts`
Run all tests once (non-watch): `npm test -- --run`

Test setup lives in `src/test/setup.ts` (configured in `vitest.config.ts`). Coverage excludes `src/test/`, `node_modules/`, `*.d.ts`, and config files.

## Architecture

### Data Flow

```
User action → localStorage (instant) → UI update → 3s debounce → /api/github/data → GitHub API → sites.json
```

- **localStorage** (`src/lib/storage/local-storage.ts`): Primary client-side store, key `nav_data`
- **Sync engine** (`src/lib/storage/sync-manager.ts`): Bidirectional sync with conflict resolution by timestamp, 3s debounce, exponential backoff retry
- **Server proxy** (`src/app/api/github/data/route.ts`): Reads GitHub token from HttpOnly cookies, proxies read/write to GitHub

### Data Model

`NavData { version, lastModified, categories[] }` → `Category { id, name, icon?, sort, sites[] }` → `Site { id, title, url, favicon?, description?, sort? }`

### Key Directories

- `src/app/` — App Router pages and API routes (`/api/auth/*`, `/api/github/data`, `/api/url/parse`, `/api/favicon`, `/api/runtime-config`)
- `src/components/ui/` — shadcn/ui primitives (Radix-based: button, dialog, input, alert-dialog, toast)
- `src/components/layout/` — AppHeader, AppLayout, BottomNav, Container, PageContainer
- `src/contexts/SitesContext.tsx` — Single context for all categories/sites CRUD, sync state, guest mode
- `src/lib/storage/` — localStorage, GitHub storage, sync manager
- `src/hooks/` — Custom hooks (`use-sync`, `use-service-worker`)
- `src/lib/validation.ts` — Zod schemas + XSS sanitization for all user inputs
- `src/lib/security.ts` — Rate limiting, origin validation, CSRF protection
- `src/lib/runtime-policies.ts` — CSP header builder (called from middleware)
- `src/lib/services/url-parser.ts` — URL metadata extraction (title, favicon, description)
- `src/lib/utils/import-export.ts` — Import/export bookmarks logic
- `src/data/sites.json` — Default seed data (used as fallback when user data not synced)
- `data/sites.json` — Runtime user data (synced with GitHub, in .gitignore for local dev)

### Middleware & Security Headers

Middleware lives at `src/middleware.ts` (not root-level). It sets CSP, HSTS, X-Frame-Options, Referrer-Policy, and Permissions-Policy on all non-static responses. CSP is dynamically built via `buildContentSecurityPolicy()` from `src/lib/runtime-policies.ts`.

### Auth Flow

GitHub OAuth: `src/app/api/auth/github/` → GitHub → `src/app/api/auth/callback/github/` → sets HttpOnly cookie → `src/app/api/auth/session/` (verify) → `src/app/api/auth/logout/` (clear). Server-side routes read token from cookies; frontend never sees the raw token.

### Deployment

Build uses Next.js standalone output (`output: "standalone"` in `next.config.ts`). The `npm run build` script runs `scripts/sync-standalone-assets.mjs` after `next build` to copy static assets into the standalone directory. Docker image (`Dockerfile`) uses multi-stage build and runs `node server.js` directly.

### Patterns

- **State**: Single React Context (`SitesContext`), accessed via `useSites()` hook. No external state library.
- **Styling**: Tailwind CSS v4 with CSS-based config (no `tailwind.config.js`). CSS custom properties in `globals.css` define color palette, dark mode via `prefers-color-scheme`.
- **Components**: shadcn/ui pattern with `cn()` utility (clsx + tailwind-merge). Lazy-loaded heavy components (`SortableSites`, `AddCategoryDialog`).
- **Drag & drop**: `@dnd-kit` (core, sortable, utilities) for sortable categories and sites.
- **Auth**: GitHub OAuth → HttpOnly cookies → server-side token extraction. Guest mode for unauthenticated users.
- **Offline**: Service worker (`public/sw.js`) with cache-first strategy for GET requests.
- **Validation**: Zod v4 schemas for URLs, titles, category names. XSS pattern detection in validation layer.

## Conventions

- TypeScript strict mode; use `@/*` import alias for `src/*`
- PascalCase component files, kebab-case utility/hook files
- Tests colocated as `*.test.ts` near source
- Prettier: 2 spaces, double quotes, semicolons, 100 char width
- Commit format: `type(scope): description` (e.g. `feat(sync): improve URL metadata fallback`)

## Environment Variables

Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` (required) — also served at runtime via `/api/runtime-config` for Docker deployments
- `GITHUB_CLIENT_SECRET` (required, server-only)
- `NEXT_PUBLIC_GITHUB_OWNER`, `NEXT_PUBLIC_GITHUB_REPO`, `NEXT_PUBLIC_DATA_FILE_PATH` (optional overrides)

`NEXT_PUBLIC_GITHUB_CLIENT_ID` is fetched client-side from `/api/runtime-config` (see `src/lib/runtime-public-config.ts`), so Docker images can be built once and configured at container startup.

## Related Files

- `AGENTS.md` — Additional repository guidelines for AI agents
- `README.md` — User-facing documentation with setup instructions and Docker deployment
