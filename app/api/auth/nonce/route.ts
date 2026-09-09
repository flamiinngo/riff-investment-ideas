import { getDb } from '@/lib/server/db';
import { noStoreJson } from '@/lib/server/session';

export async function GET() {
  const now = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomUUID().replaceAll('-', '');
  const db = getDb();
  await db.batch([
    db.prepare('DELETE FROM auth_nonces WHERE expires_at <= ?').bind(now),
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now),
    db
      .prepare(
        'INSERT INTO auth_nonces (nonce, expires_at, created_at) VALUES (?, ?, ?)',
      )
      .bind(nonce, now + 600, now),
  ]);
  return noStoreJson({ nonce });
}
