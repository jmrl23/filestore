export interface StorageProvider {
  readonly id: StorageProviderId;
  upload<O = Record<string, unknown>>(
    buffer: Buffer,
    name: string,
    location?: string,
    options?: O,
  ): Promise<FileInfo>;
  delete<O = Record<string, unknown>>(
    fileId: string,
    options?: O,
  ): Promise<void>;
  getUrl<O = Record<string, unknown>>(
    fileId: string,
    options?: O,
  ): Promise<string>;
}

export type StorageProviderId = `${string}-provider`;

export interface FileInfo {
  id: string;
  name: string;
  path?: string;
  mimetype: string;
  size: number;
}
