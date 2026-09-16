#!/usr/bin/env node
const fs = require('node:fs');
const { parseCorrection, assertTrusted, makeCandidate, validateCandidate, evaluateRisk, parseRules, readYaml } = require('./lib');
const file = process.argv[2];
if (!file) throw new Error('Usage: node scripts/propose-instruction.js <event.json> [output.json]');
const event = JSON.parse(fs.readFileSync(file, 'utf8'));
const config = readYaml('.github/learning-config.yml');
assertTrusted(event, config);
const candidate = makeCandidate(parseCorrection(event.body), event, process.env.SIMULATION_TIME || new Date().toISOString());
const existing = parseRules(fs.readFileSync('.github/copilot-instructions.md', 'utf8'));
const result = validateCandidate(candidate, existing);
if (!result.valid) throw new Error(result.errors.join('\n'));
candidate.evaluation = evaluateRisk(candidate);
const output = JSON.stringify(candidate, null, 2) + '\n';
if (process.argv[3]) fs.writeFileSync(process.argv[3], output); else process.stdout.write(output);
