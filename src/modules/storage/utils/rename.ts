import { generateRandomString } from '@/common/random';
import path from 'node:path';

export function rename(name: string, suffixLength: number = 6): string {
  const extension = path.extname(name);
  const suffix = generateRandomString(suffixLength) + extension;
  const filename =
    name.substring(0, name.length - extension.length) + `-${suffix}`;
  return filename;
}
