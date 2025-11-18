import { z } from 'zod';

export type SelectFilesPayload = z.infer<typeof selectFilesPayload>;
export const selectFilesPayload = z.object({
  id: z.array(z.uuid()).optional(),
  createdAt: z
    .object({
      gte: z.iso.datetime(),
      lte: z.iso.datetime(),
    })
    .optional(),
  providerId: z.string().optional(),
  location: z.string().optional(),
  mimetype: z.string().optional(),
  name: z.string().optional(),
  size: z
    .object({
      gte: z.number().optional(),
      lte: z.number().optional(),
    })
    .optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
export const selectFilesPayloadSchema = z.toJSONSchema(selectFilesPayload, {
  target: 'draft-7',
});
