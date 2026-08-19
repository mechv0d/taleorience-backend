import { z } from 'zod';
export declare const CreateProjectDto: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodString>;
}, z.core.$strip>;
export declare const CreateGameObjectDto: z.ZodObject<{
    name: z.ZodString;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const CreateBlockDto: z.ZodObject<{
    type: z.ZodEnum<{
        text: "text";
        image: "image";
        gallery: "gallery";
        quote: "quote";
        callout: "callout";
        divider: "divider";
        table: "table";
        embed: "embed";
    }>;
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export declare const UpdateBlockDto: z.ZodObject<{
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export declare const CreateAssetFolderDto: z.ZodObject<{
    name: z.ZodString;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const UpdateAssetDto: z.ZodObject<{
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, z.core.$strip>;
export declare const CreateTagDto: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const AddTagToGameObjectDto: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const CreateRelationDto: z.ZodObject<{
    targetGameObjectId: z.ZodString;
    type: z.ZodString;
}, z.core.$strip>;
export declare const ResolveReferencesQueryDto: z.ZodObject<{
    q: z.ZodString;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export declare const SearchQueryDto: z.ZodObject<{
    q: z.ZodString;
    limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
}, z.core.$strip>;
export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;
export type CreateGameObjectDtoType = z.infer<typeof CreateGameObjectDto>;
export type CreateBlockDtoType = z.infer<typeof CreateBlockDto>;
export type UpdateBlockDtoType = z.infer<typeof UpdateBlockDto>;
export type CreateAssetFolderDtoType = z.infer<typeof CreateAssetFolderDto>;
export type UpdateAssetDtoType = z.infer<typeof UpdateAssetDto>;
export type CreateTagDtoType = z.infer<typeof CreateTagDto>;
export type AddTagToGameObjectDtoType = z.infer<typeof AddTagToGameObjectDto>;
export type CreateRelationDtoType = z.infer<typeof CreateRelationDto>;
export type ResolveReferencesQueryDtoType = z.infer<typeof ResolveReferencesQueryDto>;
export type SearchQueryDtoType = z.infer<typeof SearchQueryDto>;
//# sourceMappingURL=dto.d.ts.map