import { createReadStream } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename } from 'node:path';

export async function writeChecksum(path) {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  await writeFile(`${path}.sha256`, `${hash.digest('hex')}  ${basename(path)}\n`);
}
