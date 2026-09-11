/**
 * Reset script: safely resets the database to a clean state.
 * Usage: npm run db:reset
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

async function reset() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();
  console.log('✅ Connected to database\n');

  try {
    await client.query('BEGIN');

    console.log('🗑  Clearing allocations and incidents...');
    await client.query('DELETE FROM allocations');
    await client.query('DELETE FROM incidents');

    console.log('🔄 Resetting assets to Available status...');
    await client.query(`
      UPDATE assets
      SET status = 'Available',
          fuel_level = 1.0,
          updated_at = NOW(),
          updated_by = 'DB_RESET'
      WHERE is_deleted = FALSE
    `);

    console.log('🔄 Refreshing hex equity materialized view...');
    await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hex_equity');

    await client.query('COMMIT');
    console.log('\n🎉 Database reset successfully. Fleet is Available, incidents cleared.');
  } catch (err) {
    await client.query('ROLLBACK');
    const msg = err instanceof Error ? err.message : String(err);
    console.error('\n❌ Database reset failed:', msg);
  } finally {
    await client.end();
  }
}

reset();
