import { rename } from '@/modules/storage/utils/rename';
import {
  FileInfo,
  StorageProvider,
} from '@/modules/storage/interfaces/storage-provider.interface';
import { Bucket, SaveOptions, Storage } from '@google-cloud/storage';
import mime from 'mime-types';
import path from 'node:path';
import { PROVIDER } from '@/modules/storage/providers/constants';

/**
 * A storage provider that uses Google Cloud Storage.
 *
 * @remarks
 * This provider requires Google Cloud credentials to be configured in the environment.
 * It uses the `@google-cloud/storage` library to interact with Google Cloud Storage.
 *
 * The easiest way to configure credentials is to use the gcloud CLI:
 * ```bash
 * gcloud auth application-default login
 * ```
 *
 * Alternatively, you can set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable
 * to the path of a service account key file.
 *
 * To log out or revoke credentials, you can use:
 * ```bash
 * gcloud auth application-default revoke
 * ```
 *
 * @example
 * ```ts
 * import { Storage } from '@google-cloud/storage';
 *
 * const storage = new Storage();
 * const bucketName = 'my-bucket';
 * const provider = new GoogleCloudStorage(storage, bucketName);
 * await provider.initialize();
 * ```
 */
export class GoogleCloudStorage implements StorageProvider {
  readonly id = PROVIDER.GOOGLE_CLOUD_STORAGE_PROVIDER;
  private bucket!: Bucket;

  constructor(
    private readonly storage: Storage,
    private readonly bucketName: string,
  ) {}

  async initialize(): Promise<void> {
    const [buckets] = await this.storage.getBuckets();
    if (!buckets.find((bucket) => bucket.name === this.bucketName)) {
      await this.storage.createBucket(this.bucketName);
      await this.storage.bucket(this.bucketName).makePublic();
    }
    this.bucket = this.storage.bucket(this.bucketName);
  }

  async upload<O = SaveOptions>(
    buffer: Buffer,
    name: string,
    location?: string,
    options?: O,
  ): Promise<FileInfo> {
    const filepath = path.join(location ?? '', rename(name));
    const file = this.bucket.file(filepath);
    const mimetype = mime.lookup(name) || 'application/octet-stream';
    await file.save(buffer, { ...options });
    return {
      id: filepath,
      name,
      path: location,
      mimetype,
      size: buffer.length,
    };
  }

  async delete(fileId: string): Promise<void> {
    await this.bucket.file(fileId).delete();
  }

  async getUrl(fileId: string): Promise<string> {
    return `https://storage.googleapis.com/${this.bucketName}/${fileId}`;
  }
}
