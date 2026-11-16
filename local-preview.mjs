// Local-only preview of ALL games (released or not):  node local-preview.mjs  then open http://localhost:5320
// Builds into local/ (gitignored) and writes local/games.json. The public site only ever uses games.json,
// where a game is listed once it is on Google Play (node publish-game.mjs <id>).
// pocket-arcade is only read (another session edits it); nothing is written there.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const PA = resolve('../../pocket-arcade');
const OUT = resolve('local');

// [id, title, tagline, group, source]  source: 'tonobity' = ../<repo> clone, 'pa' = pocket-arcade game key
const GAMES = [
  ['sliderloo', 'Sliderloo', 'Slide every block out through its colour gap.', 'prio', { repo: 'block-jam', key: 'blockjam' }],
  ['hex-fit', 'Hex Fit', 'Fill the lines. Match the colours.', 'prio', { pa: 'hexfit' }],
  ['word-lock', 'Word Lock', 'Turn the lock wheels until every row spells a word.', 'prio', { pa: 'wordlock' }],
  ['noodle-stall', 'Noodle Stall', 'Cook. Serve. Grow your stall.', 'other', { repo: 'noodle-stall', key: 'idleshop' }],
  ['mix-lab', 'Mix Lab', 'Pour and mix paint into exact colours.', 'other', { pa: 'colorsort' }],
  ['stack-tower', 'Stack Tower', 'Tap to drop each block and build the tallest tower.', 'other', { pa: 'stacktower' }],
  ['word-link', 'Word Link', 'Swipe the letter wheel to fill the crossword.', 'other', { pa: 'wordlink' }],
  ['gate-rush', 'Gate Rush', 'Work in progress.', 'other', { pa: 'gaterush' }],
];

const { build } = await import(pathToFileURL(`${PA}/node_modules/vite/dist/node/index.js`).href);
rmSync(OUT, { recursive: true, force: true });
const list = [];
for (const [id, title, tagline, group, src] of GAMES) {
  const dir = `${OUT}/${id}`;
  mkdirSync(dir, { recursive: true });
  let icon;
  if (src.repo) {
    const repo = resolve('..', src.repo);
    execSync(`node scripts/build-web.mjs ${src.key}`, { cwd: repo, stdio: 'inherit' });
    cpSync(`${repo}/dist-mobile/${src.key}`, `${dir}/play`, { recursive: true });
    icon = `${repo}/store/${src.key}/icon-512.png`;
  } else {
    await build({ configFile: false, root: `${PA}/src/games/${src.pa}`, base: './', logLevel: 'error',
      build: { outDir: `${dir}/play`, emptyOutDir: true, target: 'es2020' } });
    icon = `${PA}/store/${src.pa}/icon-512.png`;
  }
  if (existsSync(icon)) cpSync(icon, `${dir}/icon.png`);
  list.push({ id, title, tagline, group, icon: existsSync(icon) ? `local/${id}/icon.png` : '', playStore: '', demo: `local/${id}/play/`, visible: true });
  console.log('built', id);
}
writeFileSync(`${OUT}/games.json`, JSON.stringify(list, null, 2) + '\n');
console.log(`${list.length} games in local/. Open http://localhost:5320`);
