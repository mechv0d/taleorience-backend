import { Guid } from '../shared/guid';
export interface Project {
    id: Guid;
    name: string;
    description: string;
    bannerAssetId: Guid | null;
    isExample: boolean;
    isReadOnly: boolean;
    createdAt: Date;
    updatedAt: Date;
}
//# sourceMappingURL=project.entity.d.ts.map