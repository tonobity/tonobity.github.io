// Run ONLY when the game is live on Google Play. Unhide it on tonobity.github.io:  node publish-game.mjs <block-jam|hex-fit|noodle-stall>
// Builds the web demo from the sibling repo clone (../<id>), copies it to <id>/play/ plus the store icon,
// and sets "visible": true in games.json. Then commit + push this repo.
// Hide again:  node publish-game.mjs <id> --hide   (removes the demo files and sets visible false)
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [id, flag] = process.argv.slice(2);
const games = JSON.parse(readFileSync('games.json', 'utf8'));
const g = games.find((x) => x.id === id);
if (!g) { console.error(`unknown game "${id}". Known: ${games.map((x) => x.id).join(', ')}`); process.exit(1); }

if (flag === '--hide') {
  rmSync(id, { recursive: true, force: true });
  g.visible = false;
} else {
  const repo = resolve('..', id);
  if (!existsSync(repo)) { console.error(`clone ${id} next to this repo first: ${repo}`); process.exit(1); }
  const key = readdirSync(join(repo, 'src/games'))[0];
  execSync(`node scripts/build-web.mjs ${key}`, { cwd: repo, stdio: 'inherit' });
  rmSync(id, { recursive: true, force: true });
  mkdirSync(join(id, 'play'), { recursive: true });
  cpSync(join(repo, 'dist-mobile', key), join(id, 'play'), { recursive: true });
  cpSync(join(repo, 'store', key, 'icon-512.png'), join(id, 'icon.png'));
  g.visible = true;
}
writeFileSync('games.json', JSON.stringify(games, null, 2) + '\n');
console.log(`${id}: visible=${g.visible}. Now: git add -A && git commit -m "${flag === '--hide' ? 'Hide' : 'Publish'} ${id}" && git push`);
