import z from 'zod';
import type { MultipartFile } from '@fastify/multipart';
import { PROVIDER_ID } from '@/modules/storage/providers/constants';

const LIMITS = {
  maxFiles: 10,
};

export type UploadFiles = z.infer<typeof uploadFiles>;
export const uploadFiles = z.object({
  files: z
    .array(
      z.custom<MultipartFile>((file) => {
        return (
          file &&
          typeof file === 'object' &&
          'filename' in file &&
          'mimetype' in file &&
          'file' in file
        );
      }, 'Invalid multipart file'),
    )
    .max(LIMITS.maxFiles),
  path: z.string().optional(),
  provider: z.enum(['imagekit-provider', 'google-cloud-storage-provider']),
});
export const uploadFilesSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['files', 'provider'],
  properties: {
    path: {
      type: 'string',
    },
    files: {
      oneOf: [
        {
          type: 'array',
          maxItems: LIMITS.maxFiles,
          items: {
            isFile: true,
          },
        },
        {
          isFile: true,
        },
      ],
    },
    provider: {
      type: 'string',
      enum: Object.values(PROVIDER_ID),
    },
  },
};
