# Current State (2026-07-08, ранок)

> Persistent memory bank: відбиток поточного стану, **не лог**. Оновлюється
> наприкінці кожної сесії/зрізу (DoD п.8). Формат фіксований: Phase / Done last
> session / Next 1-2 tasks / Blockers.

## Phase

- S-02 «Автентифікація OTP» завершено (вхід за телефоном через SMS-код,
  сесія 30 днів, guard на всі ендпоінти); далі — S-03 «Довідник будинків»,
  перед ним — процесний трек В-04 (design-check у verify)

## Done last session

- S-02 повністю: Prisma-моделі `user`/`otp_code`/`session`; ендпоінти
  request-otp / verify-otp / logout / me (+PATCH імені); ліміти 1/60с і
  5/добу, ≤5 спроб на код — на бекенді (NFR-SEC-02); коди — лише
  HMAC-SHA256-хеші; сесія в httpOnly+Lax cookie (Secure на проді);
  глобальний SessionGuard з @Public()-алоулистом (secure-by-default)
- SMS: інтерфейс `SmsSender` — TurboSMS на проді (fail-fast без токена),
  dev-фолбек повертає `devCode` у відповіді (ADR-0004, нуль SMS у тестах)
- Web: /login (телефон → код, помилки українською), AuthFacade на сигналах,
  authGuard + 401-інтерсептор, профіль (імʼя, «Вийти») на домашній
- Тести: api unit 57, web unit 23, api-e2e 17, Playwright 33 (11×3 браузери)
- Adversarial-ревʼю (ADR-0010): BLOCK → 2 high (TOCTOU rate-limit,
  неатомарний лічильник спроб) виправлено per-phone KeyedMutex + atomic
  increment; конкурентні регресії в unit та api-e2e
- Прод: задеплоєно на Railway з TurboSMS (env: AUTH_SECRET, TURBOSMS_TOKEN,
  SMS_MODE=turbosms; fail-fast без токена перевірено наживо — перший деплой
  впав, поки staged-змінні не застосували в дашборді). Прод-перевірки:
  health ok, guard 401, валідація 400. Launch-and-look локально пройдено
  очима (вхід/імʼя/вихід); SMS-вхід на проді — підтвердження користувача
  на власному номері

## Next 1-2 tasks

- [ ] Процесний трек В-04 (**перед S-03**, рішення ретро S-01): design-check
      у `verify` — перевірка, що UI-код використовує токени теми Material
      (`var(--mat-sys-*)`) замість хардкоду кольорів/розмірів
- [ ] `/opsx:propose` S-03 «Довідник будинків» (FR-HOUSE-01/02,
      FR-ACCESS-01, NFR-SEC-03 — перше справжнє доменне CRUD з ізоляцією)

## Blockers

- (none). Локальна особливість машини: порт 3000 періодично зайнятий іншим
  проєктом (`~/Projects/cabinet`) — зупиняти його під час роботи тут
- ⚠ Робоча гілка — **`service-desk-mini`** (ADR-0012): `main` дзеркалить
  стартер курсу, проєктні коміти в нього не йдуть
