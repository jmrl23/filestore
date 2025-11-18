import dotenvx from '@dotenvx/dotenvx';
import { defineConfig } from 'drizzle-kit';

dotenvx.config({
  path: ['.env.local'],
});

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
