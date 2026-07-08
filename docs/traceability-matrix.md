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
| FR-AUTH-01 | S-02 | [otp-auth](../openspec/specs/otp-auth/spec.md) «OTP can be requested…», «…creates the account on first login» | `otp.service.spec.ts` · `phone.spec.ts` · `api-e2e/auth.spec.ts` · `web-e2e/s02-otp-auth.spec.ts` (happy path) | вхід новим номером: локально + прод із реальним SMS, підтверджено користувачем (2026-07-08) |
| FR-AUTH-02 | S-02 | [otp-auth](../openspec/specs/otp-auth/spec.md) «Failed verification attempts are limited», TTL/single-use сценарії | `otp.service.spec.ts` (TTL, спроби, reuse) · `api-e2e/auth.spec.ts` | 6-й неправильний код → нова помилка: локально (2026-07-08) |
| FR-AUTH-03 | S-02 | [otp-auth](../openspec/specs/otp-auth/spec.md) «OTP sending is rate-limited server-side» | `otp.service.spec.ts` · `api-e2e/auth.spec.ts` (60s, daily) · `web-e2e/s02-otp-auth.spec.ts` (повідомлення) | повторний запит &lt;60с → зрозуміла помилка: локально (2026-07-08) |
| FR-AUTH-04 | S-02 | [otp-auth](../openspec/specs/otp-auth/spec.md) «Session is a durable httpOnly cookie with explicit logout» | `session.service.spec.ts` · `api-e2e/auth.spec.ts` (30d, logout) · `web-e2e/s02-otp-auth.spec.ts` (reload, «Вийти») | сесія живе після перезавантаження; «Вийти» працює: локально (2026-07-08) |
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
| NFR-SEC-01 | S-02 | [otp-auth](../openspec/specs/otp-auth/spec.md) «Session is a durable httpOnly cookie…», «Phones and codes never appear in logs…» | `api-e2e/auth.spec.ts` (атрибути cookie, hash у БД) · `session.service.spec.ts` (token hash) | смок: `otp_code.code_hash`/`session.token_hash` — лише хеші (2026-07-08) |
| NFR-SEC-02 | S-02 | [otp-auth](../openspec/specs/otp-auth/spec.md) — усі ліміти в сценаріях API-рівня | `api-e2e/auth.spec.ts` — ліміти через прямі HTTP-виклики, повз UI | curl повз UI → 429/400: локально (2026-07-08) |
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
| 2026-07-08 | **v1.2:** S-02 закрито — заповнено FR-AUTH-01…04, NFR-SEC-01/02; spec `otp-auth`; demo checks локальні, прод — після деплою з TurboSMS. |
