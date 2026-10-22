import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

async function copyDesktop(stage) {
  for (const file of ['main.cjs', 'assets.cjs', 'config.cjs', 'menu.cjs'])
    await cp(`desktop/${file}`, join(stage, file));
  await cp('dist/procode/browser', join(stage, 'web'), { recursive: true });
  await cp('desktop/resources/ProCode.ico', join(stage, 'ProCode.ico'));
}
async function copyNotices(stage) {
  await mkdir(join(stage, 'licenses'));
  await cp('dist/procode/3rdpartylicenses.txt', join(stage, 'licenses/web-dependencies.txt'));
  await cp('node_modules/electron/dist/LICENSE', join(stage, 'licenses/Electron.txt'));
  await cp(
    'node_modules/electron/dist/LICENSES.chromium.html',
    join(stage, 'licenses/Chromium.html'),
  );
}
async function writeMetadata(stage, version) {
  const app = {
    name: 'procode',
    productName: 'ProCode',
    version,
    description: 'Local coding practice',
    author: 'Jacob Stieneker',
    main: 'main.cjs',
    private: true,
  };
  await writeFile(join(stage, 'package.json'), JSON.stringify(app, null, 2));
}
export async function prepareDesktop() {
  const metadata = JSON.parse(await readFile('package.json', 'utf8'));
  const stage = resolve('.desktop-stage');
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage);
  await copyDesktop(stage);
  await copyNotices(stage);
  await writeMetadata(stage, metadata.version);
  return { stage, metadata };
}
