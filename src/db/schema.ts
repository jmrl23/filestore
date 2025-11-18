import { sql } from 'drizzle-orm';
import {
  bigint,
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
    mimetype: text('mimetype').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    provider: text('storage_provider').notNull(),
    referenceId: text('file_id').notNull(),
  },
  (table) => [
    uniqueIndex('File_reference_key_key').using(
      'btree',
      table.referenceId.asc().nullsLast().op('text_ops'),
    ),
  ],
);
