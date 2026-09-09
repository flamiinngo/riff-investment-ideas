import { getDb } from './db';

export const SESSION_COOKIE = 'riff_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function cookieValue(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? '';
  for (const part of cookie.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return decodeURIComponent(value.join('='));
  }
  return null;
}

export async function hashSessionToken(token: string) {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function createSessionToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export function sessionCookie(token: string, maxAge = SESSION_MAX_AGE_SECONDS) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function getSessionAddress(request: Request) {
  const token = cookieValue(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await hashSessionToken(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await getDb()
    .prepare(
      'SELECT address FROM sessions WHERE token_hash = ? AND expires_at > ? LIMIT 1',
    )
    .bind(tokenHash, now)
    .first<{ address: string }>();
  return row?.address ?? null;
}

export async function requireSessionAddress(request: Request) {
  const address = await getSessionAddress(request);
  if (!address)
    throw new Response('Sign in with Base to continue.', { status: 401 });
  return address;
}

export function noStoreJson(data: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set('cache-control', 'no-store');
  return Response.json(data, { ...init, headers });
}
