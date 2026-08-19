"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlAssetFolderRepository = exports.SqlAssetRepository = exports.SqlBlockRepository = exports.SqlPageRepository = exports.SqlGameObjectRepository = exports.SqlProjectRepository = exports.DrizzleUnitOfWork = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema = __importStar(require("./schema"));
// --- Unit of Work ---
class DrizzleUnitOfWork {
    db;
    constructor(db) {
        this.db = db;
    }
    async execute(callback) {
        return callback(this.db);
    }
}
exports.DrizzleUnitOfWork = DrizzleUnitOfWork;
// --- Mappers ---
const mapProject = (row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
});
const mapGameObject = (row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
});
const mapPage = (row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
});
const mapBlock = (row) => ({
    id: row.id,
    projectId: row.projectId,
    pageId: row.pageId,
    type: row.type,
    data: JSON.parse(row.dataJson),
    sortOrder: row.sortOrder,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
});
const mapAsset = (row) => ({
    id: row.id,
    projectId: row.projectId,
    folderId: row.folderId,
    type: row.type,
    path: row.path,
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    metadata: JSON.parse(row.metadataJson),
    usageCount: row.usageCount,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
});
const mapAssetFolder = (row) => ({
    id: row.id,
    projectId: row.projectId,
    parentId: row.parentId,
    name: row.name,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
});
// --- Implementations ---
class SqlProjectRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const res = await this.db.select().from(schema.projects).where((0, drizzle_orm_1.eq)(schema.projects.id, id)).get();
        return res ? mapProject(res) : null;
    }
    async findAll() {
        const res = await this.db.select().from(schema.projects).all();
        return res.map(mapProject);
    }
    async save(project) {
        await this.db.insert(schema.projects).values({
            ...project,
            createdAt: project.createdAt.toISOString(),
            updatedAt: project.updatedAt.toISOString(),
        }).onConflictDoUpdate({
            target: schema.projects.id,
            set: {
                name: project.name,
                description: project.description,
                updatedAt: project.updatedAt.toISOString(),
            }
        });
    }
    async delete(id) {
        await this.db.delete(schema.projects).where((0, drizzle_orm_1.eq)(schema.projects.id, id));
    }
}
exports.SqlProjectRepository = SqlProjectRepository;
class SqlGameObjectRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const res = await this.db.select().from(schema.gameObjects).where((0, drizzle_orm_1.eq)(schema.gameObjects.id, id)).get();
        return res ? mapGameObject(res) : null;
    }
    async findByProjectId(projectId) {
        const res = await this.db.select().from(schema.gameObjects).where((0, drizzle_orm_1.eq)(schema.gameObjects.projectId, projectId)).all();
        return res.map(mapGameObject);
    }
    async save(entity) {
        await this.db.insert(schema.gameObjects).values({
            ...entity,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
        }).onConflictDoUpdate({
            target: schema.gameObjects.id,
            set: { name: entity.name, parentId: entity.parentId, updatedAt: entity.updatedAt.toISOString() }
        });
    }
    async delete(id) {
        await this.db.delete(schema.gameObjects).where((0, drizzle_orm_1.eq)(schema.gameObjects.id, id));
    }
}
exports.SqlGameObjectRepository = SqlGameObjectRepository;
class SqlPageRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const res = await this.db.select().from(schema.pages).where((0, drizzle_orm_1.eq)(schema.pages.id, id)).get();
        return res ? mapPage(res) : null;
    }
    async findByGameObjectId(gameObjectId) {
        const res = await this.db.select().from(schema.pages).where((0, drizzle_orm_1.eq)(schema.pages.gameObjectId, gameObjectId)).all();
        return res.map(mapPage);
    }
    async save(entity) {
        await this.db.insert(schema.pages).values({
            ...entity,
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
        }).onConflictDoUpdate({
            target: schema.pages.id,
            set: { title: entity.title, updatedAt: entity.updatedAt.toISOString() }
        });
    }
    async delete(id) {
        await this.db.delete(schema.pages).where((0, drizzle_orm_1.eq)(schema.pages.id, id));
    }
}
exports.SqlPageRepository = SqlPageRepository;
class SqlBlockRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id) {
        const res = await this.db.select().from(schema.blocks).where((0, drizzle_orm_1.eq)(schema.blocks.id, id)).get();
        return res ? mapBlock(res) : null;
    }
    async findByPageId(pageId) {
        const res = await this.db.select().from(schema.blocks).where((0, drizzle_orm_1.eq)(schema.blocks.pageId, pageId)).all();
        return res.map(mapBlock);
    }
    async save(entity) {
        await this.db.insert(schema.blocks).values({
            ...entity,
            dataJson: JSON.stringify(entity.data),
            createdAt: entity.createdAt.toISOString(),
            updatedAt: entity.updatedAt.toISOString(),
        }).onConflictDoUpdate({
            target: schema.blocks.id,
            set: { dataJson: JSON.stringify(entity.data), updatedAt: entity.updatedAt.toISOString() }
        });
    }
    async delete(id) {
        await this.db.delete(schema.blocks).where((0, drizzle_orm_1.eq)(schema.blocks.id, id));
    }
}
exports.SqlBlockRepository = SqlBlockRepository;
class SqlAssetRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id, trx) {
        const db = trx ?? this.db;
        const res = await db.select().from(schema.assets).where((0, drizzle_orm_1.eq)(schema.assets.id, id)).get();
        return res ? mapAsset(res) : null;
    }
    async findByProjectId(projectId, trx) {
        const db = trx ?? this.db;
        const res = await db.select().from(schema.assets).where((0, drizzle_orm_1.eq)(schema.assets.projectId, projectId)).all();
        return res.map(mapAsset);
    }
    async findByFolderId(folderId, trx) {
        const db = trx ?? this.db;
        const res = await db.select().from(schema.assets).where((0, drizzle_orm_1.eq)(schema.assets.folderId, folderId)).all();
        return res.map(mapAsset);
    }
    async save(asset, trx) {
        const db = trx ?? this.db;
        await db.insert(schema.assets).values({
            ...asset,
            metadataJson: JSON.stringify(asset.metadata),
            createdAt: asset.createdAt.toISOString(),
            updatedAt: asset.updatedAt.toISOString(),
        }).onConflictDoUpdate({
            target: schema.assets.id,
            set: {
                folderId: asset.folderId,
                type: asset.type,
                path: asset.path,
                mimeType: asset.mimeType,
                size: asset.size,
                width: asset.width,
                height: asset.height,
                metadataJson: JSON.stringify(asset.metadata),
                usageCount: asset.usageCount,
                updatedAt: asset.updatedAt.toISOString(),
            }
        });
    }
    async delete(id, trx) {
        const db = trx ?? this.db;
        await db.delete(schema.assets).where((0, drizzle_orm_1.eq)(schema.assets.id, id));
    }
    async incrementUsageCount(id, trx) {
        const db = trx ?? this.db;
        const current = await db.select().from(schema.assets).where((0, drizzle_orm_1.eq)(schema.assets.id, id)).get();
        if (current) {
            await db.update(schema.assets).set({
                usageCount: current.usageCount + 1,
                updatedAt: new Date().toISOString()
            }).where((0, drizzle_orm_1.eq)(schema.assets.id, id));
        }
    }
    async decrementUsageCount(id, trx) {
        const db = trx ?? this.db;
        const current = await db.select().from(schema.assets).where((0, drizzle_orm_1.eq)(schema.assets.id, id)).get();
        if (current) {
            await db.update(schema.assets).set({
                usageCount: Math.max(0, current.usageCount - 1),
                updatedAt: new Date().toISOString()
            }).where((0, drizzle_orm_1.eq)(schema.assets.id, id));
        }
    }
}
exports.SqlAssetRepository = SqlAssetRepository;
class SqlAssetFolderRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    async findById(id, trx) {
        const db = trx ?? this.db;
        const res = await db.select().from(schema.assetFolders).where((0, drizzle_orm_1.eq)(schema.assetFolders.id, id)).get();
        return res ? mapAssetFolder(res) : null;
    }
    async findByProjectId(projectId, trx) {
        const db = trx ?? this.db;
        const res = await db.select().from(schema.assetFolders).where((0, drizzle_orm_1.eq)(schema.assetFolders.projectId, projectId)).all();
        return res.map(mapAssetFolder);
    }
    async findByParentId(parentId, projectId, trx) {
        const db = trx ?? this.db;
        const condition = parentId === null
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.assetFolders.projectId, projectId), (0, drizzle_orm_1.isNull)(schema.assetFolders.parentId))
            : (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.assetFolders.projectId, projectId), (0, drizzle_orm_1.eq)(schema.assetFolders.parentId, parentId));
        const res = await db.select().from(schema.assetFolders).where(condition).all();
        return res.map(mapAssetFolder);
    }
    async save(folder, trx) {
        const db = trx ?? this.db;
        await db.insert(schema.assetFolders).values({
            ...folder,
            createdAt: folder.createdAt.toISOString(),
            updatedAt: folder.updatedAt.toISOString(),
        }).onConflictDoUpdate({
            target: schema.assetFolders.id,
            set: {
                parentId: folder.parentId,
                name: folder.name,
                updatedAt: folder.updatedAt.toISOString(),
            }
        });
    }
    async delete(id, trx) {
        const db = trx ?? this.db;
        await db.delete(schema.assetFolders).where((0, drizzle_orm_1.eq)(schema.assetFolders.id, id));
    }
}
exports.SqlAssetFolderRepository = SqlAssetFolderRepository;
//# sourceMappingURL=repositories.js.map