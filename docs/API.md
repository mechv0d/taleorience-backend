# TaleOrience World Engine — HTTP API Reference

> Compact reference for AI agents building a UI client.
> Base URL: `/api/v1`. All ids are UUIDv4. Timestamps are ISO-8601 strings.
> Errors: `application/problem+json`, shape `{ code, messageKey, params?, path, timestamp }`.
> Success responses are raw JSON entities (no wrapper).

- Swagger UI: `GET /api/v1/docs`
- OpenAPI JSON: `GET /api/v1/openapi.json`
- Health check: none — use `GET /api/v1/projects` with empty body.

---

## 1. Projects

Controller: `ProjectsController` → `@Controller('projects')`

### POST /api/v1/projects
Body: `{ name: string (min 1), description?: string }`
Returns 201: Project entity.
```json
{ "id": "uuid", "name": "...", "description": "...", "bannerAssetId": null,
  "isExample": false, "isReadOnly": false,
  "createdAt": "ISO", "updatedAt": "ISO" }
```

### GET /api/v1/projects
Returns 200: `Project[]`.

### GET /api/v1/projects/:id
Returns 200: Project. 404 `PROJECT_NOT_FOUND`.

### DELETE /api/v1/projects/:id
Returns 200: `{ success: true }`. 404 `PROJECT_NOT_FOUND`.

---

## 2. Game Objects and Pages

Controller: `WorldController` → `@Controller('projects/:projectId')`

### POST /api/v1/projects/:projectId/game-objects
Body: `{ name: string (min 1), parentId?: uuid | null }`
Returns 201: GameObject entity.
```json
{ "id": "uuid", "projectId": "uuid", "parentId": null,
  "name": "...", "icon": null, "sortOrder": 0,
  "createdAt": "ISO", "updatedAt": "ISO" }
```
Side effect: auto-creates a `Main` page for the GameObject.

### GET /api/v1/projects/:projectId/game-objects/:goId/pages
Returns 200: `Page[]` (each: `{ id, projectId, gameObjectId, title, sortOrder, createdAt, updatedAt }`).

### POST /api/v1/projects/:projectId/game-objects/:goId/delete
Returns 200: `{ success: true }`. Cascades: deletes pages and their blocks. 404 `GAME_OBJECT_NOT_FOUND`.

---

## 3. Blocks

All in `WorldController`. Page blocks are ordered by `sortOrder` (0-based).

### POST /api/v1/projects/:projectId/pages/:pageId/blocks
Body: `{ type: enum, data: object }`. Returns 201: Block entity.
`type` enum: `text | image | gallery | quote | callout | divider | table | embed`.

Per-type `data` schema (validated server-side; 400 `INVALID_BLOCK_DATA` on mismatch):

| type | data fields |
|---|---|
| `text` | `content: string` (min 1) — supports `[[GameObject]]` / `[[Name\|alias]]` markdown references |
| `image` | `assetId: uuid`, `caption?: string` |
| `gallery` | `assetIds: uuid[]` (min 1) |
| `quote` | `content: string` (min 1), `attribution?: string` |
| `callout` | `content: string` (min 1), `emoji?: string` |
| `divider` | `{}` |
| `table` | `headers?: string[]`, `rows: string[][]` (default `[]`) |
| `embed` | `url: http(s) url`, `caption?: string` |

Block entity:
```json
{ "id": "uuid", "projectId": "uuid", "pageId": "uuid",
  "type": "text", "data": { ... },
  "sortOrder": 0, "createdAt": "ISO", "updatedAt": "ISO" }
```
Side effect: creates `markdown_references` rows and reindexes search for `text` blocks.

### GET /api/v1/projects/:projectId/pages/:pageId/blocks
Returns 200: `Block[]` sorted by `sortOrder`.

### GET /api/v1/projects/:projectId/blocks/:blockId
Returns 200: Block. 404 `BLOCK_NOT_FOUND`.

### POST /api/v1/projects/:projectId/blocks/:blockId/update
Body: `{ data: object }` (full replacement of block `data`, validated per `type`).
Returns 201: updated Block. 400 `INVALID_BLOCK_DATA`, 404 `BLOCK_NOT_FOUND`.
Side effect: re-syncs references and search index.

### DELETE /api/v1/projects/:projectId/blocks/:blockId
Returns 200: `{ success: true }`. Cascades: removes references + search index rows.
404 `BLOCK_NOT_FOUND`.

### POST /api/v1/projects/:projectId/blocks/:blockId/move
Body: `{ toIndex: number (>= 0) }`. Returns 201: `Block[]` (page order after move).
404 `BLOCK_NOT_FOUND`.

### POST /api/v1/projects/:projectId/blocks/:blockId/duplicate
Body: `{ toIndex?: number }` (default: append). Returns 201: new Block copy.
404 `BLOCK_NOT_FOUND`. Copies references + search index for `text` blocks.

---

## 4. Tags

Controller: `KnowledgeController` → `@Controller('projects/:projectId')`

### POST /api/v1/projects/:projectId/tags
Body: `{ name: string (min 1) }`. Returns 201: Tag `{ id, projectId, name, createdAt, updatedAt }`.
409 `TAG_ALREADY_EXISTS`.

### GET /api/v1/projects/:projectId/tags
Returns 200: `Tag[]`.

### DELETE /api/v1/projects/:projectId/tags/:tagId
Returns 200: `{ success: true }`. 404 `TAG_NOT_FOUND`.

