import { getDb } from '@/lib/server/db';
import { noStoreJson, requireSessionAddress } from '@/lib/server/session';

type FollowRequest = {
  targetType?: 'idea' | 'creator';
  targetId?: string;
};

function validTarget(body: FollowRequest) {
  return (
    (body.targetType === 'idea' || body.targetType === 'creator') &&
    typeof body.targetId === 'string' &&
    body.targetId.length >= 2 &&
    body.targetId.length <= 80 &&
    /^[a-zA-Z0-9@ _+.-]+$/.test(body.targetId)
  );
}

export async function PUT(request: Request) {
  try {
    const address = await requireSessionAddress(request);
    const body = (await request.json()) as FollowRequest;
    if (!validTarget(body)) {
      return noStoreJson(
        { error: 'That follow target is invalid.' },
        { status: 400 },
      );
    }
    await getDb()
      .prepare(
        `INSERT INTO follows (user_address, target_type, target_id, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_address, target_type, target_id) DO NOTHING`,
      )
      .bind(
        address,
        body.targetType,
        body.targetId,
        Math.floor(Date.now() / 1000),
      )
      .run();
    return noStoreJson({ followed: true });
  } catch (error) {
    if (error instanceof Response) return error;
    return noStoreJson(
      { error: 'We could not update following.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const address = await requireSessionAddress(request);
    const body = (await request.json()) as FollowRequest;
    if (!validTarget(body)) {
      return noStoreJson(
        { error: 'That follow target is invalid.' },
        { status: 400 },
      );
    }
    await getDb()
      .prepare(
        'DELETE FROM follows WHERE user_address = ? AND target_type = ? AND target_id = ?',
      )
      .bind(address, body.targetType, body.targetId)
      .run();
    return noStoreJson({ followed: false });
  } catch (error) {
    if (error instanceof Response) return error;
    return noStoreJson(
      { error: 'We could not update following.' },
      { status: 500 },
    );
  }
}
