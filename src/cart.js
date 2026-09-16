'use strict';

/**
 * A deliberately small shopping cart module.
 *
 * This is the code you review during the exercise. Every exported function
 * here has a matching test in test/cart.test.js -- that is the standard the
 * repository is trying to hold onto.
 */

function addItem(cart, item) {
  if (!item || typeof item.id !== 'string') throw new Error('Item requires a string id.');
  if (!Number.isFinite(item.price) || item.price < 0) throw new Error('Item requires a non-negative price.');
  const quantity = Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 1;
  return [...cart, { ...item, quantity }];
}

function removeItem(cart, id) {
  return cart.filter((item) => item.id !== id);
}

function subtotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

module.exports = { addItem, removeItem, subtotal };
