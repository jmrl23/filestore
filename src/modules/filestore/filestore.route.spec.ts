import { cache } from '@/common/cache';
import filestoreRoutes, {
  options as filestoreOptions,
} from '@/modules/filestore/filestore.route';
import { PROVIDER } from '@/modules/storage/providers/constants';
import { ajvFilePlugin } from '@fastify/multipart';
import fastify, { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import ms from 'ms';
import { Readable } from 'node:stream';

describe('Filestore Routes', () => {
  let app: FastifyInstance;
  const uploadedFileIds: string[] = [];

  beforeAll(async () => {
    app = fastify({
      pluginTimeout: ms('8s'),
      ajv: {
        plugins: [ajvFilePlugin],
      },
    });
    await app.register(filestoreRoutes, filestoreOptions);
    await app.ready();
  }, ms('8s'));

  afterAll(async () => {
    if (uploadedFileIds.length > 0) {
      const url = `/files?${uploadedFileIds.map((id) => `id=${id}`).join('&')}`;
      await app.inject({
        method: 'DELETE',
        url,
      });
    }
    await app.close();
    await cache.disconnect();
  });

  describe('POST /files', () => {
    it(
      'should upload a file to imagekit-provider and return 201',
      async () => {
        const form = new FormData();
        const buffer = Buffer.from('test file content');
        const stream = Readable.from(buffer);

        form.append('files', stream, {
          filename: 'test.txt',
          contentType: 'text/plain',
        });
        form.append('provider', PROVIDER.IMAGEKIT_PROVIDER);
        form.append('path', 'development/filestore');

        const response = await app.inject({
          method: 'POST',
          url: '/files',
          payload: form,
          headers: form.getHeaders(),
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.data).toBeInstanceOf(Array);
        expect(body.data[0]).toHaveProperty('id');
        expect(body.data[0].name).toContain('test');
        uploadedFileIds.push(body.data[0].id);
      },
      ms('8s'),
    );

    it(
      'should upload a file to google-cloud-storage-provider and return 201',
      async () => {
        const form = new FormData();
        const buffer = Buffer.from('test file content');
        const stream = Readable.from(buffer);

        form.append('files', stream, {
          filename: 'test.txt',
          contentType: 'text/plain',
        });
        form.append('provider', PROVIDER.GOOGLE_CLOUD_STORAGE_PROVIDER);
        form.append('path', 'development/filestore');

        const response = await app.inject({
          method: 'POST',
          url: '/files',
          payload: form,
          headers: form.getHeaders(),
        });

        expect(response.statusCode).toBe(201);
        const body = JSON.parse(response.body);
        expect(body.data).toBeInstanceOf(Array);
        expect(body.data[0]).toHaveProperty('id');
        expect(body.data[0].name).toBe('test.txt');
        uploadedFileIds.push(body.data[0].id);
      },
      ms('8s'),
    );
  });

  describe('GET /files', () => {
    it(
      'should fetch the uploaded files and return 200',
      async () => {
        const response = await app.inject({
          method: 'GET',
          url: `/files?id=${uploadedFileIds.join('&id=')}`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.files).toBeInstanceOf(Array);
        expect(body.data.files.length).toBe(uploadedFileIds.length);
      },
      ms('3s'),
    );
  });

  describe('GET /files/:id', () => {
    it(
      'should fetch a single file and return 200',
      async () => {
        const fileId = uploadedFileIds[0];
        const response = await app.inject({
          method: 'GET',
          url: `/files/${fileId}`,
        });

        expect(response.statusCode).toBe(200);
        const body = JSON.parse(response.body);
        expect(body.data.file).toHaveProperty('id', fileId);
      },
      ms('3s'),
    );
  });

  describe('DELETE /files', () => {
    it(
      'should delete the uploaded files and return 204',
      async () => {
        // Create a file to delete
        const form = new FormData();
        const buffer = Buffer.from('file to be deleted');
        const stream = Readable.from(buffer);
        form.append('files', stream, {
          filename: 'delete-me.txt',
          contentType: 'text/plain',
        });
        form.append('provider', PROVIDER.IMAGEKIT_PROVIDER);
        form.append('path', 'development/filestore');
        const createResponse = await app.inject({
          method: 'POST',
          url: '/files',
          payload: form,
          headers: form.getHeaders(),
        });
        const { id: fileId } = JSON.parse(createResponse.body).data[0];

        // Delete the file
        const deleteResponse = await app.inject({
          method: 'DELETE',
          url: `/files?id=${fileId}`,
        });
        expect(deleteResponse.statusCode).toBe(204);

        // Verify the file is deleted
        const getResponse = await app.inject({
          method: 'GET',
          url: `/files?id=${fileId}&revalidate=true`,
        });
        const body = JSON.parse(getResponse.body);
        expect(body.data.files.length).toBe(0);
      },
      ms('5s'),
    );
  });
});
