import { fetchFiles as storageFetchFiles } from '@/modules/storage/schemas/fetch-files.schema';
import z from 'zod';

export type FetchFiles = z.infer<typeof fetchFiles>;
export const fetchFiles = storageFetchFiles.extend({
  revalidate: z.boolean().optional(),
});
export const fetchFilesSchema = z.toJSONSchema(fetchFiles, {
  target: 'draft-7',
});
