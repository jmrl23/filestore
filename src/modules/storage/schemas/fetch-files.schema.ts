import { PROVIDER_ID } from '@/modules/storage/providers/constants';
import { z } from 'zod';

export type FetchFiles = z.infer<typeof fetchFiles>;
export const fetchFiles = z.object({
  id: z.array(z.uuid()).optional(),
  createdAt: z
    .object({
      gte: z.iso.datetime(),
      lte: z.iso.datetime(),
    })
    .optional(),
  provider: z.enum(Object.values(PROVIDER_ID)).optional(),
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
export const fetchFilesSchema = z.toJSONSchema(fetchFiles, {
  target: 'draft-7',
});
