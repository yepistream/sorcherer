import { mkdir, readFile, writeFile } from 'node:fs/promises';

const sourcePath = 'src/sorcherer.js';
const distDir = 'dist';

const source = await readFile(sourcePath, 'utf8');
await mkdir(distDir, { recursive: true });

const esmFile = 'index.mjs';
const cjsFile = 'index.cjs';

const esmCode = `${source}\n//# sourceMappingURL=${esmFile}.map\n`;

const cjsTransformed = source
  .replace(
    "import { Vector3, Frustum, Matrix4 } from 'three';",
    "const { Vector3, Frustum, Matrix4 } = require('three');"
  )
  .replace(/export\s*\{\s*Sorcherer\s*\};\s*$/m, 'module.exports = { Sorcherer };');

const cjsCode = `${cjsTransformed}\n//# sourceMappingURL=${cjsFile}.map\n`;

const mapFor = (file) =>
  JSON.stringify({
    version: 3,
    file,
    sources: [sourcePath],
    sourcesContent: [source],
    names: [],
    mappings: ''
  });

await Promise.all([
  writeFile(`${distDir}/${esmFile}`, esmCode),
  writeFile(`${distDir}/${esmFile}.map`, mapFor(esmFile)),
  writeFile(`${distDir}/${cjsFile}`, cjsCode),
  writeFile(`${distDir}/${cjsFile}.map`, mapFor(cjsFile)),
  writeFile(
    `${distDir}/index.d.ts`,
    `export class Sorcherer {\n  constructor(...args: any[]);\n  attach(innerHTML: string): void;\n  dispose(): void;\n  setDynamicVar(varName: string, value: string): void;\n  getDynamicVar(varName: string): string;\n}\n`
  )
]);
