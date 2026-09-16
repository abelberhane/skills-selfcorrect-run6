#!/usr/bin/env node
const fs = require('node:fs');
const STEP_COUNT = 8;
const required = ['README.md','LICENSE','CODEOWNERS','.github/copilot-instructions.md','.github/learning-config.yml','.github/auto-merge-policy.yml','schemas/candidate.schema.json','schemas/auto-merge-policy.schema.json','.github/workflows/0-start-exercise.yml','.github/steps/x-review.md','src/cart.js','test/cart.test.js','scripts/open-review-pr.js','scripts/decide.js'];
for (let i = 1; i <= STEP_COUNT; i++) required.push(`.github/workflows/${i}-step.yml`);
for (let i = 1; i <= STEP_COUNT; i++) required.push(`.github/steps/${i}-step.md`);
const missing = required.filter((file) => !fs.existsSync(file));
if (missing.length) throw new Error(`Missing required files:\n${missing.join('\n')}`);
const instructions = fs.readFileSync('.github/copilot-instructions.md', 'utf8');
if (!instructions.includes('<!-- learned-rules:start -->') || !instructions.includes('<!-- learned-rules:end -->')) throw new Error('Instruction boundaries are missing.');
JSON.parse(fs.readFileSync('schemas/candidate.schema.json'));
JSON.parse(fs.readFileSync('schemas/auto-merge-policy.schema.json'));
const workflows = fs.readdirSync('.github/workflows').filter((file) => file.endsWith('.yml'));
for (const file of workflows) {
  const contents = fs.readFileSync(`.github/workflows/${file}`, 'utf8');
  if (contents.includes('pull_request_target')) throw new Error(`${file} must not expose secrets to fork code.`);
  if (/gh pr merge[^\n]*--admin/.test(contents)) throw new Error(`${file} bypasses branch protection.`);
}
for (let step = 1; step <= STEP_COUNT; step++) {
  const contents = fs.readFileSync(`.github/steps/${step}-step.md`, 'utf8');
  for (const heading of ['### 📖 Theory:', '### ⌨️ Activity:', 'Having trouble?']) if (!contents.includes(heading)) throw new Error(`Step ${step} is missing "${heading}".`);
  if (!new RegExp(`^## Step ${step}: .+`, 'm').test(contents)) throw new Error(`Step ${step} is missing its "## Step ${step}: <title>" heading.`);
  if (!/^> \*\*Lesson [12] of 2 · /m.test(contents)) throw new Error(`Step ${step} is missing its lesson banner.`);
  for (const callout of contents.match(/^[ \t]+> \[!(NOTE|IMPORTANT|TIP)\]/gm) || []) throw new Error(`Step ${step} has an indented callout: ${callout.trim()}`);
}
for (const [file, name] of [[`.github/steps/x-review.md`, 'Review']]) {
  const contents = fs.readFileSync(file, 'utf8');
  if (!contents.startsWith('## Review')) throw new Error(`${name} file must start with "## Review".`);
}
// The exercise only advances if each step workflow hands off to the next one.
if (!fs.readFileSync('.github/workflows/0-start-exercise.yml', 'utf8').includes('gh workflow enable "Step 1"')) throw new Error('0-start-exercise.yml must enable "Step 1".');
for (let step = 1; step <= STEP_COUNT; step++) {
  const contents = fs.readFileSync(`.github/workflows/${step}-step.yml`, 'utf8');
  if (!contents.startsWith(`name: Step ${step}\n`)) throw new Error(`${step}-step.yml must be named "Step ${step}" so the previous step can enable it.`);
  if (!contents.includes('gh workflow disable')) throw new Error(`${step}-step.yml must disable itself after passing.`);
  // Copying the exercise pushes to main. If main is not ignored, every step
  // workflow fires at once on repository creation and the learner gets a wall
  // of failed runs.
  if (!/branches-ignore:\s*\n\s*- main\b/.test(contents)) throw new Error(`${step}-step.yml must list "main" under branches-ignore.`);
  const handoff = step < STEP_COUNT ? `gh workflow enable "Step ${step + 1}"` : 'finish-exercise.yml';
  if (!contents.includes(handoff)) throw new Error(`${step}-step.yml must hand off with "${handoff}".`);
}
// The template must ship with applyDiscount ABSENT. Step 1 adds it on a branch so the
// learner has something real to review; if it were already here the review is pointless.
const cart = fs.readFileSync('src/cart.js', 'utf8');
if (cart.includes('applyDiscount')) throw new Error('src/cart.js must not contain applyDiscount in the published template; step 1 adds it on a branch so the learner has something to review.');
const { testCoverage } = require('./lib');
const baseline = testCoverage('src/cart.js', 'test/cart.test.js');
if (baseline.uncovered.length) throw new Error(`src/cart.js ships with untested exports: ${baseline.uncovered.join(', ')}`);

console.log(`Repository structure is valid (${required.length} required files).`);
