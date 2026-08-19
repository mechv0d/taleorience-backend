# UI Agent Brief — TaleOrience World Engine

> This file is a **brief for an AI agent** that will build a UI client for this backend.
> Read `docs/API.md` (exact HTTP contract) and `docs/PLAN_WORLD_BUILDING_SERVICE.md`
> (product vision) together with this brief. Do not invent endpoints or data shapes —
> trust `docs/API.md` over anything you infer.

---

## 1. What this service is

TaleOrience is a **local-first worldbuilding platform**. A writer creates a fantasy
world: characters, places, factions, lore. The system organizes everything into a
tree of **GameObjects**, each with **Pages** made of **Blocks** (free-form rich
content), plus **Tags**, **Relations** and internal **References** (wiki links).

Key product principle (from PLAN §1): **free writing beats strict schemas**.
The user starts typing on a blank page; structure (templates, schemas, metadata)
is optional and layered on top — never required upfront.

The backend is a REST API (NestJS + Fastify). It is **stateless HTTP only** — no
websockets, no push. The UI must poll or refetch after mutations.

---

## 2. Core domain model (what the UI renders)

```
Project (one world)
 └── GameObject (tree node: characters, locations, factions…)
      ├── parentId → hierarchy (children ordered by sortOrder)
      ├── Page[] (first page auto-created as "Main")
      │    └── Block[] (ordered by sortOrder)
      ├── Tag[] (knowledge layer)
      └── Relation[] (links to other GameObjects)
```

- **GameObject** = a node in the world tree. `{ id, projectId, parentId, name, icon, sortOrder, ... }`.
  Fetch all objects: `GET /game-objects` (flat, sorted by `sortOrder`); fetch the
  navigation tree: `GET /game-objects/tree` (nested `{ ...GameObject, children: [] }`).
- **Page** = a document owned by a GameObject. `{ id, projectId, gameObjectId, title, sortOrder, ... }`.
- **Block** = a content unit inside a Page. `{ id, projectId, pageId, type, data, sortOrder, ... }`.
  `data` is a JSON object whose shape depends on `type`.
- **Tag** = simple project-scoped label. `{ id, projectId, name }`.
- **Relation** = directed link `source → target` with a free-form `type` string.
- **Reference** (derived, read-only) = a `[[Name]]` inside a `text` block that
  points to a GameObject; drives the backlinks panel.

Block types (MVP, from PLAN §37): `text`, `image`, `gallery`, `quote`, `callout`,
`divider`, `table`, `embed`. **Markdown is written inside a `text` block** — there
is no separate "markdown block" type.

---

## 3. Reference handling (important — easy to get wrong)

- Inside a `text` block's `data.content`, the syntax `[[GameObjectName]]` or
  `[[GameObjectName|alias]]` is a **wiki link**.
- The backend parses these automatically and creates `Reference` rows + a search
  index entry. The UI does **not** send references; it only sends raw `content`.
- The UI should **render** `[[...]]` as clickable links and provide an
  autocomplete (endpoint: `GET /references/resolve?q=...`).
- Backlinks: `GET /game-objects/:goId/backlinks` lists blocks that link to a GameObject.

---

## 4. MVP scope (PLAN §36–38) — what to build now

Main user journey to support:

```
Create Project → Create GameObject (auto Main Page) → Write Markdown →
Add Image → Add another Block → Create another Page → Add Tags →
Create Reference → Search
```

Required UI areas:

1. **Project list** (create / open / delete).
2. **Left panel**: GameObject tree (hierarchy, expand/collapse, create/delete).
3. **Center**: Page tabs; Page = ordered list of Blocks; block editing for all 8 types;
   add/duplicate/move/delete blocks.
4. **Right panel (Inspector)**: GameObject tags, relations, backlinks.
5. **Search** box (PLAN §38: left panel bottom).

Layout target (PLAN §38): `Top Bar | GameObject Tree | Page | Inspector` — must
adapt responsively (tablet/mobile).

Explicitly **out of MVP** (PLAN §47): strict schemas, ECS UI, AI, real-time
collaboration, comments, ratings, timelines, templates (see §5).

