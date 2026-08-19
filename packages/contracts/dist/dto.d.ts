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
export type CreateProjectDtoType = z.infer<typeof CreateProjectDto>;
export type CreateGameObjectDtoType = z.infer<typeof CreateGameObjectDto>;
export type CreateBlockDtoType = z.infer<typeof CreateBlockDto>;
export type UpdateBlockDtoType = z.infer<typeof UpdateBlockDto>;
//# sourceMappingURL=dto.d.ts.map