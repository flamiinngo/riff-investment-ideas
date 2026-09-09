import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const profiles = sqliteTable(
  'profiles',
  {
    address: text('address').primaryKey(),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio').notNull().default(''),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [uniqueIndex('idx_profiles_handle').on(table.handle)],
);

export const authNonces = sqliteTable(
  'auth_nonces',
  {
    nonce: text('nonce').primaryKey(),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [index('idx_auth_nonces_expires_at').on(table.expiresAt)],
);

export const sessions = sqliteTable(
  'sessions',
  {
    tokenHash: text('token_hash').primaryKey(),
    address: text('address').notNull(),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    index('idx_sessions_address').on(table.address),
    index('idx_sessions_expires_at').on(table.expiresAt),
  ],
);

export const follows = sqliteTable(
  'follows',
  {
    userAddress: text('user_address').notNull(),
    targetType: text('target_type', { enum: ['idea', 'creator'] }).notNull(),
    targetId: text('target_id').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => [
    primaryKey({
      name: 'pk_follows_user_target',
      columns: [table.userAddress, table.targetType, table.targetId],
    }),
    index('idx_follows_target').on(table.targetType, table.targetId),
  ],
);

export const ideas = sqliteTable(
  'ideas',
  {
    id: text('id').primaryKey(),
    clientRequestId: text('client_request_id').notNull(),
    creatorAddress: text('creator_address').notNull(),
    creatorHandle: text('creator_handle').notNull(),
    creatorName: text('creator_name').notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    thesis: text('thesis').notNull(),
    category: text('category').notNull().default('COMMUNITY'),
    parentIdeaId: text('parent_idea_id'),
    version: integer('version').notNull(),
    allocationHash: text('allocation_hash').notNull(),
    lineageJson: text('lineage_json').notNull(),
    createdAt: integer('created_at').notNull(),
    status: text('status', { enum: ['published'] })
      .notNull()
      .default('published'),
  },
  (table) => [
    uniqueIndex('idx_ideas_client_request_id').on(table.clientRequestId),
    index('idx_ideas_created_at').on(table.createdAt),
    index('idx_ideas_creator_created').on(
      table.creatorAddress,
      table.createdAt,
    ),
    index('idx_ideas_parent').on(table.parentIdeaId),
  ],
);

export const ideaAllocations = sqliteTable(
  'idea_allocations',
  {
    ideaId: text('idea_id')
      .notNull()
      .references(() => ideas.id),
    position: integer('position').notNull(),
    symbol: text('symbol').notNull(),
    company: text('company').notNull(),
    weight: integer('weight').notNull(),
    available: integer('available', { mode: 'boolean' }).notNull(),
  },
  (table) => [
    primaryKey({
      name: 'pk_idea_allocations_position',
      columns: [table.ideaId, table.position],
    }),
    uniqueIndex('idx_idea_allocations_symbol').on(table.ideaId, table.symbol),
  ],
);