---

## 5. How to read docs/PLAN_WORLD_BUILDING_SERVICE.md

The plan is a **vision document**, not an API spec. It describes the ideal product
in Russian. Sections 1–35 define concepts and architecture; sections 36–47 define
the MVP; sections 48+ are future ideas (SaaS, collaboration, AI). Build against
**MVP sections only** and against the **actual HTTP API** in `docs/API.md`.

Quick section map:

| § | Topic | Meaning for the UI |
|---|---|---|
| 1 | Product principles | Free writing first; structure is optional |
| 2 | Protocol/contracts | Desired client<->engine contract (concept) |
| 3 | Architecture layers | UI → Application → World Engine → Persistence |
| 4 | UI Layer | UI only renders + edits; never mutates internal collections directly |
| 5 | Application Layer | Commands/queries layer (create, move, update…) |
| 6 | World Engine | Central business model (Project/GameObject/Page/Block/…) |
| 7–9 | Runtime storage & dictionaries | Concept: runtime Map<Guid,Entity>; persistence is an implementation detail |
| 10 | GameObject | Tree node, appears in left nav |
| 11 | Page | Belongs to GameObject; auto "Main" page; holds Blocks |
| 12–14 | Block / TextBlock | Content units; markdown lives in text blocks |
| 15–17 | Asset / Asset Browser / Banner | Media library; banner = asset reference |
| 18–19 | Inspector / InspectorBlock | Right panel metadata (later) |
| 20 | Tags | Project-scoped labels |
| 21 | Relations | Directed links between GameObjects |
| 22 | Markdown References | `[[Name]]` wiki links + backlinks |
| 23–26 | Templates | Page/GameObject templates (post-MVP) |
| 27–30 | Schemas, ECS | Explicitly NOT MVP |
| 31 | Domain invariants | Rules the backend enforces |
| 32–33 | Undo/Redo, Events | Future |
| 34–35 | Persistence, DB structure | Backend concern |
| 36 | MVP | The main user journey to support |
| 37 | MVP Block types | The 8 block types |
| 38 | MVP navigation | Layout: Tree | Page | Inspector |
| 39–46 | User stories | Functional requirements per area (MVP) |
| 47 | Not in MVP | Do not build these now |
| 48+ | PWA, self-hosting, SaaS, collab, AI, schemas | Future, ignore for now |

---

## 6. Local development (UI)

Backend runs on `http://localhost:4000` (env `PORT`, default 4000). No auth in
`local` mode (`AUTH_MODE=none`). Two ways to run it:

- **Docker (recommended for UI dev):**
  ```bash
  docker compose up --build
  # API: http://localhost:4000/api/v1
  # Swagger: http://localhost:4000/api/v1/docs
  ```
- **From source:** `pnpm install && pnpm build`, then `pnpm --filter @taleorience/api start:prod`
  (SQLite file created under `apps/api/data/`).

Persisted state: SQLite volume + local storage volume (see `docker-compose.yml`).
CORS: currently not configured for browser origins — the UI dev server may need a
proxy (e.g. Vite `server.proxy` → `http://localhost:4000`) to avoid CORS issues.

---

## 7. Anti-hallucination rules for the UI agent

1. **Never invent endpoints.** Every URL you call must exist in `docs/API.md`.
2. **Never invent `data` shapes.** Block `data` must match the table in `docs/API.md` §3.
3. **Never send references/tags/relations "inferred" fields** that the backend
   derives — send only what the request body in `docs/API.md` specifies.
4. **Status codes matter.** POST create → 201, POST update → 201, PATCH → 200,
   DELETE → 200/201 with `{ success: true }`. Errors are Problem Details
   (`{ code, messageKey, ... }`); use `messageKey` for i18n, do not hardcode strings.
5. **Ids are UUIDs.** All path params are UUIDv4.
6. **Ordering**: blocks/pages/game-objects come sorted by `sortOrder` from the
   backend; re-sort client-side defensively.
7. **No optimistic offline sync** — the backend is the single source of truth.
8. If something is unclear, prefer `docs/API.md` + `locales/*/errors.json` over guesses.