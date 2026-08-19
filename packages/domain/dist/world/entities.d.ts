import { Guid } from '../shared/guid';
export interface GameObject {
    id: Guid;
    projectId: Guid;
    parentId: Guid | null;
    name: string;
    icon: string | null;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Page {
    id: Guid;
    projectId: Guid;
    gameObjectId: Guid;
    title: string;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum BlockType {
    TEXT = "text",
    IMAGE = "image",
    GALLERY = "gallery",
    QUOTE = "quote",
    CALLOUT = "callout",
    DIVIDER = "divider",
    TABLE = "table",
    EMBED = "embed"
}
export interface Block {
    id: Guid;
    projectId: Guid;
    pageId: Guid;
    type: BlockType;
    data: Record<string, unknown>;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=entities.d.ts.map