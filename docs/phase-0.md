# Phase 0 — Foundation

Phase 0 содержит базовый backend skeleton без бизнес-функциональности мира.

## Реализовано

- pnpm workspace;
- apps/api NestJS + Fastify;
- config validation через Zod;
- problem+json error contract;
- localization manifest и locale namespace endpoint;
- system health/version/info/client-config endpoints;
- unit test для env validation;
- e2e tests для Phase 0 API;
- CI workflow;
- release workflow.

## Архитектурные правила

- Ошибки возвращают messageKey, не hardcoded text.
- Конфигурация валидируется на старте.
- API использует global prefix /api/v1.
- Localization endpoint не позволяет читать произвольные файлы.
- Domain errors используют единый problem+json формат.

## Что дальше

Phase 1:
- Project;
- GameObject;
- Page;
- Block;
- SQLite persistence;
- repositories;
- domain events.