import { MultipartFile, MultipartValue } from '@fastify/multipart';

type MultipartEntry = MultipartFile | MultipartValue;

export function isMultipartEntry(v: any): v is MultipartEntry {
  return v && typeof v === 'object' && 'type' in v;
}

export function normalizeEntry(entry: MultipartEntry): any {
  if (entry.type === 'file') {
    return entry;
  }
  if (entry.type === 'field') {
    return entry.value;
  }
  return entry;
}
