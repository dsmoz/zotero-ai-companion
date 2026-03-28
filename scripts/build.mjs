import { build } from 'esbuild';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

await build({
  entryPoints: [join(root, 'src/bootstrap.ts')],
  bundle: true,
  outfile: join(root, 'build/index.js'),
  format: 'iife',
  target: 'firefox102',
  external: ['zotero', 'components/'],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  jsx: 'automatic',
  jsxImportSource: 'react',
});

console.log('Build complete: build/index.js');
