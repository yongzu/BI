// Publish dist/ to the gh-pages branch (GitHub Pages).
//
// The branch is rebuilt from dist/ every time, so anything else published there would be
// wiped. Folders listed in KEEP are copied over from the live gh-pages first — /gpt/ is the
// GPT variant another tool deploys under https://yongzu.github.io/BI/gpt/ (2026-09-22).
import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const KEEP = ['gpt'];

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

rmSync('dist/.git', { recursive: true, force: true });
writeFileSync('dist/.nojekyll', '');
git('init -q -b gh-pages');
git('add -A');
git(`-c user.name="${name}" -c user.email="${email}" commit -q -m "Deploy to GitHub Pages"`);
git(`push -f ${remote} gh-pages`);
rmSync('dist/.git', { recursive: true, force: true });
