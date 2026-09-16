#!/usr/bin/env node
'use strict';

// Shows what your current auto-merge policy would do with a range of corrections.
// Edit .github/auto-merge-policy.yml and run this again to see the effect.

const { parseCorrection, makeCandidate, validateCandidate, evaluatePolicy, readYaml } = require('./lib');

const policy = readYaml('.github/auto-merge-policy.yml');

const EVENT = {
  repository: 'octocat/demo',
  comment_id: 1,
  actor: { login: 'maintainer', association: 'OWNER' },
  pull_request: { number: 1, author: 'octocat', labels: ['copilot-authored'] }
};

const EXAMPLES = [
  ['A narrow testing rule', 'category: TEST\nrule: Add unit tests for every new exported function.\nrationale: applyDiscount shipped without tests.\nscope: path:src/'],
  ['A narrow style rule', 'category: STYLE\nrule: Use const for values that are never reassigned.\nrationale: Keeps intent obvious.\nscope: path:src/'],
  ['A repository-wide mandate', 'category: CODE\nrule: Always validate every input at every boundary.\nrationale: Broad hardening.\nscope: repository'],
  ['A security rule', 'category: SECURITY\nrule: Store tokens in the secret store.\nrationale: Tokens were committed once.\nscope: path:src/'],
  ['A process change', 'category: PROCESS\nrule: Require two approvals on release branches.\nrationale: Release safety.\nscope: repository']
];

const context = {
  labels: [...(policy.required_labels || [])],
  paths: ['.github/copilot-instructions.md', 'data/candidates/', 'data/audit/']
};

const rows = EXAMPLES.map(([label, body]) => {
  const candidate = makeCandidate(parseCorrection(`/copilot-learn\n${body}`), EVENT, '2026-01-01T00:00:00.000Z');
  const validation = validateCandidate(candidate, []);
  if (!validation.valid) return { label, risk: '-', decision: 'rejected', why: validation.errors[0] };
  const decision = evaluatePolicy(candidate, policy, context);
  return {
    label,
    risk: decision.risk,
    decision: decision.autoMergeEligible ? 'auto-merge' : 'human review',
    why: decision.reasons[0] || ''
  };
});

const width = Math.max(...rows.map((r) => r.label.length));
console.log(`\nPolicy: enabled=${policy.enabled}  allowed_risk=${policy.allowed_risk}  blocked=${(policy.blocked_categories || []).join(',') || 'none'}\n`);
console.log(`${'CORRECTION'.padEnd(width)}  ${'RISK'.padEnd(6)}  ${'DECISION'.padEnd(13)}  WHY`);
console.log('-'.repeat(width + 40));
for (const row of rows) {
  console.log(`${row.label.padEnd(width)}  ${row.risk.padEnd(6)}  ${row.decision.padEnd(13)}  ${row.why}`);
}
console.log('');
