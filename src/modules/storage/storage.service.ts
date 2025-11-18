import { file } from '@/db/schema';
import {
  StorageProvider,
  StorageProviderId,
} from '@/modules/storage/interfaces/storage-provider.interface';
import { File } from '@/modules/storage/schemas/file.schema';
import { SelectFilesPayload } from '@/modules/storage/schemas/select-files-payload.schema';
import { MultipartFile } from '@fastify/multipart';
import { and, asc, desc, eq, gte, ilike, inArray, lte, SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { BadRequest } from 'http-errors';

type Db = ReturnType<typeof drizzle<{ file: typeof file }>>;

export class StorageService {
  constructor(
    private readonly db: Db,
    private readonly storageProviders: StorageProvider[],
  ) {}

  private getStoragePovider(id: string): StorageProvider {
    const StorageProvider = this.storageProviders.find((p) => p.id === id);
    if (!StorageProvider) {
      throw new BadRequest(`Invalid storage provider: ${id}`);
    }
    return StorageProvider;
  }

  async upload(
    storageId: StorageProviderId,
    files: MultipartFile[],
    location?: string,
  ): Promise<File[]> {
    if (files.length < 1) return [];
    const storageProvider = this.getStoragePovider(storageId);
    const uploads = (
      await Promise.allSettled(
        files.map(async (file) => {
          const buffer = await file.toBuffer();
          return storageProvider.upload(buffer, file.filename, location);
        }),
      )
    )
      .filter((f) => f.status === 'fulfilled')
      .map((f) => f.value);
    const uploadedFiles = await this.db
      .insert(file)
      .values(
        uploads.map((file) => ({
          name: file.name,
          size: file.size,
          mimetype: file.mimetype,
          storageProviderId: storageId,
          storageProviderFileId: file.id,
        })),
      )
      .returning({
        id: file.id,
      });
    const savedFiles = await this.fetchFiles({
      id: uploadedFiles.map((f) => f.id),
    });
    return savedFiles;
  }

  async fetchFiles(payload: SelectFilesPayload = {}): Promise<File[]> {
    const conditions: (SQL | undefined)[] = [];
    if (payload.id && payload.id.length > 0) {
      conditions.push(inArray(file.id, payload.id));
    }
    if (payload.providerId) {
      conditions.push(eq(file.storageProviderId, payload.providerId));
    }
    if (payload.location) {
      conditions.push(eq(file.path, payload.location));
    }
    if (payload.mimetype) {
      conditions.push(eq(file.mimetype, payload.mimetype));
    }
    if (payload.name) {
      conditions.push(ilike(file.name, `%${payload.name}%`));
    }
    if (payload.createdAt) {
      if (payload.createdAt.gte) {
        conditions.push(gte(file.createdAt, payload.createdAt.gte));
      }
      if (payload.createdAt.lte) {
        conditions.push(lte(file.createdAt, payload.createdAt.lte));
      }
    }
    if (payload.size) {
      if (payload.size.gte !== undefined) {
        conditions.push(gte(file.size, payload.size.gte));
      }
      if (payload.size.lte !== undefined) {
        conditions.push(lte(file.size, payload.size.lte));
      }
    }
    let query = this.db
      .select({
        id: file.id,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        name: file.name,
        size: file.size,
        path: file.path,
        mimetype: file.mimetype,
        provider: file.storageProviderId,
        providerFileId: file.storageProviderFileId,
      })
      .from(file)
      .where(and(...conditions.filter(Boolean)))
      .$dynamic();
    const orderByClause =
      payload.order === 'asc' ? asc(file.createdAt) : desc(file.createdAt);
    query = query.orderBy(orderByClause);
    if (payload.limit !== undefined) {
      query = query.limit(payload.limit);
    }
    if (payload.offset !== undefined) {
      query = query.offset(payload.offset);
    }
    const result = await query;
    const settledFiles = await Promise.allSettled<File>(
      result.map(async (file) => {
        const storageProvider = this.getStoragePovider(file.provider);
        const url = await storageProvider.getUrl(file.providerFileId);
        delete (file as Record<string, unknown>).providerFileId;
        return { ...file, url };
      }),
    );
    const files = settledFiles
      .filter((f) => f.status === 'fulfilled')
      .map((f) => f.value);
    return files;
  }

  async getUrl(storageId: StorageProviderId, fileId: string): Promise<string> {
    const storageProvider = this.getStoragePovider(storageId);
    const url = await storageProvider.getUrl(fileId);
    return url;
  }

  async delete(fileIds: string[]): Promise<void> {
    if (fileIds.length < 1) return;
    const files = await this.db
      .delete(file)
      .where(inArray(file.id, fileIds))
      .returning({
        provider: file.storageProviderId,
        fileId: file.storageProviderFileId,
      });
    Promise.all(
      files.map(async (file) => {
        const storageProvider = this.getStoragePovider(file.provider);
        await storageProvider.delete(file.fileId);
      }),
    );
  }
}
