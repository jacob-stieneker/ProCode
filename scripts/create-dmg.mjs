import { cp, mkdtemp, readFile, rm, rename, symlink, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { resolve, join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

if (process.platform !== 'darwin' || process.arch !== 'arm64')
  throw new Error('This packaging target requires an Apple Silicon Mac.');
const { version } = JSON.parse(await readFile('package.json', 'utf8'));
const bundle = resolve('release/ProCode-darwin-arm64/ProCode.app');
execFileSync('codesign', ['--verify', '--deep', '--strict', bundle]);
const stage = await mkdtemp(join(tmpdir(), 'procode-dmg-'));
const artifact = resolve(`release/ProCode-${version}-arm64.dmg`);
const pending = artifact.replace(/\.dmg$/, '.pending.dmg');
try {
  await cp(bundle, join(stage, 'ProCode.app'), { recursive: true, verbatimSymlinks: true });
  await symlink('/Applications', join(stage, 'Applications'));
  await writeFile(
    join(stage, 'Install ProCode.txt'),
    `ProCode ${version} for Apple Silicon\n\nDrag ProCode.app into Applications, then open it from Applications.\nNo Node.js, Python installation, terminal, account, or internet connection is required for practice.\n\nThis local-use build is ad-hoc signed and has not been notarized by Apple.\n\nDesktop drafts and progress are separate from your web browser. Existing browser work remains in that browser; export it there before switching. Backup import is not implemented.\nDesktop work is saved in ~/Library/Application Support/ProCode. Replacing the app preserves that folder.\n`,
  );
  execFileSync(
    'hdiutil',
    [
      'create',
      '-volname',
      'ProCode',
      '-srcfolder',
      stage,
      '-ov',
      '-format',
      'UDZO',
      '-fs',
      'HFS+',
      pending,
    ],
    { stdio: 'inherit' },
  );
  execFileSync('hdiutil', ['verify', pending], { stdio: 'inherit' });
  await rename(pending, artifact);
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(artifact)) hash.update(chunk);
  await writeFile(`${artifact}.sha256`, `${hash.digest('hex')}  ${basename(artifact)}\n`);
  console.log(`DMG ready: ${artifact}`);
} finally {
  await rm(stage, { recursive: true, force: true });
  await rm(pending, { force: true });
}
