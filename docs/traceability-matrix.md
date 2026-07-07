# Traceability Matrix — Сервіс-деск Mini (POC)

> **Версія:** 1.0 · **Створено:** 2026-07-07
> Трасування вимог [PRD](./PRD.md) (v1.2): FR/NFR → зріз ([план](./mvp-capability-plan.md)) →
> openspec-специфікація → тест → demo check (launch-and-look, DoD п.6).
> Оновлюється в DoD кожного зрізу (п.8). `—` = ще не покрито.
>
> Наскрізні вимоги (FR-ACCESS-01, NFR-SEC-03) мають первинний зріз S-03; кожен
> наступний зріз додає перевірку ізоляції для своїх обʼєктів.

| Код | Зріз | Spec (openspec) | Тест | Demo check |
|---|---|---|---|---|
| FR-AUTH-01 | S-02 | — | — | — |
| FR-AUTH-02 | S-02 | — | — | — |
| FR-AUTH-03 | S-02 | — | — | — |
| FR-AUTH-04 | S-02 | — | — | — |
| FR-HOUSE-01 | S-03 | — | — | — |
| FR-HOUSE-02 | S-03 | — | — | — |
| FR-TICKET-01 | S-04 | — | — | — |
| FR-TICKET-02 | S-04 | — | — | — |
| FR-TICKET-03 | S-05 | — | — | — |
| FR-TICKET-04 | S-04 | — | — | — |
| FR-STATUS-01 | S-05 | — | — | — |
| FR-STATUS-02 | S-05 | — | — | — |
| FR-STATUS-03 | S-05 | — | — | — |
| FR-DUE-01 | S-05 | — | — | — |
| FR-DUE-02 | S-06 | — | — | — |
| FR-FEED-01 | S-05 | — | — | — |
| FR-FEED-02 | S-05 | — | — | — |
| FR-ATTACH-01 | S-07 | — | — | — |
| FR-ATTACH-02 | S-07 | — | — | — |
| FR-ATTACH-03 | S-07 | — | — | — |
| FR-LIST-01 | S-06 | — | — | — |
| FR-LIST-02 | S-06 | — | — | — |
| FR-LIST-03 | S-06 | — | — | — |
| FR-LIST-04 | S-06 | — | — | — |
| FR-ACCESS-01 | S-03 (наскрізно S-04…S-07) | — | — | — |
| NFR-PERF-01 | S-06 | — | — | — |
| NFR-SEC-01 | S-02 | — | — | — |
| NFR-SEC-02 | S-02 | — | — | — |
| NFR-SEC-03 | S-03 (наскрізно S-04…S-07) | — | — | — |
| NFR-SEC-04 | S-01 | [app-skeleton](../openspec/specs/app-skeleton/spec.md) «Production deploy … env vars» | ручна: у репо лише `.env.example` | Railway Variables; секрети відсутні в git |
| NFR-REL-01 | S-01 | [app-skeleton](../openspec/specs/app-skeleton/spec.md) «Production deploy …» (backups) | — (налаштування платформи) | Railway MySQL → Backups: daily увімкнено (2026-07-08) |
| NFR-STOR-01 | S-07 | — | — | — |
| NFR-COMPAT-01 | S-06 | — | — | — |
| NFR-OBS-01 | S-01 (health) · S-08 (логи) | [app-skeleton](../openspec/specs/app-skeleton/spec.md) «Health endpoint …» | `health.controller.spec.ts` · `api-e2e/api.spec.ts` · `web-e2e/s01-walking-skeleton.spec.ts` | прод `/api/health` → 200 ok/up (2026-07-08) |

## Журнал змін

| Дата | Зміна |
|---|---|
| 2026-07-07 | **v1.0:** створено скелет з усіма FR/NFR PRD v1.2 і мапінгом на зрізи S-01…S-08. |
| 2026-07-08 | **v1.1:** S-01 закрито — заповнено NFR-SEC-04, NFR-REL-01, NFR-OBS-01 (health-частина); spec `app-skeleton` заархівовано в `openspec/specs/`. |
