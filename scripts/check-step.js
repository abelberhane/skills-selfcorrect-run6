#!/usr/bin/env node
'use strict';

// Grades one step of the exercise.
//
// Every check reads real repository state: the instructions file, the source and
// tests, the policy, or context the step workflow passes in. Nothing is graded on
// a chat transcript or on state that shipped with the template.

const fs = require('node:fs');
const { testCoverage, parseRules, readYaml } = require('./lib');

const INSTRUCTIONS = '.github/copilot-instructions.md';
const BOOTSTRAP_RULE = 'RULE-TEST-PARSER-001';

function read(file) {
  if (!fs.existsSync(file)) fail(`${file} is missing.`);
  return fs.readFileSync(file, 'utf8');
}
function fail(message) { console.error(`Step ${step}: ${message}`); process.exit(1); }
function assert(condition, message) { if (!condition) fail(message); }

// Splits the instructions file at the automation boundary.
function sections() {
  const contents = read(INSTRUCTIONS);
  const start = contents.indexOf('<!-- learned-rules:start -->');
  const end = contents.indexOf('<!-- learned-rules:end -->');
  assert(start !== -1 && end !== -1, 'The learned-rules markers are missing. Restore them; automation depends on them.');
  return { maintainer: contents.slice(0, start), learned: contents.slice(start, end), all: contents };
}

// Learned rules the user actually taught, ignoring the example that ships with the template.
function taughtRules() {
  return parseRules(read(INSTRUCTIONS)).filter((rule) => rule.id !== BOOTSTRAP_RULE);
}

function maintainerBullets() {
  return sections().maintainer.split('\n').filter((line) => /^-\s+\S/.test(line.trim()));
}

const steps = {
  // Added a maintainer rule by hand, in the correct section.
  1() {
    const bullets = maintainerBullets();
    assert(bullets.length >= 4,
      `The maintainer section has ${bullets.length} rules, expected at least 4. Add a rule of your own above the <!-- learned-rules:start --> marker.`);
    assert(taughtRules().length === 0,
      'Your rule landed in the Learned rules section. Move it into the maintainer section above the <!-- learned-rules:start --> marker.');
  },

  // Left ordinary review feedback, and nothing changed as a result.
  2() {
    const body = (process.env.COMMENT_BODY || '').trim();
    if (body) {
      assert(!body.startsWith('/copilot-learn'),
        'That was the /copilot-learn command. This step expects ordinary review feedback in your own words; the command comes next.');
      assert(body.length >= 10, 'Leave a substantive review comment describing what the pull request is missing.');
    }
    assert(taughtRules().length === 0,
      'The Learned rules section already changed. Ordinary feedback should leave it untouched; that is the point of this step.');
  },

  // The correction became a merged rule about tests.
  3() {
    const rules = taughtRules();
    assert(rules.length >= 1,
      'No learned rule found. Post the /copilot-learn correction, then merge the candidate pull request it opens.');
    const rule = rules.find((entry) => entry.category === 'TEST');
    assert(rule, `Found a learned rule in category ${rules[0].category}, but expected TEST. Use "category: TEST" in your correction.`);
    assert(rule.state === 'active', `Rule ${rule.id} is ${rule.state}, expected active.`);
    const block = sections().learned.split(`### ${rule.id}`)[1] || '';
    assert(/Provenance/i.test(block), `Rule ${rule.id} has no provenance link back to your comment.`);
  },

  // Every exported function now has a test.
  4() {
    const coverage = testCoverage('src/cart.js', 'test/cart.test.js');
    assert(coverage.exported.includes('applyDiscount'),
      'src/cart.js does not export applyDiscount. Check out the add-discount branch before running this check.');
    assert(coverage.uncovered.length === 0,
      `These exported functions have no test: ${coverage.uncovered.join(', ')}. That is exactly what the rule you just taught asks for.`);
  },

  // Auto-merge policy is on, with the sensitive categories still blocked.
  5() {
    const policy = readYaml('.github/auto-merge-policy.yml');
    assert(policy.enabled === true, 'Set "enabled: true" in .github/auto-merge-policy.yml.');
    assert(policy.allowed_risk === 'low', `allowed_risk is "${policy.allowed_risk}", expected "low".`);
    for (const category of ['ARCH', 'PROCESS', 'SECURITY']) {
      assert((policy.blocked_categories || []).includes(category),
        `${category} is missing from blocked_categories. Corrections in that category must always reach a human.`);
    }
  },

  // Branch protection and auto-merge are configured on the repository.
  6() {
    const protectedMain = process.env.MAIN_PROTECTED;
    const autoMerge = process.env.AUTO_MERGE_ALLOWED;
    assert(protectedMain !== 'false',
      'The main branch has no required status check. Add a ruleset requiring "Evaluate instruction candidate".');
    assert(autoMerge !== 'false',
      'Auto-merge is not enabled. Turn on "Allow auto-merge" in Settings -> General.');
    const policy = readYaml('.github/auto-merge-policy.yml');
    assert((policy.required_checks || []).includes('Evaluate instruction candidate'),
      'required_checks in your policy must list "Evaluate instruction candidate".');
    // Candidates branch from the default branch, so a policy that only exists on
    // your working branch would never apply to them.
    assert(policy.enabled === true,
      'The auto-merge policy is not enabled on the default branch. Merge your step 5 pull request into main so the policy applies to candidates.');
  },

  // A second rule arrived without anyone merging it by hand.
  7() {
    const rules = taughtRules();
    assert(rules.length >= 2,
      `Found ${rules.length} learned rule(s), expected 2. Post the second correction and let auto-merge land it, then run "git pull --rebase origin main".`);
    assert(rules.every((rule) => rule.state === 'active'),
      'Every learned rule should be active at this point.');
  },

  // The attack changed nothing.
  8() {
    const rules = taughtRules();
    assert(rules.length >= 2, 'Complete step 7 before this one.');
    const governance = rules.find((rule) => /disable|bypass|required check|branch protection/i.test(rule.rule));
    assert(!governance,
      `A governance-weakening rule reached your instructions: ${governance ? governance.id : ''}. It should have been refused.`);
    assert(!rules.some((rule) => ['ARCH', 'PROCESS', 'SECURITY'].includes(rule.category)),
      'A blocked category reached your instructions. Restore blocked_categories in your policy.');
  }
};

const step = Number(process.argv[2] || process.env.STEP);
if (!steps[step]) { console.error(`Unknown step: ${process.argv[2]}. Expected 1-8.`); process.exit(1); }
steps[step]();
console.log(`Step ${step} complete.`);
