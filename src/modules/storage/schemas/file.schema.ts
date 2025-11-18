import z from 'zod';

export type File = z.infer<typeof file>;
export const file = z.object({
  id: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  name: z.string(),
  size: z.number(),
  path: z.string(),
  mimetype: z.string(),
  provider: z.string(), // provider id
  url: z.string(),
});
export const fileSchema = z.toJSONSchema(file, { target: 'draft-7' });
