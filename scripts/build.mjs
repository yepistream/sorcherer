import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const distDir = resolve(projectRoot, 'dist');

await mkdir(distDir, { recursive: true });
await copyFile(resolve(projectRoot, 'src/sorcherer.js'), resolve(distDir, 'sorcherer.js'));
await copyFile(resolve(projectRoot, 'magicalStyle.css'), resolve(distDir, 'magicalStyle.css'));
await writeFile(resolve(distDir, 'index.js'), "export * from './sorcherer.js';\n", 'utf8');

console.log('Built runtime artifacts into dist/.');
