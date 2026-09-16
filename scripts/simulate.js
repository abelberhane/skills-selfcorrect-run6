#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { parseCorrection, assertTrusted, makeCandidate, validateCandidate, evaluateRisk } = require('./lib');
const fixtures = ['test/fixtures/valid/correction.json'];
for (const file of fixtures) {
  const event = JSON.parse(fs.readFileSync(file));
  assertTrusted(event);
  const candidate = makeCandidate(parseCorrection(event.body), event, '2026-01-01T00:00:00.000Z');
  const validation = validateCandidate(candidate, event.existing_rules || []);
  console.log(JSON.stringify({ fixture: path.basename(file), candidate, validation, evaluation: evaluateRisk(candidate) }, null, 2));
}
