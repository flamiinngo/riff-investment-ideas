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
