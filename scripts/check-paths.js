#!/usr/bin/env node
const { assertAllowedPaths } = require('./lib');
const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Provide one or more changed paths.');
assertAllowedPaths(paths);
console.log('Candidate paths are allowed.');
