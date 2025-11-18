import { db } from '@/common/db';
import { getStorageProviders } from '@/modules/storage/storage-providers';
import { StorageService } from '@/modules/storage/storage.service';
import { MultipartFile } from '@fastify/multipart';
import { BadRequest } from 'http-errors';

describe('StorageService', () => {
  let storageService: StorageService;
  const imagekitFile = { id: '' };
  const gcsFile = { id: '' };

  beforeAll(async () => {
    const providers = await getStorageProviders();
    storageService = new StorageService(db, providers);
  }, 30000);

  const files: MultipartFile[] = [
    { toBuffer: async () => Buffer.from('file1'), filename: 'file1.txt' },
  ] as MultipartFile[];

  describe('upload', () => {
    it('should upload files using imagekit-provider', async () => {
      const [result] = await storageService.upload(
        'imagekit-provider',
        files,
        'test-location',
      );

      expect(result).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        size: 5,
        mimetype: 'text/plain',
      });
      imagekitFile.id = result.id;
    }, 15000);

    it('should upload files using google-cloud-storage-provider', async () => {
      const [result] = await storageService.upload(
        'google-cloud-storage-provider',
        files,
        'test-location',
      );

      expect(result).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        size: 5,
        mimetype: 'text/plain',
      });
      gcsFile.id = result.id;
    }, 15000);

    it('should throw BadRequest for invalid storage provider', async () => {
      await expect(
        storageService.upload('invalid-provider', files, 'test-location'),
      ).rejects.toThrow(
        new BadRequest('Invalid storage provider: invalid-provider'),
      );
    });
  });

  describe('getUrl', () => {
    it('should get url from imagekit-provider', async () => {
      const url = await storageService.getUrl(
        'imagekit-provider',
        imagekitFile.id,
      );
      expect(url).toMatch(/ik.imagekit.io/);
    });

    it('should get url from google-cloud-storage-provider', async () => {
      const url = await storageService.getUrl(
        'google-cloud-storage-provider',
        gcsFile.id,
      );
      expect(url).toMatch(/storage.googleapis.com/);
    });
  });

  describe('delete', () => {
    it('should delete from imagekit-provider', async () => {
      const result = await storageService.delete(
        'imagekit-provider',
        imagekitFile.id,
      );
      expect(result).toBeUndefined();
    });

    it('should delete from google-cloud-storage-provider', async () => {
      const result = await storageService.delete(
        'google-cloud-storage-provider',
        gcsFile.id,
      );
      expect(result).toBeUndefined();
    });
  });
});
