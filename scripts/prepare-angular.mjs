import { build } from 'esbuild';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
const target = new URL('../public/runtime/angular/', import.meta.url);
await mkdir(target, { recursive: true });
await build({
  entryPoints: ['scripts/angular-runtime/runtime.js'],
  outfile: 'public/runtime/angular/runtime.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'eof',
});
await cp(
  new URL('../node_modules/typescript/lib/typescript.js', import.meta.url),
  new URL('typescript.js', target),
);
await cp(
  new URL('angular-runtime/compiler-worker.js', import.meta.url),
  new URL('compiler-worker.js', target),
);
const version = JSON.parse(
  await readFile(new URL('../node_modules/@angular/core/package.json', import.meta.url), 'utf8'),
).version;
await writeFile(new URL('version.json', target), JSON.stringify({ angular: version }, null, 2));
console.log(`Local Angular ${version} practice runtime prepared.`);

await mkdir(new URL('../public/runtime/fullstack/', import.meta.url), { recursive: true });
await build({
  entryPoints: ['scripts/fullstack-runtime/runtime.js'],
  outfile: 'public/runtime/fullstack/runtime.js',
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  legalComments: 'eof',
});

await mkdir(new URL('../public/runtime/clean/', import.meta.url), { recursive: true });
await build({
  entryPoints: ['scripts/clean-runtime/analyzer.mjs'],
  outfile: 'public/runtime/clean/analyzer.js',
  bundle: true,
  format: 'iife',
  globalName: 'ProCodeClean',
  platform: 'browser',
  target: 'es2022',
  minify: true,
});
for (const file of ['worker.js', 'python-analyzer.py'])
  await cp(
    new URL(`clean-runtime/${file}`, import.meta.url),
    new URL(`../public/runtime/clean/${file}`, import.meta.url),
  );

await mkdir(new URL('../public/runtime/method/', import.meta.url), { recursive: true });
await build({
  entryPoints: ['scripts/method-runtime/execution.mjs'],
  outfile: 'public/runtime/method/execution.js',
  bundle: true,
  format: 'iife',
  globalName: 'ProCodeMethodRuntime',
  platform: 'browser',
  target: 'es2022',
  minify: true,
});
await cp(
  new URL('method-runtime/python-analyzer.py', import.meta.url),
  new URL('../public/runtime/method/python-analyzer.py', import.meta.url),
);
