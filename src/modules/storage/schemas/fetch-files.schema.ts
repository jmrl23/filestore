import { PROVIDER } from '@/modules/storage/providers/constants';
import { z } from 'zod';

export type FetchFiles = z.infer<typeof fetchFiles>;
export const fetchFiles = z.object({
  id: z.array(z.uuid()).optional(),
  createdAtFrom: z.iso.datetime().optional(),
  createdAtTo: z.iso.datetime().optional(),
  provider: z.enum(Object.values(PROVIDER)).optional(),
  location: z.string().optional(),
  mimetype: z.string().optional(),
  name: z.string().optional(),
  sizeFrom: z.number().optional(),
  sizeTo: z.number().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
export const fetchFilesSchema = z.toJSONSchema(fetchFiles, {
  target: 'draft-7',
});
