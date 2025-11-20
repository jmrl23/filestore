import { createKeyv } from '@keyv/redis';
import { createCache } from 'cache-manager';
import ms from 'ms';

export const cache = createCache({
  ttl: ms('7d'),
  stores: [
    createKeyv({
      url: process.env.REDIS_URL,
    }),
  ],
});
