import {
  isMultipartEntry,
  normalizeEntry,
} from '@/modules/filestore/utils/normalize-multipart';
import { Multipart } from '@fastify/multipart';
import { FastifyRequest } from 'fastify';

export async function multipartPrevalidator(request: FastifyRequest) {
  const body = request.body as Record<string, Multipart | Multipart[] | string>;
  if (!(body instanceof Object)) return;
  for (const key in body) {
    const value = body[key];
    if (Array.isArray(value)) {
      body[key] = value.map((v) => normalizeEntry(v));
      continue;
    }
    if (isMultipartEntry(value)) {
      const normalized = normalizeEntry(value);
      if (value.type === 'file') {
        body[key] = [normalized];
      } else {
        body[key] = normalized;
      }
      continue;
    }
  }
}
