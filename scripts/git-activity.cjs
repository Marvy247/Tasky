#!/usr/bin/env node
const { execSync } = require('child_process');
const { mkdirSync, writeFileSync, existsSync } = require('fs');
const { join } = require('path');

const TEMP_DIR = join(__dirname, '../temp-commits');
const NUM_PRS = 5;
const TOTAL_COMMITS = 50;
const COMMITS_PER_PR = Math.ceil(TOTAL_COMMITS / NUM_PRS); // 10 each
const OFFSET = 40000;

function run(cmd) {
  try { execSync(cmd, { stdio: 'inherit' }); } catch (e) { console.error(`Error: ${e.message}`); process.exit(1); }
}

function tryRun(cmd) {
  try { execSync(cmd, { stdio: 'inherit' }); } catch {}
}

if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

// Stage temp dir
writeFileSync(join(TEMP_DIR, '.gitkeep'), '');
tryRun('git add temp-commits/ && git commit -m "chore: init temp-commits dir"');

for (let pr = 1; pr <= NUM_PRS; pr++) {
  const branch = `activity-pr-${pr}`;
  run(`git checkout -b ${branch}`);

  const start = (pr - 1) * COMMITS_PER_PR + 1;
  const end = Math.min(pr * COMMITS_PER_PR, TOTAL_COMMITS);

  for (let c = start; c <= end; c++) {
    const file = join(TEMP_DIR, `counter${OFFSET + c}.txt`);
    writeFileSync(file, `counter #${OFFSET + c}\nupdated: ${new Date().toISOString()}\n`);
    run(`git add temp-commits/counter${OFFSET + c}.txt`);
    run(`git commit -m "chore: activity counter ${OFFSET + c}"`);
  }

  run(`git push origin ${branch}`);
  run(`gh pr create --title "chore: activity batch #${pr} (commits ${start}-${end})" --body "Activity batch ${pr}/${NUM_PRS} — ${end - start + 1} commits." --base main --draft`);
  console.log(`\n✅ PR ${pr}/${NUM_PRS} created (commits ${start}-${end})`);

  run('git checkout main');
}

console.log('\n✅ Done! 50 commits across 5 PRs created.');
