import { ideas as demoIdeas } from '@/lib/ideas/mock-data';
import {
  hashAllocation,
  isPublishableAllocation,
  normalizePublishableAllocation,
} from '@/lib/ideas/canonical';
import { getDb } from '@/lib/server/db';
import { noStoreJson, requireSessionAddress } from '@/lib/server/session';
import type { Allocation, Idea, LineageNode } from '@/types';

type IdeaRow = {
  id: string;
  creator_handle: string;
  creator_name: string;
  name: string;
  description: string;
  thesis: string;
  category: string;
  parent_idea_id: string | null;
  version: number;
  allocation_hash: string;
  lineage_json: string;
  created_at: number;
  remix_count: number;
  position: number;
  symbol: string;
  company: string;
  weight: number;
  available: number;
};

type PublishRequest = {
  clientRequestId?: string;
  name?: string;
  description?: string;
  thesis?: string;
  parentIdeaId?: string;
  allocation?: Allocation[];
};

async function listIdeas() {
  const rows = await getDb()
    .prepare(
      `WITH recent_ideas AS (
         SELECT * FROM ideas
         WHERE status = 'published'
         ORDER BY created_at DESC
         LIMIT 100
       )
       SELECT
         i.id, i.creator_handle, i.creator_name, i.name, i.description,
         i.thesis, i.category, i.parent_idea_id, i.version,
         i.allocation_hash, i.lineage_json, i.created_at,
         (SELECT COUNT(*) FROM ideas child WHERE child.parent_idea_id = i.id) AS remix_count,
         a.position, a.symbol, a.company, a.weight, a.available
       FROM recent_ideas i
       JOIN idea_allocations a ON a.idea_id = i.id
       ORDER BY i.created_at DESC, a.position ASC`,
    )
    .all<IdeaRow>();
  const grouped = new Map<string, Idea>();
  for (const row of rows.results) {
    let idea = grouped.get(row.id);
    if (!idea) {
      idea = {
        id: row.id,
        name: row.name,
        description: row.description,
        thesis: row.thesis,
        creator: `@${row.creator_handle}`,
        creatorName: row.creator_name,
        createdAt: new Date(row.created_at * 1000).toISOString(),
        performance: 0,
        capital: 0,
        holders: 0,
        remixes: row.remix_count,
        category: row.category,
        allocation: [],
        sparkline: [40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
        lineage: JSON.parse(row.lineage_json) as LineageNode[],
        version: row.version,
        parentIdeaId: row.parent_idea_id ?? undefined,
        recordType: 'published',
        recordHash: row.allocation_hash,
      };
      grouped.set(row.id, idea);
    }
    idea.allocation.push({
      symbol: row.symbol,
      company: row.company,
      weight: row.weight,
      available: Boolean(row.available),
    });
  }
  return [...grouped.values()];
}

export async function GET() {
  try {
    return noStoreJson({ ideas: await listIdeas() });
  } catch {
    return noStoreJson(
      { error: 'Published ideas are temporarily unavailable.' },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const creatorAddress = await requireSessionAddress(request);
    const body = (await request.json()) as PublishRequest;
    const name = body.name?.trim().replace(/\s+/g, ' ') ?? '';
    const thesis = body.thesis?.trim().replace(/\s+/g, ' ') ?? '';
    const description = (
      body.description?.trim().replace(/\s+/g, ' ') || thesis
    ).slice(0, 240);
    const clientRequestId = body.clientRequestId?.trim() ?? '';
    if (
      !/^[a-zA-Z0-9_-]{8,80}$/.test(clientRequestId) ||
      name.length < 3 ||
      name.length > 54 ||
      thesis.length < 20 ||
      thesis.length > 600 ||
      !isPublishableAllocation(body.allocation)
    ) {
      return noStoreJson(
        { error: 'Check the idea name, thesis and 100% allocation.' },
        { status: 400 },
      );
    }
    const allocation = normalizePublishableAllocation(body.allocation);
    const hash = await hashAllocation(allocation);
    const createdAt = Math.floor(Date.now() / 1000);
    const db = getDb();
    const existing = await db
      .prepare('SELECT id FROM ideas WHERE client_request_id = ? LIMIT 1')
      .bind(clientRequestId)
      .first<{ id: string }>();
    if (existing) {
      const ideas = await listIdeas();
      const existingIdea = ideas.find((idea) => idea.id === existing.id);
      if (existingIdea) return noStoreJson({ idea: existingIdea });
      return noStoreJson(
        { error: 'The published Idea could not be loaded.' },
        { status: 500 },
      );
    }
    const profile = await db
      .prepare(
        'SELECT handle, display_name FROM profiles WHERE address = ? LIMIT 1',
      )
      .bind(creatorAddress)
      .first<{ handle: string; display_name: string }>();
    if (!profile) {
      return noStoreJson(
        { error: 'Create your Riff profile before publishing.' },
        { status: 409 },
      );
    }
    const recent = await db
      .prepare(
        'SELECT COUNT(*) AS count FROM ideas WHERE creator_address = ? AND created_at > ?',
      )
      .bind(creatorAddress, createdAt - 3600)
      .first<{ count: number }>();
    if ((recent?.count ?? 0) >= 10) {
      return noStoreJson(
        {
          error:
            'You have reached the hourly publishing limit. Try again later.',
        },
        { status: 429 },
      );
    }
    const duplicate = await db
      .prepare(
        `SELECT id FROM ideas
         WHERE creator_address = ? AND name = ? AND thesis = ?
           AND allocation_hash = ? AND created_at > ?
         LIMIT 1`,
      )
      .bind(creatorAddress, name, thesis, hash, createdAt - 86400)
      .first<{ id: string }>();
    if (duplicate) {
      return noStoreJson(
        { error: 'You already published this Idea in the last 24 hours.' },
        { status: 409 },
      );
    }
    let parent: { id: string; version: number; lineage: LineageNode[] } | null =
      null;
    if (body.parentIdeaId) {
      const storedParent = await db
        .prepare(
          'SELECT id, version, lineage_json FROM ideas WHERE id = ? LIMIT 1',
        )
        .bind(body.parentIdeaId)
        .first<{ id: string; version: number; lineage_json: string }>();
      if (storedParent) {
        parent = {
          id: storedParent.id,
          version: storedParent.version,
          lineage: JSON.parse(storedParent.lineage_json) as LineageNode[],
        };
      } else {
        const demoParent = demoIdeas.find(
          (idea) => idea.id === body.parentIdeaId,
        );
        if (demoParent)
          parent = {
            id: demoParent.id,
            version: demoParent.version,
            lineage: demoParent.lineage,
          };
      }
      if (!parent) {
        return noStoreJson(
          { error: 'The parent Idea no longer exists.' },
          { status: 409 },
        );
      }
    }
    const id = `idea_${crypto.randomUUID()}`;
    const version = parent ? parent.version + 1 : 1;
    const lineage = [
      ...(parent?.lineage ?? []),
      { id, name, creator: `@${profile.handle}` },
    ];
    const statements = [
      db
        .prepare(
          `INSERT INTO ideas (
             id, client_request_id, creator_address, creator_handle, creator_name,
             name, description, thesis, category, parent_idea_id, version,
             allocation_hash, lineage_json, created_at, status
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'COMMUNITY', ?, ?, ?, ?, ?, 'published')`,
        )
        .bind(
          id,
          clientRequestId,
          creatorAddress,
          profile.handle,
          profile.display_name,
          name,
          description,
          thesis,
          parent?.id ?? null,
          version,
          hash,
          JSON.stringify(lineage),
          createdAt,
        ),
      ...allocation.map((item, position) =>
        db
          .prepare(
            `INSERT INTO idea_allocations
             (idea_id, position, symbol, company, weight, available)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(id, position, item.symbol, item.company, item.weight, 1),
      ),
    ];
    await db.batch(statements);
    const ideas = await listIdeas();
    const publishedIdea = ideas.find((idea) => idea.id === id);
    if (!publishedIdea)
      return noStoreJson(
        { error: 'The published Idea could not be loaded.' },
        { status: 500 },
      );
    return noStoreJson({ idea: publishedIdea }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    const message = error instanceof Error ? error.message : '';
    if (/unique|constraint/i.test(message)) {
      return noStoreJson(
        { error: 'This Idea was already published.' },
        { status: 409 },
      );
    }
    return noStoreJson(
      { error: 'We could not publish this Idea.' },
      { status: 500 },
    );
  }
}
