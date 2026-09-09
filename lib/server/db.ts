import { env } from 'cloudflare:workers';

type RiffBindings = {
  DB: D1Database;
};

export function getDb() {
  return (env as unknown as RiffBindings).DB;
}
