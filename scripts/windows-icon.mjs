import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 256, height: 256 } });
  await page.goto(pathToFileURL(resolve('public/favicon.svg')).href);
  const png = await page.screenshot({ omitBackground: true });
  const header = Buffer.alloc(22);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(header.length, 18);
  await writeFile('desktop/resources/ProCode.ico', Buffer.concat([header, png]));
} finally {
  await browser.close();
}
