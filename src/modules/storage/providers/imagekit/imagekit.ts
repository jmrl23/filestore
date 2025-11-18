import {
  FileInfo,
  StorageProvider,
} from '@/modules/storage/interfaces/storage-provider.interface';
import { PROVIDER_ID } from '@/modules/storage/providers/constants';
import ImageKit from 'imagekit';
import { UploadOptions } from 'imagekit/dist/libs/interfaces';
import mime from 'mime-types';

/**
 * A storage provider that uses ImageKit.
 *
 * @remarks
 * This provider requires ImageKit credentials to be configured.
 * It uses the `imagekit` library to interact with ImageKit.
 *
 * You can configure credentials by passing them to the ImageKit constructor.
 * Typically, this involves setting environment variables for the public key,
 * private key, and URL endpoint.
 *
 * @example
 * ```ts
 * import ImageKit from 'imagekit';
 *
 * const imagekit = new ImageKit({
 *   publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
 *   privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
 *   urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
 * });
 *
 * const provider = new Imagekit(imagekit);
 * ```
 */
export class Imagekit implements StorageProvider {
  readonly id = PROVIDER_ID.IMAGEKIT_PROVIDER;

  constructor(private readonly imagekit: ImageKit) {}

  async upload<O = UploadOptions>(
    buffer: Buffer,
    name: string,
    location?: string,
    options?: O,
  ): Promise<FileInfo> {
    const file = await this.imagekit.upload({
      ...options,
      file: buffer,
      fileName: name,
      folder: location,
    });
    const { mime: _mime, size } = await this.imagekit.getFileDetails(
      file.fileId,
    );
    const mimetype = _mime ?? (mime.lookup(name) || 'application/octet-stream');

    return {
      id: file.fileId,
      name: name,
      path: location,
      size,
      mimetype,
    };
  }
  async delete(fileId: string): Promise<void> {
    await this.imagekit.deleteFile(fileId);
  }
  async getUrl(fileId: string): Promise<string> {
    const fileInfo = await this.imagekit.getFileDetails(fileId);
    return fileInfo.url;
  }
}
