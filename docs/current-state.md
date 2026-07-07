# Current State (2026-07-08, 01:15 Kyiv)

> Persistent memory bank: відбиток поточного стану, **не лог**. Оновлюється
> наприкінці кожної сесії/зрізу (DoD п.8). Формат фіксований: Phase / Done last
> session / Next 1-2 tasks / Blockers.

## Phase

- S-01 «Хребет застосунку і прод-деплой» завершено; прод живий на Railway,
  далі — S-02 (автентифікація OTP)

## Done last session

- S-01 повністю: Prisma 7 + MySQL (порожня baseline-міграція, migrate deploy
  на старті контейнера), `GET /api/health` (200/503 за станом БД),
  NestJS роздає SPA-статику (ADR-0002), hello-сторінка на Angular Material
  (ADR-0011, В-01 закрито), Dockerfile (multi-stage), `npm run dev`
- Прод на Railway: https://app-production-1adaf.up.railway.app — SPA + health
  зелений, MySQL по приватній мережі, Volume `/data` під S-07, daily backups
  увімкнено; конфіг — `railway.json`
- Тести: unit (api 4, web 7), api-e2e (2), web-e2e (4 сценарії × 3 браузери)
- Adversarial-ревʼю slice-reviewer (ADR-0010): BLOCK → 2 high виправлено
  (prisma generate у `npm run dev`; застарілий api-e2e скафолд), medium/low
  диспозиції — у ретро `docs/cycles/S-01.md`
- Важливі граблі (закріплено в design.md зрізу): MySQL 8 `caching_sha2` +
  mariadb-драйвер потребує `allowPublicKeyRetrieval` (інакше pool не
  відновлюється після рестарту БД); nxE2EPreset падає під ESM-лоадером
  Playwright — конфіг web-e2e без пресета

## Next 1-2 tasks

- [ ] `/opsx:propose` S-02 «Автентифікація OTP» (user, otp_code, TurboSMS +
      dev-фолбек, сесія в httpOnly cookie — ADR-0004)
- [ ] Процесний трек (опційно): лінтер `tools/check-docs.py` + скіл
      `/record-decision`

## Blockers

- (none). Локальна особливість машини: порт 3000 періодично зайнятий іншим
  проєктом (`~/Projects/cabinet`) — зупиняти його під час роботи тут
