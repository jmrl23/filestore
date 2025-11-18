import { GoogleCloudStorage } from '@/modules/storage/providers/google-cloud-storage/google-cloud-storage';
import { Storage } from '@google-cloud/storage';

describe('google cloud storage provider', () => {
  const storage = new Storage({
    projectId: process.env.GCLOUD_PROJECT,
  });
  const bucketName =
    process.env.STORAGE_PROVIDER_GOOGLE_CLOUD_STORAGE_BUCKET_NAME!;
  const provider = new GoogleCloudStorage(storage, bucketName);
  let fileId: string;

  beforeAll(async () => {
    await provider.initialize();
  }, 30000);

  it('should upload', async () => {
    const file = await provider.upload(
      Buffer.from('test'),
      'test.txt',
      'development/filestore',
    );
    expect(file).toStrictEqual({
      id: expect.stringMatching(/^development\/filestore\/test-.*\.txt$/),
      name: 'test.txt',
      path: 'development/filestore',
      mimetype: 'text/plain',
      size: 4,
    });
    fileId = file.id;
  }, 15000);

  it('should generate url', async () => {
    const url = await provider.getUrl(fileId);
    expect(url).toBe(`https://storage.googleapis.com/${bucketName}/${fileId}`);
  }, 15000);

  it('should delete', async () => {
    const item = await provider.delete(fileId);
    expect(item).toBeUndefined();
  }, 15000);
});
