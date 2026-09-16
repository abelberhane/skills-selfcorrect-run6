#!/usr/bin/env node
const fs = require('node:fs');
const { validateCandidate, evaluatePolicy, parseRules, readYaml } = require('./lib');
const [candidateFile, contextFile] = process.argv.slice(2);
if (!candidateFile || !contextFile) throw new Error('Usage: node scripts/evaluate-instruction.js <candidate.json> <context.json>');
const candidate = JSON.parse(fs.readFileSync(candidateFile, 'utf8'));
const context = JSON.parse(fs.readFileSync(contextFile, 'utf8'));
const existing = parseRules(fs.readFileSync('.github/copilot-instructions.md', 'utf8')).filter((rule) => rule.id !== candidate.id);
const validation = validateCandidate(candidate, existing);
const policy = readYaml('.github/auto-merge-policy.yml');
const result = { ...validation, ...evaluatePolicy(candidate, policy, context) };
if (!validation.valid) result.autoMergeEligible = false;
console.log(JSON.stringify(result, null, 2));
if (!validation.valid) process.exitCode = 1;
