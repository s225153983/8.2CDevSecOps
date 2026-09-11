// Unit tests for the helper functions in utils.js.
// These tests run without a database so the Jenkins pipeline can execute them
// on any agent, and c8 uses them to produce the lcov coverage report that the
// SonarCloud Analysis stage later uploads.

const test = require('node:test');
const assert = require('node:assert');
const utils = require('../../utils');

test('ran_no returns a value inside the requested range', () => {
  for (let i = 0; i < 200; i += 1) {
    const value = utils.ran_no(5, 10);
    assert.ok(value >= 5, `expected ${value} to be at least 5`);
    assert.ok(value <= 10, `expected ${value} to be at most 10`);
    assert.strictEqual(Number.isInteger(value), true);
  }
});

test('ran_no returns the only possible value when min equals max', () => {
  assert.strictEqual(utils.ran_no(7, 7), 7);
});

test('uid returns a string of the requested length', () => {
  assert.strictEqual(utils.uid(0).length, 0);
  assert.strictEqual(utils.uid(1).length, 1);
  assert.strictEqual(utils.uid(32).length, 32);
});

test('uid only uses alphanumeric characters', () => {
  assert.match(utils.uid(100), /^[A-Za-z0-9]+$/);
});

test('uid produces a different value on each call', () => {
  const first = utils.uid(24);
  const second = utils.uid(24);
  assert.notStrictEqual(first, second);
});

test('forbidden sets a 403 status and a plain text body', () => {
  const headers = {};
  let ended = '';

  const res = {
    statusCode: 200,
    setHeader(name, value) {
      headers[name] = value;
    },
    end(body) {
      ended = body;
    }
  };

  utils.forbidden(res);

  assert.strictEqual(res.statusCode, 403);
  assert.strictEqual(headers['Content-Type'], 'text/plain');
  assert.strictEqual(headers['Content-Length'], 'Forbidden'.length);
  assert.strictEqual(ended, 'Forbidden');
});
