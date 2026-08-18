export type Guid = string;
export const generateGuid = (): Guid => crypto.randomUUID();