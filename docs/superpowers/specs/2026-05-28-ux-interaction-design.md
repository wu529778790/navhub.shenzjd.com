# UX Interaction Optimization Design

## Scope

12 interaction issues across 3 priority batches, committed in 3 separate PRs.

## Batch 1: Critical Experience Fixes

### 1. Unify Toast System
- Delete `src/components/Toast.tsx` (imperative `showToast()`)
- Migrate `SyncStatus.tsx` to use `useToast()` hook from `ui/toast.tsx`
- Remove `ToastProvider` import from `Toast.tsx` in `layout.tsx` if still present

### 2. Sync Failure User Feedback
- In `SitesContext.tsx`, catch `syncToGitHub` errors and show toast with error message
- Snapshot data before optimistic update; rollback to snapshot on sync failure

### 3. Remove BottomNav Dead Code
- Delete `src/components/layout/BottomNav.tsx`
- Remove any imports/references

### 4. Service Worker Offline Experience
- Pre-cache app shell (`/`) in `install` event
- Return cached app shell for offline navigation instead of plain "Offline" text

## Batch 2: Interaction Details

### 5. Context Menu Viewport Awareness
- In `SiteCard.tsx`, calculate menu position relative to viewport
- Flip direction (up/down, left/right) when menu would overflow

### 6. Inline Dialog Exit Animations
- Add exit transitions to inline dialogs in `page.tsx` (edit category, delete category)
- Add exit transition to fork modal

### 7. Dismissible Error Banner
- Add close button to error banner in `page.tsx`
- Add `clearError()` method to `SitesContext`

### 8. Favicon Loading State
- In `FaviconImage.tsx`, show spinner/skeleton while image loads
- Keep Globe icon fallback on error

### 9. Adaptive Skeleton Count
- Read last known category/site count from localStorage for skeleton rendering
- Fallback to 3 categories / 4 sites per category

## Batch 3: Polish

### 10. EditSiteDialog Form Validation
- Apply existing Zod schemas to validate title (non-empty) and URL (valid format)
- Disable submit button until validation passes

### 11. Dark Mode Completion
- Add dark mode overrides for primary, accent, foreground CSS variables in `globals.css`

### 12. Remove CategoryFilter Stub
- Delete unused `CategoryFilter` export from `SearchBar.tsx`

## Out of Scope
- New features or page additions
- Architecture changes beyond interaction layer
- Performance optimization unrelated to UX
