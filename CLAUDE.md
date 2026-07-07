# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Homework for the fwdays course "Agentic Engineering: Greenfield". The project being built here is **Сервіс-деск Mini** — a minimal service-desk app (tickets for building residents) that is itself a POC of spec-driven, agent-driven development. The point is the _process_ (specs, agent cycles, verification, maker ≠ checker), not product size. Submission happens via a PR to the upstream repo reviewed by CodeRabbit (`.coderabbit.yaml`, PR template in `.github/`).

The code is currently a fresh Nx scaffold (hello-world Angular app + NestJS API). Implementation proceeds in planned agent cycles — see below.

## Docs are normative (SDD)

All product/engineering decisions live in `docs/` (written in Ukrainian) and drive the implementation:

- `docs/PRD.md` — requirements with stable codes: `FR-*` (functional), `NFR-*` (non-functional), `TC-*` (technical constraints), `BC-*` (business constraints). Every requirement is normative and testable.
- `docs/agent-plan.md` — the 7 agent cycles Е-1…Е-7 (scaffold+deploy → OTP auth → houses+tickets → status lifecycle+feed → list/filters → photo attachments → polish/retro). Cycle order is fixed; each cycle ends deployed to prod with metrics recorded. If scope doesn't fit a cycle, cut features — don't stretch the cycle.
- `docs/adr/` — MADR-format ADRs, immutable (change = new ADR). Engineering decisions go here; product decisions go as `Р-` entries in `docs/assumptions-open-questions.md` plus a PRD edit with changelog bump.
- `docs/glossary.md` — single source of terminology.

Key architecture decisions already fixed by ADRs (don't re-decide them):

- **ADR-0001**: Nx monorepo; Angular SPA frontend; NestJS + Prisma backend; REST/JSON + OpenAPI; MySQL.
- **ADR-0002**: single service, single container — NestJS serves the SPA static files; no reverse proxy.
- **ADR-0003**: attachments on local disk (Railway Volume), served only through the API with owner checks; single app instance.
- **ADR-0004**: auth is OTP via SMS (TurboSMS) only, no passwords; OTP store is a MySQL table; dev/test mode logs the code instead of sending SMS; session in httpOnly cookie.
- **ADR-0005**: environments are local + prod only; deploy is a Docker image on Railway; secrets only via env vars.

Domain model in brief: personal workspace per user (no orgs/roles — owner sees only their own data, foreign/missing objects return 404-style), houses directory, tickets with a 5-status lifecycle (Нова → В роботі → Виконана → Закрита, plus Відхилена; only transitions from PRD §5.1 are allowed), a single append-only feed per ticket (user notes + system events), photo attachments.

## Workspace layout

Nx monorepo (plugins infer targets; see `nx.json`):

- `api/` — NestJS app, built with webpack, listens on `PORT` (default 3000) with global prefix `/api`.
- `web/` — Angular 21 app (standalone components, SCSS), dev server on 4200.
- `api-e2e/` — Jest + axios tests against the running API; `nx e2e api-e2e` builds and starts the API itself (dependsOn `api:serve`).
- `web-e2e/` — Playwright (chromium/firefox/webkit); its `webServer` starts `nx run web:serve` automatically, reuses an existing one.

## Commands

```sh
npx nx serve api            # NestJS at http://localhost:3000/api
npx nx serve web            # Angular at http://localhost:4200
npx nx build api|web
npx nx lint api|web|api-e2e|web-e2e
npx nx test api             # Jest unit tests
npx nx test web             # Angular unit tests (vitest-based @angular/build:unit-test)
npx nx e2e api-e2e          # starts API itself, then runs Jest+axios specs
npx nx e2e web-e2e          # Playwright, starts web dev server itself
npx nx run-many -t lint test build   # everything
```

Single test file: `npx nx test api -- app.controller` (positional Jest pattern). For Playwright: `npx nx e2e web-e2e -- --grep "name"`.

## Conventions

- Language split: git commits, code comments, and internal docs (this file included) are in **English**; project documentation in `docs/` (PRD, ADRs, glossary, journal) and user-facing text are in **Ukrainian**. CodeRabbit reviews in Ukrainian.
- Prettier: single quotes (`.prettierrc`); ESLint flat config with Nx module-boundary rules.
- When making a product decision, record it as a `Р-` entry in `docs/assumptions-open-questions.md` and update the PRD changelog; engineering decisions get a new ADR in `docs/adr/` plus a row in its README registry. Assumptions are `П-`, open questions `В-`.
- Cost/simplicity constraints are binding: `BC-PRIN-01` "no more complex than a notebook" and `BC-GOAL-01` scope must fit ≤7 cycles.
