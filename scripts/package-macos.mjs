import { packager } from '@electron/packager';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { prepareDesktop } from './desktop-stage.mjs';
import config from '../desktop/config.cjs';

if (process.platform !== 'darwin' || process.arch !== 'arm64')
  throw new Error('This packaging target requires an Apple Silicon Mac.');
const { stage, metadata } = await prepareDesktop();
const [output] = await packager({
  dir: stage,
  out: resolve('release'),
  name: 'ProCode',
  executableName: 'ProCode',
  appBundleId: config.appId,
  appCategoryType: 'public.app-category.education',
  platform: 'darwin',
  arch: 'arm64',
  electronVersion: metadata.devDependencies.electron,
  appVersion: metadata.version,
  icon: resolve('desktop/resources/ProCode.icns'),
  asar: true,
  overwrite: true,
  prune: false,
  darwinDarkModeSupport: true,
  osxSign: {
    identity: '-',
    identityValidation: false,
    preAutoEntitlements: false,
    gatekeeperAssess: false,
    optionsForFile: () => ({
      entitlements: resolve('desktop/resources/entitlements.plist'),
      hardenedRuntime: true,
    }),
  },
});
execFileSync(
  'codesign',
  ['--verify', '--deep', '--strict', '--verbose=2', join(output, 'ProCode.app')],
  { stdio: 'inherit' },
);
console.log(`Packaged local-use app: ${join(output, 'ProCode.app')}`);
