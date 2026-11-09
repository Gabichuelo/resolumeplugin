// Test runner: bundles tests/*.test.ts with esbuild (already installed with Vite) and runs them with node:test.
import { build } from 'esbuild';
import { readdirSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'node_modules', '.granddas-tests');
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const entries = readdirSync(join(root, 'tests'))
  .filter((f) => f.endsWith('.test.ts'))
  .map((f) => join(root, 'tests', f));

await build({
  entryPoints: entries,
  outdir: outDir,
  bundle: true,
  platform: 'node',
  format: 'esm',
  outExtension: { '.js': '.mjs' },
  external: ['node:*'],
  logLevel: 'error',
});

const files = readdirSync(outDir).filter((f) => f.endsWith('.mjs')).map((f) => join(outDir, f));
const res = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
process.exit(res.status ?? 1);
