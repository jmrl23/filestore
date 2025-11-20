import { cache } from '@/common/cache';
import { db } from '@/common/db';
import { multipartPrevalidator } from '@/modules/filestore/hooks/multipart-prevalidator';
import {
  DeleteFile,
  deleteFile,
} from '@/modules/filestore/schemas/delete-files.schema';
import {
  FetchFileParams,
  fetchFileParamsSchema,
  FetchFileQuery,
  fetchFileQuerySchema,
} from '@/modules/filestore/schemas/fetch-file.schema';
import {
  FetchFiles,
  fetchFilesSchema,
} from '@/modules/filestore/schemas/fetch-files.schema';
import {
  UploadFiles,
  uploadFilesSchema,
} from '@/modules/filestore/schemas/upload-files.schema';
import { PROVIDER_ID } from '@/modules/storage/providers/constants';
import { file } from '@/modules/storage/schemas/file.schema';
import { getStorageProviders } from '@/modules/storage/storage-providers';
import { StorageService } from '@/modules/storage/storage.service';
import { asRouteFunction, asRouteOptions } from '@/plugins/routes';
import fastifyMultipart from '@fastify/multipart';
import { FastifyRequest } from 'fastify';
import os from 'node:os';
import z from 'zod';

export const options = asRouteOptions({
  prefix: '/files',
});

export default asRouteFunction(async function (app) {
  const storageService = new StorageService(
    cache,
    db,
    await getStorageProviders(),
  );

  await app.register(fastifyMultipart, {
    attachFieldsToBody: true,
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  app
    .route({
      method: 'GET',
      url: '/',
      schema: {
        description: 'list uploaded files',
        tags: ['Filestore'],
        querystring: fetchFilesSchema,
        response: {
          default: z.toJSONSchema(
            z.object({
              data: z.object({
                files: z.array(file),
              }),
            }),
            { target: 'draft-7' },
          ),
        },
      },
      async handler(
        request: FastifyRequest<{
          Querystring: FetchFiles;
        }>,
      ) {
        const { revalidate, ...query } = request.query;
        const files = await storageService.fetchFiles(query, revalidate);
        return {
          data: { files },
        };
      },
    })

    .route({
      method: 'GET',
      url: '/:fileId',
      schema: {
        description: 'fetch uploaded file',
        tags: ['Filestore'],
        params: fetchFileParamsSchema,
        querystring: fetchFileQuerySchema,
        response: {
          default: z.toJSONSchema(
            z.object({
              data: z.object({
                file,
              }),
            }),
            { target: 'draft-7' },
          ),
        },
      },
      async handler(
        request: FastifyRequest<{
          Params: FetchFileParams;
          Querystring: FetchFileQuery;
        }>,
      ) {
        const file = await storageService.fetchFile(
          request.params.fileId,
          request.query.revalidate,
        );
        return {
          data: { file },
        };
      },
    })

    .route({
      method: 'POST',
      url: '/',
      schema: {
        description: 'upload files',
        tags: ['Filestore'],
        consumes: ['multipart/form-data'],
        body: uploadFilesSchema,
        response: {
          default: z.toJSONSchema(
            z.object({
              data: z.array(file),
            }),
            { target: 'draft-7' },
          ),
        },
      },
      preValidation: [multipartPrevalidator],
      async handler(
        request: FastifyRequest<{
          Body: UploadFiles;
        }>,
        reply,
      ) {
        await request.saveRequestFiles({
          tmpdir: os.tmpdir(),
        });
        const files = await storageService.upload(
          request.body.provider as PROVIDER_ID,
          request.savedRequestFiles!,
          request.body.path ?? '',
        );
        await request.cleanRequestFiles();
        reply.code(201);
        return {
          data: files,
        };
      },
    })

    .route({
      method: 'DELETE',
      url: '/',
      schema: {
        description: 'delete files',
        tags: ['Filestore'],
        querystring: z.toJSONSchema(deleteFile, { target: 'draft-7' }),
        response: {
          204: z.toJSONSchema(z.string(), { target: 'draft-7' }),
        },
      },
      async handler(
        request: FastifyRequest<{ Querystring: DeleteFile }>,
        reply,
      ) {
        await storageService.delete(request.query.id);
        reply.code(204);
        return '';
      },
    });
});
