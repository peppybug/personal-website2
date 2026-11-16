// Builds the deployable site into _site/ for GitHub Pages.
// The site has no bundler: this copies only the public files and fails the
// build if index.html references a local file that doesn't exist.
import { cp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_site');
const publicPaths = ['index.html', 'css', 'js', 'assets'];
const skip = (src) => /(^|[\\/])(README\.md|\.DS_Store)$/.test(src);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
for (const p of publicPaths) {
  await cp(join(root, p), join(out, p), { recursive: true, filter: (src) => !skip(src) });
}
// Serve files as-is; don't let Jekyll process the site.
await writeFile(join(out, '.nojekyll'), '');

// Verify every local src/href resolves. Root-relative paths ("/x") are
// rejected because they break on project pages served from /<repo>/.
const html = await readFile(join(out, 'index.html'), 'utf8');
const refs = [...html.matchAll(/\s(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
const problems = [];
for (const ref of refs) {
  if (/^(https?:|mailto:|tel:|#|data:)/.test(ref)) continue;
  if (ref.startsWith('/')) { problems.push(`root-relative path won't work on GitHub Pages: ${ref}`); continue; }
  try { await access(join(out, ref.split(/[?#]/)[0])); } catch { problems.push(`missing file: ${ref}`); }
}
if (problems.length) {
  console.error('Build failed:\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`Built _site/ — ${refs.length} references checked, all OK.`);
