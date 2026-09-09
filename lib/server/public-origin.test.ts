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

void test('prefers the approved browser origin through the hosting proxy', () => {
  const request = new Request(
    'https://riff-investment-ideas.kobi6542.chatgpt.site/api/auth/session',
    {
      headers: {
        origin: 'https://riffbase.vercel.app',
        'x-forwarded-host': 'riff-investment-ideas.kobi6542.chatgpt.site',
        'x-forwarded-proto': 'https',
      },
    },
  );
  assert.equal(getPublicOrigin(request), 'https://riffbase.vercel.app');
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

void test('rejects an unapproved browser origin', () => {
  const request = new Request('https://riff-origin.example/api/auth/session', {
    headers: { origin: 'https://attacker.vercel.app' },
  });
  assert.equal(getPublicOrigin(request), 'https://riff-origin.example');
});
