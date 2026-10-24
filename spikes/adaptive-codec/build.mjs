// Build only the disposable bounded codec; production builds never import this spike.
import { spawnSync } from 'node:child_process';
import { copyFile, mkdir, writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = fileURLToPath(new URL('.', import.meta.url));
const result = spawnSync('cargo', ['build', '--release', '--locked', '--offline', '--target', 'wasm32-unknown-unknown'], {
  cwd: new URL('./rust/', import.meta.url), stdio: 'inherit',
  env: { ...process.env, CARGO_HOME: root + '.scratch/cargo', CARGO_TARGET_DIR: root + '.scratch/target' }
});
if (result.status !== 0) process.exit(result.status ?? 1);
const manifest = await readFile(new URL('./rust/Cargo.toml', import.meta.url), 'utf8');
const name = manifest.match(/^name\s*=\s*"([^"]+)"/m)[1].replaceAll('-', '_');
await copyFile(new URL(`./.scratch/target/wasm32-unknown-unknown/release/${name}.wasm`, import.meta.url), new URL('./codec.wasm', import.meta.url));
const bytes = await readFile(new URL('./codec.wasm', import.meta.url));
await mkdir(new URL('./evidence/', import.meta.url), { recursive: true });
const rustc = spawnSync('rustc', ['--version'], { encoding: 'utf8' }).stdout.trim();
await writeFile(new URL('./evidence/build.json', import.meta.url), JSON.stringify({ rustc, sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, target: 'wasm32-unknown-unknown', locked: true, offlineBuild: true }, null, 2) + '\n');
console.log('Built codec.wasm', bytes.length, 'bytes');
