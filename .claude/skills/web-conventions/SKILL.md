---
name: web-conventions
description: Angular frontend conventions for web/ — component layers, signals+facades state, folder structure, naming. Read BEFORE creating or modifying any Angular component, service, or route in web/src.
---

# Web (Angular) Conventions — checklist

Fixed by ADR-0009. Angular 21, standalone, **zoneless** (no zone.js).
Two layers only (BC-PRIN-01). Living examples: `features/houses/` and
`features/auth/` — copy their shape, don't re-invent.

## Components — two kinds, nothing else

- **Container** (routed page or section): injects the feature facade via
  `inject()`, handles loading/error/empty states. Max 2 levels
  (page → section); no "item containers". Only containers call facade
  methods.
- **Presentational**: data in via `input()`, events out via `output()`.
  No injected services. Local UI state (hover/expanded) as local signals
  is fine; business data and loading state are NOT.

Both: `ChangeDetectionStrategy.OnPush` always · `@if`/`@for` with `track` ·
no `standalone: true` (default) · `class`/`style` bindings, not
`ngClass`/`ngStyle` · `host` object, not `@HostBinding`/`@HostListener` ·
inline templates for small components · typed Reactive forms only
(`Validators.required` does NOT trim — normalize before validating;
`(ngSubmit)` fires only with a form directive — a bare `<form>` with just
`[formControl]` falls through to a native page-reloading submit, S-05) ·
`NgOptimizedImage` for static images · no direct DOM manipulation ·
WCAG AA basics (focus, contrast, ARIA) · user-facing strings in Ukrainian.

## State: signals + facades (no NgRx)

Per feature in `features/<feature>/data/`: **api service** (thin
HttpClient wrapper, typed DTOs) + **facade** (one injectable: private
writable signals, public `computed`, a method per user action;
reload-after-mutation). Components never touch HttpClient or writable
signals. Pattern reference: `features/houses/data/houses-facade.ts`.

Facades are root singletons — state survives navigation. A page that must
start blank (create forms) calls an explicit `facade.reset()` (S-04 review,
high). Route params: read reactively (`toSignal(route.paramMap)`), never
`route.snapshot` — the router reuses the component instance when only the
param changes.

## Structure & naming

```
features/<feature>/
  <feature>-page.ts     # routed container   → class HousesPage
  containers/           # section containers (if any)
  components/           # presentational     → house-card.ts, HouseCard
  data/                 # facade + api + models → houses-facade.ts
  <feature>.routes.ts   # lazy via loadChildren
```

Kebab-case files, **no** `.component`/`.service` suffixes; selectors
`app-*`; signal names are nouns (`houses`, `loading`), no `$`.
`core/` = app shell/guards/interceptor singletons; `shared/` only once
used by 2+ features; no `libs/` for a single consumer.

## Testing

Presentational → plain input/output tests, no mocks. Facades → unit tests
with mocked api service. Critical paths → Playwright in `web-e2e`
(slice acceptance scenarios, DoD п.4). At least one Playwright scenario
must chain steps through **in-app navigation** (routerLink clicks), not
`page.goto()` — a hard reload resets singleton state and masks stale-facade
bugs (S-04 high finding).

## Never introduce

NgRx/store libs · zone.js · item containers · speculative `shared/` ·
two-way binding of business state · template-driven forms · `any` (use
`unknown`) · `mutate` on signals (`set`/`update`). UI kit is fixed by
ADR-0011 (Angular Material) — don't add a second one.
