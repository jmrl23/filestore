import { sql } from 'drizzle-orm';
import {
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const file = pgTable(
  'files',
  {
    id: uuid('id')
      .default(sql`gen_random_uuid()`)
      .primaryKey()
      .notNull(),
    createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    name: text().notNull(),
    path: text().default('').notNull(),
    mimetype: text().notNull(),
    size: integer().notNull(),
    storageProviderId: text('storage_provider_id').notNull(),
    storageProviderFileId: text('storage_provider_file_id').notNull(),
  },
  (table) => [
    uniqueIndex('File_key_key').using(
      'btree',
      table.storageProviderFileId.asc().nullsLast().op('text_ops'),
    ),
  ],
);
