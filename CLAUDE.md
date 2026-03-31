# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A personal navigation/bookmarks site ("NavHub") built with Next.js 16 App Router, React 19, and Tailwind CSS v4. Users manage categorized bookmarks that sync bidirectionally with GitHub (data stored in `data/sites.json` in the user's forked repo). Supports guest mode (read-only), GitHub OAuth for authenticated editing, offline via service worker, and drag-and-drop reordering.

## Commands

```bash
npm run dev                      # Dev server on localhost:3000
npm run build                    # Production build
npm run lint / npm run lint:fix  # ESLint (Next.js + TS rules)
npm run format / npm run format:check  # Prettier on src/**/*
npm run type-check               # tsc --noEmit (strict mode)
npm test                         # Vitest (jsdom, globals)
npm run test:coverage            # Vitest with v8 coverage
```

Single test: `npx vitest run src/lib/errors.test.ts`

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

- `src/app/` — App Router pages and API routes (`/api/auth/*`, `/api/github/data`, `/api/url/parse`)
- `src/components/ui/` — shadcn/ui primitives (Radix-based: button, dialog, input, alert-dialog, toast)
- `src/components/layout/` — AppHeader, AppLayout, BottomNav, Container, PageContainer
- `src/contexts/SitesContext.tsx` — Single context for all categories/sites CRUD, sync state, guest mode
- `src/lib/storage/` — localStorage, GitHub storage, sync manager
- `src/lib/validation.ts` — Zod schemas + XSS sanitization for all user inputs
- `src/lib/security.ts` — Rate limiting, origin validation, CSRF protection
- `src/data/sites.json` — Default seed data

### Patterns

- **State**: Single React Context (`SitesContext`), accessed via `useSites()` hook. No external state library.
- **Styling**: Tailwind CSS v4 with CSS-based config (no `tailwind.config.js`). CSS custom properties in `globals.css` define color palette, dark mode via `prefers-color-scheme`.
- **Components**: shadcn/ui pattern with `cn()` utility (clsx + tailwind-merge). Lazy-loaded heavy components (`SortableSites`, `AddCategoryDialog`).
- **Drag & drop**: `@dnd-kit` for sortable categories and sites.
- **Auth**: GitHub OAuth → HttpOnly cookies → server-side token extraction. Guest mode for unauthenticated users.
- **Offline**: Service worker (`public/sw.js`) with cache-first strategy for GET requests.
- **Validation**: Zod schemas for URLs, titles, category names. XSS pattern detection in validation layer.

## Conventions

- TypeScript strict mode; use `@/*` import alias for `src/*`
- PascalCase component files, kebab-case utility/hook files
- Tests colocated as `*.test.ts` near source
- Prettier: 2 spaces, double quotes, semicolons, 100 char width
- Commit format: `type(scope): description` (e.g. `feat(sync): improve URL metadata fallback`)

## Environment Variables

Copy `.env.example` to `.env.local`:
- `NEXT_PUBLIC_GITHUB_CLIENT_ID` (required)
- `GITHUB_CLIENT_SECRET` (required)
- `NEXT_PUBLIC_GITHUB_OWNER`, `NEXT_PUBLIC_GITHUB_REPO`, `NEXT_PUBLIC_DATA_FILE_PATH` (optional overrides)
