// Publish dist/ to the gh-pages branch (GitHub Pages).
//
// The branch is rebuilt from dist/ every time, so anything else published there would be
// wiped. Folders listed in KEEP are copied over from the live gh-pages first — /gpt/ is the
// GPT variant another tool deploys under https://yongzu.github.io/BI/gpt/ (2026-09-22).
//
// Past versions (public/versions.json entries with a path, e.g. v1/) are frozen builds served
// under /BI/v1/ … (2026-10-14). They are kept from the live site like /gpt/; one that is not
// there yet is built once from its git tag (v1, v2, …) with base /BI/<id>/.
//   npm run deploy -- --rebuild v1   rebuilds v1 from its tag instead of keeping the live copy
//   npm run deploy -- --dry-run      builds dist/ as it would be published, without pushing
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

const snapshots = JSON.parse(readFileSync('public/versions.json', 'utf8')).filter((v) => v.path).map((v) => v.id);
const rebuild = process.argv.includes('--rebuild') ? process.argv.slice(process.argv.indexOf('--rebuild') + 1) : [];
const KEEP = ['gpt', ...snapshots.filter((id) => !rebuild.includes(id))];

const git = (args, cwd = 'dist') => execSync(`git ${args}`, { cwd, stdio: 'inherit' });
const read = (args) => execSync(`git ${args}`).toString().trim();

const remote = read('remote get-url origin');
const name = read('config user.name');
const email = read('config user.email');

// carry the kept folders over, byte for byte, from the published branch
execSync('git fetch -q origin gh-pages', { stdio: 'inherit' });
for (const dir of KEEP) {
  const files = read(`ls-tree -r --name-only origin/gh-pages -- ${dir}`).split('\n').filter(Boolean);
  for (const file of files) {
    const out = join('dist', file);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, execSync(`git show "origin/gh-pages:${file}"`, { maxBuffer: 64 * 1024 * 1024 }));
  }
  if (files.length) console.log(`kept ${dir}/ (${files.length} files) from the live site`);
}

// build the past versions that are not on the live site (or asked to be rebuilt) from their tags
for (const id of snapshots) {
  if (existsSync(join('dist', id))) continue;
  const tree = mkdtempSync(join(tmpdir(), `bi-${id}-`));
  console.log(`building ${id}/ from tag ${id}`);
  execSync(`git worktree add -q --detach "${tree}" refs/tags/${id}`, { stdio: 'inherit' });
  const modules = join(tree, 'node_modules');
  try {
    symlinkSync(resolve('node_modules'), modules, 'junction');
    execSync(`npx vite build --base /BI/${id}/ --outDir "${resolve('dist', id)}" --emptyOutDir --logLevel warn`, { cwd: tree, stdio: 'inherit' });
  } finally {
    // drop the link first so removing the worktree can never reach into the real node_modules
    if (existsSync(modules)) unlinkSync(modules);
    execSync(`git worktree remove --force "${tree}"`, { stdio: 'inherit' });
  }
}

// npm run deploy -- --dry-run   everything up to here (dist/ as it would be published), no push
if (process.argv.includes('--dry-run')) process.exit(0);

rmSync('dist/.git', { recursive: true, force: true });
writeFileSync('dist/.nojekyll', '');
git('init -q -b gh-pages');
git('add -A');
git(`-c user.name="${name}" -c user.email="${email}" commit -q -m "Deploy to GitHub Pages"`);
git(`push -f ${remote} gh-pages`);
rmSync('dist/.git', { recursive: true, force: true });
