import { file } from '@/db/schema';
import { StorageProvider } from '@/modules/storage/interfaces/storage-provider.interface';
import { PROVIDER_ID } from '@/modules/storage/providers/constants';
import { FetchFiles } from '@/modules/storage/schemas/fetch-files.schema';
import { File } from '@/modules/storage/schemas/file.schema';
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
    storageId: PROVIDER_ID,
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
          provider: storageId,
          referenceId: file.id,
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

  async fetchFiles(payload: FetchFiles = {}): Promise<File[]> {
    const conditions: (SQL | undefined)[] = [];
    if (payload.id && payload.id.length > 0) {
      conditions.push(inArray(file.id, payload.id));
    }
    if (payload.provider) {
      conditions.push(eq(file.provider, payload.provider));
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
        provider: file.provider,
        referenceId: file.referenceId,
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
        const url = await storageProvider.getUrl(file.referenceId);
        delete (file as Record<string, unknown>).referenceId;
        return { ...file, url };
      }),
    );
    const files = settledFiles
      .filter((f) => f.status === 'fulfilled')
      .map((f) => f.value);
    return files;
  }

  async getUrl(storageId: PROVIDER_ID, fileId: string): Promise<string> {
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
        provider: file.provider,
        refereceId: file.referenceId,
      });
    Promise.all(
      files.map(async (file) => {
        const storageProvider = this.getStoragePovider(file.provider);
        await storageProvider.delete(file.refereceId);
      }),
    );
  }
}
