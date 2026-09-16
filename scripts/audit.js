#!/usr/bin/env node
const fs = require('node:fs');
const crypto = require('node:crypto');
const [candidateFile, action = 'proposed', output] = process.argv.slice(2);
if (!candidateFile || !output) throw new Error('Usage: node scripts/audit.js <candidate> <action> <output>');
const candidate = JSON.parse(fs.readFileSync(candidateFile, 'utf8'));
const entry = { timestamp: process.env.SIMULATION_TIME || new Date().toISOString(), candidate_id: candidate.id, action, provenance: candidate.provenance, fingerprint: candidate.fingerprint };
entry.audit_hash = crypto.createHash('sha256').update(JSON.stringify(entry)).digest('hex');
fs.appendFileSync(output, JSON.stringify(entry) + '\n');
