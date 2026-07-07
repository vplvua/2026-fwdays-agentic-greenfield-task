# ADR — Сервіс-деск Mini (POC агентної розробки)

> Реєстр інженерних рішень POC. Формат — **MADR**; нумерація `ADR-NNNN`; статуси
> **Proposed → Accepted → Superseded**. ADR **незмінні** — зміну оформлюємо новим ADR.
> Простір номерів **окремий** від реєстру основного проєкту (репозиторій
> `service-desk-prd`, тека `adr/`) — збіг номерів нічого не означає.
>
> **Межі:** ADR — лише інженерні рішення. Продуктові рішення фіксуються записом `Р-`
> у [журналі](../assumptions-open-questions.md) + правкою [PRD](../PRD.md) (Р-10);
> в ADR вони не переносяться.

## Реєстр

| ADR | Назва | Статус | Трасування |
|---|---|---|---|
| [0001](./ADR-0001-inherit-parent-stack.md) | Успадкування стеку основного проєкту (Nx · Angular · NestJS · Prisma · MySQL) | Accepted | TC-STACK-01 · BC-GOAL-01 |
| [0002](./ADR-0002-single-container.md) | Один сервіс, один контейнер: NestJS роздає статику SPA | Accepted | TC-STACK-02 · NFR-SEC-01 |
| [0003](./ADR-0003-local-attachment-storage.md) | Вкладення на локальному диску (Railway Volume) | Accepted | TC-MEDIA-01 · NFR-STOR-01 · NFR-REL-01 |
| [0004](./ADR-0004-otp-turbosms-mysql-store.md) | OTP: TurboSMS + dev-фолбек; транзитний стор — таблиця MySQL | Accepted | TC-AUTH-01 · FR-AUTH-01…04 · BC-COST-01 |
| [0005](./ADR-0005-environments-deploy.md) | Середовища й деплой: local + prod, Docker-образ на Railway | Accepted | TC-OPS-01 · BC-COST-01 |
| [0006](./ADR-0006-fallow-static-verification.md) | Незалежна статична верифікація коду агентів: fallow (CLI + MCP) | Accepted | BC-PRIN-01 · BC-GOAL-01 |
| [0007](./ADR-0007-openspec-sdd-workflow.md) | OpenSpec як робочий шар SDD: ієрархія правди та цикл слайсу | Accepted | BC-GOAL-01 · BC-PRIN-01 · Р-01 |

## Зведений стек (з ADR)

- **Монорепо:** Nx (`apps/web` Angular + `apps/api` NestJS + `libs/*` спільні типи/DTO).
- **Фронтенд:** Angular SPA (CSR), мобільний-пріоритет.
- **Бекенд:** TypeScript · NestJS · Prisma (+ Prisma Migrate) · MySQL.
- **API:** REST/JSON + OpenAPI (генерується з коду).
- **Автентифікація:** OTP по SMS (TurboSMS), сесія в httpOnly cookie; стор OTP — таблиця MySQL.
- **Вкладення:** локальний диск → Railway Volume; роздача через API з перевіркою власника.
- **Розгортання:** один Docker-образ (API + статика SPA) на Railway; середовища — local + prod.
