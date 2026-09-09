import { getDb } from '@/lib/server/db';
import { getSessionAddress, noStoreJson } from '@/lib/server/session';

type ProfileRow = {
  address: string;
  handle: string;
  display_name: string;
  bio: string;
};

export async function GET(request: Request) {
  const address = await getSessionAddress(request);
  if (!address) {
    return noStoreJson({
      account: null,
      followedIdeas: [],
      followedCreators: [],
    });
  }
  const db = getDb();
  const [profile, followed] = await Promise.all([
    db
      .prepare(
        'SELECT address, handle, display_name, bio FROM profiles WHERE address = ? LIMIT 1',
      )
      .bind(address)
      .first<ProfileRow>(),
    db
      .prepare(
        'SELECT target_type, target_id FROM follows WHERE user_address = ? ORDER BY created_at DESC',
      )
      .bind(address)
      .all<{ target_type: 'idea' | 'creator'; target_id: string }>(),
  ]);
  const suffix = address.slice(2, 8);
  return noStoreJson({
    account: profile
      ? {
          address: profile.address,
          handle: profile.handle,
          displayName: profile.display_name,
          bio: profile.bio,
        }
      : {
          address,
          handle: `builder_${suffix}`,
          displayName: 'New builder',
          bio: '',
        },
    followedIdeas: followed.results
      .filter((item) => item.target_type === 'idea')
      .map((item) => item.target_id),
    followedCreators: followed.results
      .filter((item) => item.target_type === 'creator')
      .map((item) => item.target_id),
  });
}
