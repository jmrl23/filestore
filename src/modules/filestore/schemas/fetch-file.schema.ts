import z from 'zod';

export type FetchFileParams = z.infer<typeof fetchFileParams>;
export const fetchFileParams = z.object({
  fileId: z.uuid(),
});
export const fetchFileParamsSchema = z.toJSONSchema(fetchFileParams, {
  target: 'draft-7',
});

export type FetchFileQuery = z.infer<typeof fetchFilesQuery>;
export const fetchFilesQuery = z.object({
  revalidate: z.boolean().optional(),
});
export const fetchFileQuerySchema = z.toJSONSchema(fetchFilesQuery, {
  target: 'draft-7',
});
