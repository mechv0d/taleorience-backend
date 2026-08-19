import { Guid } from '../shared/guid';
export interface AssetFolder {
    id: Guid;
    projectId: Guid;
    parentId: Guid | null;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=asset-folder.entity.d.ts.map