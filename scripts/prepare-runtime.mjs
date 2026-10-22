import { cp, mkdir, readdir } from 'node:fs/promises';
const source = new URL('../node_modules/pyodide/', import.meta.url);
const target = new URL('../public/runtime/pyodide/', import.meta.url);
await mkdir(target, { recursive: true });
for (const file of await readdir(source)) {
  if (/\.(mjs|js|wasm|zip|json)$/.test(file))
    await cp(new URL(file, source), new URL(file, target));
}
console.log('Local Python runtime prepared. No CDN is needed at runtime.');
