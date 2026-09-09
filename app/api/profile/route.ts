import { getDb } from '@/lib/server/db';
import { noStoreJson, requireSessionAddress } from '@/lib/server/session';

type ProfileRequest = {
  handle?: string;
  displayName?: string;
  bio?: string;
};

export async function PUT(request: Request) {
  try {
    const address = await requireSessionAddress(request);
    const body = (await request.json()) as ProfileRequest;
    const handle = body.handle?.trim().toLowerCase() ?? '';
    const displayName = body.displayName?.trim() ?? '';
    const bio = body.bio?.trim() ?? '';
    if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
      return noStoreJson(
        { error: 'Use 3–20 letters, numbers or underscores for your handle.' },
        { status: 400 },
      );
    }
    if (displayName.length < 2 || displayName.length > 40 || bio.length > 140) {
      return noStoreJson(
        { error: 'Check your display name and bio lengths.' },
        { status: 400 },
      );
    }
    await getDb()
      .prepare(
        `INSERT INTO profiles (address, handle, display_name, bio, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(address) DO UPDATE SET
           handle = excluded.handle,
           display_name = excluded.display_name,
           bio = excluded.bio,
           updated_at = excluded.updated_at`,
      )
      .bind(address, handle, displayName, bio, Math.floor(Date.now() / 1000))
      .run();
    return noStoreJson({
      account: { address, handle, displayName, bio },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : '';
    if (/unique|constraint/i.test(message)) {
      return noStoreJson(
        { error: 'That handle is already taken.' },
        { status: 409 },
      );
    }
    return noStoreJson(
      { error: 'We could not save your profile.' },
      { status: 500 },
    );
  }
}
