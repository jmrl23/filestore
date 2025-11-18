import { DATABASE_URL } from '@/config/env';
import { file } from '@/db/schema';
import { drizzle } from 'drizzle-orm/node-postgres';

export const db = drizzle(DATABASE_URL, {
  schema: { file },
});
