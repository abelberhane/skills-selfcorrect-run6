#!/usr/bin/env node
'use strict';

// Adds applyDiscount() to src/cart.js WITHOUT a matching test.
//
// This produces the pull request the learner reviews in step 2. The omission is
// the whole point: every other function in this module is tested, so the gap is
// obvious to a reviewer and worth turning into a durable rule.

const fs = require('node:fs');

const SOURCE = process.argv[2] || 'src/cart.js';

const FUNCTION = `
function applyDiscount(cart, percent) {
  const factor = 1 - percent / 100;
  return cart.map((item) => ({ ...item, price: item.price * factor }));
}
`;

const contents = fs.readFileSync(SOURCE, 'utf8');
if (contents.includes('function applyDiscount')) {
  console.log('applyDiscount already present; nothing to do.');
  process.exit(0);
}

const exportsLine = 'module.exports = { addItem, removeItem, subtotal };';
if (!contents.includes(exportsLine)) {
  console.error(`Could not find the expected exports line in ${SOURCE}.`);
  process.exit(1);
}

const updated = contents
  .replace(exportsLine, `${FUNCTION.trim()}\n\n${exportsLine.replace('subtotal }', 'subtotal, applyDiscount }')}`);

fs.writeFileSync(SOURCE, updated);
console.log(`Added applyDiscount to ${SOURCE} with no accompanying test.`);
