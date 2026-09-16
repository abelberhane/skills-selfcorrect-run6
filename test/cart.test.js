'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { addItem, removeItem, subtotal } = require('../src/cart');

test('addItem defaults quantity to one', () => {
  const cart = addItem([], { id: 'apple', price: 2.5 });
  assert.equal(cart.length, 1);
  assert.equal(cart[0].quantity, 1);
});

test('addItem rejects an item without a string id', () => {
  assert.throws(() => addItem([], { price: 1 }), /string id/);
});

test('addItem rejects a negative price', () => {
  assert.throws(() => addItem([], { id: 'apple', price: -1 }), /non-negative price/);
});

test('removeItem drops only the matching id', () => {
  const cart = addItem(addItem([], { id: 'apple', price: 2 }), { id: 'pear', price: 3 });
  assert.deepEqual(removeItem(cart, 'apple').map((item) => item.id), ['pear']);
});

test('subtotal multiplies price by quantity', () => {
  const cart = addItem([], { id: 'apple', price: 2.5, quantity: 4 });
  assert.equal(subtotal(cart), 10);
});

test('subtotal of an empty cart is zero', () => {
  assert.equal(subtotal([]), 0);
});
