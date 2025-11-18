import { GoogleCloudStorage } from '@/modules/storage/providers/google-cloud-storage/google-cloud-storage';
import { Storage } from '@google-cloud/storage';

const mockFile = {
  save: jest.fn(),
  delete: jest.fn(),
};

const mockBucket = {
  file: jest.fn().mockReturnValue(mockFile),
  makePublic: jest.fn(),
};

const mockStorage = {
  getBuckets: jest.fn().mockResolvedValue([[]]),
  createBucket: jest.fn().mockResolvedValue([mockBucket]),
  bucket: jest.fn().mockReturnValue(mockBucket),
};

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => mockStorage),
}));

describe('google cloud storage provider', () => {
  const provider: GoogleCloudStorage = new GoogleCloudStorage(
    new Storage(),
    'test-bucket',
  );
  let fileId: string;

  beforeAll(async () => {
    await provider.initialize();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload', async () => {
    const file = await provider.upload(
      Buffer.from('test'),
      'test.txt',
      'sample-location',
    );
    expect(mockBucket.file).toHaveBeenCalledWith(
      expect.stringMatching(/^sample-location\/test-.*\.txt$/),
    );
    expect(mockFile.save).toHaveBeenCalledWith(Buffer.from('test'), {});
    expect(file).toStrictEqual({
      id: expect.stringMatching(/^sample-location\/test-.*\.txt$/),
      name: 'test.txt',
      path: 'sample-location',
      mimetype: 'text/plain',
      size: 4,
    });
    fileId = file.id;
  });

  it('should generate url', async () => {
    const url = await provider.getUrl(fileId);
    expect(url).toBe(`https://storage.googleapis.com/test-bucket/${fileId}`);
  });

  it('should delete', async () => {
    await provider.delete(fileId);
    expect(mockBucket.file).toHaveBeenCalledWith(fileId);
    expect(mockFile.delete).toHaveBeenCalled();
  });
});
