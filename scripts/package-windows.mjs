import { build, Platform, Arch } from 'electron-builder';
import { prepareDesktop } from './desktop-stage.mjs';
import config from '../desktop/windows-builder.cjs';
import { writeChecksum } from './write-checksum.mjs';
import { resolve } from 'node:path';

if (process.platform !== 'win32')
  throw new Error('Build this installer on Windows, locally or with the Windows desktop workflow.');
const { metadata } = await prepareDesktop();
await build({ targets: Platform.WINDOWS.createTarget('nsis', Arch.x64), config, publish: 'never' });
const installer = resolve(`release/windows/ProCode-${metadata.version}-windows-x64-setup.exe`);
await writeChecksum(installer);
console.log(`Windows installer ready: ${installer}`);
