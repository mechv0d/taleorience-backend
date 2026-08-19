"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAssetDto = exports.CreateAssetFolderDto = exports.UpdateBlockDto = exports.CreateBlockDto = exports.CreateGameObjectDto = exports.CreateProjectDto = void 0;
const zod_1 = require("zod");
// --- Runtime Schemas (для валидации) ---
exports.CreateProjectDto = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().default(''),
});
exports.CreateGameObjectDto = zod_1.z.object({
    name: zod_1.z.string().min(1),
    parentId: zod_1.z.string().uuid().nullable().optional(),
});
exports.CreateBlockDto = zod_1.z.object({
    type: zod_1.z.enum(['text', 'image', 'gallery', 'quote', 'callout', 'divider', 'table', 'embed']),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
});
exports.UpdateBlockDto = zod_1.z.object({
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
});
exports.CreateAssetFolderDto = zod_1.z.object({
    name: zod_1.z.string().min(1),
    parentId: zod_1.z.string().uuid().nullable().optional(),
});
exports.UpdateAssetDto = zod_1.z.object({
    folderId: zod_1.z.string().uuid().nullable().optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
//# sourceMappingURL=dto.js.map