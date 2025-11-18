import { Imagekit } from '@/modules/storage/providers/imagekit/imagekit';
import ImageKit from 'imagekit';

describe('imagekit provider', () => {
  const imagekit = new ImageKit({
    publicKey: process.env.STORAGE_PROVIDER_IMAGEKIT_PUBLIC_KEY!,
    privateKey: process.env.STORAGE_PROVIDER_IMAGEKIT_PRIVATE_KEY!,
    urlEndpoint: process.env.STORAGE_PROVIDER_IMAGEKIT_ENDPOINT!,
  });
  const provider = new Imagekit(imagekit);
  let fileId: string;

  it('should upload', async () => {
    const file = await provider.upload(
      Buffer.from('test'),
      'test.txt',
      'development/filestore',
    );
    expect(file).toStrictEqual({
      id: expect.any(String),
      name: expect.stringContaining('test'),
      path: 'development/filestore',
      mimetype: 'text/plain',
      size: 4,
    });
    fileId = file.id;
  }, 15000);

  it('should generate url', async () => {
    const url = await provider.getUrl(fileId);
    const endpoint = process.env.STORAGE_PROVIDER_IMAGEKIT_ENDPOINT!;
    const origin = new URL(endpoint).origin;
    expect(url).toContain(origin);
  }, 15000);

  it('should delete', async () => {
    const item = await provider.delete(fileId);
    expect(item).toBeUndefined();
  }, 15000);
});
