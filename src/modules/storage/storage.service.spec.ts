import { db } from '@/common/db';
import { PROVIDER_ID } from '@/modules/storage/providers/constants';
import { File } from '@/modules/storage/schemas/file.schema';
import { getStorageProviders } from '@/modules/storage/storage-providers';
import { StorageService } from '@/modules/storage/storage.service';
import { MultipartFile } from '@fastify/multipart';
import { createCache } from 'cache-manager';
import { BadRequest } from 'http-errors';

describe('StorageService', () => {
  let storageService: StorageService;
  const uploadedFiles: File[] = [];

  beforeAll(async () => {
    const providers = await getStorageProviders();
    storageService = new StorageService(createCache(), db, providers);
  }, 30000);

  afterAll(async () => {
    if (uploadedFiles.length > 0) {
      const fileIds = uploadedFiles.map((file) => file.id);
      await storageService.delete(fileIds);
    }
  });

  const files: Pick<MultipartFile, 'toBuffer' | 'filename' | 'mimetype'>[] = [
    {
      toBuffer: async () => Buffer.from('file1'),
      filename: 'file1.txt',
      mimetype: 'text/plain',
    },
  ];

  describe('upload', () => {
    it('should upload files using imagekit-provider', async () => {
      const result = await storageService.upload(
        PROVIDER_ID.IMAGEKIT_PROVIDER,
        files as MultipartFile[],
        'development/filestore',
      );

      expect(result[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        size: 5,
        mimetype: 'text/plain',
      });
      uploadedFiles.push(...result);
    }, 15000);

    it('should upload files using google-cloud-storage-provider', async () => {
      const result = await storageService.upload(
        PROVIDER_ID.GOOGLE_CLOUD_STORAGE_PROVIDER,
        files as MultipartFile[],
        'development/filestore',
      );

      expect(result[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        size: 5,
        mimetype: 'text/plain',
      });
      uploadedFiles.push(...result);
    }, 15000);

    it('should throw BadRequest for invalid storage provider', async () => {
      await expect(
        storageService.upload(
          'invalid-provider' as PROVIDER_ID,
          files as MultipartFile[],
          'development/filestore',
        ),
      ).rejects.toThrow(
        new BadRequest('Invalid storage provider: invalid-provider'),
      );
    });
  });

  describe('fetchFiles', () => {
    it('should fetch files by id', async () => {
      const fileIds = uploadedFiles.map((file) => file.id);
      const result = await storageService.fetchFiles({ id: fileIds });
      expect(result).toHaveLength(fileIds.length);
      expect(result.map((f) => f.id).sort()).toEqual(fileIds.sort());
    });

    it('should fetch files by providerId', async () => {
      const result = await storageService.fetchFiles({
        provider: PROVIDER_ID.IMAGEKIT_PROVIDER,
      });
      expect(
        result.every((f) => f.provider === PROVIDER_ID.IMAGEKIT_PROVIDER),
      ).toBe(true);
    }, 15000);

    it('should limit and offset results', async () => {
      const result = await storageService.fetchFiles({ limit: 1, offset: 1 });
      expect(result).toHaveLength(1);
    });

    it('should order results', async () => {
      const ascResult = await storageService.fetchFiles({ order: 'asc' });
      const descResult = await storageService.fetchFiles({ order: 'desc' });
      expect(new Date(ascResult[0].createdAt).getTime()).toBeLessThanOrEqual(
        new Date(ascResult[ascResult.length - 1].createdAt).getTime(),
      );
      expect(
        new Date(descResult[0].createdAt).getTime(),
      ).toBeGreaterThanOrEqual(
        new Date(descResult[descResult.length - 1].createdAt).getTime(),
      );
    }, 15000);
  });

  describe('getUrl', () => {
    it('should get url from imagekit-provider', async () => {
      const file = uploadedFiles.find(
        (f) => f.provider === PROVIDER_ID.IMAGEKIT_PROVIDER,
      )!;
      const dbFile = await db.query.file.findFirst({
        where: (fileTable, { eq }) => eq(fileTable.id, file.id),
      });
      const url = await storageService.getUrl(
        PROVIDER_ID.IMAGEKIT_PROVIDER,
        dbFile!.referenceId,
      );
      expect(url).toMatch(/ik.imagekit.io/);
    });

    it('should get url from google-cloud-storage-provider', async () => {
      const file = uploadedFiles.find(
        (f) => f.provider === PROVIDER_ID.GOOGLE_CLOUD_STORAGE_PROVIDER,
      )!;
      const dbFile = await db.query.file.findFirst({
        where: (fileTable, { eq }) => eq(fileTable.id, file.id),
      });
      const url = await storageService.getUrl(
        PROVIDER_ID.GOOGLE_CLOUD_STORAGE_PROVIDER,
        dbFile!.referenceId,
      );
      expect(url).toMatch(/storage.googleapis.com/);
    });
  });
});
