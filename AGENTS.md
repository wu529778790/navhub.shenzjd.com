# Repository Guidelines

## Project Structure & Module Organization
- Main app code lives in `src/` using Next.js App Router (`src/app/` for routes, layouts, API handlers).
- Reusable UI components are in `src/components/`; shared logic is in `src/lib/` and `src/hooks/`.
- State/context lives in `src/contexts/`; test setup is in `src/test/setup.ts`.
- Test files are colocated as `*.test.ts` (for example `src/lib/errors.test.ts`, `src/lib/storage/__tests__/local-storage.test.ts`).
- Static assets are in `public/`; seed/sample data is in `data/` and `src/data/`; operational docs are in `docs/`.

## Build, Test, and Development Commands
- `pnpm dev`: start local development server at `http://localhost:3000`.
- `pnpm build`: create production build.
- `pnpm start`: run the production build locally.
- `pnpm lint` / `pnpm lint:fix`: run ESLint (Next.js + TypeScript rules), optionally auto-fix.
- `pnpm format` / `pnpm format:check`: run Prettier write/check on `src/**/*`.
- `pnpm type-check`: run strict TypeScript checks with no emit.
- `pnpm test`, `pnpm test:ui`, `pnpm test:coverage`: run Vitest in CLI, UI, or coverage mode.

## Coding Style & Naming Conventions
- TypeScript is strict; prefer explicit types for public APIs and shared utilities.
- Prettier governs formatting: 2 spaces, semicolons, double quotes, max width 100.
- Use the `@/*` import alias for `src/*` paths.
- Component files use PascalCase (for example `SiteCard.tsx`); hooks use `use-*.ts`; utility modules use kebab-case.

## Testing Guidelines
- Framework: Vitest + Testing Library (`jsdom`, global test APIs enabled).
- Keep tests close to the code they validate and use `*.test.ts` naming.
- Run `pnpm test:coverage` before opening a PR; coverage reports are generated as text, JSON, and HTML.

## Commit & Pull Request Guidelines
- Recent history includes automated sync commits (`[skip ci] Auto sync ...`); use clear human-authored messages for feature work.
- Prefer concise imperative commit subjects, e.g. `feat(sync): improve URL metadata fallback`.
- PRs should include: purpose/scope, key implementation notes, test evidence (`pnpm test`, `pnpm lint`, `pnpm type-check`), linked issue, and UI screenshots/GIFs when behavior changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local` for local development.
- Never commit secrets (GitHub OAuth client secret, tokens); verify `.env*` changes carefully.
