# Current State (2026-07-07, 16:40 Kyiv)

> Persistent memory bank: відбиток поточного стану, **не лог**. Оновлюється
> наприкінці кожної сесії/зрізу (DoD п.7). Формат фіксований: Phase / Done last
> session / Next 1-2 tasks / Blockers.

## Phase

- Tooling setup завершено (перед S-01): quality gates + SDD-контур готові, зрізи ще не стартували

## Done last session

- fallow: devDependency + MCP + `.fallowrc.json`, ADR-0006; 2 реальні знахідки виправлено
- Quality gates: `npm run verify` (format, lint, typecheck, fallow, openspec, tests, build) + хуки Claude Code (post-edit format/lint, pre-commit verify gate)
- OpenSpec 1.5: init з `/opsx:*`-командами, правила в `openspec/config.yaml`, ADR-0007
- Скіл `/slice-plan` + `docs/mvp-capability-plan.md` v1.1 (S-01…S-08, DoD, аудит agent-plan)
- ADR-0008: trunk-based, без робочих PR; один фінальний PR здачі
- CLAUDE.md консолідовано: handoff protocol, quality gates, slice workflow, скіли
- Tests: verify зелений (unit web/api, build обох, fallow audit clean)

## Next 1-2 tasks

- [ ] `/opsx:propose` S-01 «Хребет застосунку і прод-деплой» (перший зріз)
- [ ] Процесний трек: лінтер `tools/check-docs.py` + скіл `/record-decision` (можна паралельно з S-01)

## Blockers

- (none)
