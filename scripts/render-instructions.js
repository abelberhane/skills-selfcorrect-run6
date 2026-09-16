#!/usr/bin/env node
const fs = require('node:fs');
const { updateInstructions } = require('./lib');
const source = process.argv[2], candidateFile = process.argv[3], output = process.argv[4];
if (!source || !candidateFile || !output) throw new Error('Usage: node scripts/render-instructions.js <instructions> <candidate> <output>');
const rendered = updateInstructions(fs.readFileSync(source, 'utf8'), JSON.parse(fs.readFileSync(candidateFile, 'utf8')));
fs.writeFileSync(output, rendered);
