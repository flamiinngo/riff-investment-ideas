import assert from 'node:assert/strict';
import test from 'node:test';
import { getPublicOrigin } from './public-origin.ts';

void test('uses an approved public proxy origin', () => {
  const request = new Request('https://riff-origin.example/api/auth/session', {
    headers: {
      'x-forwarded-host': 'riff-investment-ideas.vercel.app',
      'x-forwarded-proto': 'https',
    },
  });
  assert.equal(
    getPublicOrigin(request),
    'https://riff-investment-ideas.vercel.app',
  );
});

void test('rejects an unapproved forwarded host', () => {
  const request = new Request('https://riff-origin.example/api/auth/session', {
    headers: {
      'x-forwarded-host': 'attacker.example',
      'x-forwarded-proto': 'https',
    },
  });
  assert.equal(getPublicOrigin(request), 'https://riff-origin.example');
});
