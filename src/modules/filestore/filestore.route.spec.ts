import filestoreRoutes, {
  options as filestoreOptions,
} from '@/modules/filestore/filestore.route';
import { PROVIDER_ID } from '@/modules/storage/providers/constants';
import { ajvFilePlugin } from '@fastify/multipart';
import fastify, { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import { Readable } from 'stream';

describe('Filestore Routes', () => {
  let app: FastifyInstance;
  const uploadedFileIds: string[] = [];

  beforeAll(async () => {
    app = fastify({
      ajv: {
        plugins: [ajvFilePlugin],
      },
    });
    await app.register(filestoreRoutes, filestoreOptions);
    await app.ready();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /filestore/upload', () => {
    it('should upload a file to imagekit-provider and return 201', async () => {
      const form = new FormData();
      const buffer = Buffer.from('test file content');
      const stream = Readable.from(buffer);

      form.append('files', stream, {
        filename: 'test.txt',
        contentType: 'text/plain',
      });
      form.append('provider', PROVIDER_ID.IMAGEKIT_PROVIDER);
      form.append('path', 'development/filestore');

      const response = await app.inject({
        method: 'POST',
        url: '/filestore/upload',
        payload: form,
        headers: form.getHeaders(),
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0].name).toContain('test');
      uploadedFileIds.push(body.data[0].id);
    }, 15000);

    it('should upload a file to google-cloud-storage-provider and return 201', async () => {
      const form = new FormData();
      const buffer = Buffer.from('test file content');
      const stream = Readable.from(buffer);

      form.append('files', stream, {
        filename: 'test.txt',
        contentType: 'text/plain',
      });
      form.append('provider', PROVIDER_ID.GOOGLE_CLOUD_STORAGE_PROVIDER);
      form.append('path', 'development/filestore');

      const response = await app.inject({
        method: 'POST',
        url: '/filestore/upload',
        payload: form,
        headers: form.getHeaders(),
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.data[0]).toHaveProperty('id');
      expect(body.data[0].name).toBe('test.txt');
      uploadedFileIds.push(body.data[0].id);
    }, 15000);
  });

  describe('GET /filestore', () => {
    it('should fetch the uploaded files and return 200', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/filestore?id=${uploadedFileIds.join('&id=')}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.files).toBeInstanceOf(Array);
      expect(body.data.files.length).toBe(uploadedFileIds.length);
    });
  });

  describe('DELETE /filestore', () => {
    it('should delete the uploaded files and return 204', async () => {
      const url = `/filestore?${uploadedFileIds.map((id) => `id=${id}`).join('&')}`;
      const response = await app.inject({
        method: 'DELETE',
        url,
      });

      expect(response.statusCode).toBe(204);

      // Verify that the files are deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/filestore?${uploadedFileIds.map((id) => `id=${id}`).join('&')}`,
      });
      const body = JSON.parse(getResponse.body);
      expect(body.data.files.length).toBe(0);
    }, 15000);
  });
});
