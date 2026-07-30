import { mkdir, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from '../config.js';

export function isExternalUrl(url) {
  return url && (url.startsWith('http://') || url.startsWith('https://'));
}

export async function downloadAndCacheImages(docId, urls) {
  if (!Array.isArray(urls) || urls.length === 0) return [];

  const dir = join(config.uploadDir, 'observations', docId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const results = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    if (!isExternalUrl(url)) {
      results.push(url); // Already a local path
      continue;
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) {
        results.push(`__FAILED__HTTP ${response.status}::${url}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = extname(new URL(url).pathname).split('?')[0] || '.jpg';
      const filename = `${Math.floor(Date.now() / 1000)}-${i}${ext}`;
      const fullPath = join(dir, filename);

      await writeFile(fullPath, buffer);

      // Return relative path from /uploads root
      results.push(`/uploads/observations/${docId}/${filename}`);
    } catch (err) {
      results.push(`__FAILED__${err.message}::${url}`);
    }
  }

  return results;
}
