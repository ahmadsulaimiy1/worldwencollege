// Shared, portable path resolution for every test file in this
// directory — no hardcoded absolute paths, so the suite runs
// correctly from any checkout location.
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function loadUrl(relativePath) {
  return new URL(relativePath, 'file://' + ROOT + '/');
}
