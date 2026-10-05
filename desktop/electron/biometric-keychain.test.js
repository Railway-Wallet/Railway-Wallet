const assert = require('node:assert/strict');
const test = require('node:test');
const { isValidAuthKey } = require('./auth-key');

test('accepts Railway PBKDF2 auth keys', () => {
  assert.equal(isValidAuthKey('a'.repeat(64)), true);
});

test('rejects prefixed or incorrectly sized auth keys', () => {
  assert.equal(isValidAuthKey(`0x${'a'.repeat(64)}`), false);
  assert.equal(isValidAuthKey('a'.repeat(63)), false);
});
