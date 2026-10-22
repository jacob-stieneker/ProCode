import { chromium } from '@playwright/test';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const temp = await mkdtemp(join(tmpdir(), 'procode-icon-'));
const iconset = join(temp, 'ProCode.iconset');
await mkdir(iconset);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
  await page.goto(pathToFileURL(resolve('public/favicon.svg')).href);
  await page.screenshot({ path: join(temp, 'icon.png'), omitBackground: true });
  for (const size of [16, 32, 128, 256, 512]) {
    for (const scale of [1, 2]) {
      execFileSync(
        'sips',
        [
          '-z',
          String(size * scale),
          String(size * scale),
          join(temp, 'icon.png'),
          '--out',
          join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`),
        ],
        { stdio: 'ignore' },
      );
    }
  }
  execFileSync('iconutil', [
    '-c',
    'icns',
    iconset,
    '-o',
    resolve('desktop/resources/ProCode.icns'),
  ]);
} finally {
  await browser.close();
  await rm(temp, { recursive: true, force: true });
}
