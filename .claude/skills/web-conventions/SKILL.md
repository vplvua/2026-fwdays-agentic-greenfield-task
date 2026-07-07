---
name: web-conventions
description: Angular frontend conventions for web/ — component layers, signals+facades state, folder structure, naming. Read BEFORE creating or modifying any Angular component, service, or route in web/src.
---

# Web (Angular) Conventions

Fixed by ADR-0009. The app is **Angular 21, standalone, zoneless** (no
zone.js) — never rely on zone-based change detection. Small app (5 screens),
so the architecture is deliberately two layers, not more (BC-PRIN-01).

## Component layers

Two kinds of components, nothing else:

- **Container** (page or section): injects the feature facade via
  `inject()`, wires data down and events up, handles loading/error/empty
  states. Routed pages are containers. Max 2 container levels
  (page → section); no "item containers".
- **Presentational**: ALL data via `input()` signals, ALL events via
  `output()`. No injected services. Local UI state (hover, expanded, menu
  open) is allowed as local `signal`s; business data and loading state are
  NOT.

Rules for both: `ChangeDetectionStrategy.OnPush` always; native control
flow (`@if`/`@for` with `track`); no direct DOM manipulation; user-facing
strings in Ukrainian.

## State: signals + facades (no NgRx)

Per feature, in `features/<feature>/data/`:

- **Api service** — thin HttpClient wrapper for the feature's endpoints,
  returns typed DTOs.
- **Facade** — one injectable per feature: private writable `signal`s,
  public `computed`/readonly signals, methods for every user action
  (they call the api service and update state). Components never touch
  HttpClient or writable signals directly.

```ts
@Injectable({ providedIn: 'root' })
export class HousesFacade {
  private readonly api = inject(HousesApi);
  private readonly state = signal<{
    houses: House[];
    loading: boolean;
    error: string | null;
  }>({
    houses: [],
    loading: false,
    error: null,
  });

  readonly houses = computed(() => this.state().houses);
  readonly loading = computed(() => this.state().loading);

  async load(): Promise<void> {
    /* set loading, call api, update state, handle error */
  }
}
```

## Folder structure

```
web/src/app/
├── core/                    # app shell, auth guard/interceptor — singletons
├── features/
│   └── <feature>/           # auth, houses, tickets, ticket-list, ...
│       ├── <feature>-page.ts        # routed page container
│       ├── containers/              # section containers (if any)
│       ├── components/              # presentational
│       ├── data/                    # facade + api service + models
│       └── <feature>.routes.ts      # lazy-loaded via loadChildren
└── shared/                  # ONLY once used by 2+ features
```

No `libs/` for web code until a second consumer exists.

## Naming (Angular 21 style, matches the scaffold)

- Files: kebab-case, **no** `.component`/`.service` suffixes (`app.ts`,
  `houses-page.ts`, `house-card.ts`, `houses-facade.ts`).
- Classes: role as suffix in the name — `HousesPage`, `HouseCard`,
  `HousesFacade`, `HousesApi`.
- Selectors: `app-` prefix, kebab-case (enforced by eslint).
- Signal names: nouns (`houses`, `loading`), no `$` suffixes.

## Data flow (memorize)

facade signals → container → `input()` → presentational → `output()` →
container → facade method. Only containers call facade methods.

## Testing

- Presentational: plain component tests via inputs/outputs, no mocks.
- Facades: unit tests with a mocked api service.
- Critical paths: Playwright specs in `web-e2e` (slice acceptance
  scenarios, DoD п.4).

## What NOT to introduce

NgRx or any store lib; zone.js; item containers; `shared/` "just in case";
`libs/*` for a single consumer; two-way binding of business state;
`.component.ts` suffixes. The UI kit is decided in S-01 (В-01) — follow
whatever ADR records it, don't add a second one.
