# Current State (2026-07-09)

> Persistent memory bank: відбиток поточного стану, **не лог**. Оновлюється
> наприкінці кожної сесії/зрізу (DoD п.8). Формат фіксований: Phase / Done last
> session / Next 1-2 tasks / Blockers.

## Phase

- S-07 «Фото-вкладення» завершено (аплоад/перегляд/видалення фото з
  файлами на Railway Volume і роздачею лише через API); далі — S-08
  «Поліровка, наскрізна перевірка, ретроспектива POC»

## Done last session

- Р-13 (закрито В-02): вкладення — лише JPEG/PNG/WebP, HEIC відхиляється;
  правка FR-ATTACH-01, PRD v1.4 (iPhone Safari сам конвертує HEIC→JPEG
  при аплоаді через accept-фільтр)
- API: модуль attachments — multipart-аплоад (multer memory storage,
  `defParamCharset: 'utf8'` для кириличних імен) з валідацією заявленого
  MIME **і** магічних байтів, ≤10 МБ, ≤10 на заявку; метадані-список;
  стрімінг binary (RFC 5987 inline-ім'я, `Cache-Control: private`);
  видалення; події `ATTACHMENT` у стрічці атомарно з рядком; 404-парність
  всюди, включно з відсутнім файлом на диску; 413 від multer перемаплено
  в `{ code: ATTACHMENT_TOO_LARGE }` (як і LIMIT_UNEXPECTED_FILE → 400)
- БД/диск: таблиця `attachment` (UUID-ім'я на диску unique, оригінальне
  ім'я лише в БД), `ATTACHMENT` у `TicketEventField`;
  `ATTACHMENTS_DIR` — prod fail-fast, dev-дефолт `.data/attachments`
- Web: секція «Фото» в картці — грід мініатюр (CSS-масштаб оригіналу,
  lazy), аплоад з accept-фільтром і клієнтськими пре-чеками (сервер —
  межа виконання), повний розмір у діалозі, видалення через спільний
  confirm-dialog (переїхав у `shared/` — другий споживач); речення
  «Додано/Видалено фото …» у стрічці
- Ревʼю (ADR-0010): PASS_WITH_NOTES (4c7c292..f9db528) — medium
  (мутація вкладень комітилась у стан лише після перезавантаження —
  тепер commit-before-reload, як у mutateWithFeed з S-05) і low
  (контракт помилок для LIMIT_UNEXPECTED_FILE) виправлено з тестами
- Тести: api unit 205 (+33), web unit 96 (+16), api-e2e
  73 (+11), Playwright 96 (S-07: 3 сценарії ×3 браузери); смок на
  реальній MySQL+диску: байт-у-байт round-trip, інваріанти БД↔диск,
  рестарт API — файл живий; launch-and-look 390×844 очима — ок
- Прод: `railway up` (пуш у GitHub деплой НЕ тригерить — деплої йдуть
  через CLI); app-volume вже існував з S-01, змонтований на `/data`;
  `ATTACHMENTS_DIR=/data` встановлено; S-04…S-07 задеплоєно, міграції
  застосовані, health зелений. Демо «фото живе після редеплою» на проді
  очима — у S-08 (потрібен реальний SMS-вхід)
- Заархівовано `ticket-attachments`; spec синхронізовано в
  `openspec/specs/ticket-attachments/`, `npx openspec list` порожній

## Next 1-2 tasks

- [ ] `/opsx:propose` S-08 «Поліровка, наскрізна перевірка, ретроспектива
      POC» (NFR-OBS-01 повністю — структуровані логи без PII; traceability
      100%; наскрізний прохід §6 на проді, включно з «фото після
      редеплою» з реальним SMS-входом)
- [ ] У проході S-08: перевірити прод-демо S-02 (SMS) і NFR-STOR-01 очима

## Blockers

- (none)
- ⚠ Робоча гілка — **`service-desk-mini`** (ADR-0012): `main` дзеркалить
  стартер курсу, проєктні коміти в нього не йдуть
- ⚠ Прод-деплой = `railway up` з робочої копії (GitHub-інтеграції немає)
