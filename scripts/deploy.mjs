// Publish dist/ to the gh-pages branch (GitHub Pages).
import { execSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';

const git = (args, cwd = 'dist') => execSync(`git ${args}`, { cwd, stdio: 'inherit' });
const read = (args) => execSync(`git ${args}`).toString().trim();

const remote = read('remote get-url origin');
const name = read('config user.name');
const email = read('config user.email');

rmSync('dist/.git', { recursive: true, force: true });
writeFileSync('dist/.nojekyll', '');
git('init -q -b gh-pages');
git('add -A');
git(`-c user.name="${name}" -c user.email="${email}" commit -q -m "Deploy to GitHub Pages"`);
git(`push -f ${remote} gh-pages`);
rmSync('dist/.git', { recursive: true, force: true });
