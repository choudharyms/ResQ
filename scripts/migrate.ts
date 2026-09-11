/**
 * Migration runner: applies all SQL files in db/migrations/ in numbered order.
 * Usage: npm run db:migrate
 *
 * Idempotency: We do NOT use a migrations table here (no time for that in 36h).
 * Re-running will fail on already-existing objects — that's intentional:
 * it prevents accidental double-application. Apply migrations once per environment.
 *
 * For production: use Supabase CLI or a proper migration tool (goose, flyway).
 */

import fs   from 'fs';
import path from 'path';
import pg   from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const MIGRATIONS_DIR = path.join(process.cwd(), 'db', 'migrations');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✅  Connected to database\n');

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort(); // Sorts lexicographically: 001_, 002_, ... ensures order

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql      = fs.readFileSync(filePath, 'utf-8');

    console.log(`⏳  Applying migration: ${file}`);
    try {
      await client.query(sql);
      console.log(`✅  Applied: ${file}\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌  Failed on ${file}:\n    ${msg}\n`);
      // Abort on first failure — subsequent migrations may depend on this one
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log('🎉  All migrations applied successfully');
}

run();
