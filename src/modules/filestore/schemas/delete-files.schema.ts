import z from 'zod';

export type DeleteFile = z.infer<typeof deleteFile>;
export const deleteFile = z.object({
  id: z.array(z.uuid()),
});
export const deleteFileSchema = z.toJSONSchema(deleteFile, {
  target: 'draft-7',
});