### POST /api/v1/projects/:projectId/game-objects/:goId/tags
Body: `{ name: string }` (creates tag if missing, then attaches). Returns 201: `GameObjectTag`-shaped response.
404 `GAME_OBJECT_NOT_FOUND`.

### GET /api/v1/projects/:projectId/game-objects/:goId/tags
Returns 200: `Tag[]` attached to the GameObject.

### DELETE /api/v1/projects/:projectId/game-objects/:goId/tags/:tagId
Returns 200: `{ success: true }`. 404 `TAG_NOT_FOUND`.

---

## 5. Relations

### POST /api/v1/projects/:projectId/game-objects/:goId/relations
Body: `{ targetGameObjectId: uuid, type: string (min 1) }`.
Returns 201: Relation `{ id, projectId, sourceGameObjectId, targetGameObjectId, type, createdAt }`.
404 `GAME_OBJECT_NOT_FOUND` (source or target).

### GET /api/v1/projects/:projectId/relations
Returns 200: `Relation[]` for the project.

### DELETE /api/v1/projects/:projectId/relations/:relationId
Returns 200: `{ success: true }`. 404 `RELATION_NOT_FOUND`.

---

## 6. References and Search

### GET /api/v1/projects/:projectId/game-objects/:goId/backlinks
Returns 200: `Array<{ referenceId, blockId, pageId, pageTitle, label: string|null }>`.
Lists blocks that link to the GameObject via `[[...]]`.

### GET /api/v1/projects/:projectId/references/resolve?q=<string>&limit=<int 1-100>
Returns 200: `GameObject[]` whose name matches `q` (substring, case-insensitive).

### GET /api/v1/projects/:projectId/search?q=<string>&limit=<int 1-100>
Returns 200: `Array<{ id, projectId, entityType: 'gameObject'|'page'|'block', entityId, text }>`
from the search index (text blocks, game object names, page titles).

---

## 7. Assets

Controller: `AssetsController` → `@Controller('projects/:projectId/assets')`

### GET /api/v1/projects/:projectId/assets
Returns 200: `Asset[]`.
```json
{ "id": "uuid", "projectId": "uuid", "folderId": null, "type": "image",
  "path": "...", "mimeType": "...", "size": 0, "width": null, "height": null,
  "metadata": {}, "usageCount": 0, "createdAt": "ISO", "updatedAt": "ISO" }
```

### POST /api/v1/projects/:projectId/assets
Multipart/form-data: file field + optional `folderId` field.
Returns 201: Asset. Errors: 400 `FILE_REQUIRED`, `UNSUPPORTED_MIME_TYPE`, `FILE_TOO_LARGE` (10 MB max).
Image types get thumbnails.

### GET /api/v1/projects/:projectId/assets/:assetId
Returns 200: Asset metadata. 404 `ASSET_NOT_FOUND`.

### PATCH /api/v1/projects/:projectId/assets/:assetId
Body: `{ folderId?: uuid|null, metadata?: object }`. Returns 200: updated Asset.

### GET /api/v1/projects/:projectId/assets/:assetId/content
Returns raw file bytes with `content-type` / `content-length` headers.

### GET /api/v1/projects/:projectId/assets/:assetId/thumbnail
Returns thumbnail bytes. 404 if not available.

### DELETE /api/v1/projects/:projectId/assets/:assetId
Returns 201: `{ success: true }`. 409 `ASSET_IN_USE` when `usageCount > 0`.

### Asset Folders (`AssetFoldersController` → `@Controller('projects/:projectId/asset-folders')`)

### GET /api/v1/projects/:projectId/asset-folders
Returns 200: `AssetFolder[]` = `{ id, projectId, parentId, name, createdAt, updatedAt }`.

### POST /api/v1/projects/:projectId/asset-folders
Body: `{ name: string, parentId?: uuid|null }`. Returns 201: AssetFolder.

### DELETE /api/v1/projects/:projectId/asset-folders/:folderId
Returns 201: `{ success: true }`. Errors: 409 `FOLDER_NOT_EMPTY`, `FOLDER_HAS_CHILDREN`.

---

## 8. Error codes (Problem Details)

Common HTTP statuses: 400 validation/DomainError, 404 not found, 409 conflict, 500 internal.

Frequent codes: `PROJECT_NOT_FOUND`, `GAME_OBJECT_NOT_FOUND`, `PAGE_NOT_FOUND`,
`BLOCK_NOT_FOUND`, `INVALID_BLOCK_DATA`, `TAG_ALREADY_EXISTS`, `TAG_NOT_FOUND`,
`RELATION_NOT_FOUND`, `ASSET_NOT_FOUND`, `ASSET_IN_USE`, `FOLDER_NOT_EMPTY`,
`FOLDER_HAS_CHILDREN`, `FILE_REQUIRED`, `FILE_TOO_LARGE`, `UNSUPPORTED_MIME_TYPE`,
`LOCALE_NOT_FOUND`, `INVALID_LOCALE`, `NOT_FOUND` (unknown route), `INTERNAL_ERROR`.

`messageKey` maps to `locales/{lang}/errors.json`; UI can localize via that key.

---

## 9. Runtime model (what the UI must render)

- `Project` → tree of `GameObject` (hierarchy via `parentId`, ordered by `sortOrder`).
- Each `GameObject` → one or more `Page` (first is `Main`), ordered by `sortOrder`.
- Each `Page` → ordered list of `Block` (by `sortOrder`).
- `Block.data` is a JSON blob whose shape depends on `Block.type` (see section 3).
- `[[Name]]` in a `text` block is an internal link resolved to a GameObject.